import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";

/** Set an image field on a record (R55) via frappe.client.set_value. */
export async function PUT(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Invalid request." }, { status: 400 });
  }
  const { doctype, docname, field, imagePath } = body || {};
  if (!isValidDoctype(doctype) || !docname || !/^[A-Za-z0-9_]+$/.test(String(field || ""))) {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Missing fields" }, { status: 400 });
  }
  try {
    const res = await frappeCall(req, "frappe.client.set_value", { doctype, name: docname, fieldname: field, value: imagePath });
    return NextResponse.json({ message: "Primary image set successfully", data: res?.message ?? null });
  } catch (err) {
    return bffErrorResponse(err, "set-primary");
  }
}
