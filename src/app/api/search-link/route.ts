import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";

/**
 * Link-field search (R55) via frappe.desk.search.search_link.
 * Response: { data: [{ value, label?, description? }] }.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Invalid request." }, { status: 400 });
  }
  const { txt, module, reference_doctype } = body || {};
  if (!isValidDoctype(module)) {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Missing doctype" }, { status: 400 });
  }
  const args: Record<string, unknown> = {
    doctype: module,
    txt: typeof txt === "string" ? txt : "",
    page_length: 20,
  };
  if (isValidDoctype(reference_doctype)) args.reference_doctype = reference_doctype;
  try {
    const res = await frappeCall(req, "frappe.desk.search.search_link", args);
    const rows = Array.isArray(res?.message) ? res.message : Array.isArray(res?.results) ? res.results : [];
    return NextResponse.json({ data: rows });
  } catch (err) {
    return bffErrorResponse(err, "search-link");
  }
}
