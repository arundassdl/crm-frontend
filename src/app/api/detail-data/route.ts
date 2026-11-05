import { protectedHandler } from "@/lib/security";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";

/**
 * Record detail (R55): { ...doc, record: doc, primary_address? }.
 * `record` is the full document (with child tables such as `links`) via frappe.client.get,
 * so Frappe read permission applies.
 */
async function rawPOST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "BAD_REQUEST", kind: "failed", message: "Invalid request." },
      { status: 400 },
    );
  }
  const { doctype } = body || {};
  // CRM Task names are auto-increment numbers.
  const docname =
    typeof body?.docname === "number" ? String(body.docname) : body?.docname;
  if (!isValidDoctype(doctype) || !docname || typeof docname !== "string") {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        kind: "failed",
        message: "Missing doctype or name",
      },
      { status: 400 },
    );
  }

  try {
    const res = await frappeCall(req, "frappe.client.get", {
      doctype,
      name: docname,
    });
    const record = res?.message || null;
    // Fields at the top level and under `record`: detail screens read both shapes.
    const result: Record<string, unknown> = { ...(record || {}), record };

    // Optional: primary address for doctypes linked through Dynamic Link (Contact / CRM Organization).
    if (record && (doctype === "Contact" || doctype === "CRM Organization")) {
      try {
        const addr = await frappeCall(req, "frappe.client.get_list", {
          doctype: "Address",
          fields: ["*"],
          filters: [
            ["Dynamic Link", "link_doctype", "=", doctype],
            ["Dynamic Link", "link_name", "=", docname],
          ],
          order_by: "is_primary_address desc, modified desc",
          limit_page_length: 1,
        });
        if (Array.isArray(addr?.message) && addr.message.length)
          result.primary_address = addr.message[0];
      } catch {
        // Address is optional; a permission gap here must not hide the record.
      }
    }
    return NextResponse.json(result);
  } catch (err) {
    return bffErrorResponse(err, "detail-data");
  }
}

export const POST = protectedHandler(rawPOST);
