import { protectedHandler } from "@/lib/security";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { bffErrorResponse } from "@/lib/tenant-fetch";
import { umCall, validTeam, validUser } from "@/lib/user-management";

async function rawGET(req: Request) {
  try {
    const user = validUser(new URL(req.url).searchParams.get("user"));
    return NextResponse.json(await umCall(req, "list_memberships", { user }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return bffErrorResponse(err, "um-memberships");
  }
}

async function rawPOST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.active !== "boolean" || typeof body?.is_manager !== "boolean") {
      return NextResponse.json(
        { error: "Choose valid membership settings.", code: "INVALID_MEMBERSHIP" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      await umCall(req, "set_membership", {
        user: validUser(body?.user),
        team: validTeam(body?.team),
        active: body.active,
        is_manager: body.is_manager,
      }, "POST"),
    );
  } catch (err) {
    return bffErrorResponse(err, "um-memberships");
  }
}

export const GET = protectedHandler(rawGET);
export const POST = protectedHandler(rawPOST);
