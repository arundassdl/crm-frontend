import { NextRequest, NextResponse } from "next/server";
import {
  requireContext,
  csrfToken,
  sessionCookie,
  securityResponse,
} from "@/lib/security";
import { resolveTenant, TenantResolverError } from "@/lib/tenant-resolver";
export async function GET(req: NextRequest) {
  try {
    const session = await requireContext(req, false);
    await resolveTenant(
      session.userId,
      session.organization,
      "crm",
      session.createdAt,
    );
    return NextResponse.json(
      {
        userId: session.userId,
        organization: session.organization,
        csrf: csrfToken(sessionCookie(req)),
        features: { metadata: false, reports: false, customDashboards: false },
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch (error) {
    if (error instanceof TenantResolverError)
      return NextResponse.json(
        {
          error: error.code,
          message: "Organization access could not be authorized.",
        },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    return securityResponse(error);
  }
}
