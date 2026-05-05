"use client";
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    fetchLeadConversionMapping,
    postConvertLead,
    type ConversionMapMessage,
} from "@/services/api/crm/lead-convert-api";
import { getFormFields, getLayoutList } from "@/services/api/general_apis/layout-api";
import { getVisibleFormFieldsForMapping } from "@/components/layout-builder/LeadConversionMappingPanel";
import { getComponentStageProbability } from "@/services/api/general_apis/component-picklist-api";
import { fetchDataBySearch } from "@/services/api/common-erpnext-api/lookup-api";
import { showToast } from "@/components/ToastNotificationNew";
import {
    fetchLeadConversionDuplicateInfo,
    getAccountsOrgTargetFieldNameForLeadSource,
    getAccountsTargetLayoutIdFromMapping,
    getContactsTargetFieldNameForLeadSource,
    getContactsTargetLayoutIdFromMapping,
    pickLeadCompany,
    type LeadConversionDuplicateContactRow,
    type LeadConversionDuplicateInfo,
} from "@/services/api/crm/lead-convert-duplicate-api";

export interface LeadConvertFormProps {
    leadId: string;
    lead: Record<string, any>;
    sourceModule?: string;
    /** SDL Layout document `name` (same as Lead `layout_id`) for get_formFields and conversion map APIs — not `layout_name`. */
    sourceLayout: string;
    /** Cancel: return to lead detail (caller typically `router.push` to `/leads/detail/[slug]`). */
    onCancel: () => void;
}

function normalizeLeadFieldKey(raw: string | undefined | null): string {
    if (!raw) return "";
    let s = String(raw).trim();
    if (s.startsWith("SDL Layout.")) s = s.slice("SDL Layout.".length);
    if (s.startsWith("tabCRM Lead.")) s = s.slice("tabCRM Lead.".length);
    return s.trim();
}

function labelFromFieldMeta(f: any): string | null {
    if (!f || typeof f !== "object") return null;
    const lb = f.label ?? f.field_label;
    if (lb != null && String(lb).trim() !== "") return String(lb).trim();
    return null;
}

/** Flat `fields` from get_formFields (may include rows not on canvas) for label lookup. */
function normalizeFormFieldsResponseForLead(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.fields)) return res.fields;
    if (Array.isArray(res?.message?.fields)) return res.message.fields;
    if (Array.isArray(res?.data?.fields)) return res.data.fields;
    if (Array.isArray(res?.data)) return res.data;
    if (res?.status === "error") return [];
    return [];
}

/** Contacts module: email fieldnames for duplicate line label lookup. */
const CONTACTS_EMAIL_FIELD_ALIASES = ["email_id", "email", "sdl_email", "primary_email"] as const;

/** Accounts module: try these fieldnames for org / account identity labels (same spirit as duplicate API). */
const ACCOUNTS_ORG_FIELD_ALIASES = [
    "organization_name",
    "name",
    "account_name",
    "sdl_account",
    "sdl_account_name",
    "organization",
    "company_name",
    "customer_name",
] as const;

function buildLeadFieldLabelByKeyMap(layoutFields: any[], flatFields: any[]): Map<string, any> {
    const byKey = new Map<string, any>();
    const add = (f: any) => {
        const k = normalizeLeadFieldKey(String(f?.fieldname ?? f?.name ?? f?.field_name ?? "").trim());
        if (!k) return;
        byKey.set(k.toLowerCase(), f);
    };
    /** Flat doctype meta first; visible layout rows last so canvas labels win over generic defaults. */
    for (const f of flatFields) add(f);
    for (const f of layoutFields) add(f);
    return byKey;
}

function tryFieldLabelFromMap(byKey: Map<string, any>, key: string | undefined | null): string | null {
    const nk = normalizeLeadFieldKey(key);
    if (!nk) return null;
    const f = byKey.get(nk.toLowerCase());
    return f ? labelFromFieldMeta(f) : null;
}

/**
 * Contact-email line: **Contacts** layout label for mapped email field (Lead → Contacts), then Lead, then “Email”.
 * Account line: **Accounts** layout labels (e.g. Lead “Company” maps to Accounts “Account Name”), not Lead labels.
 */
function resolveDuplicateMatchDisplayLabel(
    dup: LeadConversionDuplicateInfo | null,
    lead: Record<string, any>,
    mapping: ConversionMapMessage | null,
    leadByKey: Map<string, any>,
    accountByKey: Map<string, any>,
    contactByKey: Map<string, any>
): string {
    if (!dup?.has_duplicate) return "";

    if (dup.scenario === "contact_email") {
        if (contactByKey.size > 0) {
            const target = getContactsTargetFieldNameForLeadSource(mapping, dup.match_lead_source_field);
            if (target) {
                const hit = tryFieldLabelFromMap(contactByKey, target);
                if (hit) return hit;
            }
            for (const k of CONTACTS_EMAIL_FIELD_ALIASES) {
                const hit = tryFieldLabelFromMap(contactByKey, k);
                if (hit) return hit;
            }
        }
        if (leadByKey.size > 0) {
            const keysToTry: string[] = [];
            if (dup.match_lead_source_field?.trim()) {
                keysToTry.push(normalizeLeadFieldKey(dup.match_lead_source_field));
            }
            for (const k of CONTACTS_EMAIL_FIELD_ALIASES) keysToTry.push(k);
            const seen = new Set<string>();
            for (const raw of keysToTry) {
                const nk = normalizeLeadFieldKey(raw);
                if (!nk) continue;
                const kl = nk.toLowerCase();
                if (seen.has(kl)) continue;
                seen.add(kl);
                const hit = tryFieldLabelFromMap(leadByKey, nk);
                if (hit) return hit;
            }
        }
        return dup.match_field_label;
    }

    if (dup.scenario === "account") {
        const reasons = dup.reasons ?? [];
        const phoneOnly = reasons.includes("phone") && !reasons.includes("company");

        if (phoneOnly) {
            if (accountByKey.size === 0) return dup.match_field_label;
            const mk = dup.match_lead_source_field?.trim();
            if (mk) {
                const direct = tryFieldLabelFromMap(accountByKey, mk);
                if (direct) return direct;
            }
            for (const k of ["mobile_no", "phone", "mobile"]) {
                const hit = tryFieldLabelFromMap(accountByKey, k);
                if (hit) return hit;
            }
            return dup.match_field_label;
        }

        if (accountByKey.size === 0) return "Account Name";

        const target = getAccountsOrgTargetFieldNameForLeadSource(mapping, dup.match_lead_source_field);
        if (target) {
            const hit = tryFieldLabelFromMap(accountByKey, target);
            if (hit) return hit;
        }
        for (const k of ACCOUNTS_ORG_FIELD_ALIASES) {
            const hit = tryFieldLabelFromMap(accountByKey, k);
            if (hit) return hit;
        }
        return "Account Name";
    }

    return dup.match_field_label;
}

