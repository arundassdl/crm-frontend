import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";
import { allowedDoctype } from "@/lib/operation-policy";

/** Files attached to a record (R55). Response: { data: [...] } (Frappe resource shape). */
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
  const { doctype, name } = body || {};
  if (!isValidDoctype(doctype) || !name) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        kind: "failed",
        message: "doctype and name required",
      },
      { status: 400 },
    );
  }
  try {
    allowedDoctype(doctype);
    await frappeCall(req, "frappe.client.get", { doctype, name: String(name) });
    const res = await frappeCall(req, "frappe.client.get_list", {
      doctype: "File",
      fields: [
        "name",
        "file_name",
        "file_url",
        "attached_to_field",
        "is_private",
        "file_size",
      ],
      filters: [
        ["attached_to_doctype", "=", doctype],
        ["attached_to_name", "=", String(name)],
      ],
      limit_page_length: 100,
    });
    return NextResponse.json({
      data: Array.isArray(res?.message) ? res.message : [],
    });
  } catch (err) {
    return bffErrorResponse(err, "list-files");
  }
}

export const POST = protectedHandler(rawPOST);
