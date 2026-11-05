import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";

/** Deals linked to a contact (R55). Response: { data, totalCount }. */
async function rawGET(req: NextRequest) {
  const contactName = req.nextUrl.searchParams.get("contact");
  if (!contactName) {
    return NextResponse.json(
      {
        error: "BAD_REQUEST",
        kind: "failed",
        message: "Missing contact parameter",
      },
      { status: 400 },
    );
  }
  try {
    const res = await frappeCall(req, "frappe.client.get_list", {
      doctype: "CRM Deal",
      fields: ["*"],
      filters: [["CRM Contacts", "contact", "=", contactName]],
      limit_page_length: 0,
    });
    const deals = Array.isArray(res?.message) ? res.message : [];
    return NextResponse.json({ data: deals, totalCount: deals.length });
  } catch (err) {
    return bffErrorResponse(err, "contact-deals");
  }
}

export const GET = protectedHandler(rawGET);
