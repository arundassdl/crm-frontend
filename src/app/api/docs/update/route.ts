export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { BffError, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";
import { cleanDocForSave } from "@/lib/frappe-doc";

/**
 * Update a document from a form (Deals) via frappe.client.set_value (R55).
 * Legacy response shape kept: { success: true, data } or { error: "<message>", kind }.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  const { doctype, name, updateData } = body || {};
  if (!isValidDoctype(doctype) || !name || !updateData || typeof updateData !== "object") {
    return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
  }
  const values = cleanDocForSave(updateData);
  delete values.name;
  try {
    const res = await frappeCall(req, "frappe.client.set_value", { doctype, name, fieldname: values });
    return NextResponse.json({ success: true, data: res?.message ?? null });
  } catch (err) {
    const e = err instanceof BffError ? err : null;
    if (!e) console.error("[docs/update]", (err as any)?.message);
    return NextResponse.json(
      { success: false, error: e?.message || "Something went wrong. Try again.", kind: e?.kind || "failed" },
      { status: e?.status || 500 },
    );
  }
}
