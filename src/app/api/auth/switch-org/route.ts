import { NextRequest, NextResponse } from "next/server";
import {
  requireContext,
  csrfToken,
  sessionCookie,
  securityResponse,
  publicOrigin,
} from "@/lib/security";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/session";
import { getCtrlCrmLaunchUrl } from "@/lib/one";
export async function GET(req: NextRequest) {
  try {
    await requireContext(req, false);
    const csrf = csrfToken(sessionCookie(req));
    return new NextResponse(
      `<form method="post" action="/api/auth/switch-org"><input type="hidden" name="_csrf" value="${csrf}"><button>Choose another organization</button></form>`,
      {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store",
          "Content-Security-Policy":
            "default-src 'none'; form-action 'self'; frame-ancestors 'self' https://ctrl.evoq.app",
        },
      },
    );
  } catch (error) {
    return securityResponse(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    await requireContext(req, false);
    const response = NextResponse.redirect(getCtrlCrmLaunchUrl(), 303);
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      ...getSessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return securityResponse(error);
  }
}
