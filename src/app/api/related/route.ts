export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { bffErrorResponse, frappeCall } from "@/lib/tenant-fetch";
import { isValidDoctype } from "@/lib/frappe-list";

/**
 * Notes, comments and tasks attached to a CRM record (R55).
 * Replaces the SalesBond get_notes_with_owner / get_comments_with_owner /
 * get_tasks_with_owner methods with Frappe CRM doctypes:
 *   notes    → FCRM Note (reference_doctype / reference_docname)
 *   comments → Comment (reference_doctype / reference_name, comment_type = Comment)
 *   tasks    → CRM Task (reference_doctype / reference_docname)
 * Body: { kind, doctype, docname, limit?, offset? }. Response: { data, total }.
 * Each row gets owner_name / image / email from the owner's User record when readable.
 */
const KINDS: Record<string, { doctype: string; nameField: string; fields: string[]; extra?: unknown[] }> = {
  notes: {
    doctype: "FCRM Note",
    nameField: "reference_docname",
    fields: ["name", "title", "content", "owner", "creation", "modified"],
  },
  comments: {
    doctype: "Comment",
    nameField: "reference_name",
    fields: ["name", "content", "owner", "comment_email", "creation", "modified"],
    extra: [["Comment", "comment_type", "=", "Comment"]],
  },
  tasks: {
    doctype: "CRM Task",
    nameField: "reference_docname",
    fields: ["name", "title", "description", "priority", "status", "due_date", "assigned_to", "owner", "creation", "modified"],
  },
};

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Invalid request." }, { status: 400 });
  }
  const spec = KINDS[String(body?.kind)];
  const doctype = body?.doctype;
  const docname = body?.docname === undefined || body?.docname === null ? "" : String(body.docname);
  if (!spec || !isValidDoctype(doctype) || !docname) {
    return NextResponse.json({ error: "BAD_REQUEST", kind: "failed", message: "Missing kind, doctype or name" }, { status: 400 });
  }
  const limit = Math.min(Math.max(parseInt(body?.limit ?? "100", 10) || 100, 1), 200);
  const offset = Math.max(parseInt(body?.offset ?? "0", 10) || 0, 0);
  const filters = [
    [spec.doctype, "reference_doctype", "=", doctype],
    [spec.doctype, spec.nameField, "=", docname],
    ...(spec.extra || []),
  ];

  try {
    const [list, count] = await Promise.all([
      frappeCall(req, "frappe.client.get_list", {
        doctype: spec.doctype,
        fields: spec.fields,
        filters,
        order_by: "creation desc",
        limit_start: offset,
        limit_page_length: limit,
      }),
      frappeCall(req, "frappe.client.get_count", { doctype: spec.doctype, filters }),
    ]);
    const rows: any[] = Array.isArray(list?.message) ? list.message : [];

    // Owner display names; optional (a user may not be allowed to read User).
    const owners = Array.from(new Set(rows.map((r) => r.owner).filter(Boolean)));
    const users: Record<string, { full_name?: string; user_image?: string }> = {};
    if (owners.length) {
      try {
        const u = await frappeCall(req, "frappe.client.get_list", {
          doctype: "User",
          fields: ["name", "full_name", "user_image"],
          filters: [["User", "name", "in", owners]],
          limit_page_length: owners.length,
        });
        for (const row of Array.isArray(u?.message) ? u.message : []) users[row.name] = row;
      } catch {
        /* names fall back to the owner email */
      }
    }

    const data = rows.map((r) => ({
      ...r,
      owner_name: users[r.owner]?.full_name || r.owner,
      image: users[r.owner]?.user_image || "",
      email: r.comment_email || r.owner,
    }));
    const total = Number(count?.message);
    return NextResponse.json({ data, total: Number.isFinite(total) ? total : data.length });
  } catch (err) {
    return bffErrorResponse(err, "related");
  }
}
