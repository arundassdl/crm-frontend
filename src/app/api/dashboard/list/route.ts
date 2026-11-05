import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { frappeCall, bffErrorResponse } from "@/lib/tenant-fetch";
import { SecurityError, securityResponse } from "@/lib/security";
async function rawGET(req: NextRequest, context: any) {
  try {
    const args: any = Object.fromEntries(req.nextUrl.searchParams);
    delete args.username;
    delete args.role_profile;
    delete args.token;

    const data = await frappeCall(
      req,
      "sdl_metadata.api.dashboard.get_dashboard_list",
      args,
      "GET",
    );
    return NextResponse.json(data.message ?? data);
  } catch (error) {
    return error instanceof SecurityError
      ? securityResponse(error)
      : bffErrorResponse(error);
  }
}

export const GET = protectedHandler(rawGET);
