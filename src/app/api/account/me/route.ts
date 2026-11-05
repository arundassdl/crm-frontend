import { protectedHandler } from "@/lib/security";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { bffErrorResponse } from "@/lib/tenant-fetch";
import { umCall, validName } from "@/lib/user-management";

/** R63: My Account — the signed-in user's own profile only (doc 67). */
async function rawGET(req: Request) {
  try {
    return NextResponse.json(await umCall(req, "me"), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return bffErrorResponse(err, "account-me");
  }
}

/** Only first and last name can change here; identity, email, roles and organization are EVOQ's. */
async function rawPOST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const args = {
      first_name: validName(body?.first_name, "first name"),
      last_name: validName(body?.last_name, "last name"),
    };
    return NextResponse.json(await umCall(req, "update_me", args, "POST"), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return bffErrorResponse(err, "account-me");
  }
}

export const GET = protectedHandler(rawGET);
export const POST = protectedHandler(rawPOST);
