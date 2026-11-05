import { assertCsrf, securityResponse } from "@/lib/security";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { verifyForPurpose } from "@/lib/session";
import { invalidateTenantCache } from "@/lib/tenant-resolver";
import { signOutEverywhere } from "@/lib/global-logout";
import {
  RETRY_COOKIE,
  RETRY_PURPOSE,
  renderLogout,
} from "@/lib/logout-response";

/** R60: "Try again" on the logout page. The user comes from the signed 10-minute retry cookie. */
export async function POST(req: NextRequest) {
  try {
    await assertCsrf(req, req.cookies.get(RETRY_COOKIE)?.value || "");
  } catch (error) {
    return securityResponse(error);
  }
  const pending = verifyForPurpose<{ userId?: string }>(
    RETRY_PURPOSE,
    req.cookies.get(RETRY_COOKIE)?.value,
  );
  if (!pending?.userId || typeof pending.userId !== "string")
    return renderLogout("signed_out");
  invalidateTenantCache(pending.userId);
  const outcome = await signOutEverywhere(pending.userId);
  return outcome === "signed_out"
    ? renderLogout("signed_out")
    : renderLogout("not_confirmed", pending.userId);
}
