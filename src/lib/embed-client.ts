'use client'

// newdocs/80: the browser half of embedded mode, and EM-6's page-organization binding.
import { ORGANIZATION_CHANGED, PAGE_ORG_HEADER, ctrlOrigin } from './embed'

/** Protocol v1 (CTRL `lib/apps/frame-protocol.ts`). Display hints only: nothing here carries a token or grants anything. */
export type CrmToCtrlMessage =
  | { evoq: 1; type: 'ready' }
  | { evoq: 1; type: 'navigated'; path: string; title?: string }
  | { evoq: 1; type: 'signin-required'; path?: string }
  | { evoq: 1; type: 'relaunch'; path?: string }
  | { evoq: 1; type: 'signed-out' }
  | { evoq: 1; type: 'choose-organization' }

/** Framed at all. (Who frames us is the browser's to enforce: nginx `frame-ancestors` allows only CTRL.) */
export function isEmbedded(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
}

/** To CTRL only — the message is dropped by the browser if the parent is anything else. */
export function tellCtrl(message: CrmToCtrlMessage): void {
  if (!isEmbedded()) return
  window.parent.postMessage(message, ctrlOrigin())
}

let pageOrganization: string | null = null
let reported = false

/** EM-6: this page was drawn for `organization`. A later render for another one means the session moved. */
export function setPageOrganization(organization: string | null): void {
  if (organization && pageOrganization && organization !== pageOrganization) organizationChanged()
  if (organization) pageOrganization = organization
}

export const ORG_CHANGED_EVENT = 'evoq:organization-changed'

/** Inside CTRL: CTRL relaunches the frame for its organization. Standalone: the page offers a reload. */
export function organizationChanged(): void {
  if (reported) return
  reported = true
  if (isEmbedded()) tellCtrl({ evoq: 1, type: 'relaunch', path: window.location.pathname })
  else window.dispatchEvent(new Event(ORG_CHANGED_EVENT))
}

function ownApi(url: string | URL): boolean {
  try {
    const u = new URL(String(url), window.location.href)
    return u.origin === window.location.origin && u.pathname.startsWith('/api/') && !u.pathname.startsWith('/api/auth/')
  } catch {
    return false
  }
}

let installed = false

/**
 * EM-6: every call this page makes to CRM's own BFF names the page's organization, so the BFF can
 * refuse it after the session moved to another organization (409 ORGANIZATION_CHANGED). Both `fetch`
 * and XMLHttpRequest (axios) are covered; other origins and `/api/auth/*` are left alone.
 */
export function installPageOrganizationBinding(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' || input instanceof URL ? input : input.url
    if (!pageOrganization || !ownApi(url)) return nativeFetch(input, init)
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
    headers.set(PAGE_ORG_HEADER, pageOrganization)
    const res = await nativeFetch(input, { ...init, headers })
    if (res.status === 409) {
      res
        .clone()
        .json()
        .then((body) => body?.error === ORGANIZATION_CHANGED && organizationChanged())
        .catch(() => undefined)
    }
    return res
  }

  const open = XMLHttpRequest.prototype.open
  const send = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest & { __evoqOwnApi?: boolean }, ...args: any[]) {
    this.__evoqOwnApi = ownApi(args[1])
    return (open as any).apply(this, args)
  } as typeof XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest & { __evoqOwnApi?: boolean }, body?: any) {
    if (this.__evoqOwnApi && pageOrganization) {
      this.setRequestHeader(PAGE_ORG_HEADER, pageOrganization)
      this.addEventListener('load', () => {
        if (this.status !== 409) return
        try {
          const parsed = typeof this.response === 'string' ? JSON.parse(this.response) : this.response
          if (parsed?.error === ORGANIZATION_CHANGED) organizationChanged()
        } catch {
          // not ours
        }
      })
    }
    return send.call(this, body)
  }
}

/** The script that marks a framed document before first paint, so CRM's own bar never flashes inside CTRL. */
export const EMBED_MARK_SCRIPT =
  "try{if(window.self!==window.top)document.documentElement.setAttribute('data-evoq-embedded','1')}catch(e){document.documentElement.setAttribute('data-evoq-embedded','1')}"
