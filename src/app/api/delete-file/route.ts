import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { allowedDoctype } from "@/lib/operation-policy";

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
    const loaded = await frappeCall(req, "frappe.client.get", {
      doctype: "File",
      name: file.name,
    });
    const fileDoc = loaded?.message;
    if (
      !fileDoc?.attached_to_doctype ||
      !fileDoc?.attached_to_name ||
      fileDoc.is_private !== 1
    )
      return NextResponse.json({ error: "FILE_NOT_PERMITTED" }, { status: 403 });
    allowedDoctype(fileDoc.attached_to_doctype);
    await frappeCall(req, "frappe.client.get", {
      doctype: fileDoc.attached_to_doctype,
      name: fileDoc.attached_to_name,
    });
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
