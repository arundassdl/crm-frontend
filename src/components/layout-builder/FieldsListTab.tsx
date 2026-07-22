"use client";
import { readAccessTokenString, readRoleProfileFromStorage } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    Box,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MagnifyingGlass, CaretDown } from "@phosphor-icons/react";
import { getCustomFields } from "@/services/api/general_apis/custom-field-api";
import { getLayoutList } from "@/services/api/general_apis/layout-api";
import { getLayout } from "@/services/api/crm/crm-api";
import Link from "@/components/Link";
import { useRouter } from "next/navigation";

interface FieldsListTabProps {
    module: string;
    /** Optional layouts for this module (for filter dropdown and Layouts column) */
    layoutRows?: { name: string; layout_name?: string }[];
}

function getFieldLabel(field: any): string {
    return field.label ?? field.fieldname ?? field.name ?? "—";
}

function getFieldType(field: any): string {
    return field.fieldtype ?? field.data_type ?? "—";
}

const FieldsListTab: React.FC<FieldsListTabProps> = ({ module, layoutRows: layoutRowsProp }) => {
    const router = useRouter();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const [fields, setFields] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [layoutFilter, setLayoutFilter] = useState<string>("all");
    const [layouts, setLayouts] = useState<{ value: string; label: string }[]>([]);
    const [fieldToLayouts, setFieldToLayouts] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(false);
    const [openLayoutDialog, setOpenLayoutDialog] = useState(false);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string>("");

    const token = readAccessTokenString();
    const roleProfile = readRoleProfileFromStorage();

    const fetchLayouts = useCallback(async () => {
        if (!token || !module) return [];
        const list = await getLayoutList(module, token, roleProfile);
        return Array.isArray(list) ? list : [];
    }, [module, token, roleProfile]);

    const fetchFields = useCallback(async () => {
        if (!module || !token) return;
        setLoading(true);
        try {
            const res = await getCustomFields(module, token);
            let extractedFields: any[] = [];

            if (res?.layout_json) {
                const layout = typeof res.layout_json === "string" ? JSON.parse(res.layout_json) : res.layout_json;
                if (Array.isArray(layout)) {
                    layout.forEach((section: any) => {
                        section.columns?.forEach((col: any) => {
                            col.fields?.forEach((field: any) => {
                                extractedFields.push({ ...field, section: section.title });
                            });
                        });
                    });
                } else if (layout?.sections) {
                    layout.sections.forEach((section: any) => {
                        section.columns?.forEach((col: any) => {
                            col.fields?.forEach((field: any) => {
                                extractedFields.push({ ...field, section: section?.title });
                            });
                        });
                    });
                }
            } else if (Array.isArray(res)) {
                extractedFields = res;
            } else if (Array.isArray(res?.fields)) {
                extractedFields = res.fields;
            }

            setFields(extractedFields);
        } catch (e) {
            console.error("Failed to fetch fields", e);
            setFields([]);
        } finally {
            setLoading(false);
        }
    }, [module, token]);

    // Build field -> layouts mapping by fetching each layout
    useEffect(() => {
        if (!module || !token) return;

        const load = async () => {
            const layoutList = layoutRowsProp?.length
                ? layoutRowsProp.map((r) => ({ value: r.name, label: r.layout_name ?? r.name }))
                : await fetchLayouts();

            setLayouts([{ value: "all", label: "All Layouts" }, ...layoutList]);

            const map: Record<string, string[]> = {};
            for (const lay of layoutList) {
                try {
                    const data = await getLayout(module, lay.value, token);
                    const doc = data?.doc ?? data;
                    const layoutJson = doc?.layout_json ?? doc?.layout;
                    const parsed = typeof layoutJson === "string" ? JSON.parse(layoutJson || "{}") : layoutJson || {};
                    const layoutName = doc?.layout_name ?? lay.label ?? lay.value;

                    const fieldNames = new Set<string>();
                    (parsed.sections ?? []).forEach((s: any) => {
                        (s.columns ?? []).forEach((c: any) => {
                            (c.fields ?? []).forEach((f: any) => {
                                const fn = f.fieldname ?? f.name;
                                if (fn) fieldNames.add(fn);
                            });
                        });
                    });

                    fieldNames.forEach((fn) => {
                        if (!map[fn]) map[fn] = [];
                        map[fn].push(layoutName);
                    });
                } catch {
                    // skip failed layout
                }
            }
            setFieldToLayouts(map);
        };

        load();
    }, [module, token, layoutRowsProp, fetchLayouts]);

    useEffect(() => {
        if (module && token) {
            fetchFields();
        }
    }, [fetchFields]);

    const filteredFields = useMemo(() => {
        let list = fields;
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (f) =>
                    getFieldLabel(f).toLowerCase().includes(q) ||
                    getFieldType(f).toLowerCase().includes(q)
            );
        }
        if (layoutFilter && layoutFilter !== "all") {
            const selectedLayoutName = layouts.find((l) => l.value === layoutFilter)?.label ?? layoutFilter;
            list = list.filter((f) => {
                const fieldName = f.fieldname ?? f.name;
                const rawLayoutNames = f.layout_names;
                const layoutNamesFromField = Array.isArray(rawLayoutNames)
                    ? rawLayoutNames
                    : typeof rawLayoutNames === "string"
                        ? (rawLayoutNames || "").split(",").map((s: string) => s.trim()).filter(Boolean)
                        : [];
                const layoutList = layoutNamesFromField.length > 0 ? layoutNamesFromField : (fieldToLayouts[fieldName] ?? []);
                return layoutList.includes(selectedLayoutName);
            });
        }
        return list;
    }, [fields, searchQuery, layoutFilter, layouts, fieldToLayouts]);

    const layoutOptions = useMemo(
        () => layouts.filter((l) => l.value !== "all"),
        [layouts]
    );

    const handleCreateAndEditFields = () => {
        setSelectedLayoutId("");
        setOpenLayoutDialog(true);
    };

    const handleLayoutDialogContinue = () => {
        if (!selectedLayoutId) return;
        setOpenLayoutDialog(false);
        router.push(
            `/setup/customization/modules/${encodeURIComponent(module)}/layouts/edit/${encodeURIComponent(selectedLayoutId)}`
        );
    };

    const formatLayoutsCell = (field: any) => {
        const fieldName = field.fieldname ?? field.name;
        // Prefer layout_names from field when present (string or array)
        const rawLayoutNames = field.layout_names;
        const layoutNamesFromField = Array.isArray(rawLayoutNames)
            ? rawLayoutNames
            : typeof rawLayoutNames === "string"
                ? (rawLayoutNames || "").split(",").map((s: string) => s.trim()).filter(Boolean)
                : [];
        const layoutNames =
            layoutNamesFromField.length > 0 ? layoutNamesFromField : (fieldToLayouts[fieldName] ?? []);
        if (layoutNames.length === 0) return "—";

        const moduleName = module;
        const layoutUrl = `/setup/customization/modules/${encodeURIComponent(moduleName)}`;

        if (layoutNames.length <= 3) {
            return layoutNames.map((name, i) => (
                <React.Fragment key={String(name) + i}>
                    {i > 0 && (i === layoutNames.length - 1 ? " and " : ", ")}
                    <Link href={layoutUrl} style={{ color: "var(--mui-palette-primary-main)" }}>
                        {name}
                    </Link>
                </React.Fragment>
            ));
        }
        const first = layoutNames.slice(0, 2);
        const rest = layoutNames.length - 2;
        return (
            <>
                {first.map((name, i) => (
                    <React.Fragment key={String(name) + i}>
                        {i > 0 && ", "}
                        <Link href={layoutUrl} style={{ color: "var(--mui-palette-primary-main)" }}>
                            {name}
                        </Link>
                    </React.Fragment>
                ))}
                {" and "}
                <Link href={layoutUrl} style={{ color: "var(--mui-palette-primary-main)" }}>
                    {rest} More
                </Link>
            </>
        );
    };

    const headTh = `px-4 py-3 text-[12.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#71717A]" : "text-slate-500"}`;

    return (
        <div>
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="flex-1 relative min-w-[160px]">
                    <MagnifyingGlass size={13} weight="duotone" color="#94A3B8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Fields or Data Types"
                        className={`w-full pl-8 pr-3 py-2 text-[13px] border rounded-lg focus:outline-none focus:border-[#1D4ED8] ${isDark ? "bg-[#18181B] border-[#3F3F46] text-[#D4D4D8] placeholder:text-[#71717A]" : "bg-white border-[#E3ECFC] text-slate-700 placeholder:text-slate-400"}`}
                    />
                </div>
                <div className="relative">
                    <select
                        value={layoutFilter}
                        onChange={(e) => setLayoutFilter(e.target.value)}
                        className={`appearance-none pl-3 pr-8 py-2 text-[13px] border rounded-lg focus:outline-none focus:border-[#1D4ED8] cursor-pointer ${isDark ? "bg-[#18181B] border-[#3F3F46] text-[#D4D4D8]" : "bg-white border-[#E3ECFC] text-slate-700"}`}
                    >
                        {layouts.map((l) => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                    </select>
                    <CaretDown size={10} weight="bold" color="#94A3B8" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreateAndEditFields}
                    sx={{ bgcolor: "#1D4ED8", color: "white", borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: "0.75rem", px: 2, py: 0.9, whiteSpace: "nowrap", boxShadow: "0 1px 6px #1D4ED833", "&:hover": { bgcolor: "#2563EB" } }}
                >
                    Create and Edit Fields
                </Button>
            </div>

            {/* Table */}
            <div className={`border rounded-xl overflow-hidden ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className={isDark ? "bg-[#111113] border-b border-[#27272A]" : "bg-[#f9fbff] border-b border-[#E3ECFC]"}>
                            <th className={headTh}>Fields</th>
                            <th className={headTh}>Data Type</th>
                            <th className={headTh}>Custom Field</th>
                            <th className={headTh}>Layouts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-10 text-center">
                                    <CircularProgress size={24} />
                                </td>
                            </tr>
                        ) : filteredFields.length === 0 ? (
                            <tr>
                                <td colSpan={4} className={`px-4 py-10 text-center text-[15px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>
                                    No fields found.
                                </td>
                            </tr>
                        ) : (
                            filteredFields.map((field) => {
                                const id = field.fieldname ?? field.name ?? Math.random();
                                const isCustom = !field.is_core && !field.core;
                                return (
                                    <tr
                                        key={id}
                                        className={`border-b last:border-0 transition-colors ${isDark ? "border-[#18181B] hover:bg-[#111113]" : "border-[#EFF6FF] hover:bg-[#fafcff]"}`}
                                    >
                                        <td className={`px-4 py-3 text-[14px] font-medium ${isDark ? "text-[#D4D4D8]" : "text-slate-700"}`}>
                                            {getFieldLabel(field)}
                                        </td>
                                        <td className={`px-4 py-3 text-[14px] ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>
                                            {getFieldType(field)}
                                        </td>
                                        <td className={`px-4 py-3 text-[14px] ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
                                            {isCustom ? "Yes" : ""}
                                        </td>
                                        <td className="px-4 py-3 text-[14px] font-semibold text-[#1D4ED8]">
                                            {formatLayoutsCell(field)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <Dialog
                open={openLayoutDialog}
                onClose={() => setOpenLayoutDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600 }}>
                    Create and Edit Fields in Layout Editor
                </DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }} size="medium">
                        <InputLabel id="select-layout-label">Select Layout</InputLabel>
                        <Select
                            labelId="select-layout-label"
                            id="select-layout"
                            value={selectedLayoutId}
                            label="Select Layout"
                            onChange={(e) => setSelectedLayoutId(e.target.value)}
                            displayEmpty
                            renderValue={(v) => (v ? layoutOptions.find((l) => l.value === v)?.label ?? v : "None")}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {layoutOptions.map((l) => (
                                <MenuItem key={l.value} value={l.value}>
                                    {l.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenLayoutDialog(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleLayoutDialogContinue}
                        variant="contained"
                        color="primary"
                        disabled={!selectedLayoutId}
                    >
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default FieldsListTab;
