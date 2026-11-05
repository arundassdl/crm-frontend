import { protectedHandler } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { frappeCall, bffErrorResponse } from "@/lib/tenant-fetch";
import { allowedDoctype } from "@/lib/operation-policy";
import { cleanDocForSave } from "@/lib/frappe-doc";
import { SecurityError, securityResponse } from "@/lib/security";
async function rawPOST(req: NextRequest) {
  try {
    const body = await req.json();
    const doctype = body.doctype || body.module;
    allowedDoctype(doctype);
    const route = new URL(req.url).pathname;
    let data: any;
    if (route.endsWith("/create"))
      data = await frappeCall(req, "frappe.client.insert", {
        doc: { ...cleanDocForSave(body.formData || body.data || {}), doctype },
      });
    else if (route.endsWith("/update"))
      data = await frappeCall(req, "frappe.client.set_value", {
        doctype,
        name: body.name,
        fieldname: cleanDocForSave(
          body.updateData || body.formData || body.data || {},
        ),
      });
    else if (route.endsWith("/rename"))
      throw new SecurityError(501, "FEATURE_BACKEND_NOT_VERIFIED");
    else
      data = await frappeCall(req, "frappe.client.get_list", {
        doctype,
        filters: body.filters || [],
        fields: body.fields || ["name"],
        limit_page_length: Math.min(Number(body.limit_page_length) || 20, 100),
      });
    return NextResponse.json(data);
  } catch (error) {
    return error instanceof SecurityError
      ? securityResponse(error)
      : bffErrorResponse(error);
  }
}

export const POST = protectedHandler(rawPOST);
