import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getOneSigninUrl, safeCrmPath } from "@/lib/one";
import { embedSigninUrl, isFrameRequest } from "@/lib/embed";

// Duplicated from lib/session.ts: that module imports Node 'crypto', which the Edge middleware cannot bundle.
const SESSION_COOKIE_NAME = "evoq_crm_session";

/** The template's own username/password pages. EVOQ CRM has no separate login: these never render. */
const LEGACY_AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/update-password",
];

/**
 * Routing hint only: is there an unexpired session cookie? The signature is verified in the
 * Node runtime (org layout, BFF routes); a forged cookie gets no data, only the page shell.
 */
function sessionLooksValid(raw: string | undefined): boolean {
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  try {
    const b64 = parts[0].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
    return (
      typeof json?.expiresAt === "number" &&
      json.expiresAt > Date.now() &&
      typeof json?.organization === "string"
    );
  } catch {
    return false;
  }
}

/**
 * R58 (doc 62 §3): without a valid CRM session every page goes to the Evoq One CRM page, which
 * offers EVOQ sign-in and plans; the intended CRM path is kept as a validated relative `next`.
 *
 * `/api/*` (including `/api/auth/launch`, the launch-ticket redemption) is excluded by the
 * matcher, so a launch ticket is always processed before this rule can redirect.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const orgPath = pathname.match(/^\/org\/(TEAM-[0-9]{5,})(\/.*)?$/);
  const modulePath = orgPath ? orgPath[2] || "/" : pathname;
  if (pathname.startsWith("/_next")) return NextResponse.next();

  const raw = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionLooksValid(raw)) {
    // newdocs/80: inside CTRL's frame, Evoq One (which refuses frames) is replaced by a page that tells CTRL.
    const res = NextResponse.redirect(
      isFrameRequest(request.headers)
        ? embedSigninUrl(request.nextUrl.origin, safeCrmPath(pathname))
        : getOneSigninUrl(safeCrmPath(pathname)),
      307,
    );
    res.headers.set("Cache-Control", "no-store");
    if (raw)
      res.cookies.set(SESSION_COOKIE_NAME, "", {
        path: "/",
        maxAge: 0,
        httpOnly: true,
      });
    if (request.cookies.get("isLoggedIn"))
      res.cookies.set("isLoggedIn", "", { path: "/", maxAge: 0 });
    return res;
  }

  if (
    LEGACY_AUTH_PAGES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
  ) {
    return NextResponse.redirect(new URL("/org", request.url), 307);
  }
  if (
    /^\/(roles|user\/permission|user\/users\/(add|edit|detail)|user\/roles\/(add|edit|detail))(\/|$)/.test(
      modulePath,
    )
  )
    return NextResponse.redirect(new URL("/user/roles", request.url), 307);
  if (
    /^\/(analytics|reports|report|dashboard-builder|setup|settings|permission)(\/|$)/.test(
      modulePath,
    ) ||
    pathname.startsWith("/reports/api/")
  ) {
    return NextResponse.redirect(
      new URL("/integration-unavailable", request.url),
      307,
    );
  }
  // R59: tell the server components which page this is (for a safe return after sign-in).
  const forwarded = new Headers(request.headers);
  forwarded.set("x-evoq-path", pathname);
  return NextResponse.next({ request: { headers: forwarded } });
}

export const config = {
  matcher: [
    "/((?!api|embed|_next/static|_next/image|assets|images|favicon.ico|favicon.png|logo.png|sw.js).*)",
  ],
};
