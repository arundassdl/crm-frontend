"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Typography,
    Button,
    FormControl,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
} from "@mui/material";
import {
    getConversionMap,
    getFormFields,
    getLayoutList,
    saveConversionMap,
    type ConversionMapMessage,
} from "@/services/api/general_apis/layout-api";
import { showToast } from "@/components/ToastNotificationNew";

function getRowVal(row: any, field: string) {
    if (!row) return undefined;
    return row[field] ?? row[`SDL Layout.${field}`];
}

function findModuleMapRow(rows: any[], hints: string[]): any | null {
    for (const h of hints) {
        const hl = h.toLowerCase();
        const hit = rows.find((r: any) => {
            const f = String(r.frontend_module ?? "").trim().toLowerCase();
            const n = String(r.name ?? "").trim().toLowerCase();
            return f === hl || n === hl;
        });
        if (hit) return hit;
    }
    return null;
}

/** Same module string as listing/create flows use for getLayoutList / getFormFields (e.g. "Leads"), not only SDL doc name. */
function moduleApiIdentifier(row: any | null): string {
    if (!row) return "";
    return String(row.frontend_module ?? row.name ?? "").trim();
}

function normalizeFormFieldsResponse(res: any): any[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.fields)) return res.fields;
    if (Array.isArray(res?.message?.fields)) return res.message.fields;
    if (Array.isArray(res?.data?.fields)) return res.data.fields;
    if (Array.isArray(res?.data)) return res.data;
    if (res?.status === "error") return [];
    return [];
}

/** Layout canvas fields: respect hide/hidden/visible (see LayoutCanvas). */
function fieldVisibleInLayoutField(f: any): boolean {
    if (!f || typeof f !== "object") return true;
    if (f.hidden === true || f.hide === true) return false;
    if (f.visible === 0 || f.visible === false) return false;
    return true;
}

/** Flatten fields from get_formFields layout_json (sections/columns) when API omits a flat `fields` array. */
function extractFieldsFromLayoutPayload(res: any): any[] {
    const out: any[] = [];
    const layout = res?.layout_json ?? res?.layout;
    if (!layout) return out;
    const parsed = typeof layout === "string" ? (() => {
        try {
            return JSON.parse(layout);
        } catch {
            return null;
        }
    })() : layout;
    if (!parsed) return out;

    const walkSections = (sections: any[]) => {
        sections.forEach((section: any) => {
            section.columns?.forEach((col: any) => {
                col.fields?.forEach((field: any) => {
                    if (!fieldVisibleInLayoutField(field)) return;
                    const normalized = {
                        ...field,
                        fieldname: field.fieldname ?? field.name ?? field.field_name,
                        name: field.name ?? field.fieldname ?? field.field_name,
                        label: field.label ?? field.fieldname ?? field.name,
                    };
                    if (normalized.fieldname || normalized.name) {
                        out.push(normalized);
                    }
                });
            });
        });
    };

    if (Array.isArray(parsed)) {
        parsed.forEach((section: any) => {
            section.columns?.forEach((col: any) => {
                col.fields?.forEach((field: any) => {
                    if (!fieldVisibleInLayoutField(field)) return;
                    const normalized = {
                        ...field,
                        fieldname: field.fieldname ?? field.name ?? field.field_name,
                        name: field.name ?? field.fieldname ?? field.field_name,
                        label: field.label ?? field.fieldname ?? field.name,
                    };
                    if (normalized.fieldname || normalized.name) out.push(normalized);
                });
            });
        });
    } else if (Array.isArray(parsed?.sections)) {
        walkSections(parsed.sections);
    }

    return out;
}

function fieldLabel(f: any): string {
    return String(f.label ?? f.fieldname ?? f.name ?? "—");
}

function fieldKey(f: any): string {
    return String(f.fieldname ?? f.field_name ?? f.name ?? "").trim();
}

function isOwnerField(f: any): boolean {
    const k = fieldKey(f).toLowerCase();
    return k === "owner" || k === "owner_name";
}

/**
 * Fields for mapping dropdowns: only fields placed on the selected layout (`layout_json`), in layout order.
 * When the API returns both a full `fields` list and `layout_json`, we use the layout so changing
 * Account/Contact/Deal layout reloads that column’s options (e.g. V1 vs V2).
 * Exported for Lead Convert (deal mandatory fields) — same merge rules as mapping UI.
 */
