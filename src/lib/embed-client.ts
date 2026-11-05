"use client";

// newdocs/80: the browser half of embedded mode, and EM-6's page-organization binding.
import { ORGANIZATION_CHANGED, PAGE_ORG_HEADER, ctrlOrigin } from "./embed";

/** Protocol v1 (CTRL `lib/apps/frame-protocol.ts`). Display hints only: nothing here carries a token or grants anything. */
export type CrmToCtrlMessage =
  | { evoq: 1; type: "ready" }
  | { evoq: 1; type: "navigated"; path: string; title?: string }
  | { evoq: 1; type: "signin-required"; path?: string }
  | { evoq: 1; type: "relaunch"; path?: string }
  | { evoq: 1; type: "signed-out" }
  | { evoq: 1; type: "choose-organization" };

/** Framed at all. (Who frames us is the browser's to enforce: nginx `frame-ancestors` allows only CTRL.) */
export function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/** To CTRL only — the message is dropped by the browser if the parent is anything else. */
export function tellCtrl(message: CrmToCtrlMessage): void {
  if (!isEmbedded()) return;
  window.parent.postMessage(message, ctrlOrigin());
}

let pageOrganization: string | null = null;
let reported = false;
let pageCsrf = "";
export function setPageCsrf(value: string): void {
  pageCsrf = value;
}

/** EM-6: this page was drawn for `organization`. A later render for another one means the session moved. */
export function setPageOrganization(organization: string | null): void {
  if (organization && pageOrganization && organization !== pageOrganization)
    organizationChanged();
  if (organization) pageOrganization = organization;
}

export const ORG_CHANGED_EVENT = "evoq:organization-changed";

/** Inside CTRL: CTRL relaunches the frame for its organization. Standalone: the page offers a reload. */
export function organizationChanged(): void {
  if (reported) return;
  reported = true;
  if (isEmbedded())
    tellCtrl({ evoq: 1, type: "relaunch", path: window.location.pathname });
  else window.dispatchEvent(new Event(ORG_CHANGED_EVENT));
}

function ownApi(url: string | URL): boolean {
  try {
    const u = new URL(String(url), window.location.href);
    return (
      u.origin === window.location.origin && u.pathname.startsWith("/api/")
    );
  } catch {
    return false;
  }
}

let installed = false;

/**
 * EM-6: every call this page makes to CRM's own BFF names the page's organization, so the BFF can
 * refuse it after the session moved to another organization (409 ORGANIZATION_CHANGED). Both `fetch`
 * and XMLHttpRequest (axios) are covered; other origins and `/api/auth/*` are left alone.
 */
export function installPageOrganizationBinding(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string" || input instanceof URL ? input : input.url;
    if (!pageOrganization || !ownApi(url)) return nativeFetch(input, init);
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    headers.delete("authorization");
    headers.set(PAGE_ORG_HEADER, pageOrganization);
    if (pageCsrf) headers.set("x-evoq-csrf", pageCsrf);
    const res = await nativeFetch(input, { ...init, headers });
    if (res.status === 409) {
      res
        .clone()
        .json()
        .then(
          (body) =>
            body?.error === ORGANIZATION_CHANGED && organizationChanged(),
        )
        .catch(() => undefined);
    }
    return res;
  };

  const setHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (
    name: string,
    value: string,
  ) {
    if ((this as any).__evoqOwnApi && name.toLowerCase() === "authorization")
      return;
    return setHeader.call(this, name, value);
  };
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { __evoqOwnApi?: boolean },
    ...args: any[]
  ) {
    this.__evoqOwnApi = ownApi(args[1]);
    return (open as any).apply(this, args);
  } as typeof XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { __evoqOwnApi?: boolean },
    body?: any,
  ) {
    if (this.__evoqOwnApi && pageOrganization) {
      this.setRequestHeader(PAGE_ORG_HEADER, pageOrganization);
      if (pageCsrf) this.setRequestHeader("x-evoq-csrf", pageCsrf);
      this.addEventListener("load", () => {
        if (this.status !== 409) return;
        try {
          const parsed =
            typeof this.response === "string"
              ? JSON.parse(this.response)
              : this.response;
          if (parsed?.error === ORGANIZATION_CHANGED) organizationChanged();
        } catch {
          // not ours
        }
      });
    }
    return send.call(this, body);
  };
}

/**
 * CTRL's light/dark appearance while framed (newdocs/80 §12.9). Kept for this tab only
 * (sessionStorage, separate from any standalone CRM tab) and never written to CRM's own settings
 * cookie or MUI's stored mode, so the standalone site keeps its own choice.
 */
export type Appearance = "light" | "dark";
const APPEARANCE_KEY = "evoq-embedded-appearance";
const appearanceListeners = new Set<() => void>();

export function getEmbeddedAppearance(): Appearance | null {
  if (typeof window === "undefined" || !isEmbedded()) return null;
  try {
    const v = window.sessionStorage.getItem(APPEARANCE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function setEmbeddedAppearance(value: unknown): void {
  if ((value !== "light" && value !== "dark") || !isEmbedded()) return;
  try {
    window.sessionStorage.setItem(APPEARANCE_KEY, value);
  } catch {
    // not remembered across this tab's reloads; still applied now
  }
  latestAppearance = value;
  appearanceListeners.forEach((l) => l());
}

let latestAppearance: Appearance | null = null;
export function subscribeAppearance(listener: () => void): () => void {
  appearanceListeners.add(listener);
  return () => appearanceListeners.delete(listener);
}
export function currentAppearance(): Appearance | null {
  return latestAppearance ?? getEmbeddedAppearance();
}

/** Framed, for rendering: false on the server and in the first client render's snapshot for SSR. */
export const subscribeNothing = () => () => undefined;
export const embeddedSnapshot = () => isEmbedded();
export const serverSnapshot = () => false;

/** The script that marks a framed document before first paint, so CRM's own bar never flashes inside CTRL. */
export const EMBED_MARK_SCRIPT =
  "try{if(window.self!==window.top)document.documentElement.setAttribute('data-evoq-embedded','1')}catch(e){document.documentElement.setAttribute('data-evoq-embedded','1')}";
