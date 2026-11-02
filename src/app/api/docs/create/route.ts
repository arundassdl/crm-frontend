export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { BffError, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";
import { cleanDocForSave } from "@/lib/frappe-doc";

/**
 * Create a document from a form (Deals) via frappe.client.insert (R55).
 * Legacy response shape kept: { success: true, data } or { error: "<message>", kind }.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }
  const { module, formData, links } = body || {};
  if (!isValidDoctype(module) || !formData || typeof formData !== "object") {
    return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
  }
  const doc: Record<string, any> = { ...cleanDocForSave(formData), doctype: module };
  if (Array.isArray(links) && links.length) doc.links = links;
  try {
    const res = await frappeCall(req, "frappe.client.insert", { doc });
    return NextResponse.json({ success: true, data: res?.message ?? null });
  } catch (err) {
    const e = err instanceof BffError ? err : null;
    if (!e) console.error("[docs/create]", (err as any)?.message);
    return NextResponse.json(
      { success: false, error: e?.message || "Something went wrong. Try again.", kind: e?.kind || "failed" },
      { status: e?.status || 500 },
    );
  }
}
