export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { BffError, bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { FrappeListArgs, ListRequestError, buildListArgs, dropField, toGridRecords } from "@/lib/frappe-list";

/**
 * Grid list for a CRM doctype (R55).
 * Uses standard Frappe list APIs on the caller's tenant backend through the
 * delegated session; Frappe enforces the user's permissions.
 * Response: { records, total_count } or { error, kind, message } with an HTTP error status.
 */
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Invalid request." }, { status: 400 });
  }

  let args;
  try {
    args = buildListArgs(body);
  } catch (err) {
    if (err instanceof ListRequestError) {
      return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: err.message }, { status: 400 });
    }
    return bffErrorResponse(err, "datalist");
  }

  // A column the tenant's CRM version does not have would fail the whole query.
  // Drop it and retry (a few times at most) so the rest of the list still loads.
  const dropped: string[] = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await loadList(req, args, dropped);
    } catch (err) {
      const missing = err instanceof BffError && err.kind === "validation" ? unknownField(err.message) : null;
      if (!missing || missing === "name" || dropped.includes(missing)) return bffErrorResponse(err, "datalist");
      dropped.push(missing);
      args = dropField(args, missing);
    }
  }
  return bffErrorResponse(new BffError(422, "VALIDATION_ERROR", "validation", "The list request was not accepted."));
}

function unknownField(message: string): string | null {
  const m = message.match(/Field not permitted in query:\s*`?([A-Za-z0-9_]+)`?/i) || message.match(/Unknown column '(?:[^']*\.)?`?([A-Za-z0-9_]+)`?'/i);
  return m ? m[1] : null;
}

async function loadList(req: Request, args: FrappeListArgs, dropped: string[]) {
  const [list, count] = await Promise.all([
    frappeCall(req, "frappe.client.get_list", { ...args }),
    frappeCall(req, "frappe.desk.reportview.get_count", {
      doctype: args.doctype,
      filters: args.filters,
      or_filters: args.or_filters,
    }),
  ]);
  const records = toGridRecords(list?.message);
  const total = Number(count?.message);
  const body: Record<string, unknown> = {
    records,
    total_count: Number.isFinite(total) ? total : records.length,
  };
  if (dropped.length) {
    body.dropped_fields = dropped;
    console.warn(`[datalist] ${args.doctype}: dropped unknown fields ${dropped.join(", ")}`);
  }
  return NextResponse.json(body);
}
