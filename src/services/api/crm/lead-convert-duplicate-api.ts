import { CONSTANTS } from "@/services/config/app-config";
import { fetchFromERPNext } from "@/services/api/common-erpnext-api/listing-api-get";
import type { ConversionMapMessage } from "@/services/api/general_apis/layout-api";

export type DuplicateMatchReason = "company" | "email" | "phone";

/** One CRM Organization row for the “matching accounts” UI + modal. */
export interface LeadConversionDuplicateAccount {
    name: string;
    phone?: string;
    website?: string;
    account_type?: string;
    /** When the match came via Contact email/phone, the contact’s display name. */
    matched_via_contact_name?: string;
    /** How this row was discovered (for messaging). */
    reason: DuplicateMatchReason;
}

export type DuplicateMatchFieldLabel =
    | "Account Name"
    | "Email"
    | "Phone"
    | "Last Name"
    | "Organization";

/** `contact_email` = lead email matches a Contact (takes priority). `account` = org name / mapping / phone path. */
export type LeadConversionDuplicateScenario = "none" | "contact_email" | "account";

/** One row for the “Matching Contact Record(s)” modal (email duplicate path). */
export interface LeadConversionDuplicateContactRow {
    /** Contact `name` (document id). */
    name: string;
    contact_display_name: string;
    email_id: string;
    /** Linked CRM Organization display (first link). */
    account_name: string;
    /** CRM Organization `name` (first dynamic link) — send as `existing_account` when `existing_contact` is set. */
    linked_account_doc_name?: string;
}

export interface LeadConversionDuplicateInfo {
    scenario: LeadConversionDuplicateScenario;
    has_duplicate: boolean;
    /** Bold phrase in the warning line (mapping-driven for Account vs Contact overlap). */
    match_field_label: DuplicateMatchFieldLabel;
    /**
     * CRM Lead fieldname used for the match (e.g. `organization_name`, `last_name`) —
     * resolve to layout **label** in the UI.
     */
    match_lead_source_field?: string;
    /** When lead email matches an existing Contact — use for `existing_contact` on convert. */
    existing_contact_doc_name?: string;
    matched_contact_display_name?: string;
    /** Rows for Matching Contact Record(s) modal (same email). */
    matched_contacts?: LeadConversionDuplicateContactRow[];
    accounts: LeadConversionDuplicateAccount[];
    reasons: DuplicateMatchReason[];
}

function pickLeadField(lead: Record<string, any>, ...keys: string[]): string {
    for (const k of keys) {
        const v =
            lead[k] ??
            lead[`SDL Layout.${k}`] ??
            lead[`tabCRM Lead.${k}`];
        if (v == null || v === "") continue;
        if (typeof v === "object") return JSON.stringify(v);
        return String(v).trim();
    }
    return "";
}

/**
 * Company / account name on CRM Lead: `organization` (Link → CRM Organization.name),
 * `organization_name`, `company` / `company_name`. Link values may arrive as `{ name }`.
 */
export function pickLeadCompany(lead: Record<string, any>): string {
    const keys = [
        "organization",
        "organization_name",
        "company_name",
        "company",
        "lead_company",
        "account_name",
        "org_name",
    ];
    for (const key of keys) {
        const raw =
            lead[key] ??
            lead[`SDL Layout.${key}`] ??
            lead[`tabCRM Lead.${key}`];
        if (raw == null || raw === "") continue;
        if (typeof raw === "object" && raw !== null && !Array.isArray(raw) && "name" in raw) {
            const n = String((raw as { name?: unknown }).name ?? "").trim();
            if (n) return n;
        }
        if (typeof raw !== "object") {
            const s = String(raw).trim();
            if (s) return s;
        }
    }
    return "";
}

