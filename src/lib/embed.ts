// newdocs/80: CRM shown inside CTRL ("embedded mode"). Edge-safe: no Node-only imports.
//
// Embedded mode changes presentation and navigation only — never who may see what. The session
// cookie, the tenant resolver and Central decide access exactly as for the standalone site.
import { getCtrlUrl } from "./ctrl";

/** The only origin CRM talks to when framed (https, from NEXT_PUBLIC_CTRL_URL). */
export function ctrlOrigin(): string {
  try {
    return new URL(getCtrlUrl()).origin;
  } catch {
    return "https://ctrl.evoq.app";
  }
}

/**
 * A document request for a frame. Browsers send `Sec-Fetch-Dest: iframe` only for frame
 * navigations; a top-level visit to crm.evoq.app never matches, so the standalone site is unchanged.
 */
export function isFrameRequest(headers: Headers): boolean {
  return headers.get("sec-fetch-dest") === "iframe";
}

/** Where a framed page without a session goes: a page that tells CTRL, instead of Evoq One (which refuses frames). */
export const EMBED_SIGNIN_PATH = "/embed/signin-required";

/**
 * That page on this site. Built from the request's own origin, as the launch route's redirect is:
 * Next's middleware refuses a relative Location, and nginx's `proxy_redirect` maps the app's
 * listener address to the public host (newdocs/80 §12.2).
 */
export function embedSigninUrl(origin: string, next: string | null): URL {
  const url = new URL(EMBED_SIGNIN_PATH, origin);
  if (next) url.searchParams.set("next", next);
  return url;
}

/** EM-6: the header a page adds to its own BFF calls, naming the organization it was drawn for. */
export const PAGE_ORG_HEADER = "x-evoq-page-org";
export const ORGANIZATION_CHANGED = "ORGANIZATION_CHANGED";
