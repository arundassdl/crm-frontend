export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";
import { cleanDocForSave, fillPlaceholders } from "@/lib/frappe-doc";

const MAX_DOCUMENTS = 10;

/**
 * Create or update several documents in order (R55). Used by the Lead and Task forms.
 * Body: { documents: [{ doctype, key?, data }] }. A document whose data has `name`
 * is updated; otherwise it is inserted. Later documents may reference earlier ones
 * with "{{key.name}}". Not atomic across documents: stops at the first failure.
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Invalid request." }, { status: 400 });
  }
  const documents = body?.documents;
  if (!Array.isArray(documents) || documents.length === 0 || documents.length > MAX_DOCUMENTS) {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Missing documents" }, { status: 400 });
  }
  for (const d of documents) {
    if (!d || !isValidDoctype(d.doctype) || !d.data || typeof d.data !== "object") {
      return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Invalid document" }, { status: 400 });
    }
  }

  const created: Record<string, Record<string, any>> = {};
  const results: Array<{ doctype: string; name: string; action: "insert" | "update" }> = [];
  try {
    for (const d of documents) {
      const data = cleanDocForSave(fillPlaceholders(d.data, created));
      let saved: any;
      if (data.name) {
        const { name, ...values } = data;
        const res = await frappeCall(req, "frappe.client.set_value", { doctype: d.doctype, name, fieldname: values });
        saved = res?.message;
        results.push({ doctype: d.doctype, name, action: "update" });
      } else {
        const res = await frappeCall(req, "frappe.client.insert", { doc: { ...data, doctype: d.doctype } });
        saved = res?.message;
        results.push({ doctype: d.doctype, name: saved?.name, action: "insert" });
      }
      if (d.key && saved) created[String(d.key)] = saved;
    }
    return NextResponse.json({ success: true, documents: results });
  } catch (err) {
    const resp = bffErrorResponse(err, "create-multiple-doc");
    return resp;
  }
}
