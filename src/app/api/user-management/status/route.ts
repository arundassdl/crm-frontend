import { protectedHandler } from "@/lib/security";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { BffError, bffErrorResponse } from "@/lib/tenant-fetch";
import { umCall, validUser } from "@/lib/user-management";

/** R63: suspend or restore another organization user's CRM access (managers only; never deletes). */
async function rawPOST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.active !== "boolean")
      throw new BffError(
        400,
        "INVALID_STATUS",
        "validation",
        "Choose active or suspended.",
      );
    return NextResponse.json(
      await umCall(
        req,
        "set_status",
        { user: validUser(body?.user), active: body.active ? 1 : 0 },
        "POST",
      ),
    );
  } catch (err) {
    return bffErrorResponse(err, "um-status");
  }
}

export const POST = protectedHandler(rawPOST);
