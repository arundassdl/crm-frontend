export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";
import { cleanDocForSave } from "@/lib/frappe-doc";

/** Create one document (R55) via frappe.client.insert. Response: the created doc. */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Invalid request." }, { status: 400 });
  }
  const { doctype, data } = body || {};
  if (!isValidDoctype(doctype) || !data || typeof data !== "object") {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Missing doctype or data" }, { status: 400 });
  }
  try {
    const res = await frappeCall(req, "frappe.client.insert", { doc: { ...cleanDocForSave(data), doctype } });
    return NextResponse.json(res?.message ?? null);
  } catch (err) {
    return bffErrorResponse(err, "create");
  }
}