export function getVisibleFormFieldsForMapping(res: any): any[] {
    const flat = normalizeFormFieldsResponse(res);
    const flatNormalized = flat.map((f: any) => ({
        ...f,
        fieldname: f.fieldname ?? f.name ?? f.field_name,
        name: f.name ?? f.fieldname ?? f.field_name,
    }));
    const flatByKey = new Map<string, any>();
    for (const f of flatNormalized) {
        const k = fieldKey(f);
        if (k) flatByKey.set(k, f);
    }

    const fromLayout = extractFieldsFromLayoutPayload(res);
    const hasLayoutPayload = !!(res?.layout_json ?? res?.layout);

    if (fromLayout.length > 0) {
        const seen = new Set<string>();
        const merged: any[] = [];
        for (const row of fromLayout) {
            if (!fieldVisibleInLayoutField(row)) continue;
            const k = fieldKey(row);
            if (!k || seen.has(k)) continue;
            seen.add(k);
            const meta = flatByKey.get(k);
            if (meta) {
                merged.push({
                    ...meta,
                    ...row,
                    fieldname: k,
                    name: row.name ?? meta.name ?? k,
                    label: row.label ?? meta.label,
                });
            } else {
                merged.push({
                    ...row,
                    fieldname: row.fieldname ?? row.name ?? row.field_name,
                    name: row.name ?? row.fieldname ?? row.field_name,
                });
            }
        }
        return merged;
    }

    /* layout_json exists but section walk found no fields (alternate JSON shapes) — still use flat `fields` if API sent them */
    if (hasLayoutPayload && fromLayout.length === 0 && flatNormalized.length > 0) {
        return flatNormalized;
    }

    if (hasLayoutPayload) {
        return [];
    }

    if (flatNormalized.length > 0) {
        return flatNormalized;
    }
    return extractFieldsFromLayoutPayload(res);
}

/** Normalize API differences (SDL `type`, Frappe `fieldtype`, UI `data_type`) to one comparable key. */
const CANONICAL_FIELD_TYPE: Record<string, string> = {
    data: "text",
    string: "text",
    text: "text",
    email: "email",
    phone: "mobile_no",
    mobile_no: "mobile_no",
    int: "longinteger",
    integer: "longinteger",
    longinteger: "longinteger",
    bigint: "longinteger",
    float: "number",
    number: "number",
    currency: "currency",
    textarea: "textarea",
    multiline: "textarea",
    picklist: "picklist",
    select: "picklist",
    autocomplete: "autocomplete",
    link: "lookup",
    lookup: "lookup",
    checkbox: "checkbox",
    check: "checkbox",
    bool: "checkbox",
    boolean: "checkbox",
    switch: "switch",
    date: "date",
    datetime: "datetime",
    file: "file",
    attach: "file",
    address: "address",
    firstname: "firstname",
    contactlead: "contactlead",
    relatedto: "relatedto",
    reminder: "reminder",
    stage: "stage",
    password: "password",
    radio: "radio",
};

function rawFieldTypeString(f: any): string {
    const raw = f?.type ?? f?.fieldtype ?? f?.data_type ?? f?.field_type;
    if (raw == null) return "";
    const s = String(raw).trim();
    if (!s || s === "—" || s === "-" || /^n\/?a$/i.test(s)) return "";
    const sl = s.toLowerCase();
    if (sl.includes("single line") || sl === "single line") return "text";
    if (sl.includes("multi line") || sl.includes("multi-line") || sl.includes("multiline")) return "textarea";
    return s;
}

function canonicalFieldType(f: any): string {
    const s = rawFieldTypeString(f);
    if (!s) return "";
    const sl = s.toLowerCase();
    return CANONICAL_FIELD_TYPE[sl] ?? sl;
}

/** When lead type is known, only targets with the same canonical type match. Unknown lead type → no filtering. */
function targetFieldMatchesLead(leadField: any, targetField: any): boolean {
    const leadCanon = canonicalFieldType(leadField);
    if (!leadCanon) return true;
    const tgtCanon = canonicalFieldType(targetField);
    if (!tgtCanon) return false;
    return leadCanon === tgtCanon;
}

const NONE = "";

function resolveLayoutValueFromSavedTarget(
    layouts: { value: string; label: string }[],
    targetLayout: string
): string {
    const t = String(targetLayout ?? "").trim();
    if (!t) return "";
    const byLabel = layouts.find((o) => o.label === t);
    if (byLabel?.value) return byLabel.value;
    const byValue = layouts.find((o) => o.value === t);
    if (byValue?.value) return byValue.value;
    const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
    const nt = norm(t);
    const fuzzy = layouts.find((o) => norm(o.label) === nt || norm(o.value) === nt);
    return fuzzy?.value ?? "";
}

