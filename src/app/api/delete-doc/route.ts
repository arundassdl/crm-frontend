import { protectedHandler } from "@/lib/security";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";

/** Delete one document (R55) via frappe.client.delete (delete permission applies). */
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
  const name = typeof body?.name === "number" ? String(body.name) : body?.name;
  if (!isValidDoctype(doctype) || !name || typeof name !== "string") {
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
    await frappeCall(req, "frappe.client.delete", { doctype, name });
    return NextResponse.json({ success: true });
  } catch (err) {
    return bffErrorResponse(err, "delete-doc");
  }
}

export const POST = protectedHandler(rawPOST);
