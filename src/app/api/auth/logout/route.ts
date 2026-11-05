import { requireContext, securityResponse } from "@/lib/security";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, parseSession } from "@/lib/session";
import { invalidateTenantCache } from "@/lib/tenant-resolver";
import {
  getCtrlLogoutContinueUrl,
  signOutEverywhere,
} from "@/lib/global-logout";
import { clearCrmCookies, renderLogout } from "@/lib/logout-response";

/**
 * CRM logout = global sign-out (R59), made fast (R60, doc 64).
 *
 * POST (the Logout button):
 *   1. Central signs the user (from the signed CRM cookie) out everywhere. The cutoff is written in
 *      that request; the identity-provider clean-up runs in the background, so this takes
 *      ~0.1–0.2 s. Waits at most 5 s.
 *   2. CRM cookies are cleared and cached resolutions dropped on this response.
 *   3. The response is a small page that clears the CTRL and Evoq One sign-in cookies in parallel
 *      and goes straight to https://one.evoq.app/products/crm (fallback: the CRM → CTRL → One chain).
 *   If Central did not confirm, the page says so and offers Try again (a 10-minute signed retry
 *   cookie carries the user id, since the session cookie is already gone). It never claims a
 *   global sign-out that did not happen.
 *
 * POST requires a verified CRM session, an exact same-origin request and a session-bound CSRF token.
 * GET is read-only and returns 405.
 */
export async function POST(req: NextRequest) {
  try {
    await requireContext(req, false);
  } catch (error) {
    return securityResponse(error);
  }
  const session = parseSession(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return renderLogout("signed_out"); // nothing of ours to sign out; still clear and leave
  invalidateTenantCache(session.userId);
  const outcome = await signOutEverywhere(session.userId);
  if (outcome !== "signed_out") {
    console.warn(`[crm-logout] global sign-out ${outcome}`);
    return renderLogout("not_confirmed", session.userId);
  }
  return renderLogout("signed_out");
}

export async function GET() {
  return NextResponse.json(
    { error: "METHOD_NOT_ALLOWED" },
    { status: 405, headers: { Allow: "POST", "Cache-Control": "no-store" } },
  );
}
