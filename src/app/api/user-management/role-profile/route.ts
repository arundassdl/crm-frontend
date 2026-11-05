import { protectedHandler } from "@/lib/security";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { bffErrorResponse } from "@/lib/tenant-fetch";
import { umCall, validProfile, validUser } from "@/lib/user-management";

/** R63: give another organization user an approved role profile (managers only; tenant-enforced). */
async function rawPOST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const args = {
      user: validUser(body?.user),
      role_profile: validProfile(body?.role_profile),
    };
    return NextResponse.json(
      await umCall(req, "set_role_profile", args, "POST"),
    );
  } catch (err) {
    return bffErrorResponse(err, "um-role-profile");
  }
}

export const POST = protectedHandler(rawPOST);
