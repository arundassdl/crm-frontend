import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";

/** Set one field (Kanban drag, stage bar) via frappe.client.set_value (R55). */
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
  const { doctype, fieldname, name, value } = body || {};
  if (
    !isValidDoctype(doctype) ||
    !fieldname ||
    !/^[A-Za-z0-9_]+$/.test(String(fieldname)) ||
    !name ||
    value === undefined
  ) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        kind: "failed",
        message: "Missing required fields: doctype, fieldname, name, value",
      },
      { status: 400 },
    );
  }
  try {
    const res = await frappeCall(req, "frappe.client.set_value", {
      doctype,
      name,
      fieldname,
      value,
    });
    return NextResponse.json(res?.message ?? null);
  } catch (err) {
    return bffErrorResponse(err, "set-value");
  }
}

export const POST = protectedHandler(rawPOST);