function parseMappingJsonField(
    raw: string | Record<string, string> | undefined
): Record<string, string> | null {
    if (raw == null) return null;
    if (typeof raw === "object" && !Array.isArray(raw)) {
        return raw as Record<string, string>;
    }
    if (typeof raw === "string") {
        try {
            const p = JSON.parse(raw);
            return typeof p === "object" && p !== null && !Array.isArray(p) ? p : null;
        } catch {
            return null;
        }
    }
    return null;
}

/** Selected layout id must exist in the current layout list (retired/removed layouts fail this check). */
function isLayoutSelectedInList(
    layouts: { value: string; label: string }[],
    selected: string
): boolean {
    const v = String(selected ?? "").trim();
    if (!v) return false;
    return layouts.some((o) => o.value === v);
}

function labelForValidLayoutSelection(
    layouts: { value: string; label: string }[],
    selected: string
): string | null {
    if (!isLayoutSelectedInList(layouts, selected)) return null;
    const hit = layouts.find((o) => o.value === selected);
    if (!hit) return null;
    return String(hit.label ?? hit.value ?? "").trim() || null;
}

/** Same column widths for Layout Mapping and Field Mapping so Account/Contact/Deal line up. */
const MAPPING_COL = {
    lead: { width: "28%" },
    account: { width: "24%" },
    contact: { width: "24%" },
    deal: { width: "24%" },
} as const;

const mappingTableSx = { tableLayout: "fixed" as const, width: "100%" };

const mappingTableHeadCellSx = {
    fontWeight: 600,
    bgcolor: "transparent",
    verticalAlign: "middle",
} as const;

const mappingTableBodyCellSx = {
    bgcolor: "transparent",
    verticalAlign: "middle",
} as const;

const mappingTableContainerBaseSx = {
    bgcolor: "transparent",
    boxShadow: "none",
    width: "100%",
} as const;

/** Matches field-mapping `targetSelect` controls (minWidth 140, full width of cell). */
const layoutSelectFormControlSx = { minWidth: 140 };

export interface LeadConversionMappingSavePayload {
    leadLayoutId: string;
    accountLayoutId: string;
    contactLayoutId: string;
    dealLayoutId: string;
    mapAccount: Record<string, string>;
    mapContact: Record<string, string>;
    mapDeal: Record<string, string>;
}

/** When set (e.g. from Module Listing), the Lead column shows a layout dropdown instead of plain text. */
export interface LeadLayoutPickerConfig {
    options: { value: string; label: string }[];
    onChange: (layoutDocName: string) => void;
}

interface LeadConversionMappingPanelProps {
    layoutRow: any;
    moduleRows: any[];
    userToken: any;
    onCancel: () => void;
    onSave?: (payload: LeadConversionMappingSavePayload) => void | Promise<void>;
    /** Lead layout picker inside the Layout Mapping table; when omitted, show the current layout name only. */
    leadLayoutPicker?: LeadLayoutPickerConfig;
}

