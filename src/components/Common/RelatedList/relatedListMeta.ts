import {
  Handshake,
  UserCircle,
  Buildings,
  ClipboardText,
  Target,
  ListBullets,
} from "@phosphor-icons/react";

/**
 * Per child-doctype metadata for rendering a config-driven related-list section.
 * Everything that varies by related-list type (which field links to the detail
 * page, where that detail page lives, the create drawer, the section icon) lives
 * here so the section component itself stays generic.
 */
export type RelatedListKind = "deal" | "contact" | "account" | "lead" | "task" | "generic";

export interface RelatedListMeta {
  kind: RelatedListKind;
  /** Candidate field names (in priority order) that render as a link to the record. */
  primaryFields: string[];
  /** Detail-route base; the record `name` is appended (encoded). Empty ⇒ not clickable. */
  detailHrefBase: string;
  icon: React.ElementType;
  /** Label used on the "New …" button. */
  newLabel: string;
}

const META: Record<string, RelatedListMeta> = {
  "CRM Deal": { kind: "deal", primaryFields: ["deal_name"], detailHrefBase: "/deals/detail/", icon: Handshake, newLabel: "Deal" },
  "Contact": { kind: "contact", primaryFields: ["first_name", "full_name"], detailHrefBase: "/contacts/detail/", icon: UserCircle, newLabel: "Contact" },
  "CRM Organization": { kind: "account", primaryFields: ["organization_name"], detailHrefBase: "/accounts/detail/", icon: Buildings, newLabel: "Account" },
  "CRM Lead": { kind: "lead", primaryFields: ["lead_name", "first_name"], detailHrefBase: "/leads/detail/", icon: Target, newLabel: "Lead" },
  "CRM Leads": { kind: "lead", primaryFields: ["lead_name", "first_name"], detailHrefBase: "/leads/detail/", icon: Target, newLabel: "Lead" },
};

/** Lightweight kind detection (also used for Task WHERE-condition special-casing). */
export function getRelatedListKind(mainDoctype?: string, label?: string): RelatedListKind {
  if (mainDoctype && META[mainDoctype]) return META[mainDoctype].kind;
  const hay = `${mainDoctype || ""} ${label || ""}`.toLowerCase();
  if (hay.includes("task")) return "task";
  if (hay.includes("deal")) return "deal";
  if (hay.includes("contact")) return "contact";
  if (hay.includes("lead")) return "lead";
  if (hay.includes("organization") || hay.includes("account")) return "account";
  return "generic";
}

export function getRelatedListMeta(mainDoctype?: string, label?: string): RelatedListMeta {
  if (mainDoctype && META[mainDoctype]) return META[mainDoctype];
  const kind = getRelatedListKind(mainDoctype, label);
  switch (kind) {
    case "task":
      return { kind, primaryFields: ["title", "subject"], detailHrefBase: "/tasks/detail/", icon: ClipboardText, newLabel: "Task" };
    case "deal":
      return { kind, primaryFields: ["deal_name"], detailHrefBase: "/deals/detail/", icon: Handshake, newLabel: "Deal" };
    case "contact":
      return { kind, primaryFields: ["first_name", "full_name"], detailHrefBase: "/contacts/detail/", icon: UserCircle, newLabel: "Contact" };
    case "lead":
      return { kind, primaryFields: ["lead_name", "first_name"], detailHrefBase: "/leads/detail/", icon: Target, newLabel: "Lead" };
    case "account":
      return { kind, primaryFields: ["organization_name"], detailHrefBase: "/accounts/detail/", icon: Buildings, newLabel: "Account" };
    default:
      return { kind: "generic", primaryFields: ["name"], detailHrefBase: "", icon: ListBullets, newLabel: "Record" };
  }
}

/** CRM parent doctype for a given parent module (used to link new Tasks by reference). */
export function parentDoctypeForModule(parent_module: string): string {
  switch (parent_module) {
    case "Accounts": return "CRM Organization";
    case "Deals": return "CRM Deals";
    case "Leads": return "CRM Leads";
    case "Contacts": return "Contact";
    default: return "";
  }
}

/**
 * Notes and Attachments already have dedicated cards on every detail dashboard,
 * so a related list configured for them in Settings → "Detail View" would render
 * the same content a second time. Detect those entries so the generic
 * config-driven sections can skip them.
 *
 * Matching stays deliberately exact (labels are compared whole, not by
 * substring) so real doctypes such as "Delivery Note" keep rendering.
 */
export function isDedicatedRelatedList(mainDoctype?: string, label?: string): boolean {
  const DEDICATED_DOCTYPES = ["fcrm note", "note", "file", "attachment"];
  const DEDICATED_LABELS = ["note", "notes", "attachment", "attachments"];
  const doctype = String(mainDoctype || "").trim().toLowerCase();
  const name = String(label || "").trim().toLowerCase();
  return DEDICATED_DOCTYPES.includes(doctype) || DEDICATED_LABELS.includes(name);
}
