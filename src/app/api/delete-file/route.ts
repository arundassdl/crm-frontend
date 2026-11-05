import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";

/** Delete an attached file (R55) via frappe.client.delete. */
async function rawPOST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "BAD_REQUEST", kind: "failed", message: "Invalid request." },
      { status: 400 },
    );
  }
  const file = body?.file;
  if (!file?.name || typeof file.name !== "string") {
    return NextResponse.json(
      { error: "BAD_REQUEST", kind: "failed", message: "file is required" },
      { status: 400 },
    );
  }
  try {
    await frappeCall(req, "frappe.client.delete", {
      doctype: "File",
      name: file.name,
    });
    return NextResponse.json({ message: "ok" });
  } catch (err) {
    return bffErrorResponse(err, "delete-file");
  }
}

export const POST = protectedHandler(rawPOST);