const LeadConversionMappingPanel: React.FC<LeadConversionMappingPanelProps> = ({
    layoutRow,
    moduleRows,
    userToken,
    onCancel,
    onSave,
    leadLayoutPicker,
}) => {
    const token = userToken?.access_token ?? "";
    const roleProfile = userToken?.role_profile ?? "";

    const leadsModuleApi = useMemo(
        () => moduleApiIdentifier(findModuleMapRow(moduleRows, ["Leads", "leads", "Lead", "lead"])),
        [moduleRows]
    );
    const accountsModuleApi = useMemo(
        () => moduleApiIdentifier(findModuleMapRow(moduleRows, ["Accounts", "accounts", "Account", "account"])),
        [moduleRows]
    );
    const contactsModuleApi = useMemo(
        () => moduleApiIdentifier(findModuleMapRow(moduleRows, ["Contacts", "contacts", "Contact", "contact"])),
        [moduleRows]
    );
    const dealsModuleApi = useMemo(
        () => moduleApiIdentifier(findModuleMapRow(moduleRows, ["Deals", "deals", "Deal", "deal"])),
        [moduleRows]
    );

    const leadLayoutId = getRowVal(layoutRow, "name");
    const leadLayoutLabel = getRowVal(layoutRow, "layout_name") ?? leadLayoutId ?? "—";

    const [accountLayouts, setAccountLayouts] = useState<{ value: string; label: string }[]>([]);
    const [contactLayouts, setContactLayouts] = useState<{ value: string; label: string }[]>([]);
    const [dealLayouts, setDealLayouts] = useState<{ value: string; label: string }[]>([]);

    const [selectedAccountLayout, setSelectedAccountLayout] = useState("");
    const [selectedContactLayout, setSelectedContactLayout] = useState("");
    const [selectedDealLayout, setSelectedDealLayout] = useState("");

    const [leadFields, setLeadFields] = useState<any[]>([]);
    const [accountFields, setAccountFields] = useState<any[]>([]);
    const [contactFields, setContactFields] = useState<any[]>([]);
    const [dealFields, setDealFields] = useState<any[]>([]);

    const [loadingLayouts, setLoadingLayouts] = useState(false);
    const [loadingFields, setLoadingFields] = useState(false);

    const [mapAccount, setMapAccount] = useState<Record<string, string>>({});
    const [mapContact, setMapContact] = useState<Record<string, string>>({});
    const [mapDeal, setMapDeal] = useState<Record<string, string>>({});
    const [savedConversionMap, setSavedConversionMap] = useState<ConversionMapMessage | null>(null);
    const [saving, setSaving] = useState(false);
    /** Apply server target layout picks once per lead layout; re-applying on every layout-list refresh overwrote user dropdown changes. */
    const hasAppliedServerTargetLayoutsRef = useRef(false);

    const loadLayoutOptions = useCallback(async () => {
        if (!token) return;
        setLoadingLayouts(true);
        try {
            const [a, c, d] = await Promise.all([
                accountsModuleApi ? getLayoutList(accountsModuleApi, token, roleProfile) : Promise.resolve([]),
                contactsModuleApi ? getLayoutList(contactsModuleApi, token, roleProfile) : Promise.resolve([]),
                dealsModuleApi ? getLayoutList(dealsModuleApi, token, roleProfile) : Promise.resolve([]),
            ]);
            const norm = (list: any[]) =>
                (Array.isArray(list) ? list : []).map((x: any) => ({
                    value: String(x.value ?? x.name ?? ""),
                    label: String(x.label ?? x.layout_name ?? x.name ?? ""),
                })).filter((x) => x.value);

            setAccountLayouts(norm(a));
            setContactLayouts(norm(c));
            setDealLayouts(norm(d));

            const pick = (arr: { value: string; label: string }[]) => arr[0]?.value ?? "";
            setSelectedAccountLayout((prev) => prev || pick(norm(a)));
            setSelectedContactLayout((prev) => prev || pick(norm(c)));
            setSelectedDealLayout((prev) => prev || pick(norm(d)));
        } finally {
            setLoadingLayouts(false);
        }
    }, [token, roleProfile, accountsModuleApi, contactsModuleApi, dealsModuleApi]);

    useEffect(() => {
        loadLayoutOptions();
    }, [loadLayoutOptions]);

    /** Drop stale layout ids when the list refreshes (e.g. retired layout no longer in get_layout_list). */
    useEffect(() => {
        setSelectedAccountLayout((prev) => {
            if (!accountLayouts.length) return "";
            if (prev && accountLayouts.some((o) => o.value === prev)) return prev;
            return accountLayouts[0]?.value ?? "";
        });
    }, [accountLayouts]);

    useEffect(() => {
        setSelectedContactLayout((prev) => {
            if (!contactLayouts.length) return "";
            if (prev && contactLayouts.some((o) => o.value === prev)) return prev;
            return contactLayouts[0]?.value ?? "";
        });
    }, [contactLayouts]);

    useEffect(() => {
        setSelectedDealLayout((prev) => {
            if (!dealLayouts.length) return "";
            if (prev && dealLayouts.some((o) => o.value === prev)) return prev;
            return dealLayouts[0]?.value ?? "";
        });
    }, [dealLayouts]);

    useEffect(() => {
        setMapAccount({});
        setMapContact({});
        setMapDeal({});
        setSavedConversionMap(null);
    }, [leadLayoutId]);

    useEffect(() => {
        if (!token || !leadsModuleApi || !leadLayoutLabel) return;
        let cancelled = false;
        (async () => {
            const msg = await getConversionMap(leadsModuleApi, String(leadLayoutLabel), token);
            if (!cancelled) {
                setSavedConversionMap(msg);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token, leadsModuleApi, leadLayoutLabel, leadLayoutId]);

    useEffect(() => {
        const msg = savedConversionMap;
        if (!msg || !Array.isArray(msg.target_modules)) return;
        if (hasAppliedServerTargetLayoutsRef.current) return;

        const tms = msg.target_modules;
        if (tms.length === 0) {
            hasAppliedServerTargetLayoutsRef.current = true;
            return;
        }
        const needAccounts = tms.some((t) => String(t.target_doctype || "").trim() === "Accounts");
        const needContacts = tms.some((t) => String(t.target_doctype || "").trim() === "Contacts");
        const needDeals = tms.some((t) => String(t.target_doctype || "").trim() === "Deals");
        if (needAccounts && !accountLayouts.length) return;
        if (needContacts && !contactLayouts.length) return;
        if (needDeals && !dealLayouts.length) return;

        for (const tm of tms) {
            const dt = String(tm.target_doctype || "").trim();
            const tl = String(tm.target_layout || "").trim();
            if (dt === "Accounts" && accountLayouts.length) {
                const v = resolveLayoutValueFromSavedTarget(accountLayouts, tl);
                if (v) setSelectedAccountLayout(v);
            } else if (dt === "Contacts" && contactLayouts.length) {
                const v = resolveLayoutValueFromSavedTarget(contactLayouts, tl);
                if (v) setSelectedContactLayout(v);
            } else if (dt === "Deals" && dealLayouts.length) {
                const v = resolveLayoutValueFromSavedTarget(dealLayouts, tl);
                if (v) setSelectedDealLayout(v);
            }
        }
        hasAppliedServerTargetLayoutsRef.current = true;
    }, [savedConversionMap, accountLayouts, contactLayouts, dealLayouts]);

    useEffect(() => {
        const msg = savedConversionMap;
        if (!msg) return;
        const nextAcc: Record<string, string> = {};
        const nextCon: Record<string, string> = {};
        const nextDeal: Record<string, string> = {};
        for (const row of msg.mapping_rows || []) {
            const sf = row.source_field;
            if (!sf) continue;
            const mj = parseMappingJsonField(row.mapping_json);
            if (!mj) continue;
            const a = mj.Accounts ?? (mj as Record<string, string>).accounts;
            const c = mj.Contact ?? mj.Contacts ?? (mj as Record<string, string>).contact;
            const d = mj.Deals ?? (mj as Record<string, string>).deals;
            if (a != null && String(a).trim() !== "") nextAcc[sf] = String(a);
            if (c != null && String(c).trim() !== "") nextCon[sf] = String(c);
            if (d != null && String(d).trim() !== "") nextDeal[sf] = String(d);
        }
        setMapAccount(nextAcc);
        setMapContact(nextCon);
        setMapDeal(nextDeal);
    }, [savedConversionMap, leadLayoutId]);

    useEffect(() => {
        if (!token || !leadsModuleApi || !leadLayoutId) return;
        let cancelled = false;
        (async () => {
            setLoadingFields(true);
            try {
                const res = await getFormFields(leadsModuleApi, token, roleProfile, leadLayoutId);
                const list = getVisibleFormFieldsForMapping(res).filter(
                    (f: any) => fieldKey(f) && !isOwnerField(f)
                );
                if (!cancelled) {
                    setLeadFields(list);
                }
            } catch {
                if (!cancelled) setLeadFields([]);
            } finally {
                if (!cancelled) setLoadingFields(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token, leadsModuleApi, leadLayoutId, roleProfile]);

    useEffect(() => {
        if (!token || !accountsModuleApi || !selectedAccountLayout) {
            setAccountFields([]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await getFormFields(accountsModuleApi, token, roleProfile, selectedAccountLayout);
                if (!cancelled) {
                    setAccountFields(getVisibleFormFieldsForMapping(res).filter((f: any) => !isOwnerField(f)));
                }
            } catch {
                if (!cancelled) setAccountFields([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token, accountsModuleApi, selectedAccountLayout, roleProfile]);

    useEffect(() => {
        if (!token || !contactsModuleApi || !selectedContactLayout) {
            setContactFields([]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await getFormFields(contactsModuleApi, token, roleProfile, selectedContactLayout);
                if (!cancelled) {
                    setContactFields(getVisibleFormFieldsForMapping(res).filter((f: any) => !isOwnerField(f)));
                }
            } catch {
                if (!cancelled) setContactFields([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token, contactsModuleApi, selectedContactLayout, roleProfile]);

    useEffect(() => {
        if (!token || !dealsModuleApi || !selectedDealLayout) {
            setDealFields([]);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await getFormFields(dealsModuleApi, token, roleProfile, selectedDealLayout);
                if (!cancelled) {
                    setDealFields(getVisibleFormFieldsForMapping(res).filter((f: any) => !isOwnerField(f)));
                }
            } catch {
                if (!cancelled) setDealFields([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token, dealsModuleApi, selectedDealLayout, roleProfile]);

    /** Drop target mappings when the saved target field no longer matches the lead field’s type. */
    useEffect(() => {
        setMapAccount((prev) => {
            if (!accountFields.length) return prev;
            let next = prev;
            let changed = false;
            for (const lf of leadFields) {
                const k = fieldKey(lf);
                const v = prev[k];
                if (!v || v === NONE) continue;
                const tf = accountFields.find((f) => fieldKey(f) === v);
                const lc = canonicalFieldType(lf);
                if (!lc) continue;
                if (!tf || !targetFieldMatchesLead(lf, tf)) {
                    if (!changed) {
                        next = { ...prev };
                        changed = true;
                    }
                    delete next[k];
                }
            }
            return changed ? next : prev;
        });
    }, [leadFields, accountFields]);

    useEffect(() => {
        setMapContact((prev) => {
            if (!contactFields.length) return prev;
            let next = prev;
            let changed = false;
            for (const lf of leadFields) {
                const k = fieldKey(lf);
                const v = prev[k];
                if (!v || v === NONE) continue;
                const tf = contactFields.find((f) => fieldKey(f) === v);
                const lc = canonicalFieldType(lf);
                if (!lc) continue;
                if (!tf || !targetFieldMatchesLead(lf, tf)) {
                    if (!changed) {
                        next = { ...prev };
                        changed = true;
                    }
                    delete next[k];
                }
            }
            return changed ? next : prev;
        });
    }, [leadFields, contactFields]);

    useEffect(() => {
        setMapDeal((prev) => {
            if (!dealFields.length) return prev;
            let next = prev;
            let changed = false;
            for (const lf of leadFields) {
                const k = fieldKey(lf);
                const v = prev[k];
                if (!v || v === NONE) continue;
                const tf = dealFields.find((f) => fieldKey(f) === v);
                const lc = canonicalFieldType(lf);
                if (!lc) continue;
                if (!tf || !targetFieldMatchesLead(lf, tf)) {
                    if (!changed) {
                        next = { ...prev };
                        changed = true;
                    }
                    delete next[k];
                }
            }
            return changed ? next : prev;
        });
    }, [leadFields, dealFields]);

    const targetSelect = (
        leadField: any,
        fields: any[],
        value: string,
        onChange: (v: string) => void
    ) => {
        const opts = fields.filter(
            (f) => fieldKey(f) && !isOwnerField(f) && targetFieldMatchesLead(leadField, f)
        );
        const validIds = new Set(opts.map((x) => fieldKey(x)));
        const safeValue = value && value !== NONE && validIds.has(value) ? value : NONE;
        return (
            <FormControl size="small" fullWidth sx={{ minWidth: 140 }}>
                <Select
                    displayEmpty
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    renderValue={(v) => {
                        if (!v || v === NONE) return "None";
                        const f = opts.find((x) => fieldKey(x) === v);
                        return f ? fieldLabel(f) : v;
                    }}
                >
                    <MenuItem value={NONE}>
                        <em>None</em>
                    </MenuItem>
                    {opts.map((f) => (
                        <MenuItem key={fieldKey(f)} value={fieldKey(f)}>
                            {fieldLabel(f)}
                            {f?.is_custom || f?.custom ? " *" : ""}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    };

    const isCustom = (f: any) => !!(f?.is_custom || f?.custom);

    const leadFieldsSortedByFieldname = useMemo(() => {
        return [...leadFields].sort((a, b) =>
            fieldKey(a).localeCompare(fieldKey(b), undefined, { sensitivity: "base" })
        );
    }, [leadFields]);

    const handleSave = async () => {
        if (!token) {
            showToast("Please sign in to save.", "error");
            return;
        }
        if (loadingLayouts) {
            showToast("Layouts are still loading.", "error");
            return;
        }
        setSaving(true);
        try {
            const source_module = leadsModuleApi || "Leads";
            const source_layout = String(
                getRowVal(layoutRow, "layout_name") ?? leadLayoutId ?? ""
            );

            if (accountsModuleApi) {
                if (!accountLayouts.length) {
                    showToast("No Account layouts are available. Cannot save conversion mapping.", "error");
                    return;
                }
                if (!isLayoutSelectedInList(accountLayouts, selectedAccountLayout)) {
                    showToast(
                        "Select a valid Account layout. The previous selection may have been retired or removed.",
                        "error"
                    );
                    return;
                }
            }
            if (contactsModuleApi) {
                if (!contactLayouts.length) {
                    showToast("No Contact layouts are available. Cannot save conversion mapping.", "error");
                    return;
                }
                if (!isLayoutSelectedInList(contactLayouts, selectedContactLayout)) {
                    showToast(
                        "Select a valid Contact layout. The previous selection may have been retired or removed.",
                        "error"
                    );
                    return;
                }
            }
            if (dealsModuleApi) {
                if (!dealLayouts.length) {
                    showToast("No Deal layouts are available. Cannot save conversion mapping.", "error");
                    return;
                }
                if (!isLayoutSelectedInList(dealLayouts, selectedDealLayout)) {
                    showToast(
                        "Select a valid Deal layout. The previous selection may have been retired or removed.",
                        "error"
                    );
                    return;
                }
            }

            const accountLabel = labelForValidLayoutSelection(accountLayouts, selectedAccountLayout);
            const contactLabel = labelForValidLayoutSelection(contactLayouts, selectedContactLayout);
            const dealLabel = labelForValidLayoutSelection(dealLayouts, selectedDealLayout);

            const target_module = [
                {
                    target_module: accountsModuleApi || "Accounts",
                    target_layout: accountsModuleApi ? accountLabel ?? "" : "",
                },
                {
                    target_module: contactsModuleApi || "Contacts",
                    target_layout: contactsModuleApi ? contactLabel ?? "" : "",
                },
                {
                    target_module: dealsModuleApi || "Deals",
                    target_layout: dealsModuleApi ? dealLabel ?? "" : "",
                },
            ];
            const mapping_rows = leadFieldsSortedByFieldname
                .map((lf) => {
                    const k = fieldKey(lf);
                    if (!k) return null;
                    const acc = mapAccount[k];
                    const con = mapContact[k];
                    const deal = mapDeal[k];
                    const accVal = acc && acc !== NONE ? acc : "";
                    const conVal = con && con !== NONE ? con : "";
                    const dealVal = deal && deal !== NONE ? deal : "";
                    if (!accVal && !conVal && !dealVal) return null;
                    return {
                        source_field: k,
                        mapping_json: {
                            Accounts: accVal,
                            Contact: conVal,
                            Deals: dealVal,
                        },
                    };
                })
                .filter((row): row is NonNullable<typeof row> => row != null);
            await saveConversionMap(
                {
                    source_module,
                    source_layout,
                    target_module,
                    mapping_rows,
                },
                token
            );
            showToast("Lead conversion mapping saved", "success");
            await onSave?.({
                leadLayoutId: String(leadLayoutId ?? ""),
                accountLayoutId: selectedAccountLayout,
                contactLayoutId: selectedContactLayout,
                dealLayoutId: selectedDealLayout,
                mapAccount: { ...mapAccount },
                mapContact: { ...mapContact },
                mapDeal: { ...mapDeal },
            });
        } catch (e: any) {
            showToast(e?.message || "Failed to save conversion map", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 2,
                }}
            >
                <Typography variant="h6" fontWeight={600} sx={{ pr: 1 }}>
                    Lead Conversion Mapping
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
                    <Button variant="outlined" size="medium" onClick={onCancel} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        size="medium"
                        onClick={handleSave}
                        disabled={saving || !token || loadingLayouts}
                    >
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </Box>
            </Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Layout Mapping
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 900 }}>
                Map the Lead layout to the layouts of Account, Contact, and Deal to make Lead conversion
                more specific to layouts.
            </Typography>
            {loadingLayouts ? (
                <CircularProgress size={24} sx={{ mb: 2 }} />
            ) : (
                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ ...mappingTableContainerBaseSx, mb: 4 }}
                >
                    <Table size="small" sx={mappingTableSx}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "transparent" }}>
                                <TableCell sx={{ ...mappingTableHeadCellSx, ...MAPPING_COL.lead }}>
                                    Lead
                                </TableCell>
                                <TableCell sx={{ ...mappingTableHeadCellSx, ...MAPPING_COL.account }}>
                                    Account
                                </TableCell>
                                <TableCell sx={{ ...mappingTableHeadCellSx, ...MAPPING_COL.contact }}>
                                    Contact
                                </TableCell>
                                <TableCell sx={{ ...mappingTableHeadCellSx, ...MAPPING_COL.deal }}>Deal</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow sx={{ bgcolor: "transparent" }}>
                                <TableCell sx={{ ...mappingTableBodyCellSx, ...MAPPING_COL.lead }}>
                                    {leadLayoutPicker ? (
                                        <FormControl size="small" fullWidth sx={layoutSelectFormControlSx}>
                                            <Select
                                                value={String(leadLayoutId ?? "")}
                                                onChange={(e) =>
                                                    leadLayoutPicker.onChange(String(e.target.value))
                                                }
                                            >
                                                {leadLayoutPicker.options.map((o) => (
                                                    <MenuItem key={o.value} value={o.value}>
                                                        {o.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        leadLayoutLabel
                                    )}
                                </TableCell>
                                <TableCell sx={{ ...mappingTableBodyCellSx, ...MAPPING_COL.account }}>
                                    <FormControl size="small" fullWidth sx={layoutSelectFormControlSx}>
                                        <Select
                                            value={selectedAccountLayout}
                                            onChange={(e) => setSelectedAccountLayout(e.target.value)}
                                        >
                                            {accountLayouts.map((o) => (
                                                <MenuItem key={o.value} value={o.value}>
                                                    {o.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell sx={{ ...mappingTableBodyCellSx, ...MAPPING_COL.contact }}>
                                    <FormControl size="small" fullWidth sx={layoutSelectFormControlSx}>
                                        <Select
                                            value={selectedContactLayout}
                                            onChange={(e) => setSelectedContactLayout(e.target.value)}
                                        >
                                            {contactLayouts.map((o) => (
                                                <MenuItem key={o.value} value={o.value}>
                                                    {o.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                                <TableCell sx={{ ...mappingTableBodyCellSx, ...MAPPING_COL.deal }}>
                                    <FormControl size="small" fullWidth sx={layoutSelectFormControlSx}>
                                        <Select
                                            value={selectedDealLayout}
                                            onChange={(e) => setSelectedDealLayout(e.target.value)}
                                        >
                                            {dealLayouts.map((o) => (
                                                <MenuItem key={o.value} value={o.value}>
                                                    {o.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                    Field Mapping
                </Typography>
                <Typography variant="caption" color="error">
                    * Custom Field
                </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 900 }}>
                Based on the layout mapping of modules, map the fields in the Lead module to the fields in
                Account, Contact and Deal modules. Each row only shows target fields with the same field type
                as the Lead field (for example, Single Line to Single Line).
            </Typography>

            {loadingFields ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                        ...mappingTableContainerBaseSx,
                        maxHeight: "min(70vh, 560px)",
                        overflow: "auto",
                    }}
                >
                    <Table size="small" stickyHeader sx={mappingTableSx}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: "transparent" }}>
                                <TableCell sx={{ ...mappingTableHeadCellSx, ...MAPPING_COL.lead }}>
                                    Lead
                                </TableCell>
                                <TableCell sx={{ ...mappingTableHeadCellSx, ...MAPPING_COL.account }}>
                                    Account
                                </TableCell>
                                <TableCell sx={{ ...mappingTableHeadCellSx, ...MAPPING_COL.contact }}>
                                    Contact
                                </TableCell>
                                <TableCell sx={{ ...mappingTableHeadCellSx, ...MAPPING_COL.deal }}>Deal</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leadFieldsSortedByFieldname.map((lf, idx) => {
                                const k = fieldKey(lf);
                                return (
                                    <TableRow key={k || idx} sx={{ bgcolor: "transparent" }}>
                                        <TableCell sx={{ ...mappingTableBodyCellSx, ...MAPPING_COL.lead }}>
                                            {fieldLabel(lf)}
                                            {isCustom(lf) ? (
                                                <Typography component="span" color="error" sx={{ ml: 0.5 }}>
                                                    *
                                                </Typography>
                                            ) : null}
                                        </TableCell>
                                        <TableCell sx={{ ...mappingTableBodyCellSx, ...MAPPING_COL.account }}>
                                            {targetSelect(
                                                lf,
                                                accountFields,
                                                mapAccount[k] ?? NONE,
                                                (v) => setMapAccount((prev) => ({ ...prev, [k]: v }))
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ ...mappingTableBodyCellSx, ...MAPPING_COL.contact }}>
                                            {targetSelect(
                                                lf,
                                                contactFields,
                                                mapContact[k] ?? NONE,
                                                (v) => setMapContact((prev) => ({ ...prev, [k]: v }))
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ ...mappingTableBodyCellSx, ...MAPPING_COL.deal }}>
                                            {targetSelect(
                                                lf,
                                                dealFields,
                                                mapDeal[k] ?? NONE,
                                                (v) => setMapDeal((prev) => ({ ...prev, [k]: v }))
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default LeadConversionMappingPanel;