/** First company/org-related Lead field key that has a value (same order as {@link pickLeadCompany}). */
export function pickLeadCompanyFieldKey(lead: Record<string, any>): string | null {
    const keys = [
        "organization",
        "organization_name",
        "company_name",
        "company",
        "lead_company",
        "account_name",
        "org_name",
    ];
    for (const key of keys) {
        const raw =
            lead[key] ??
            lead[`SDL Layout.${key}`] ??
            lead[`tabCRM Lead.${key}`];
        if (raw == null || raw === "") continue;
        if (typeof raw === "object" && raw !== null && !Array.isArray(raw) && "name" in raw) {
            const n = String((raw as { name?: unknown }).name ?? "").trim();
            if (n) return key;
        }
        if (typeof raw !== "object") {
            const s = String(raw).trim();
            if (s) return key;
        }
    }
    return null;
}

function pickLeadEmailFieldKey(lead: Record<string, any>): string {
    if (pickLeadField(lead, "email_id")) return "email_id";
    if (pickLeadField(lead, "email")) return "email";
    return "email_id";
}

function pickLeadPhoneFieldKey(lead: Record<string, any>): string | null {
    if (pickLeadValueBySourceField(lead, "mobile_no")) return "mobile_no";
    if (pickLeadValueBySourceField(lead, "phone")) return "phone";
    return null;
}

/**
 * Accounts layout fieldnames that map CRM Organization identity / “SDL Account” value.
 * Layouts may use `name`, `sdl_account`, or custom labels saved as fieldnames.
 */
const ACCOUNTS_ORG_NAME_TARGETS = new Set(
    [
        "name",
        "organization_name",
        "organization",
        "sdl_account",
        "sdl_account_name",
        "account_name",
        "customer_name",
        "company_name",
    ].map((s) => s.toLowerCase())
);

function parseMappingJsonRow(raw: unknown): Record<string, string> | null {
    if (!raw) return null;
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
        return raw as Record<string, string>;
    }
    if (typeof raw === "string") {
        try {
            const p = JSON.parse(raw);
            return typeof p === "object" && p !== null ? (p as Record<string, string>) : null;
        } catch {
            return null;
        }
    }
    return null;
}

/** Frappe `/api/resource` list responses may use `data` or nested `message`. */
function extractResourceList(res: unknown): any[] {
    if (!res || typeof res !== "object") return [];
    const r = res as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data;
    const msg = r.message;
    if (msg && typeof msg === "object") {
        const m = msg as Record<string, unknown>;
        if (Array.isArray(m.data)) return m.data;
    }
    return [];
}

function accountsTargetFromMappingJson(mj: Record<string, string>): string {
    const direct = String(mj.Accounts ?? (mj as Record<string, string>).accounts ?? "").trim();
    if (direct) return direct;
    for (const [k, v] of Object.entries(mj)) {
        if (k.toLowerCase() === "accounts" && v != null && String(v).trim() !== "") {
            return String(v).trim();
        }
    }
    return "";
}

/** Accounts layout field that plausibly maps CRM Organization identity (name), not e.g. phone. */
function isAccountOrgIdentityTarget(targetField: string): boolean {
    const t = targetField.trim().toLowerCase();
    if (!t) return false;
    if (ACCOUNTS_ORG_NAME_TARGETS.has(t)) return true;
    if (
        t.includes("organization_name") ||
        t.includes("account_name") ||
        t.includes("company_name") ||
        t.includes("customer_name") ||
        t.includes("org_name") ||
        t.includes("sdl_account") ||
        t === "title" ||
        t === "org_name"
    ) {
        return true;
    }
    return false;
}

/**
 * All Lead `source_field`s that map to Account org / SDL Account targets (`mapping_json.Accounts`).
 */
export function collectLeadFieldsMappedToAccountOrgName(
    mapping: ConversionMapMessage | null | undefined
): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    if (!mapping?.mapping_rows?.length) return out;
    for (const row of mapping.mapping_rows) {
        const mj = parseMappingJsonRow((row as { mapping_json?: unknown }).mapping_json);
        if (!mj) continue;
        const accountsTarget = accountsTargetFromMappingJson(mj);
        if (!accountsTarget) continue;
        if (!isAccountOrgIdentityTarget(accountsTarget)) continue;
        const sf = String((row as { source_field?: string }).source_field ?? "").trim();
        if (sf && !seen.has(sf)) {
            seen.add(sf);
            out.push(sf);
        }
    }
    return out;
}