function pickLeadDisplay(lead: Record<string, any>, field: string): string {
    const v =
        lead[field] ??
        lead[`SDL Layout.${field}`] ??
        lead[`tabCRM Lead.${field}`];
    if (v == null || v === "") return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
}

function parseMappingJson(raw: unknown): Record<string, string> | null {
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

/** Lead cell value for a Deals target field from conversion `mapping_rows`. */
function getLeadValueMappedToDealField(
    mapping: ConversionMapMessage | null,
    lead: Record<string, any>,
    dealFieldName: string
): string {
    if (!mapping?.mapping_rows || !dealFieldName) return "";
    const target = String(dealFieldName).trim();
    for (const row of mapping.mapping_rows) {
        const mj = parseMappingJson((row as any).mapping_json);
        if (!mj) continue;
        const dealsTarget = String(mj.Deals ?? mj.deals ?? "").trim();
        if (dealsTarget === target) {
            const sf = String((row as any).source_field ?? "").trim();
            if (sf) return pickLeadDisplay(lead, sf);
        }
    }
    return "";
}

function isDealFieldMandatory(f: any): boolean {
    return (
        f?.reqd === 1 ||
        f?.reqd === true ||
        f?.reqd === "1" ||
        f?.mandatory === true ||
        f?.required === true ||
        f?.is_required === true
    );
}

/** SDL layout metadata: only fields flagged `validate` load on Lead Convert (see get_formFields). */
function isDealFieldValidateEnabled(f: any): boolean {
    return f?.validate === true || f?.validate === 1 || f?.validate === "1";
}

function resolveRedirect(msg: Record<string, any> | undefined): { path: string; label: string } | null {
    if (!msg || typeof msg !== "object") return null;
    const name =
        (msg.redirect_name as string) ||
        (msg.deal as string) ||
        (msg.account as string) ||
        (msg.contact as string) ||
        (msg.name as string);
    if (!name) return null;

    const mod = String(msg.redirect_module || msg.redirect_doctype || "").toLowerCase();
    const rd = String(msg.redirect_to || msg.redirect || "").toLowerCase();

    if (mod.includes("deal") || rd === "deal" || rd === "deals") {
        return { path: `/deals/detail/${encodeURIComponent(name)}`, label: "Deal" };
    }
    if (mod.includes("organization") || mod.includes("account") || rd === "account") {
        return { path: `/accounts/detail/${encodeURIComponent(name)}`, label: "Account" };
    }
    if (mod.includes("contact") || rd === "contact") {
        return { path: `/contacts/detail/${encodeURIComponent(name)}`, label: "Contact" };
    }
    if (msg.deal) {
        return { path: `/deals/detail/${encodeURIComponent(String(msg.deal))}`, label: "Deal" };
    }
    if (msg.account) {
        return {
            path: `/accounts/detail/${encodeURIComponent(String(msg.account))}`,
            label: "Account",
        };
    }
    return null;
}

/** Label / input row: two columns, label and control both left-aligned (sm+). */
function FormRow({
    label,
    htmlFor,
    required,
    children,
    /** Wider label column for deal fields (e.g. “Campaign Source”). */
    wideLabel,
    /** Multi-line controls align top with label padded. */
    alignTop,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    children: React.ReactNode;
    wideLabel?: boolean;
    alignTop?: boolean;
}) {
    const cols = wideLabel
        ? "sm:grid-cols-[minmax(9rem,13rem)_minmax(0,1fr)]"
        : "sm:grid-cols-[minmax(8rem,11rem)_minmax(0,1fr)]";
    const align = alignTop ? "sm:items-start" : "sm:items-center";
    const labelPad = alignTop ? " sm:pt-2" : "";
    return (
        <div
            className={`grid grid-cols-1 justify-items-start gap-1.5 border-b border-slate-100 py-3 last:border-b-0 ${cols} ${align} sm:gap-4`}
        >
            <label
                htmlFor={htmlFor}
                className={`text-left text-sm text-slate-600 sm:leading-tight${labelPad}`}
            >
                {label}
                {required ? <span className="text-red-600 sm:ml-0.5">*</span> : null}
            </label>
            <div className="w-full min-w-0 text-left">{children}</div>
        </div>
    );
}

function PillInput({
    id,
    value,
    onChange,
    disabled,
}: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
}) {
    return (
        <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full max-w-md rounded-full border-0 bg-slate-100 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200/80 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
    );
}

