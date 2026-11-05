import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { frappeCall, bffErrorResponse } from "@/lib/tenant-fetch";
import { SecurityError, securityResponse } from "@/lib/security";
async function rawPOST(req: NextRequest, context: any) {
  try {
    const args: any = await req.json();
    delete args.username;
    delete args.role_profile;
    delete args.token;

    const data = await frappeCall(
      req,
      "sdl_metadata.api.dashboard.save_dashboard",
      args,
      "POST",
    );
    return NextResponse.json(data.message ?? data);
  } catch (error) {
    return error instanceof SecurityError
      ? securityResponse(error)
      : bffErrorResponse(error);
  }
}

export const POST = protectedHandler(rawPOST);
