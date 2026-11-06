import {
    getConversionMap,
    type ConversionMapMessage,
} from "@/services/api/general_apis/layout-api";

export type { ConversionMapMessage };

/** Optional server-side preview; falls back to client-side merge of mapping + lead when unavailable. */
export interface LeadConvertPreviewMessage {
    /** Per–lead-field values keyed by target module doctype (e.g. Accounts / Contacts / Deals). */
    row_values?: Record<
        string,
        Record<string, string | number | boolean | null | undefined>
    >;
    /** Prefill hints for the three sections (names, existing links, stage). */
    defaults?: {
        account_name?: string;
        contact_name?: string;
        deal_name?: string;
        existing_account?: string;
        existing_contact?: string;
        deal_stage?: string;
    };
    [key: string]: unknown;
}

/** One row per dynamic deal layout field (`deal_name`, `amount`, stage field name, …). */
export interface DealValueRow {
    fieldname: string;
    value: string | number;
}

export interface ConvertLeadPayload {
    lead_id: string;
    create_account: boolean;
    create_contact: boolean;
    create_deal: boolean;
    /** When converting into an existing CRM Organization (duplicate path). */
    existing_account?: string;
    /** When converting into an existing Contact (email duplicate path). */
    existing_contact?: string;
    account_name?: string;
    contact_name?: string;
    /** Deal layout label/name for `options` (routing). */
    deal_layout?: string;
    /**
     * Deal form values keyed by field name — converted to **`deal_value`** on the request:
     * an array of `{ fieldname, value }` for all mandatory / validate layout fields (dynamic names).
     */
    deal_field_data?: Record<string, string | number | undefined>;
    /** Owner user id / email — included inside stringified `options`. */
    owner?: string;
    notify_record_owner?: boolean;
    source_module?: string;
    source_layout?: string;
}

export interface ConvertLeadResponseMessage {
    success?: boolean;
    message?: string;
    /** Primary document to open after convert. */
    redirect_doctype?: string;
    /** CRM Deal | CRM Organization | Contact | … */
    redirect_module?: string;
    /** Document name for /deals/detail/[slug] etc. */
    redirect_name?: string;
    deal?: string;
    account?: string;
    contact?: string;
    [key: string]: unknown;
}

/**
 * Loads saved field mapping for the lead layout (same as setup → Lead conversion mapping).
 */
export async function fetchLeadConversionMapping(
    sourceModule: string,
    sourceLayout: string
): Promise<ConversionMapMessage | null> {
    return getConversionMap(sourceModule, sourceLayout, "");
}

/** Coerce numeric deal fields by field name (dynamic layout keys). */
function coerceDealFieldValue(key: string, raw: string | number | undefined): string | number | undefined {
    if (raw === undefined || raw === "") return undefined;
    if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
    const s = String(raw).trim();
    if (s === "") return undefined;
    const kl = key.toLowerCase();
    const maybeNum =
        kl === "amount" ||
        kl.includes("amount") ||
        kl.endsWith("_value") ||
        kl === "probability";
    if (maybeNum) {
        const n = Number(s);
        if (!Number.isNaN(n)) return n;
    }
    return s;
}

/** Build `deal_value` array from flat deal form state (dynamic fieldnames). */
function buildDealValueArray(
    deal_field_data: Record<string, string | number | undefined>
): DealValueRow[] {
    const rows: DealValueRow[] = [];
    for (const [key, raw] of Object.entries(deal_field_data)) {
        const fieldname = String(key).trim();
        if (!fieldname) continue;
        const value = coerceDealFieldValue(fieldname, raw as string | number | undefined);
        if (value === undefined) continue;
        rows.push({ fieldname, value });
    }
    return rows;
}

/**
 * POST /api/method/sdl_metadata.api.lead_conversion.convert_lead
 *
 * Body shape:
 * - `lead_id` — CRM Lead name
 * - `options` — JSON string: `{ create_account, create_contact, create_deal, owner, … }` (1/0 flags)
 * - `deal_value` — array of `{ fieldname, value }` for dynamic deal layout fields (deal_name, amount, stage, …)
 */
export async function postConvertLead(
    payload: ConvertLeadPayload
): Promise<{ data: { message?: ConvertLeadResponseMessage } }> {
    const optionsObj: Record<string, string | number | boolean> = {
        create_account: payload.create_account ? 1 : 0,
        create_contact: payload.create_contact ? 1 : 0,
        create_deal: payload.create_deal ? 1 : 0,
    };
    if (payload.owner != null && String(payload.owner).trim() !== "") {
        optionsObj.owner = String(payload.owner).trim();
    }
    if (payload.notify_record_owner !== undefined) {
        optionsObj.notify_record_owner = payload.notify_record_owner ? 1 : 0;
    }
    if (payload.source_module) optionsObj.source_module = payload.source_module;
    if (payload.source_layout) optionsObj.source_layout = payload.source_layout;
    if (payload.account_name != null && String(payload.account_name).trim() !== "") {
        optionsObj.account_name = String(payload.account_name).trim();
    }
    if (payload.existing_account != null && String(payload.existing_account).trim() !== "") {
        optionsObj.existing_account = String(payload.existing_account).trim();
    }
    if (payload.existing_contact != null && String(payload.existing_contact).trim() !== "") {
        optionsObj.existing_contact = String(payload.existing_contact).trim();
    }
    if (payload.contact_name != null && String(payload.contact_name).trim() !== "") {
        optionsObj.contact_name = String(payload.contact_name).trim();
    }
    if (payload.deal_layout != null && String(payload.deal_layout).trim() !== "") {
        optionsObj.deal_layout = String(payload.deal_layout).trim();
    }

    const body: Record<string, unknown> = {
        lead_id: payload.lead_id,
        options: JSON.stringify(optionsObj),
    };

    if (
        payload.create_deal &&
        payload.deal_field_data &&
        typeof payload.deal_field_data === "object"
    ) {
        const deal_value = buildDealValueArray(payload.deal_field_data);
        if (deal_value.length > 0) {
            body.deal_value = deal_value;
        }
    }

    const res = await fetch("/api/leads/convert", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = new Error(data?.message || "Conversion failed");
        Object.assign(error, { response: { data, status: res.status } });
        throw error;
    }
    return { data };
}
