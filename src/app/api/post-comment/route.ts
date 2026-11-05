import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";

/** Add a comment to a record (R55) via frappe.desk.form.utils.add_comment. */
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
  const { reference_doctype, reference_name, content } = body || {};
  if (!reference_doctype || !reference_name || !content) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        kind: "failed",
        message: "Missing comment fields",
      },
      { status: 400 },
    );
  }
  try {
    // comment_email / comment_by come from the delegated Frappe user, not the browser.
    const sess = await frappeCall(
      req,
      "frappe.auth.get_logged_user",
      {},
      "GET",
    );
    const res = await frappeCall(req, "frappe.desk.form.utils.add_comment", {
      reference_doctype,
      reference_name,
      content,
      comment_email: sess?.message,
      comment_by: sess?.message,
    });
    return NextResponse.json(res);
  } catch (err) {
    return bffErrorResponse(err, "post-comment");
  }
}

export const POST = protectedHandler(rawPOST);
