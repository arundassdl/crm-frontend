import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { cleanDocForSave } from "@/lib/frappe-doc";

/** Insert a note-like document (R55) via frappe.client.insert. Body: { doc } (Frappe insert shape). */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Invalid request." }, { status: 400 });
  }
  const raw = typeof body?.doc === "string" ? safeParse(body.doc) : body?.doc;
  if (!raw || typeof raw !== "object" || !raw.doctype) {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Missing doc" }, { status: 400 });
  }
  try {
    const res = await frappeCall(req, "frappe.client.insert", { doc: { ...cleanDocForSave(raw), doctype: raw.doctype } });
    return NextResponse.json(res);
  } catch (err) {
    return bffErrorResponse(err, "post-note");
  }
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