export default function LeadConvertForm({
    leadId,
    lead,
    sourceModule = "Leads",
    sourceLayout,
    onCancel,
}: LeadConvertFormProps) {
    const router = useRouter();
    const [userToken] = useState<any>(() => {
        if (typeof window === "undefined") return {};
        try {
            return readAccessTokenDataParsed();
        } catch {
            return {};
        }
    });

    const token = userToken?.access_token ?? "";
    const roleProfile = userToken?.role_profile ?? "";

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [mapping, setMapping] = useState<ConversionMapMessage | null>(null);

    const [createDeal, setCreateDeal] = useState(false);

    const [accountName, setAccountName] = useState("");
    const [contactName, setContactName] = useState("");
    const [dealLayoutOptions, setDealLayoutOptions] = useState<{ value: string; label: string }[]>(
        []
    );
    /** Layout list `value` (SDL Layout name) for get_formFields. */
    const [selectedDealLayoutId, setSelectedDealLayoutId] = useState("");
    const [mandatoryDealFields, setMandatoryDealFields] = useState<any[]>([]);
    const [dealFieldValues, setDealFieldValues] = useState<Record<string, string>>({});
    const [stagePipelineOptions, setStagePipelineOptions] = useState<{ value: string; label: string }[]>(
        []
    );
    const [convertPreviewDefaults, setConvertPreviewDefaults] = useState<
        Record<string, string | undefined>
    >({});

    const [ownerValue, setOwnerValue] = useState("");
    const [ownerOptions, setOwnerOptions] = useState<{ value: string; label: string }[]>([]);
    const [notifyOwner, setNotifyOwner] = useState(true);

    const [dupInfo, setDupInfo] = useState<LeadConversionDuplicateInfo | null>(null);
    /** Lead layout fields (contact-email duplicate line). */
    const [leadLayoutFields, setLeadLayoutFields] = useState<any[]>([]);
    /** Full flat `fields` from get_formFields — includes meta not always merged onto canvas rows. */
    const [leadFieldsFlatForLookup, setLeadFieldsFlatForLookup] = useState<any[]>([]);
    /** Accounts layout fields — labels for “Account with similar details in …” (Lead Company → Account Account Name). */
    const [accountLayoutFieldsForDup, setAccountLayoutFieldsForDup] = useState<any[]>([]);
    const [accountFieldsFlatForDup, setAccountFieldsFlatForDup] = useState<any[]>([]);
    /** Contacts layout fields — labels for “Contact with similar details in …” (Lead email → Contact Email). */
    const [contactLayoutFieldsForDup, setContactLayoutFieldsForDup] = useState<any[]>([]);
    const [contactFieldsFlatForDup, setContactFieldsFlatForDup] = useState<any[]>([]);
    const [dupLoading, setDupLoading] = useState(false);
    /** When duplicates exist: use existing org vs create new. */
    const [accountMode, setAccountMode] = useState<"existing" | "create">("existing");
    const [selectedExistingAccount, setSelectedExistingAccount] = useState("");
    const [matchModalOpen, setMatchModalOpen] = useState(false);
    const [modalSelectedAccount, setModalSelectedAccount] = useState("");
    const [contactMatchModalOpen, setContactMatchModalOpen] = useState(false);
    const [modalSelectedContact, setModalSelectedContact] = useState("");
    /** Selected Contact `name` when converting into existing contact (email duplicate). */
    const [selectedExistingContact, setSelectedExistingContact] = useState("");

    const dealLayoutFromMapping = useMemo(() => {
        const tms = mapping?.target_modules;
        if (!Array.isArray(tms)) return "";
        const row = tms.find((t: any) => String(t?.target_doctype || "").trim() === "Deals");
        return String(row?.target_layout ?? "").trim();
    }, [mapping]);

    const layoutLockedByMapping = Boolean(dealLayoutFromMapping);

    const selectedDealLayoutLabel = useMemo(() => {
        return (
            dealLayoutOptions.find((o) => o.value === selectedDealLayoutId)?.label ||
            selectedDealLayoutId ||
            ""
        );
    }, [dealLayoutOptions, selectedDealLayoutId]);

    const stageFieldMeta = useMemo(() => {
        return (
            mandatoryDealFields.find((f: any) => {
                const t = String(f?.type ?? "").toLowerCase();
                const ft = String(f?.fieldtype ?? "").toLowerCase();
                return t === "stage" || ft.includes("stage");
            }) ?? null
        );
    }, [mandatoryDealFields]);

    const ownerSelectOptions = useMemo(() => {
        const o = [...ownerOptions];
        if (ownerValue && !o.some((x) => x.value === ownerValue)) {
            o.unshift({ value: ownerValue, label: ownerValue });
        }
        return o;
    }, [ownerOptions, ownerValue]);

    const headerSubtitle = useMemo(() => {
        const c = contactName.trim() || pickLeadDisplay(lead, "lead_name");
        const a = accountName.trim() || pickLeadCompany(lead);
        if (!c && !a) return "";
        return `(${c || "—"}${a ? ` - ${a}` : ""})`;
    }, [contactName, accountName, lead]);

    const leadFieldLabelByKey = useMemo(
        () => buildLeadFieldLabelByKeyMap(leadLayoutFields, leadFieldsFlatForLookup),
        [leadLayoutFields, leadFieldsFlatForLookup]
    );

    const accountFieldLabelByKey = useMemo(
        () => buildLeadFieldLabelByKeyMap(accountLayoutFieldsForDup, accountFieldsFlatForDup),
        [accountLayoutFieldsForDup, accountFieldsFlatForDup]
    );

    const contactFieldLabelByKey = useMemo(
        () => buildLeadFieldLabelByKeyMap(contactLayoutFieldsForDup, contactFieldsFlatForDup),
        [contactLayoutFieldsForDup, contactFieldsFlatForDup]
    );

    /** Bold phrase: target module label (Contacts: Email, Accounts: Account Name, …). */
    const duplicateMatchDisplayLabel = useMemo(
        () =>
            resolveDuplicateMatchDisplayLabel(
                dupInfo,
                lead,
                mapping,
                leadFieldLabelByKey,
                accountFieldLabelByKey,
                contactFieldLabelByKey
            ),
        [dupInfo, lead, mapping, leadFieldLabelByKey, accountFieldLabelByKey, contactFieldLabelByKey]
    );

    useEffect(() => {
        if (!token || !sourceLayout) {
            setLeadLayoutFields([]);
            setLeadFieldsFlatForLookup([]);
            return;
        }
        let cancelled = false;
        (async () => {
            const res: any = await getFormFields("Leads", token, roleProfile, sourceLayout);
            if (cancelled) return;
            let fieldsData: any[] = getVisibleFormFieldsForMapping(res);
            if (fieldsData.length === 0) {
                if (Array.isArray(res?.fields)) fieldsData = res.fields;
                else if (Array.isArray(res)) fieldsData = res;
                else if (res?.data && Array.isArray(res.data)) fieldsData = res.data;
            }
            setLeadLayoutFields(fieldsData);
            setLeadFieldsFlatForLookup(normalizeFormFieldsResponseForLead(res));
        })();
        return () => {
            cancelled = true;
        };
    }, [token, roleProfile, sourceLayout]);

    /** Load Accounts layout field meta so duplicate copy uses Account module labels (e.g. Account Name). */
    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        (async () => {
            let layoutId = getAccountsTargetLayoutIdFromMapping(mapping);
            if (!layoutId) {
                const list = await getLayoutList("Accounts", token, roleProfile);
                layoutId = Array.isArray(list) && list[0]?.value ? String(list[0].value) : "";
            }
            if (!layoutId || cancelled) {
                setAccountLayoutFieldsForDup([]);
                setAccountFieldsFlatForDup([]);
                return;
            }
            const res: any = await getFormFields("Accounts", token, roleProfile, layoutId);
            if (cancelled) return;
            let fieldsData: any[] = getVisibleFormFieldsForMapping(res);
            if (fieldsData.length === 0) {
                if (Array.isArray(res?.fields)) fieldsData = res.fields;
                else if (Array.isArray(res)) fieldsData = res;
                else if (res?.data && Array.isArray(res.data)) fieldsData = res.data;
            }
            setAccountLayoutFieldsForDup(fieldsData);
            setAccountFieldsFlatForDup(normalizeFormFieldsResponseForLead(res));
        })();
        return () => {
            cancelled = true;
        };
    }, [token, roleProfile, mapping]);

    /** Load Contacts layout field meta — duplicate line uses Contact module label for mapped email field. */
    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        (async () => {
            let layoutId = getContactsTargetLayoutIdFromMapping(mapping);
            if (!layoutId) {
                const list = await getLayoutList("Contacts", token, roleProfile);
                layoutId = Array.isArray(list) && list[0]?.value ? String(list[0].value) : "";
            }
            if (!layoutId || cancelled) {
                setContactLayoutFieldsForDup([]);
                setContactFieldsFlatForDup([]);
                return;
            }
            const res: any = await getFormFields("Contacts", token, roleProfile, layoutId);
            if (cancelled) return;
            let fieldsData: any[] = getVisibleFormFieldsForMapping(res);
            if (fieldsData.length === 0) {
                if (Array.isArray(res?.fields)) fieldsData = res.fields;
                else if (Array.isArray(res)) fieldsData = res;
                else if (res?.data && Array.isArray(res.data)) fieldsData = res.data;
            }
            setContactLayoutFieldsForDup(fieldsData);
            setContactFieldsFlatForDup(normalizeFormFieldsResponseForLead(res));
        })();
        return () => {
            cancelled = true;
        };
    }, [token, roleProfile, mapping]);

    const loadMappingAndPreview = useCallback(async () => {
        if (!token || !sourceLayout) return;
        setLoading(true);
        setDupLoading(true);
        let mapMsg: ConversionMapMessage | null = null;
        try {
            const mapRes = await fetchLeadConversionMapping(sourceModule, sourceLayout, token);
            mapMsg = mapRes;
            setMapping(mapMsg);
            setConvertPreviewDefaults({});

            const org =
                pickLeadCompany(lead) ||
                pickLeadDisplay(lead, "lead_name");
            const person =
                pickLeadDisplay(lead, "full_name") ||
                [pickLeadDisplay(lead, "first_name"), pickLeadDisplay(lead, "last_name")]
                    .filter(Boolean)
                    .join(" ")
                    .trim() ||
                pickLeadDisplay(lead, "lead_name");

            setAccountName(org);
            setContactName(person);
            const own =
                pickLeadDisplay(lead, "owner") ||
                userToken?.email ||
                userToken?.username ||
                "";
            setOwnerValue(own);
        } catch (e: any) {
            showToast(e?.message || "Failed to load conversion data", "error");
        } finally {
            setLoading(false);
            try {
                const dup = await fetchLeadConversionDuplicateInfo(lead, token, mapMsg);
                setDupInfo(dup);
                if (dup.scenario === "account" && dup.has_duplicate && dup.accounts.length > 0) {
                    const first = dup.accounts[0].name;
                    setSelectedExistingAccount(first);
                    setModalSelectedAccount(first);
                    setAccountMode("existing");
                }
                if (dup.scenario === "contact_email" && dup.has_duplicate && dup.existing_contact_doc_name) {
                    const ec = dup.existing_contact_doc_name.trim();
                    setSelectedExistingContact(ec);
                    setModalSelectedContact(ec);
                }
            } catch {
                setDupInfo({
                    scenario: "none",
                    has_duplicate: false,
                    match_field_label: "Account Name",
                    accounts: [],
                    reasons: [],
                });
            } finally {
                setDupLoading(false);
            }
        }
    }, [token, sourceLayout, sourceModule, leadId, lead, userToken]);

    useEffect(() => {
        loadMappingAndPreview();
    }, [loadMappingAndPreview]);

    /** Duplicate detection without a source layout has no conversion map — email/phone overlap only. */
    useEffect(() => {
        if (!token || !leadId || sourceLayout) return;
        let cancelled = false;
        setDupLoading(true);
        (async () => {
            try {
                const info = await fetchLeadConversionDuplicateInfo(lead, token, null);
                if (cancelled) return;
                setDupInfo(info);
                if (info.scenario === "account" && info.has_duplicate && info.accounts.length > 0) {
                    const first = info.accounts[0].name;
                    setSelectedExistingAccount(first);
                    setModalSelectedAccount(first);
                    setAccountMode("existing");
                }
                if (info.scenario === "contact_email" && info.has_duplicate && info.existing_contact_doc_name) {
                    const ec = info.existing_contact_doc_name.trim();
                    setSelectedExistingContact(ec);
                    setModalSelectedContact(ec);
                }
            } catch {
                if (!cancelled) {
                    setDupInfo({
                        scenario: "none",
                        has_duplicate: false,
                        match_field_label: "Account Name",
                        accounts: [],
                        reasons: [],
                    });
                }
            } finally {
                if (!cancelled) setDupLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token, leadId, lead, sourceLayout]);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        (async () => {
            const users = await fetchDataBySearch(
                "",
                "User",
                token,
                undefined,
                undefined,
                ["full_name", "name", "email"],
                ["full_name", "email"]
            );
            if (cancelled) return;
            const mapOpt = (x: any) => ({
                value: String(x.value ?? x.name ?? ""),
                label: String(x.label ?? x.description ?? x.value ?? ""),
            });
            setOwnerOptions((users || []).map(mapOpt));
        })();
        return () => {
            cancelled = true;
        };
    }, [token]);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        (async () => {
            const list = await getLayoutList("Deals", token, roleProfile);
            const opts = (Array.isArray(list) ? list : []).map((l: any) => ({
                value: String(l.value ?? ""),
                label: String(l.label ?? l.value ?? ""),
            }));
            if (cancelled) return;
            setDealLayoutOptions(opts);
            let pickId = opts[0]?.value ?? "";
            if (dealLayoutFromMapping) {
                const hit = opts.find(
                    (o) =>
                        o.value === dealLayoutFromMapping ||
                        o.label === dealLayoutFromMapping
                );
                if (hit) pickId = hit.value;
                else pickId = pickId || dealLayoutFromMapping;
            }
            if (pickId) setSelectedDealLayoutId(pickId);
        })();
        return () => {
            cancelled = true;
        };
    }, [token, roleProfile, dealLayoutFromMapping]);

    /** Deal fields to show: `validate: true` from get_formFields only (per SDL layout metadata). */
    useEffect(() => {
        if (!token || !createDeal || !selectedDealLayoutId) {
            setMandatoryDealFields([]);
            return;
        }
        let cancelled = false;
        (async () => {
            const res: any = await getFormFields(
                "Deals",
                token,
                roleProfile,
                selectedDealLayoutId
            );
            if (cancelled) return;
            if (res?.status === "error" && !res?.layout_json && !res?.layout && !Array.isArray(res?.fields)) {
                setMandatoryDealFields([]);
                return;
            }
            /* Same flatten/merge as conversion mapping: layout_json carries `validate` + field meta. */
            let fieldsData: any[] = getVisibleFormFieldsForMapping(res);
            if (fieldsData.length === 0) {
                if (Array.isArray(res?.fields)) fieldsData = res.fields;
                else if (Array.isArray(res)) fieldsData = res;
                else if (res?.data && Array.isArray(res.data)) fieldsData = res.data;
            }

            const EXCLUDED = new Set(["created_by", "modified_by", "creation", "modified", "name"]);
            /** Even with validate=true — account/org/owner captured outside the deal block on convert. */
            const SKIP_VALIDATE_NAMES = new Set(
                ["account_name", "organization", "organization_name", "owner", "owner_name"].map((s) =>
                    s.toLowerCase()
                )
            );
            const toShow = fieldsData.filter((f: any) => {
                const name = String(f?.name ?? f?.fieldname ?? "").trim();
                if (!name || EXCLUDED.has(name)) return false;
                if (SKIP_VALIDATE_NAMES.has(name.toLowerCase())) return false;
                return isDealFieldValidateEnabled(f);
            });
            setMandatoryDealFields(toShow);
        })();
        return () => {
            cancelled = true;
        };
    }, [token, roleProfile, createDeal, selectedDealLayoutId]);

    /** Prefill deal fields from conversion mapping + preview defaults. */
    useEffect(() => {
        if (!createDeal || mandatoryDealFields.length === 0) return;
        setDealFieldValues((prev) => {
            const next: Record<string, string> = { ...prev };
            for (const f of mandatoryDealFields) {
                const n = String(f?.name ?? f?.fieldname ?? "").trim();
                if (!n) continue;
                let v = getLeadValueMappedToDealField(mapping, lead, n);
                if (!v && convertPreviewDefaults) {
                    if (n === "deal_name") v = convertPreviewDefaults.deal_name ?? "";
                    if (String(f?.type ?? "").toLowerCase() === "stage") {
                        v = convertPreviewDefaults.deal_stage ?? v ?? "";
                    }
                }
                if (!v && n === "deal_name") {
                    v =
                        pickLeadDisplay(lead, "deal_name") ||
                        pickLeadDisplay(lead, "lead_name") ||
                        "";
                }
                if (next[n] === undefined || next[n] === "") {
                    next[n] = v != null && v !== "" ? String(v) : next[n] ?? "";
                }
            }
            return next;
        });
    }, [createDeal, mandatoryDealFields, mapping, lead, convertPreviewDefaults]);

    /** Stage probability options for mandatory Stage field (dynamic field name). */
    useEffect(() => {
        if (!token || !createDeal || !stageFieldMeta) {
            setStagePipelineOptions([]);
            return;
        }
        const fieldName = String(stageFieldMeta?.name ?? stageFieldMeta?.fieldname ?? "").trim();
        if (!fieldName) {
            setStagePipelineOptions([]);
            return;
        }
        const layoutName =
            dealLayoutOptions.find((o) => o.value === selectedDealLayoutId)?.label ||
            selectedDealLayoutId ||
            dealLayoutFromMapping ||
            "";
        if (!layoutName) {
            setStagePipelineOptions([]);
            return;
        }
        let cancelled = false;
        (async () => {
            const stages = await getComponentStageProbability(
                "Deals",
                layoutName,
                fieldName,
                token
            );
            if (cancelled) return;
            const opts = (stages || []).map((s) => ({
                value: s.value,
                label: s.label || s.value,
            }));
            setStagePipelineOptions(opts);
            setDealFieldValues((prev) => {
                const cur = prev[fieldName];
                if (cur && opts.some((o) => o.value === cur)) return prev;
                const def =
                    stages.find((x) => x.is_default === 1 || x.is_default === true) || stages[0];
                const pick = def?.value ?? cur ?? "";
                return pick ? { ...prev, [fieldName]: String(pick) } : prev;
            });
        })();
        return () => {
            cancelled = true;
        };
    }, [
        token,
        createDeal,
        stageFieldMeta,
        selectedDealLayoutId,
        dealLayoutOptions,
        dealLayoutFromMapping,
    ]);

    const handleSubmit = async () => {
        if (!token) {
            showToast("Please sign in again.", "error");
            return;
        }
        if (createDeal) {
            /* Every loaded field is validate=true — all must be filled for convert submission. */
            for (const f of mandatoryDealFields) {
                const n = String(f?.name ?? f?.fieldname ?? "").trim();
                if (!n) continue;
                const val = String(dealFieldValues[n] ?? "").trim();
                if (!val) {
                    showToast(`${f?.label || n} is required.`, "error");
                    return;
                }
            }
        }
        setSubmitting(true);
        try {
            const contactEmailDup = dupInfo?.scenario === "contact_email";
            const accountDup = dupInfo?.scenario === "account" && dupInfo?.has_duplicate === true;

            const useExistingAccount = accountDup && accountMode === "existing";
            /** New account only when not using existing contact and (no account dup or user chose create). */
            const createAccount = contactEmailDup
                ? false
                : !accountDup || accountMode === "create";
            const targetAccountName = useExistingAccount
                ? selectedExistingAccount.trim()
                : accountName.trim();

            let existingAccountPayload: string | undefined;
            if (contactEmailDup) {
                const ec =
                    selectedExistingContact.trim() || dupInfo?.existing_contact_doc_name?.trim();
                if (!ec) {
                    showToast("Existing contact could not be resolved.", "error");
                    setSubmitting(false);
                    return;
                }
                const row = dupInfo?.matched_contacts?.find((r) => r.name === ec);
                existingAccountPayload = row?.linked_account_doc_name?.trim();
            } else if (useExistingAccount) {
                existingAccountPayload = targetAccountName;
            }

            if (accountDup && useExistingAccount && !targetAccountName) {
                showToast("Select an account to continue.", "error");
                setSubmitting(false);
                return;
            }

            const res = await postConvertLead(
                {
                    lead_id: leadId,
                    create_account: createAccount,
                    create_contact: !contactEmailDup,
                    create_deal: createDeal,
                    existing_account: existingAccountPayload,
                    existing_contact: contactEmailDup
                        ? selectedExistingContact.trim() ||
                          dupInfo?.existing_contact_doc_name?.trim()
                        : undefined,
                    account_name: contactEmailDup
                        ? existingAccountPayload || undefined
                        : targetAccountName || undefined,
                    contact_name: contactEmailDup ? undefined : contactName,
                    deal_layout: selectedDealLayoutLabel || dealLayoutFromMapping || undefined,
                    /** API builds `deal_value`: [{ fieldname, value }, …] for dynamic layout fields. */
                    deal_field_data: createDeal ? { ...dealFieldValues } : undefined,
                    owner: ownerValue || undefined,
                    notify_record_owner: notifyOwner,
                    source_module: sourceModule,
                    source_layout: sourceLayout,
                },
                token
            );

            const raw = res?.data?.message;
            const msg: Record<string, any> =
                typeof raw === "string"
                    ? { message: raw }
                    : raw && typeof raw === "object"
                      ? (raw as Record<string, any>)
                      : {};

            showToast(
                typeof msg?.message === "string" ? msg.message : "Lead converted successfully.",
                "success"
            );
            const dest = resolveRedirect(msg);
            if (dest) router.push(dest.path);
        } catch (e: any) {
            const err =
                e?.response?.data?.message ||
                e?.response?.data?.exc ||
                e?.message ||
                "Conversion failed";
            showToast(typeof err === "string" ? err : "Conversion failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const footer = (
        <div className="flex flex-wrap items-center justify-start gap-2">
            <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || loading}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
                {submitting ? "Converting…" : "Convert"}
            </button>
            <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
                Cancel
            </button>
        </div>
    );

    const selectClass =
        "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50";

    const showDealLayoutPicker = dealLayoutOptions.length > 1;

    const setDealValue = (name: string, v: string) => {
        setDealFieldValues((prev) => ({ ...prev, [name]: v }));
    };

    const pillClass =
        "inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-800 ring-1 ring-slate-200/80";

    const openMatchModal = () => {
        setModalSelectedAccount(selectedExistingAccount || dupInfo?.accounts[0]?.name || "");
        setMatchModalOpen(true);
    };

    const confirmMatchModal = () => {
        if (modalSelectedAccount) setSelectedExistingAccount(modalSelectedAccount);
        setMatchModalOpen(false);
    };

    const contactRowsForModal: LeadConversionDuplicateContactRow[] = useMemo(() => {
        const d = dupInfo;
        if (!d || d.scenario !== "contact_email" || !d.has_duplicate) return [];
        if (d.matched_contacts?.length) return d.matched_contacts;
        const n = d.existing_contact_doc_name?.trim();
        if (!n) return [];
        return [
            {
                name: n,
                contact_display_name: d.matched_contact_display_name || n,
                email_id:
                    pickLeadDisplay(lead, "email_id") || pickLeadDisplay(lead, "email") || "",
                account_name: "—",
                linked_account_doc_name: undefined,
            },
        ];
    }, [dupInfo, lead]);

    const openContactMatchModal = () => {
        setModalSelectedContact(
            selectedExistingContact.trim() || dupInfo?.existing_contact_doc_name?.trim() || ""
        );
        setContactMatchModalOpen(true);
    };

    const confirmContactMatchModal = () => {
        if (modalSelectedContact.trim()) setSelectedExistingContact(modalSelectedContact.trim());
        setContactMatchModalOpen(false);
    };

    return (
        <div className="w-full max-w-xl pb-8 text-left">
            <header className="mb-6 border-b border-slate-200 pb-4 text-left">
                <h1 className="text-xl font-semibold text-slate-900">Convert Lead</h1>
                {headerSubtitle ? (
                    <p className="mt-1 text-sm text-slate-500">{headerSubtitle}</p>
                ) : null}
            </header>
            <div className="flex flex-col pb-2">
                {loading || dupLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-slate-600">
                        <span
                            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
                            aria-hidden
                        />
                        Loading…
                    </div>
                ) : (
                    <>
                        {dupInfo?.scenario === "contact_email" && dupInfo.has_duplicate ? (
                            <>
                                <p className="mb-4 text-left text-sm text-slate-700">
                                    Contact with similar details in{" "}
                                    <strong>{duplicateMatchDisplayLabel}</strong> already exists.
                                </p>
                                <div className="mb-4 space-y-3 border-b border-slate-100 pb-4 text-left">
                                    <label className="flex cursor-default flex-wrap items-center gap-2 text-sm text-slate-800">
                                        <input
                                            type="radio"
                                            name="contact-dup-mode"
                                            checked
                                            readOnly
                                            className="h-4 w-4 shrink-0 border-slate-300 text-blue-600 focus:ring-blue-500"
                                            aria-checked="true"
                                            aria-label="Add to existing Contact"
                                        />
                                        <span>Add to Existing Contact</span>
                                        {dupInfo.matched_contact_display_name ||
                                        dupInfo.existing_contact_doc_name ? (
                                            <span className={pillClass}>
                                                {contactRowsForModal.find(
                                                    (r) => r.name === selectedExistingContact
                                                )?.contact_display_name ||
                                                    dupInfo.matched_contact_display_name ||
                                                    dupInfo.existing_contact_doc_name}
                                            </span>
                                        ) : null}
                                        {dupInfo.existing_contact_doc_name ? (
                                            <button
                                                type="button"
                                                className="text-sm font-medium text-blue-600 hover:underline"
                                                onClick={openContactMatchModal}
                                            >
                                                View
                                            </button>
                                        ) : null}
                                    </label>
                                    <label className="flex cursor-default flex-wrap items-center gap-2 text-sm text-slate-500">
                                        <input
                                            type="radio"
                                            name="contact-dup-mode"
                                            checked={false}
                                            readOnly
                                            disabled
                                            className="h-4 w-4 shrink-0 border-slate-300"
                                            aria-hidden
                                        />
                                        <span className="text-slate-800">Create New Contact:</span>
                                        <span className={pillClass}>
                                            {contactName.trim() || pickLeadDisplay(lead, "lead_name") || "—"}
                                        </span>
                                        <span className="text-slate-500">
                                            (Disabled. Your organization has chosen not to create duplicates.)
                                        </span>
                                    </label>
                                </div>
                            </>
                        ) : dupInfo?.scenario === "account" && dupInfo.has_duplicate ? (
                            <>
                                <p className="mb-4 text-left text-sm text-slate-700">
                                    Account with similar details in{" "}
                                    <strong>{duplicateMatchDisplayLabel}</strong> already exists.
                                </p>
                                <div className="mb-4 space-y-3 border-b border-slate-100 pb-4 text-left">
                                    <label className="flex cursor-pointer flex-wrap items-center gap-2 text-sm text-slate-800">
                                        <input
                                            type="radio"
                                            name="account-mode"
                                            className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={accountMode === "existing"}
                                            onChange={() => setAccountMode("existing")}
                                        />
                                        <span>Add to existing Account</span>
                                        {selectedExistingAccount ? (
                                            <span className={pillClass}>{selectedExistingAccount}</span>
                                        ) : null}
                                        <button
                                            type="button"
                                            className="text-sm font-medium text-blue-600 hover:underline"
                                            onClick={openMatchModal}
                                        >
                                            View
                                        </button>
                                    </label>
                                    {accountMode === "existing" ? (
                                        <p className="pl-6 text-left text-sm text-slate-600">
                                            A new Contact{" "}
                                            <span className={pillClass}>
                                                {contactName.trim() || "—"}
                                            </span>{" "}
                                            will be created for the Account.
                                        </p>
                                    ) : null}
                                    <label className="flex cursor-pointer flex-wrap items-center gap-2 text-sm text-slate-800">
                                        <input
                                            type="radio"
                                            name="account-mode"
                                            className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={accountMode === "create"}
                                            onChange={() => setAccountMode("create")}
                                        />
                                        <span>Create New Account :</span>
                                        {accountMode === "create" ? (
                                            <span
                                                className={pillClass}
                                                title={accountName.trim() || undefined}
                                            >
                                                {accountName.trim() || "—"}
                                            </span>
                                        ) : (
                                            <span className={pillClass}>
                                                {accountName.trim() || "—"}
                                            </span>
                                        )}
                                    </label>
                                    {accountMode === "create" ? (
                                        <p className="pl-6 text-left text-sm text-slate-600">
                                            A new Contact{" "}
                                            <span className={pillClass}>
                                                {contactName.trim() || "—"}
                                            </span>{" "}
                                            will be created for the Account.
                                        </p>
                                    ) : null}
                                </div>
                            </>
                        ) : (
                            <>
                                <FormRow label="Create New Account">
                                    <PillInput
                                        id="acc-name"
                                        value={accountName}
                                        onChange={setAccountName}
                                    />
                                </FormRow>

                                <FormRow label="Create New Contact">
                                    <PillInput
                                        id="con-name"
                                        value={contactName}
                                        onChange={setContactName}
                                    />
                                </FormRow>
                            </>
                        )}

                        <div className="border-b border-slate-100 py-3 text-left">
                            <label
                                htmlFor="create-deal-check"
                                className="inline-flex cursor-pointer items-center gap-2 text-left"
                            >
                                <input
                                    id="create-deal-check"
                                    type="checkbox"
                                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    checked={createDeal}
                                    onChange={(e) => setCreateDeal(e.target.checked)}
                                />
                                <span className="text-sm text-slate-800">
                                    Create a new Deal for this Account.
                                </span>
                            </label>
                        </div>

                        {createDeal ? (
                                <div className="w-full space-y-0">
                                    {showDealLayoutPicker ? (
                                        <FormRow label="Layout" htmlFor="deal-layout" wideLabel>
                                            <div className="flex max-w-full items-center gap-2">
                                                <select
                                                    id="deal-layout"
                                                    value={selectedDealLayoutId}
                                                    disabled={layoutLockedByMapping}
                                                    onChange={(e) =>
                                                        setSelectedDealLayoutId(e.target.value)
                                                    }
                                                    className={selectClass + " w-full min-w-0 flex-1"}
                                                >
                                                    {dealLayoutOptions.map((o) => (
                                                        <option key={o.value} value={o.value}>
                                                            {o.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {layoutLockedByMapping ? (
                                                    <span
                                                        className="shrink-0 text-slate-400"
                                                        title="Defined by lead conversion mapping"
                                                    >
                                                        <svg
                                                            className="h-5 w-5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            aria-hidden
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                            />
                                                        </svg>
                                                    </span>
                                                ) : null}
                                            </div>
                                        </FormRow>
                                    ) : null}

                                    {mandatoryDealFields.map((f: any) => {
                                        const name = String(f?.name ?? f?.fieldname ?? "").trim();
                                        if (!name) return null;
                                        const label = String(f?.label ?? name);
                                        const ft = String(f?.type ?? "").toLowerCase();
                                        const fdt = String(f?.fieldtype ?? "").toLowerCase();
                                        const value = dealFieldValues[name] ?? "";
                                        const req =
                                            isDealFieldValidateEnabled(f) || isDealFieldMandatory(f);
                                        const fieldId = `deal-field-${name}`;
                                        const isStage = ft === "stage" || fdt.includes("stage");
                                        const isCurrency =
                                            fdt === "currency" ||
                                            fdt === "float" ||
                                            name.toLowerCase() === "amount";
                                        const isDate = ft === "date" || ft === "datetime" || fdt === "date";

                                        if (isStage) {
                                            return (
                                                <FormRow
                                                    key={name}
                                                    label={label}
                                                    htmlFor={fieldId}
                                                    required={req}
                                                    wideLabel
                                                >
                                                    <select
                                                        id={fieldId}
                                                        value={value}
                                                        onChange={(e) =>
                                                            setDealValue(name, e.target.value)
                                                        }
                                                        className={selectClass + " w-full"}
                                                    >
                                                        <option value="">Select stage</option>
                                                        {stagePipelineOptions.map((o) => (
                                                            <option key={o.value} value={o.value}>
                                                                {o.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormRow>
                                            );
                                        }

                                        if (isCurrency) {
                                            return (
                                                <FormRow
                                                    key={name}
                                                    label={label}
                                                    htmlFor={fieldId}
                                                    required={req}
                                                    wideLabel
                                                >
                                                    <div className="flex w-full max-w-full items-center overflow-hidden rounded-md border border-slate-300 bg-white">
                                                        <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                                            $
                                                        </span>
                                                        <input
                                                            id={fieldId}
                                                            type="number"
                                                            inputMode="decimal"
                                                            value={value}
                                                            onChange={(e) =>
                                                                setDealValue(name, e.target.value)
                                                            }
                                                            className="min-w-0 flex-1 border-0 px-3 py-2 text-sm focus:outline-none focus:ring-0"
                                                        />
                                                    </div>
                                                </FormRow>
                                            );
                                        }

                                        if (isDate) {
                                            return (
                                                <FormRow
                                                    key={name}
                                                    label={label}
                                                    htmlFor={fieldId}
                                                    required={req}
                                                    wideLabel
                                                >
                                                    <input
                                                        id={fieldId}
                                                        type="date"
                                                        value={value}
                                                        onChange={(e) =>
                                                            setDealValue(name, e.target.value)
                                                        }
                                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </FormRow>
                                            );
                                        }

                                        if (ft === "textarea" || ft === "multiline") {
                                            return (
                                                <FormRow
                                                    key={name}
                                                    label={label}
                                                    htmlFor={fieldId}
                                                    required={req}
                                                    wideLabel
                                                    alignTop
                                                >
                                                    <textarea
                                                        id={fieldId}
                                                        value={value}
                                                        rows={3}
                                                        onChange={(e) =>
                                                            setDealValue(name, e.target.value)
                                                        }
                                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    />
                                                </FormRow>
                                            );
                                        }

                                        return (
                                            <FormRow
                                                key={name}
                                                label={label}
                                                htmlFor={fieldId}
                                                required={req}
                                                wideLabel
                                            >
                                                <input
                                                    id={fieldId}
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) =>
                                                        setDealValue(name, e.target.value)
                                                    }
                                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </FormRow>
                                        );
                                    })}
                                </div>
                            ) : null}

                        <FormRow label="Owner of the New Records" htmlFor="owner-pick">
                            <div className="flex max-w-md items-center gap-2">
                                <select
                                    id="owner-pick"
                                    value={ownerValue}
                                    onChange={(e) => setOwnerValue(e.target.value)}
                                    className={selectClass + " flex-1"}
                                >
                                    <option value="">—</option>
                                    {ownerSelectOptions.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label || o.value}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-slate-400" aria-hidden>
                                    <svg
                                        className="h-6 w-6"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </span>
                            </div>
                        </FormRow>

                        <div className="py-3">
                            <label className="inline-flex cursor-pointer items-center gap-2 text-left">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    checked={notifyOwner}
                                    onChange={(e) => setNotifyOwner(e.target.checked)}
                                />
                                <span className="text-sm text-slate-800">
                                    Notify record owner (Account and Contact).
                                </span>
                            </label>
                        </div>
                    </>
                )}
            </div>
            <div className="mt-8 border-t border-slate-200 pt-6">{footer}</div>

            {matchModalOpen && dupInfo && dupInfo.accounts.length > 0 ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="match-modal-title"
                    onClick={() => setMatchModalOpen(false)}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            id="match-modal-title"
                            className="mb-4 text-lg font-semibold text-slate-900"
                        >
                            Matching Account Record(s)
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-600">
                                        <th className="w-10 py-2 pr-2" scope="col" />
                                        <th className="py-2 pr-3" scope="col">
                                            Account Name
                                        </th>
                                        <th className="py-2 pr-3" scope="col">
                                            Phone
                                        </th>
                                        <th className="py-2 pr-3" scope="col">
                                            Website
                                        </th>
                                        <th className="py-2" scope="col">
                                            Account Type
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dupInfo.accounts.map((row) => (
                                        <tr key={row.name} className="border-b border-slate-100">
                                            <td className="py-2 pr-2 align-middle">
                                                <input
                                                    type="radio"
                                                    name="modal-pick-account"
                                                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    checked={modalSelectedAccount === row.name}
                                                    onChange={() => setModalSelectedAccount(row.name)}
                                                    aria-label={`Select ${row.name}`}
                                                />
                                            </td>
                                            <td className="py-2 pr-3 align-middle">
                                                <span className={pillClass}>{row.name}</span>
                                            </td>
                                            <td className="py-2 pr-3 align-middle text-slate-700">
                                                {row.phone || "—"}
                                            </td>
                                            <td className="py-2 pr-3 align-middle text-slate-700">
                                                {row.website || "—"}
                                            </td>
                                            <td className="py-2 align-middle text-slate-700">
                                                {row.account_type || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                                onClick={() => setMatchModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!modalSelectedAccount}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                                onClick={confirmMatchModal}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {contactMatchModalOpen &&
            dupInfo?.scenario === "contact_email" &&
            contactRowsForModal.length > 0 ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="contact-match-modal-title"
                    onClick={() => setContactMatchModalOpen(false)}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            id="contact-match-modal-title"
                            className="mb-4 text-lg font-semibold text-slate-900"
                        >
                            Matching Contact Record(s)
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-600">
                                        <th className="w-10 py-2 pr-2" scope="col" />
                                        <th className="py-2 pr-3" scope="col">
                                            Contact Name
                                        </th>
                                        <th className="py-2 pr-3" scope="col">
                                            Account Name
                                        </th>
                                        <th className="py-2" scope="col">
                                            Email
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contactRowsForModal.map((row) => (
                                        <tr key={row.name} className="border-b border-slate-100">
                                            <td className="py-2 pr-2 align-middle">
                                                <input
                                                    type="radio"
                                                    name="modal-pick-contact"
                                                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    checked={modalSelectedContact === row.name}
                                                    onChange={() => setModalSelectedContact(row.name)}
                                                    aria-label={`Select ${row.contact_display_name}`}
                                                />
                                            </td>
                                            <td className="py-2 pr-3 align-middle">
                                                <button
                                                    type="button"
                                                    className="text-left font-medium text-blue-600 hover:underline"
                                                    onClick={() =>
                                                        router.push(
                                                            `/contacts/detail/${encodeURIComponent(row.name)}`
                                                        )
                                                    }
                                                >
                                                    {row.contact_display_name}
                                                </button>
                                            </td>
                                            <td className="py-2 pr-3 align-middle text-slate-800">
                                                {row.account_name}
                                            </td>
                                            <td className="py-2 align-middle">
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-800">
                                                    {row.email_id || "—"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                                onClick={() => setContactMatchModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!modalSelectedContact.trim()}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                                onClick={confirmContactMatchModal}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
