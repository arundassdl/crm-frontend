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
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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

    return (
        <Box>
            {/* Top control bar */}
            <Box
                sx={{
                    mb: 2,
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 2,
                    pb: 3
                }}
            >
                <TextField
                    placeholder="Search Fields or Data Types"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 280 }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="layout-filter-label">Layout</InputLabel>
                    <Select
                        labelId="layout-filter-label"
                        value={layoutFilter}
                        label="Layout"
                        onChange={(e) => setLayoutFilter(e.target.value)}
                    >
                        {layouts.map((l) => (
                            <MenuItem key={l.value} value={l.value}>
                                {l.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" onClick={handleCreateAndEditFields}>
                    Create and Edit Fields
                </Button>
            </Box>

            {/* Table */}
            <TableContainer
                component={Paper}
                sx={{
                    mt: 2,
                    border: 1,
                    borderColor: "divider",
                }}
            >
                <Table
                    sx={{
                        minWidth: 650,
                        "& thead th": { fontWeight: 600, py: 1 },
                        "& thead tr": {
                            borderBottomWidth: 2,
                            borderBottomStyle: "solid",
                            borderBottomColor: "divider",
                        },
                    }}
                    aria-label="fields table"
                >
                    <TableHead>
                        <TableRow>
                            <TableCell>Fields</TableCell>
                            <TableCell>Data Type</TableCell>
                            <TableCell align="center">Custom Field</TableCell>
                            <TableCell>Layouts</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <CircularProgress size={24} />
                                </TableCell>
                            </TableRow>
                        ) : filteredFields.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No records found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredFields.map((field) => {
                                const id = field.fieldname ?? field.name ?? Math.random();
                                const isCustom = !field.is_core && !field.core;
                                return (
                                    <TableRow
                                        key={id}
                                        hover
                                        sx={{
                                            "&:last-child td, &:last-child th": { border: 0 },
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2">
                                                {getFieldLabel(field)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {getFieldType(field)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            {isCustom ? (
                                                <CheckCircleIcon
                                                    sx={{ color: "green", fontSize: 20 }}
                                                    titleAccess="Yes"
                                                />
                                            ) : null}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" component="span">
                                                {formatLayoutsCell(field)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

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
        </Box>
    );
};

export default FieldsListTab;
