import { protectedHandler } from "@/lib/security";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { bffErrorResponse } from "@/lib/tenant-fetch";
import { umCall } from "@/lib/user-management";

/** R63: the role profiles CRM managers can assign, with their roles. */
async function rawGET(req: Request) {
  try {
    return NextResponse.json(await umCall(req, "list_role_profiles"), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return bffErrorResponse(err, "um-role-profiles");
  }
}

export const GET = protectedHandler(rawGET);
