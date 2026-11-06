import { NextResponse } from "next/server";
import { protectedHandler } from "@/lib/security";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";

export const dynamic = "force-dynamic";

const ALLOWED_OPTIONS = new Set([
  "create_account", "create_contact", "create_deal", "owner",
  "notify_record_owner", "source_module", "source_layout", "account_name",
  "existing_account", "existing_contact", "contact_name", "deal_layout",
]);

function invalid(message: string) {
  return NextResponse.json(
    { error: "BAD_REQUEST", kind: "validation", message },
    { status: 400 },
  );
}

async function rawPOST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return invalid("Invalid conversion request.");
  }
  const leadId = typeof body?.lead_id === "string" ? body.lead_id.trim() : "";
  if (!leadId || leadId.length > 140) return invalid("A valid lead is required.");

  let options: unknown = body?.options ?? {};
  if (typeof options === "string") {
    try { options = JSON.parse(options); } catch { return invalid("Invalid conversion options."); }
  }
  if (!options || typeof options !== "object" || Array.isArray(options))
    return invalid("Invalid conversion options.");
  const optionEntries = Object.entries(options as Record<string, unknown>);
  if (optionEntries.length > 16 || optionEntries.some(([key]) => !ALLOWED_OPTIONS.has(key)))
    return invalid("Unsupported conversion option.");

  const dealValue = body?.deal_value;
  if (dealValue !== undefined && (!Array.isArray(dealValue) || dealValue.length > 100))
    return invalid("Invalid deal values.");
  if (Array.isArray(dealValue)) {
    for (const row of dealValue) {
      if (!row || typeof row !== "object" || Array.isArray(row)) return invalid("Invalid deal value.");
      const keys = Object.keys(row);
      if (keys.some((key) => key !== "fieldname" && key !== "value"))
        return invalid("Unsupported deal field.");
      if (typeof row.fieldname !== "string" || !/^[A-Za-z0-9_]{1,140}$/.test(row.fieldname))
        return invalid("Invalid deal field.");
    }
  }

  try {
    const result = await frappeCall(req, "sdl_metadata.api.lead_conversion.convert_lead", {
      lead_id: leadId,
      options: JSON.stringify(Object.fromEntries(optionEntries)),
      ...(dealValue === undefined ? {} : { deal_value: dealValue }),
    });
    return NextResponse.json(result);
  } catch (error) {
    return bffErrorResponse(error, "lead-convert");
  }
}

export const POST = protectedHandler(rawPOST);