/** First Lead field mapped to Account org name (compat). */
export function findLeadFieldMappedToAccountOrgName(
    mapping: ConversionMapMessage | null | undefined
): string | null {
    const all = collectLeadFieldsMappedToAccountOrgName(mapping);
    return all[0] ?? null;
}

/**
 * Accounts layout `fieldname` that receives the Lead value for the row matching
 * `leadSourceField` (e.g. Lead `company` → Accounts `organization_name` → label “Account Name”).
 * If `leadSourceField` is empty or has no org mapping row, returns the first org-identity Accounts target in the map.
 */
export function getAccountsOrgTargetFieldNameForLeadSource(
    mapping: ConversionMapMessage | null | undefined,
    leadSourceField: string | undefined | null
): string | null {
    if (!mapping?.mapping_rows?.length) return null;
    const want = String(leadSourceField ?? "").trim().toLowerCase();
    if (want) {
        for (const row of mapping.mapping_rows) {
            const sf = String((row as { source_field?: string }).source_field ?? "").trim().toLowerCase();
            if (sf !== want) continue;
            const mj = parseMappingJsonRow((row as { mapping_json?: unknown }).mapping_json);
            if (!mj) continue;
            const t = accountsTargetFromMappingJson(mj);
            if (t && isAccountOrgIdentityTarget(t)) return t.trim();
        }
    }
    for (const row of mapping.mapping_rows) {
        const mj = parseMappingJsonRow((row as { mapping_json?: unknown }).mapping_json);
        if (!mj) continue;
        const t = accountsTargetFromMappingJson(mj);
        if (t && isAccountOrgIdentityTarget(t)) return t.trim();
    }
    return null;
}

/** SDL Layout document name for the Accounts target from conversion map `target_modules`. */
export function getAccountsTargetLayoutIdFromMapping(
    mapping: ConversionMapMessage | null | undefined
): string | null {
    const tms = mapping?.target_modules;
    if (!Array.isArray(tms)) return null;
    const row = tms.find((t: { target_doctype?: string }) => String(t?.target_doctype ?? "").trim() === "Accounts");
    const id = row ? String((row as { target_layout?: string }).target_layout ?? "").trim() : "";
    return id || null;
}

function contactsTargetFromMappingJson(mj: Record<string, string>): string {
    const direct = String(
        mj.Contact ?? mj.Contacts ?? (mj as Record<string, string>).contact ?? ""
    ).trim();
    if (direct) return direct;
    for (const [k, v] of Object.entries(mj)) {
        const kl = k.toLowerCase();
        if ((kl === "contact" || kl === "contacts") && v != null && String(v).trim() !== "") {
            return String(v).trim();
        }
    }
    return "";
}

function isContactEmailIdentityTarget(targetField: string): boolean {
    const t = targetField.trim().toLowerCase();
    if (!t) return false;
    if (t === "email_id" || t === "email") return true;
    if (t.includes("email")) return true;
    return false;
}

/**
 * Contacts layout `fieldname` for the Lead row matching `leadSourceField`
 * (e.g. Lead `email_id` → Contacts `email_id` → label “Email”).
 */
