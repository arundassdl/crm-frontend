import { NextResponse } from "next/server";
import { protectedHandler } from "@/lib/security";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";

export const dynamic = "force-dynamic";

async function rawGET(req: Request) {
  try {
    const result = await frappeCall(req, "sdl_metadata.api.roles.permission_matrix", {}, "GET");
    return NextResponse.json(result?.message ?? {}, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return bffErrorResponse(error, "permission-matrix-read"); }
}

async function rawPOST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(k => k !== "matrix"))
      return NextResponse.json({ message: "Invalid permission matrix." }, { status: 400 });
    const result = await frappeCall(req, "sdl_metadata.api.roles.save_permission_matrix", { matrix: body.matrix });
    return NextResponse.json({ message: { msg: "success", data: result?.message } });
  } catch (error) { return bffErrorResponse(error, "permission-matrix-save"); }
}

export const GET = protectedHandler(rawGET);
export const POST = protectedHandler(rawPOST);
