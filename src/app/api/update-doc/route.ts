export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";
import { cleanDocForSave } from "@/lib/frappe-doc";

/** Update fields on one document (R55) via frappe.client.set_value (write permission applies). */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Invalid request." }, { status: 400 });
  }
  const { doctype, name, data } = body || {};
  if (!isValidDoctype(doctype) || !name || !data || typeof data !== "object") {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Missing doctype, name or data" }, { status: 400 });
  }
  const values = cleanDocForSave(data);
  delete values.name;
  if (Object.keys(values).length === 0) {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Nothing to update" }, { status: 400 });
  }
  try {
    const res = await frappeCall(req, "frappe.client.set_value", { doctype, name, fieldname: values });
    return NextResponse.json(res?.message ?? null);
  } catch (err) {
    return bffErrorResponse(err, "update-doc");
  }
}