export function getContactsTargetFieldNameForLeadSource(
    mapping: ConversionMapMessage | null | undefined,
    leadSourceField: string | undefined | null
): string | null {
    if (!mapping?.mapping_rows?.length) return null;
    const want = String(leadSourceField ?? "").trim().toLowerCase();
    if (want) {
        for (const row of mapping.mapping_rows) {
            const sf = String((row as { source_field?: string }).source_field ?? "").trim().toLowerCase();
            if (sf !== want) continue;
            const mj = parseMappingJsonRow((row as { mapping_json?: unknown }).mapping_json);
            if (!mj) continue;
            const t = contactsTargetFromMappingJson(mj);
            if (t && isContactEmailIdentityTarget(t)) return t.trim();
        }
    }
    for (const row of mapping.mapping_rows) {
        const mj = parseMappingJsonRow((row as { mapping_json?: unknown }).mapping_json);
        if (!mj) continue;
        const t = contactsTargetFromMappingJson(mj);
        if (t && isContactEmailIdentityTarget(t)) return t.trim();
    }
    return null;
}

/** SDL Layout document name for the Contacts target from conversion map `target_modules`. */
export function getContactsTargetLayoutIdFromMapping(
    mapping: ConversionMapMessage | null | undefined
): string | null {
    const tms = mapping?.target_modules;
    if (!Array.isArray(tms)) return null;
    const row = tms.find((t: { target_doctype?: string }) => String(t?.target_doctype ?? "").trim() === "Contacts");
    const id = row ? String((row as { target_layout?: string }).target_layout ?? "").trim() : "";
    return id || null;
}

/** Single lead field value (handles Link `{ name }`). */
export function pickLeadValueBySourceField(lead: Record<string, any>, sourceField: string): string {
    const raw =
        lead[sourceField] ??
        lead[`SDL Layout.${sourceField}`] ??
        lead[`tabCRM Lead.${sourceField}`];
    if (raw == null || raw === "") return "";
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw) && "name" in raw) {
        return String((raw as { name?: unknown }).name ?? "").trim();
    }
    if (typeof raw === "object") return "";
    return String(raw).trim();
}

type MappingSourceKind = "last_name" | "organization" | "other";

function classifyMappingSourceField(sourceField: string): MappingSourceKind {
    const k = sourceField.trim().toLowerCase();
    if (k === "last_name") return "last_name";
    if (
        k === "organization" ||
        k === "organization_name" ||
        k === "company" ||
        k === "company_name" ||
        k === "lead_company" ||
        k === "sdl_company" ||
        k === "sdl_account" ||
        k.endsWith("_company") ||
        k.endsWith("_organization")
    ) {
        return "organization";
    }
    return "other";
}

const ORG_LABEL_RANK: Partial<Record<DuplicateMatchFieldLabel, number>> = {
    Organization: 3,
    "Last Name": 2,
    "Account Name": 1,
};

function mergeOrgMappingLabel(
    prev: DuplicateMatchFieldLabel | null,
    candidate: DuplicateMatchFieldLabel
): DuplicateMatchFieldLabel {
    if (!prev) return candidate;
    const a = ORG_LABEL_RANK[candidate] ?? 0;
    const b = ORG_LABEL_RANK[prev] ?? 0;
    return a >= b ? candidate : prev;
}

/** CRM Organization: only `name` and `organization_name` in list queries (duplicate matching). */
const CRM_ORG_LIST_FIELDS = ["name", "organization_name"];

async function findOrgsByExactDocumentNameOnly(
    name: string,
    token: string
): Promise<Record<string, any>[]> {
    const c = name.trim();
    if (!c) return [];
    try {
        const params = {
            filters: JSON.stringify([["name", "=", c]]),
            fields: JSON.stringify(CRM_ORG_LIST_FIELDS),
            limit_page_length: 20,
        };
        const res = await fetchFromERPNext("CRM Organization", params, token);
        return extractResourceList(res);
    } catch {
        return [];
    }
}

function normEmail(s: string): string {
    return s.trim().toLowerCase();
}

function normPhone(s: string): string {
    return s.replace(/\D/g, "");
}

