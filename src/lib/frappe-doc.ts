/**
 * Helpers for documents the CRM UI sends to the tenant backend (R55). Pure functions.
 */

/** Fields the browser must never set: Frappe owns them. */
const SERVER_OWNED = new Set([
  "owner",
  "creation",
  "modified",
  "modified_by",
  "docstatus",
  "idx",
  "doctype",
]);
const CHILD_SERVER_OWNED = new Set([
  "owner",
  "creation",
  "modified",
  "modified_by",
  "docstatus",
  "idx",
  "doctype",
  "parent",
  "parenttype",
  "parentfield",
]);

function cleanChildRow(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  const isNew = !!row.__islocal;
  for (const [k, v] of Object.entries(row)) {
    if (
      k.startsWith("__") ||
      k.startsWith("ignore_") ||
      CHILD_SERVER_OWNED.has(k)
    )
      continue;
    if (k === "name" && isNew) continue;
    out[k] = v;
  }
  // Child doctype is chosen by Frappe from the parent's table field,
  // so a wrong client-side "doctype" on a row cannot break the save.
  return out;
}

/** Remove client-only and server-owned keys; clean child-table rows. */
export function cleanDocForSave(
  data: Record<string, any>,
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(data || {})) {
    if (
      k.startsWith("__") ||
      k.startsWith("ignore_") ||
      SERVER_OWNED.has(k) ||
      k === "ignore_version"
    )
      continue;
    if (
      Array.isArray(v) &&
      v.every((r) => r && typeof r === "object" && !Array.isArray(r))
    ) {
      out[k] = v.map(cleanChildRow);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_-]+)\.([A-Za-z0-9_]+)\s*\}\}/g;

/** Replace "{{key.field}}" in string values (deep) with values from earlier created docs. */
export function fillPlaceholders(
  value: any,
  created: Record<string, Record<string, any>>,
): any {
  if (typeof value === "string") {
    return value.replace(PLACEHOLDER, (m, key, field) => {
      const v = created[key]?.[field];
      return v === undefined || v === null ? m : String(v);
    });
  }
  if (Array.isArray(value))
    return value.map((v) => fillPlaceholders(v, created));
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value))
      out[k] = fillPlaceholders(v, created);
    return out;
  }
  return value;
}
