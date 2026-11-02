/**
 * Translate the CRM grid's list request (originally shaped for the SalesBond
 * `sdl_user_management.get_datagrid_list` method, which tenant CRM sites do not
 * have) into standard Frappe `frappe.client.get_list` arguments (R55).
 *
 * Pure functions only, so they can be unit tested without a backend.
 */

const IDENT = /^[A-Za-z0-9_]+$/;
const DOCTYPE = /^[A-Za-z0-9_ -]+$/;
const OPERATORS = new Set([
  '=', '!=', '>', '<', '>=', '<=', 'like', 'not like', 'in', 'not in', 'is', 'between',
]);

export interface GridListRequest {
  module?: string;
  fields?: Array<{ doctype?: string; field?: string } | string>;
  filters?: unknown[];
  limit_start?: number | string;
  limit_page_length?: number | string;
  order_by?: string;
  /** R68: Contact lists only — `true` also lists the tenant's own team members. */
  include_team_members?: boolean;
}

export interface FrappeListArgs {
  doctype: string;
  fields: string[];
  filters: unknown[];
  or_filters: unknown[];
  order_by: string;
  limit_start: number;
  limit_page_length: number;
}

export class ListRequestError extends Error {}

export function isValidDoctype(doctype: unknown): doctype is string {
  return typeof doctype === 'string' && doctype.length > 0 && doctype.length <= 140 && DOCTYPE.test(doctype);
}

function clampInt(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** "CRM Lead.modified desc" / "`tabCRM Lead`.modified DESC" / "modified" → "modified desc" */
export function normaliseOrderBy(orderBy: unknown, doctype: string, allowed: Set<string>): string {
  const fallback = 'modified desc';
  if (typeof orderBy !== 'string' || !orderBy.trim()) return fallback;
  let s = orderBy.trim().replace(/`/g, '');
  for (const prefix of [`tab${doctype}.`, `${doctype}.`]) {
    if (s.startsWith(prefix)) s = s.slice(prefix.length);
  }
  const m = s.match(/^([A-Za-z0-9_]+)(?:\s+(asc|desc))?$/i);
  if (!m) return fallback;
  const field = m[1];
  if (!allowed.has(field) && !['modified', 'creation', 'name'].includes(field)) return fallback;
  return `${field} ${(m[2] || 'desc').toLowerCase()}`;
}

/** Strip "tab" prefixes: "`tabCRM Lead`.lead_name" / "tabCRM Lead.lead_name" → ["CRM Lead", "lead_name"] */
function splitQualified(col: string, doctype: string): [string, string] | null {
  const s = col.replace(/`/g, '');
  const dot = s.lastIndexOf('.');
  if (dot < 0) return IDENT.test(s) ? [doctype, s] : null;
  let dt = s.slice(0, dot);
  const field = s.slice(dot + 1);
  if (dt.startsWith('tab')) dt = dt.slice(3);
  if (!isValidDoctype(dt) || !IDENT.test(field)) return null;
  return [dt, field];
}

function validOperator(op: unknown): op is string {
  return typeof op === 'string' && OPERATORS.has(op.toLowerCase());
}

export function translateFilters(filters: unknown, doctype: string): { filters: unknown[]; or_filters: unknown[] } {
  const out: unknown[] = [];
  const orOut: unknown[] = [];
  if (!Array.isArray(filters)) return { filters: out, or_filters: orOut };

  for (const f of filters) {
    if (!Array.isArray(f) || f.length === 0) continue;

    // Quick search: ["OR", [col, "like", v], ...] → or_filters
    if (f[0] === 'OR') {
      for (const cond of f.slice(1)) {
        if (!Array.isArray(cond) || cond.length < 3) continue;
        const q = splitQualified(String(cond[0]), doctype);
        if (!q || !validOperator(cond[1])) continue;
        // Only search the main doctype's own columns.
        if (q[0] !== doctype) continue;
        orOut.push([q[0], q[1], String(cond[1]).toLowerCase(), cond[2]]);
      }
      continue;
    }

    if (f.length === 3) {
      const q = splitQualified(String(f[0]), doctype);
      if (!q || !validOperator(f[1])) continue;
      out.push([q[0], q[1], String(f[1]).toLowerCase(), f[2]]);
    } else if (f.length === 4) {
      // Child-table filter: [child_doctype, field, op, value]
      if (!isValidDoctype(f[0]) || !IDENT.test(String(f[1])) || !validOperator(f[2])) continue;
      out.push([f[0], f[1], String(f[2]).toLowerCase(), f[3]]);
    }
  }
  return { filters: out, or_filters: orOut };
}

/**
 * R68: a Contact linked to a sign-in user of this tenant (`Contact.user` set) is an internal team member — Frappe
 * creates one for every synced member. Customer-facing Contact lists and counts leave them out; nothing is deleted
 * or changed, and a customer whose email happens to match a member stays listed (the link, not the email, decides).
 */
export const CUSTOMER_CONTACTS_ONLY = ['Contact', 'user', 'is', 'not set'] as const;

export function buildListArgs(body: GridListRequest): FrappeListArgs {
  const doctype = body.module;
  if (!isValidDoctype(doctype)) throw new ListRequestError('Missing or invalid doctype');
  if (!Array.isArray(body.fields)) throw new ListRequestError('Fields must be an array');

  const fields: string[] = [];
  for (const f of body.fields) {
    const dt = typeof f === 'string' ? doctype : f?.doctype || doctype;
    const name = typeof f === 'string' ? f : f?.field;
    // Only the main doctype's columns; related doctypes are loaded on the detail page.
    if (dt !== doctype || !name || !IDENT.test(name)) continue;
    if (!fields.includes(name)) fields.push(name);
  }
  if (!fields.includes('name')) fields.unshift('name');

  const { filters, or_filters } = translateFilters(body.filters, doctype);
  if (doctype === 'Contact' && body.include_team_members !== true) filters.push([...CUSTOMER_CONTACTS_ONLY]);

  return {
    doctype,
    fields,
    filters,
    or_filters,
    order_by: normaliseOrderBy(body.order_by, doctype, new Set(fields)),
    limit_start: clampInt(body.limit_start, 0, 0, 1_000_000),
    limit_page_length: clampInt(body.limit_page_length, 20, 1, 500),
  };
}

/** Rows for MUI DataGrid need an `id`. */
export function toGridRecords(rows: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(rows)) return [];
  return rows.map((r: any) => ({ id: r?.name, ...r }));
}

/** Remove one field from the select list, filters and quick-search filters. */
export function dropField(args: FrappeListArgs, field: string): FrappeListArgs {
  const keep = (f: unknown) => !(Array.isArray(f) && f[0] === args.doctype && f[1] === field);
  return {
    ...args,
    fields: args.fields.filter((f) => f !== field),
    filters: args.filters.filter(keep),
    or_filters: args.or_filters.filter(keep),
    order_by: args.order_by.startsWith(`${field} `) ? 'modified desc' : args.order_by,
  };
}