async function safeFetchOrgByName(
    name: string,
    token: string
): Promise<Record<string, any> | null> {
    if (!name.trim()) return null;
    try {
        const params = {
            filters: JSON.stringify([["name", "=", name.trim()]]),
            fields: JSON.stringify(CRM_ORG_LIST_FIELDS),
            limit_page_length: 1,
        };
        const res = await fetchFromERPNext("CRM Organization", params, token);
        const list = extractResourceList(res);
        const row = list[0];
        return row && typeof row === "object" ? row : null;
    } catch {
        return null;
    }
}

async function findOrgsByCompanyName(company: string, token: string): Promise<Record<string, any>[]> {
    const c = company.trim();
    if (!c) return [];
    const out: Record<string, any>[] = [];
    const seen = new Set<string>();
    const tryAdd = async (filters: [string, string, string][]) => {
        try {
            const params = {
                filters: JSON.stringify(filters),
                fields: JSON.stringify(CRM_ORG_LIST_FIELDS),
                limit_page_length: 20,
            };
            const res = await fetchFromERPNext("CRM Organization", params, token);
            for (const row of extractResourceList(res)) {
                if (row?.name && !seen.has(row.name)) {
                    seen.add(row.name);
                    out.push(row);
                }
            }
        } catch {
            /* ignore */
        }
    };
    await tryAdd([["name", "=", c]]);
    if (out.length === 0) {
        await tryAdd([["organization_name", "=", c]]);
    }
    return out;
}

async function fetchContactsByEmail(email: string, token: string): Promise<Record<string, any>[]> {
    const e = normEmail(email);
    if (!e) return [];
    try {
        const params = {
            filters: JSON.stringify([["email_id", "=", email.trim()]]),
            fields: JSON.stringify(["name", "full_name", "email_id", "phone", "mobile_no"]),
            limit_page_length: 50,
        };
        const res = await fetchFromERPNext("Contact", params, token);
        const rows = extractResourceList(res);
        return rows.filter((r: any) => normEmail(String(r?.email_id ?? "")) === e);
    } catch {
        return [];
    }
}

async function fetchContactsByPhone(phone: string, token: string): Promise<Record<string, any>[]> {
    const digits = normPhone(phone);
    if (!digits || digits.length < 5) return [];
    const raw = phone.trim();
    const merged = new Map<string, Record<string, any>>();
    const merge = (rows: any[]) => {
        for (const r of rows) {
            if (r?.name) merged.set(String(r.name), r);
        }
    };
    try {
        const p1 = {
            filters: JSON.stringify([["phone", "=", raw]]),
            fields: JSON.stringify(["name", "full_name", "email_id", "phone", "mobile_no"]),
            limit_page_length: 50,
        };
        const res1 = await fetchFromERPNext("Contact", p1, token);
        merge(extractResourceList(res1));
    } catch {
        /* ignore */
    }
    try {
        const p2 = {
            filters: JSON.stringify([["mobile_no", "=", raw]]),
            fields: JSON.stringify(["name", "full_name", "email_id", "phone", "mobile_no"]),
            limit_page_length: 50,
        };
        const res2 = await fetchFromERPNext("Contact", p2, token);
        merge(extractResourceList(res2));
    } catch {
        /* ignore */
    }
    if (merged.size === 0) {
        try {
            const p3 = {
                filters: JSON.stringify([["phone", "like", `%${digits}%`]]),
                fields: JSON.stringify(["name", "full_name", "email_id", "phone", "mobile_no"]),
                limit_page_length: 50,
            };
            const res3 = await fetchFromERPNext("Contact", p3, token);
            for (const r of extractResourceList(res3)) {
                const p = normPhone(String(r?.phone ?? ""));
                const m = normPhone(String(r?.mobile_no ?? ""));
                if (p === digits || m === digits) merge([r]);
            }
        } catch {
            /* ignore */
        }
    }
    return Array.from(merged.values());
}

async function fetchOrgNamesLinkedToContact(
    contactName: string,
    token: string
): Promise<string[]> {
    try {
        const url = `${CONSTANTS.API_BASE_URL}/api/resource/Contact/${encodeURIComponent(contactName)}`;
        const res = await fetch(url, {
            headers: { Authorization: `${token}` },
        });
        if (!res.ok) return [];
        const json = await res.json();
        const data = json?.data;
        const links = Array.isArray(data?.links) ? data.links : [];
        return links
            .filter((l: any) => String(l?.link_doctype ?? "") === "CRM Organization")
            .map((l: any) => String(l?.link_name ?? "").trim())
            .filter(Boolean);
    } catch {
        return [];
    }
}

async function enrichContactRowsForDuplicateModal(
    contacts: Record<string, any>[],
    token: string
): Promise<LeadConversionDuplicateContactRow[]> {
    const rows = await Promise.all(
        contacts.map(async (c): Promise<LeadConversionDuplicateContactRow | null> => {
            const name = String(c?.name ?? "").trim();
            if (!name) return null;
            const contact_display_name = String(c?.full_name ?? name).trim();
            const email_id = String(c?.email_id ?? "").trim();
            let account_name = "—";
            let linked_account_doc_name: string | undefined;
            const orgLinks = await fetchOrgNamesLinkedToContact(name, token);
            if (orgLinks.length > 0) {
                linked_account_doc_name = orgLinks[0];
                const od = await safeFetchOrgByName(orgLinks[0], token);
                account_name =
                    od?.organization_name != null && String(od.organization_name).trim() !== ""
                        ? String(od.organization_name).trim()
                        : String(od?.name ?? orgLinks[0]).trim();
            }
            return {
                name,
                contact_display_name: contact_display_name || name,
                email_id,
                account_name,
                linked_account_doc_name,
            };
        })
    );
    return rows.filter((r): r is LeadConversionDuplicateContactRow => r != null);
}

function orgDocToRow(
    doc: Record<string, any>,
    reason: DuplicateMatchReason,
    matchedViaContact?: string
): LeadConversionDuplicateAccount {
    return {
        name: String(doc.name ?? "").trim(),
        phone: "",
        website: "",
        account_type: "",
        matched_via_contact_name: matchedViaContact,
        reason,
    };
}

function resolveMatchFieldLabel(
    reasons: DuplicateMatchReason[],
    orgMappingLabel: DuplicateMatchFieldLabel | null
): DuplicateMatchFieldLabel {
    if (orgMappingLabel) return orgMappingLabel;
    if (reasons.includes("email")) return "Email";
    if (reasons.includes("phone")) return "Phone";
    if (reasons.includes("company")) return "Account Name";
    return "Account Name";
}

/**
 * Detects existing CRM Organization / Contact overlap for lead conversion.
 * - **Account name:** Uses conversion mapping: the Lead `source_field` mapped to Accounts `name` /
 *   `organization_name` decides whether we compare **Last Name** (→ `CRM Organization.name` only),
 *   **Organization** (→ `name` + `organization_name`), or other fields (→ `name` only).
 * - Email / phone: `Contact` vs lead; org name(s) from Dynamic Links on the contact.
 */
export async function fetchLeadConversionDuplicateInfo(
    lead: Record<string, any>,
    token: string,
    mapping: ConversionMapMessage | null
): Promise<LeadConversionDuplicateInfo> {
    const leadEmail = pickLeadField(lead, "email", "email_id");
    if (leadEmail) {
        const contactsByEmail = await fetchContactsByEmail(leadEmail, token);
        if (contactsByEmail.length > 0) {
            const c0 = contactsByEmail[0];
            const docName = String(c0?.name ?? "").trim();
            const display = String(c0?.full_name ?? docName ?? "").trim();
            const matched_contacts = await enrichContactRowsForDuplicateModal(contactsByEmail, token);
            return {
                scenario: "contact_email",
                has_duplicate: true,
                match_field_label: "Email",
                match_lead_source_field: pickLeadEmailFieldKey(lead),
                existing_contact_doc_name: docName,
                matched_contact_display_name: display || docName,
                matched_contacts,
                accounts: [],
                reasons: ["email"],
            };
        }
    }

    const reasons: DuplicateMatchReason[] = [];
    const byName = new Map<string, LeadConversionDuplicateAccount>();
    let orgMappingLabel: DuplicateMatchFieldLabel | null = null;

    const mappedSources = collectLeadFieldsMappedToAccountOrgName(mapping);
    let companyAddedFromMapping = false;
    let matchLeadSourceField: string | undefined;

    for (const mappedSource of mappedSources) {
        const value = pickLeadValueBySourceField(lead, mappedSource);
        const kind = classifyMappingSourceField(mappedSource);
        if (!value) continue;

        let orgs: Record<string, any>[] = [];
        let candidateLabel: DuplicateMatchFieldLabel = "Account Name";
        if (kind === "last_name") {
            orgs = await findOrgsByExactDocumentNameOnly(value, token);
            candidateLabel = "Last Name";
        } else if (kind === "organization") {
            orgs = await findOrgsByCompanyName(value, token);
            candidateLabel = "Organization";
        } else {
            orgs = await findOrgsByExactDocumentNameOnly(value, token);
            if (orgs.length === 0) {
                orgs = await findOrgsByCompanyName(value, token);
            }
            candidateLabel = "Account Name";
        }
        if (orgs.length) {
            companyAddedFromMapping = true;
            if (!matchLeadSourceField) matchLeadSourceField = mappedSource;
            orgMappingLabel = mergeOrgMappingLabel(orgMappingLabel, candidateLabel);
            reasons.push("company");
            for (const doc of orgs) {
                if (!doc?.name) continue;
                byName.set(doc.name, orgDocToRow(doc, "company"));
            }
        }
    }

    /** If mapping targets didn’t match (e.g. `sdl_account` not in saved map) or no value, still compare Lead company fields to CRM Organization. */
    if (!companyAddedFromMapping) {
        const fallbackCompany = pickLeadCompany(lead);
        if (fallbackCompany) {
            const orgs = await findOrgsByCompanyName(fallbackCompany, token);
            if (orgs.length) {
                reasons.push("company");
                orgMappingLabel = mergeOrgMappingLabel(orgMappingLabel, "Organization");
                if (!matchLeadSourceField) {
                    matchLeadSourceField = pickLeadCompanyFieldKey(lead) ?? undefined;
                }
                for (const doc of orgs) {
                    if (!doc?.name) continue;
                    byName.set(doc.name, orgDocToRow(doc, "company"));
                }
            }
        }
    }

    const phone = pickLeadField(lead, "phone", "mobile_no");

    if (phone) {
        const contacts = await fetchContactsByPhone(phone, token);
        let anyPhoneOrg = false;
        for (const c of contacts) {
            const cname = String(c?.name ?? "").trim();
            if (!cname) continue;
            const display = String(c?.full_name ?? cname).trim();
            const orgNames = await fetchOrgNamesLinkedToContact(cname, token);
            for (const on of orgNames) {
                anyPhoneOrg = true;
                const doc = (await safeFetchOrgByName(on, token)) ?? { name: on };
                const prev = byName.get(on);
                if (!prev) {
                    byName.set(on, orgDocToRow(doc, "phone", display));
                }
            }
        }
        if (anyPhoneOrg) reasons.push("phone");
    }

    const uniqReasons = Array.from(new Set(reasons));
    const accounts = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
    const hasAccountDup = accounts.length > 0;

    if (!matchLeadSourceField && uniqReasons.includes("phone") && !uniqReasons.includes("company")) {
        matchLeadSourceField = pickLeadPhoneFieldKey(lead) ?? undefined;
    }

    return {
        scenario: hasAccountDup ? "account" : "none",
        has_duplicate: hasAccountDup,
        match_field_label: resolveMatchFieldLabel(uniqReasons, orgMappingLabel),
        match_lead_source_field: matchLeadSourceField,
        accounts,
        reasons: uniqReasons,
    };
}
