"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Tabs,
    Tab,
    Typography,
    InputAdornment,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Menu,
    MenuItem,
    Divider,
    Switch,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CloseIcon from "@mui/icons-material/Close";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "@/components/ToastNotificationNew";
import CreateLayoutDialog from "./CreateLayoutDialog";
import LayoutPermissionDialog from "./LayoutPermissionDialog";
import FieldsManager from "./FieldsManager";
import LeadConversionMappingPanel, {
    type LeadConversionMappingSavePayload,
    type LeadLayoutPickerConfig,
} from "./LeadConversionMappingPanel";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { updateResource, deleteClient } from "@/services/api/common-erpnext-api/create-edit-api";
import { getLayout, saveLayout } from "@/services/api/crm/crm-api";
import { deleteLinkedComponentStageProbabilityForLayout } from "@/services/api/general_apis/layout-api";
import { CONSTANTS } from "@/services/config/app-config";
import axios from "axios";
import Link from "@/components/Link";
import {
    moduleSettingsLayoutCreatePath,
    moduleSettingsLayoutEditPath,
} from "@/app/settings/utils/moduleSettingsRoutes";

interface LayoutListingProps {
    /** Optional SDL Module Map name to filter layouts by module */
    moduleFilterName?: string;
    /** When true, the grid toolbar heading is hidden (e.g. when embedded in module tabs) */
    hideHeading?: boolean;
    /** Optional initial tab (layouts, fields, etc.) - also reads from ?tab= URL param */
    initialTab?: string;
    /** `/settings?tab=customization&subtab=…` — use `moduleTab` instead of `tab` for layouts/fields */
    embedInSettings?: boolean;
}

function getRowVal(row: any, field: string) {
    if (!row) return undefined;
    return row[field] ?? row[`SDL Layout.${field}`];
}

function pickDefaultLeadLayoutRow(rows: any[]): any | null {
    if (!rows?.length) return null;
    const def = rows.find((r) => {
        const v = getRowVal(r, "is_default");
        return v === 1 || v === true || v === "1";
    });
    return def ?? rows[0];
}

const LAYOUT_DOCTYPE = "SDL Layout";

function LayoutStatusSwitchCell({
    row,
    token,
    onSuccess,
    disabled: disabledProp,
}: {
    row: any;
    token: string;
    onSuccess: () => void;
    disabled?: boolean;
}) {
    const isCore = !!getRowVal(row, "is_core");
    const disabled = disabledProp ?? isCore;
    const rawStatus = getRowVal(row, "status");
    const checked = rawStatus === 1 || rawStatus === "1" || rawStatus === true;
    const [loading, setLoading] = useState(false);
    const [localChecked, setLocalChecked] = useState(checked);

    useEffect(() => {
        setLocalChecked(checked);
    }, [checked]);

    const handleChange = useCallback(
        async (_: React.ChangeEvent<HTMLInputElement>, newChecked: boolean) => {
            const name = getRowVal(row, "name");
            if (!name || !token) return;
            setLoading(true);
            setLocalChecked(newChecked);
            try {
                const result = await updateResource(
                    LAYOUT_DOCTYPE,
                    name,
                    { status: newChecked ? 1 : 0 },
                    token
                );
                if ((result as any)?.success) {
                    showToast("Status updated successfully", "success");
                    onSuccess();
                } else {
                    setLocalChecked(checked);
                    showToast((result as any)?.message || "Failed to update status", "error");
                }
            } catch {
                setLocalChecked(checked);
                showToast("Failed to update status", "error");
            } finally {
                setLoading(false);
            }
        },
        [row, token, checked, onSuccess]
    );

    return (
        <Switch
            checked={localChecked}
            disabled={disabled || loading}
            onChange={handleChange}
            size="small"
            color="success"
        />
    );
}

const LayoutListing: React.FC<LayoutListingProps> = ({
    moduleFilterName,
    hideHeading,
    initialTab: initialTabProp,
    embedInSettings = false,
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabFromUrl = embedInSettings
        ? searchParams?.get("moduleTab")
        : searchParams?.get("tab");
    const showLeadConversionLayoutPicker =
        searchParams?.get("leadConversionPicker") === "1" ||
        searchParams?.get("leadConversionPicker") === "true";
    const module = "SDL Layout";
    const module_name = "Layouts";

    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
            readAccessTokenDataRaw()
        );
        return initialValue || "";
    });

    // Left sidebar: modules from get_modulelisting API
    const [moduleRows, setModuleRows] = useState<any[]>([]);
    /** Start true so we do not treat "modules not loaded yet" as non-Leads and strip ?leadConversion= from the URL. */
    const [modulesLoading, setModulesLoading] = useState(true);
    const [moduleSearch, setModuleSearch] = useState("");
    const [selectedModule, setSelectedModule] = useState<string | null>(
        moduleFilterName ?? null
    );

    const [refreshKey, setRefreshKey] = useState(0);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);
    const [renameRow, setRenameRow] = useState<any>(null);
    const [renameValue, setRenameValue] = useState("");
    const [renameSubmitting, setRenameSubmitting] = useState(false);
    const [permissionOpen, setPermissionOpen] = useState(false);
    const [permissionLayoutName, setPermissionLayoutName] = useState("");
    const [permissionSharedTo, setPermissionSharedTo] = useState<string[]>([]);
    const [permissionModule, setPermissionModule] = useState("");
    const [permissionDocName, setPermissionDocName] = useState("");
    const [permissionLayoutBody, setPermissionLayoutBody] = useState<any>(null);

    // Layout table data
    const [layoutRows, setLayoutRows] = useState<any[]>([]);
    const [layoutsLoading, setLayoutsLoading] = useState(false);
    const [layoutMenuAnchor, setLayoutMenuAnchor] = useState<null | HTMLElement>(null);
    const [layoutMenuRow, setLayoutMenuRow] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteConfirmRow, setDeleteConfirmRow] = useState<any>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [showLeadConversionMapping, setShowLeadConversionMapping] = useState(false);
    const [leadConversionLayoutRow, setLeadConversionLayoutRow] = useState<any | null>(null);

    // Main content tabs - sync with URL ?tab= param
    const [activeTab, setActiveTab] = useState(() => {
        const t = tabFromUrl;
        if (t === "fields") return "fields";
        if (t === "layouts") return "layouts";
        if (initialTabProp === "fields") return "fields";
        return "layouts";
    });

    useEffect(() => {
        if (tabFromUrl === "fields") setActiveTab("fields");
        else if (tabFromUrl === "layouts") setActiveTab("layouts");
    }, [tabFromUrl]);

    /** Migrate old `?tab=lead-conversion` links to Layouts tab + `leadConversion=1`. */
    useEffect(() => {
        if (tabFromUrl !== "lead-conversion") return;
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        if (embedInSettings) {
            params.set("moduleTab", "layouts");
        } else {
            params.set("tab", "layouts");
        }
        params.set("leadConversion", "1");
        router.replace(`${pathname ?? ''}?${params.toString()}`, { scroll: false });
    }, [tabFromUrl, embedInSettings, pathname, router, searchParams]);

    // Load modules from get_modulelisting API
    useEffect(() => {
        const token = userToken?.access_token;
        if (!token) {
            setModulesLoading(false);
            return;
        }

        const load = async () => {
            setModulesLoading(true);
            try {
                const method = "/api/method/sdl_metadata.api.modules.get_modulelisting";
                const url = `${CONSTANTS.API_BASE_URL}${method}`;
                const res = await axios.get(url, {
                    headers: { Authorization: token },
                    timeout: 5000,
                });
                const message = res?.data?.message ?? [];
                const rows = Array.isArray(message) ? message : message?.records ?? [];
                setModuleRows(rows);
                // If we have moduleFilterName and no selection yet, or first load, select it
                if (moduleFilterName && !selectedModule) {
                    setSelectedModule(moduleFilterName);
                } else if (!selectedModule && rows.length > 0) {
                    setSelectedModule(rows[0]?.name ?? null);
                }
            } catch (e) {
                console.error("Failed to load modules", e);
                showToast("Failed to load modules", "error");
            } finally {
                setModulesLoading(false);
            }
        };

        load();
    }, [userToken?.access_token, refreshKey]);

    // Sync selectedModule when moduleFilterName changes (e.g. from URL)
    useEffect(() => {
        if (moduleFilterName) {
            setSelectedModule(moduleFilterName);
        }
    }, [moduleFilterName]);

    const filteredModuleRows = useMemo(() => {
        const term = moduleSearch.trim().toLowerCase();
        if (!term) return moduleRows;
        return moduleRows.filter((row: any) => {
            const displayName = (row.frontend_module || row.name || "").toLowerCase();
            return displayName.includes(term);
        });
    }, [moduleRows, moduleSearch]);

    const selectedModuleDisplayName = useMemo(() => {
        if (!selectedModule) return "";
        const row = moduleRows.find((r: any) => r.name === selectedModule);
        return row?.frontend_module ?? row?.name ?? selectedModule;
    }, [selectedModule, moduleRows]);

    const isLeadsModule = useMemo(() => {
        const row = moduleRows.find((r: any) => r.name === selectedModule);
        const label = String(row?.frontend_module ?? row?.name ?? "").trim().toLowerCase();
        return label === "lead" || label === "leads";
    }, [selectedModule, moduleRows]);

    useEffect(() => {
        const v = searchParams?.get("leadConversion");
        const open = v === "1" || v === "true";
        if (modulesLoading) return;
        if (!isLeadsModule) {
            setShowLeadConversionMapping(false);
            return;
        }
        setShowLeadConversionMapping(open);
        if (open) setActiveTab("layouts");
    }, [searchParams, isLeadsModule, modulesLoading]);

    useEffect(() => {
        if (modulesLoading) return;
        if (isLeadsModule) return;
        if (!searchParams?.get("leadConversion")) return;
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.delete("leadConversion");
        params.delete("leadConversionPicker");
        router.replace(`${pathname ?? ''}?${params.toString()}`, { scroll: false });
    }, [modulesLoading, isLeadsModule, pathname, router, searchParams]);

    useEffect(() => {
        if (!isLeadsModule) {
            setLeadConversionLayoutRow(null);
        }
    }, [isLeadsModule]);

    const handleAddNew = () => {
        setOpenDrawer(true);
    };

    const handleLayoutAssignment = () => {
        showToast("Layout Assignment - coming soon", "default");
    };

    const handleDelete = async (_id: any) => {
        showToast("Delete functionality not implemented yet", "warning");
    };

    const handleEditLayout = useCallback(
        (row: any) => {
            const name = getRowVal(row, "name");
            const moduleVal = getRowVal(row, "module");
            if (!name || !moduleVal) return;
            if (embedInSettings) {
                router.push(moduleSettingsLayoutEditPath(moduleVal, name));
            } else {
                router.push(
                    `/setup/customization/modules/${moduleVal}/layouts/edit/${encodeURIComponent(name)}`
                );
            }
        },
        [embedInSettings, router]
    );

    const handleRenameClick = useCallback((row: any) => {
        const current = getRowVal(row, "layout_name");
        setRenameRow(row);
        setRenameValue(current ?? "");
        setRenameOpen(true);
    }, []);

    const handleRenameClose = useCallback(() => {
        setRenameOpen(false);
        setRenameRow(null);
        setRenameValue("");
    }, []);

    const handleRenameSubmit = useCallback(async () => {
        if (!renameRow || !userToken?.access_token) return;
        const name = getRowVal(renameRow, "name");
        if (!name) return;
        const newValue = renameValue.trim();
        if (!newValue) {
            showToast("Layout Name is required", "warning");
            return;
        }
        setRenameSubmitting(true);
        try {
            const result = await updateResource(
                "SDL Layout",
                name,
                { layout_name: newValue },
                userToken.access_token
            );
            if ((result as any)?.success) {
                showToast("Layout renamed successfully", "success");
                setRefreshKey((k) => k + 1);
                handleRenameClose();
            } else {
                showToast((result as any)?.message || "Failed to rename layout", "error");
            }
        } catch {
            showToast("Failed to rename layout", "error");
        } finally {
            setRenameSubmitting(false);
        }
    }, [renameRow, renameValue, userToken?.access_token, handleRenameClose]);

    const handleCloneClick = useCallback(
        (row: any) => {
            const name = getRowVal(row, "name");
            const moduleVal = getRowVal(row, "module");
            if (!name || !moduleVal) return;
            if (embedInSettings) {
                router.push(moduleSettingsLayoutCreatePath(moduleVal, name));
            } else {
                router.push(
                    `/setup/customization/modules/${moduleVal}/layouts/create?clone_from=${encodeURIComponent(name)}`
                );
            }
        },
        [embedInSettings, router]
    );

    const handleLayoutPermissionClick = useCallback(
        async (row: any) => {
            const moduleVal = getRowVal(row, "module");
            const name = getRowVal(row, "name");
            const layoutName = getRowVal(row, "layout_name");
            if (!name || !moduleVal || !userToken?.access_token) {
                showToast("Missing layout or token", "warning");
                return;
            }
            try {
                const data = await getLayout(moduleVal, name, userToken.access_token);
                const doc = data?.doc ?? data;
                if (!doc) {
                    showToast("Failed to load layout", "error");
                    return;
                }
                const rawSharedTo = doc.shared_to ?? doc.shared_to_text;
                const sharedToArray = Array.isArray(rawSharedTo)
                    ? rawSharedTo
                    : rawSharedTo && typeof rawSharedTo === "object"
                        ? Object.keys(rawSharedTo)
                        : [];
                let layoutContent = doc.layout_json ?? doc.layout;
                if (typeof layoutContent === "string") {
                    try {
                        layoutContent = JSON.parse(layoutContent);
                    } catch {
                        layoutContent = { sections: [] };
                    }
                }
                if (!layoutContent || !layoutContent.sections) {
                    layoutContent = { sections: [] };
                }
                setPermissionLayoutName(layoutName ?? name ?? "Untitled");
                setPermissionSharedTo(sharedToArray);
                setPermissionModule(moduleVal);
                setPermissionDocName(name);
                setPermissionLayoutBody(layoutContent);
                setPermissionOpen(true);
            } catch {
                showToast("Failed to load layout permissions", "error");
            }
        },
        [userToken?.access_token]
    );

    const handlePermissionClose = useCallback(() => {
        setPermissionOpen(false);
        setPermissionLayoutName("");
        setPermissionSharedTo([]);
        setPermissionModule("");
        setPermissionDocName("");
        setPermissionLayoutBody(null);
    }, []);

    const handlePermissionSave = useCallback(
        async (sharedTo: string[]) => {
            if (!userToken?.access_token || !permissionModule || !permissionDocName) return;
            try {
                await (saveLayout as any)(
                    permissionModule,
                    permissionDocName,
                    permissionLayoutBody ?? { sections: [] },
                    userToken.access_token,
                    false,
                    permissionLayoutName,
                    sharedTo
                );
                showToast("Layout permissions updated", "success");
                setRefreshKey((k) => k + 1);
                handlePermissionClose();
            } catch {
                showToast("Failed to update layout permissions", "error");
            }
        },
        [
            userToken?.access_token,
            permissionModule,
            permissionDocName,
            permissionLayoutBody,
            permissionLayoutName,
            handlePermissionClose,
        ]
    );

    const colFields = [
        { doctype: module, field: "name", hidden: "True" },
        { doctype: module, field: "module", hidden: "True" },
        { doctype: module, field: "layout_name", headerName: "Layout Name", hidden: "False" },
        { doctype: module, field: "shared_to_text", headerName: "Shared To", hidden: "False" },
        { doctype: "SDL Module Map", field: "frontend_module", headerName: "Module", hidden: "True" },
        { doctype: module, field: "is_default", headerName: "Default", hidden: "False" },
        { doctype: module, field: "is_core", headerName: "Is Core", hidden: "True" },
        { doctype: module, field: "creation", headerName: "Created On", hidden: "False" },
        { doctype: module, field: "modified", headerName: "Modified On", hidden: "False" },
        { doctype: module, field: "status", headerName: "Status", hidden: "False" },
    ];

    const relatedDocs = ["SDL Module Map"];
    const include_contact = "False";
    const Joinquery =
        "INNER JOIN `tabSDL Module Map` ON `tabSDL Layout`.module = `tabSDL Module Map`.name";

    const effectiveModuleFilter = selectedModule ?? moduleFilterName;

    // Fetch layout rows when module is selected
    useEffect(() => {
        const token = userToken?.access_token;
        if (!token || !effectiveModuleFilter) {
            setLayoutRows([]);
            return;
        }

        const load = async () => {
            setLayoutsLoading(true);
            try {
                const whereCondition = ` AND \`tabSDL Module Map\`.name = '${effectiveModuleFilter}'`;
                const result = await fetchRawDataGridListing(
                    { page: 0, pageSize: 1000, filters: { items: [], quickFilterValues: [] }, sort: [] },
                    token,
                    colFields,
                    module,
                    relatedDocs,
                    include_contact,
                    "",
                    [],
                    Joinquery,
                    whereCondition,
                    userToken?.role_profile ?? "",
                    userToken?.username ?? ""
                );
                setLayoutRows(result?.data ?? []);
            } catch (e) {
                console.error("Failed to load layouts", e);
                setLayoutRows([]);
            } finally {
                setLayoutsLoading(false);
            }
        };

        load();
    }, [userToken?.access_token, effectiveModuleFilter, refreshKey]);

    useEffect(() => {
        if (!showLeadConversionMapping || !isLeadsModule || layoutsLoading) return;
        if (layoutRows.length === 0) return;
        const docName = leadConversionLayoutRow
            ? getRowVal(leadConversionLayoutRow, "name")
            : null;
        const stillExists =
            docName &&
            layoutRows.some((r) => getRowVal(r, "name") === docName);
        if (!stillExists) {
            setLeadConversionLayoutRow(pickDefaultLeadLayoutRow(layoutRows));
        }
    }, [
        showLeadConversionMapping,
        isLeadsModule,
        layoutRows,
        layoutsLoading,
        leadConversionLayoutRow,
    ]);

    const handleLayoutMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
        setLayoutMenuAnchor(event.currentTarget);
        setLayoutMenuRow(row);
    };

    const handleLayoutMenuClose = () => {
        setLayoutMenuAnchor(null);
        setLayoutMenuRow(null);
    };

    const handleLayoutMenuEdit = () => {
        if (layoutMenuRow) handleEditLayout(layoutMenuRow);
        handleLayoutMenuClose();
    };

    const handleLayoutMenuRename = () => {
        if (layoutMenuRow) handleRenameClick(layoutMenuRow);
        handleLayoutMenuClose();
    };

    const handleLayoutMenuClone = () => {
        if (layoutMenuRow) handleCloneClick(layoutMenuRow);
        handleLayoutMenuClose();
    };

    const handleLayoutMenuPermission = async () => {
        if (layoutMenuRow) await handleLayoutPermissionClick(layoutMenuRow);
        handleLayoutMenuClose();
    };

    const handleMainTabChange = useCallback(
        (_: React.SyntheticEvent, value: string) => {
            setActiveTab(value);
            const params = new URLSearchParams(searchParams?.toString() ?? "");
            if (value === "layouts") {
                if (embedInSettings) {
                    params.set("moduleTab", "layouts");
                } else {
                    params.set("tab", "layouts");
                }
            } else if (value === "fields") {
                if (embedInSettings) {
                    params.set("moduleTab", "fields");
                } else {
                    params.set("tab", "fields");
                }
                params.delete("leadConversion");
                params.delete("leadConversionPicker");
                setShowLeadConversionMapping(false);
                setLeadConversionLayoutRow(null);
            }
            router.replace(`${pathname ?? ''}?${params.toString()}`, { scroll: false });
        },
        [embedInSettings, pathname, router, searchParams]
    );

    const handleLeadConversionMapping = useCallback(() => {
        if (!layoutMenuRow) {
            handleLayoutMenuClose();
            return;
        }
        setLeadConversionLayoutRow(layoutMenuRow);
        setShowLeadConversionMapping(true);
        setActiveTab("layouts");
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        if (embedInSettings) {
            params.set("moduleTab", "layouts");
        } else {
            params.set("tab", "layouts");
        }
        params.set("leadConversion", "1");
        params.delete("leadConversionPicker");
        router.replace(`${pathname ?? ''}?${params.toString()}`, { scroll: false });
        handleLayoutMenuClose();
    }, [embedInSettings, layoutMenuRow, pathname, router, searchParams]);

    const handleLeadConversionCancel = useCallback(() => {
        setShowLeadConversionMapping(false);
        setLeadConversionLayoutRow(null);
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.delete("leadConversion");
        params.delete("leadConversionPicker");
        if (embedInSettings) {
            params.set("moduleTab", "layouts");
        } else {
            params.set("tab", "layouts");
        }
        router.replace(`${pathname ?? ''}?${params.toString()}`, { scroll: false });
    }, [embedInSettings, pathname, router, searchParams]);

    const handleLeadConversionLayoutChange = useCallback((layoutDocName: string) => {
        const row = layoutRows.find((r) => getRowVal(r, "name") === layoutDocName);
        if (row) setLeadConversionLayoutRow(row);
    }, [layoutRows]);

    const leadLayoutPickerConfig: LeadLayoutPickerConfig | undefined = useMemo(() => {
        if (!showLeadConversionLayoutPicker || !layoutRows.length) return undefined;
        return {
            options: layoutRows
                .map((row: any) => {
                    const value = getRowVal(row, "name") ?? "";
                    const label = getRowVal(row, "layout_name") ?? value ?? "";
                    return { value, label };
                })
                .filter((o) => o.value),
            onChange: handleLeadConversionLayoutChange,
        };
    }, [
        showLeadConversionLayoutPicker,
        layoutRows,
        handleLeadConversionLayoutChange,
    ]);

    const handleLeadConversionSave = useCallback(async (_payload: LeadConversionMappingSavePayload) => {
        setRefreshKey((prev) => prev + 1);
    }, []);

    const handleLayoutMenuDelete = () => {
        if (layoutMenuRow) {
            setDeleteConfirmRow(layoutMenuRow);
            setDeleteConfirmOpen(true);
        }
        handleLayoutMenuClose();
    };

    const handleDeleteConfirmClose = () => {
        if (!deleteSubmitting) {
            setDeleteConfirmOpen(false);
            setDeleteConfirmRow(null);
        }
    };

    const handleDeleteConfirm = useCallback(async () => {
        const row = deleteConfirmRow;
        const docName = row ? getRowVal(row, "name") : null;
        const layoutLabel = row ? getRowVal(row, "layout_name") : null;
        const moduleName = row ? getRowVal(row, "module") : null;
        const token = userToken?.access_token;
        if (!docName || !token) return;
        setDeleteSubmitting(true);
        try {
            const cascade = await deleteLinkedComponentStageProbabilityForLayout(
                docName,
                layoutLabel,
                moduleName,
                token
            );
            if (cascade.error) {
                showToast(cascade.error, "error");
                return;
            }
            const result = await deleteClient(LAYOUT_DOCTYPE, docName, token);
            if ((result as any)?.success) {
                showToast("Layout deleted successfully", "success");
                setRefreshKey((prev) => prev + 1);
                handleDeleteConfirmClose();
            } else {
                showToast((result as any)?.message || "Failed to delete layout", "error");
            }
        } catch {
            showToast("Failed to delete layout", "error");
        } finally {
            setDeleteSubmitting(false);
        }
    }, [deleteConfirmRow, userToken?.access_token]);

    return (
        <Box sx={{ display: "flex", minHeight: "calc(90vh - 120px)", bgcolor: "background.paper" }}>
            {/* Left sidebar - Modules */}
            <Box
                sx={{
                    width: 280,
                    minWidth: 280,
                    borderRight: 1,
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "background.paper",
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        borderBottom: 1,
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        bgcolor: "background.paper",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Link
                            href={
                                embedInSettings
                                    ? `/settings?tab=customization&subtab=modules`
                                    : "/setup/customization/modules"
                            }
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                color: "inherit",
                                textDecoration: "none",
                            }}
                        >
                            <ArrowBackIcon fontSize="small" />
                            {!searchExpanded && (
                                <Typography variant="body2" fontWeight={500} color="text.secondary">
                                    Modules
                                </Typography>
                            )}
                        </Link>
                        <Box sx={{ ml: searchExpanded ? 0 : "auto", display: "flex", alignItems: "center", gap: 0.5, flex: searchExpanded ? 1 : "none" }}>
                            {searchExpanded ? (
                                <>
                                    <TextField
                                        size="small"
                                        placeholder="Search"
                                        value={moduleSearch}
                                        onChange={(e) => setModuleSearch(e.target.value)}
                                        autoFocus
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" sx={{ color: "action.disabled" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ minWidth: 0 }}
                                    />
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setSearchExpanded(false);
                                            setModuleSearch("");
                                        }}
                                        aria-label="Close search"
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </>
                            ) : (
                                <IconButton
                                    size="small"
                                    onClick={() => setSearchExpanded(true)}
                                    aria-label="Search modules"
                                >
                                    <SearchIcon fontSize="small" sx={{ color: "action.active" }} />
                                </IconButton>
                            )}
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ p: 1, flex: 1, overflow: "auto", bgcolor: "background.paper" }}>
                    {modulesLoading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        filteredModuleRows.map((row: any) => {
                            const displayName = row.frontend_module ?? row.name ?? "";
                            const isSelected = selectedModule === row.name;
                            return (
                                <Box
                                    key={row.name}
                                    onClick={() => setSelectedModule(row.name)}
                                    sx={{
                                        px: 2.5,
                                        py: 1.75,
                                        mb: 0.75,
                                        borderRadius: 999,
                                        cursor: "pointer",
                                        background: isSelected
                                            ? "linear-gradient(270deg, var(--mui-palette-primary-main), rgb(139, 187, 247) 100%)"
                                            : "transparent",
                                        color: isSelected ? "primary.contrastText" : "text.primary",
                                        "&:hover": {
                                            background: isSelected
                                                ? "linear-gradient(90deg, #1558b0 0%, #3b8bd9 100%)"
                                                : "action.hover",
                                        },
                                        transition: "background 0.2s ease, color 0.2s ease",
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        fontSize={15}
                                        fontWeight={isSelected ? 600 : 500}
                                        sx={{ color: isSelected ? "primary.contrastText" : "text.primary", pl: 1 }}
                                    >
                                        {displayName}
                                    </Typography>
                                </Box>
                            );
                        })
                    )}
                </Box>
            </Box>

            {/* Main content area */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {selectedModule ? (
                    <>
                        <Box sx={{ px: 3, pt: 3, pb: 1 }}>
                            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
                                {selectedModuleDisplayName}
                            </Typography>
                            <Tabs
                                value={activeTab}
                                onChange={handleMainTabChange}
                                sx={{
                                    minHeight: 48,
                                    bgcolor: "transparent !important",
                                    borderBottom: 1,
                                    borderColor: "divider",
                                    mb: 2,
                                    "& .MuiTabs-flexContainer": { gap: 1 },
                                    "& .MuiTab-root": {
                                        textTransform: "none",
                                        minHeight: 48,
                                        backgroundColor: "transparent !important",
                                        boxShadow: "none !important",
                                    },
                                    "& .MuiTab-root:hover": {
                                        backgroundColor: "transparent !important",
                                        color: "#333333 !important",
                                    },
                                    "& .MuiTab-root.Mui-selected": {
                                        backgroundColor: "transparent !important",
                                        borderColor: "#C4BCE0 !important",
                                        color: "#333333 !important",
                                        fontWeight: 600,
                                    },
                                    "& .MuiTab-root.Mui-selected:hover": {
                                        backgroundColor: "transparent !important",
                                        color: "#333333 !important",
                                    },
                                    "& .MuiTabs-indicator": {
                                        backgroundColor: "primary.main",
                                        height: 3,
                                    },
                                }}
                            >
                                <Tab label="Layouts" value="layouts" />
                                <Tab label="Fields" value="fields" />
                            </Tabs>
                            {activeTab === "layouts" &&
                                !(showLeadConversionMapping && isLeadsModule) && (
                                    <>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mb: 2, p: 2 }}
                                        >
                                            Design your own layouts to fit your business processes, then
                                            assign them to your user accounts based on permission
                                            profiles.
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "flex-end",
                                                gap: 1,
                                                mb: 2,
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                onClick={handleAddNew}
                                                size="medium"
                                            >
                                                Create New Layout
                                            </Button>
                                        </Box>
                                    </>
                                )}
                        </Box>

                        <Box sx={{ flex: 1, overflow: "auto", px: 3, pb: 3 }}>
                            {activeTab === "layouts" &&
                                showLeadConversionMapping &&
                                isLeadsModule && (
                                    <Box sx={{ pb: 3 }}>
                                        {layoutsLoading && (
                                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                                <CircularProgress size={28} />
                                            </Box>
                                        )}
                                        {!layoutsLoading && layoutRows.length === 0 && (
                                            <Typography variant="body2" color="text.secondary">
                                                No layouts found for this module.
                                            </Typography>
                                        )}
                                        {!layoutsLoading &&
                                            layoutRows.length > 0 &&
                                            leadConversionLayoutRow && (
                                                <LeadConversionMappingPanel
                                                    layoutRow={leadConversionLayoutRow}
                                                    moduleRows={moduleRows}
                                                    userToken={userToken}
                                                    onCancel={handleLeadConversionCancel}
                                                    onSave={handleLeadConversionSave}
                                                    leadLayoutPicker={leadLayoutPickerConfig}
                                                />
                                            )}
                                    </Box>
                                )}
                            {activeTab === "layouts" &&
                                !(showLeadConversionMapping && isLeadsModule) && (
                                <TableContainer
                                    component={Paper}
                                    sx={{
                                        mt: 3,
                                        pt: 2,
                                        border: 1,
                                        borderColor: "divider",
                                    }}
                                >
                                    <Table
                                        sx={{
                                            minWidth: 650,
                                            "& thead th": {
                                                fontWeight: 600,
                                                py: 1,
                                            },
                                            "& thead tr": {
                                                borderBottomWidth: 2,
                                                borderBottomStyle: "solid",
                                                borderBottomColor: "divider",
                                            },
                                        }}
                                        aria-label="layouts table"
                                    >
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Name</TableCell>
                                                <TableCell>Shared To</TableCell>
                                                <TableCell>Last Modified</TableCell>
                                                <TableCell align="right">Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {layoutsLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center">
                                                        <CircularProgress size={24} />
                                                    </TableCell>
                                                </TableRow>
                                            ) : layoutRows.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center">
                                                        <Typography variant="body2" color="text.secondary">
                                                            No records found.
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                layoutRows.map((row: any) => {
                                                    const modified = getRowVal(row, "modified");
                                                    const dateStr = modified
                                                        ? new Date(modified).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })
                                                        : "—";
                                                    const layoutName = getRowVal(row, "layout_name");
                                                    const moduleVal = getRowVal(row, "module");
                                                    const docName = getRowVal(row, "name");

                                                    return (
                                                        <TableRow
                                                            key={docName}
                                                            hover
                                                            sx={{
                                                                "&:last-child td, &:last-child th": { border: 0 },
                                                                "&:hover .row-more-icon": { opacity: 1 },
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Box
                                                                    sx={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: 1,
                                                                        pl: 2,
                                                                    }}
                                                                >
                                                                    <Link
                                                                        href={
                                                                            embedInSettings
                                                                                ? moduleSettingsLayoutEditPath(
                                                                                      moduleVal,
                                                                                      docName
                                                                                  )
                                                                                : `/setup/customization/modules/${moduleVal}/layouts/edit/${encodeURIComponent(docName)}`
                                                                        }
                                                                        rel="noopener noreferrer"
                                                                        style={{
                                                                            color: "var(--mui-palette-primary-main)",
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        <Box component="span" sx={{ px: 1 }}>
                                                                            {layoutName ?? docName}
                                                                        </Box>
                                                                    </Link>
                                                                    <IconButton
                                                                        size="small"
                                                                        className="row-more-icon"
                                                                        sx={{
                                                                            p: 0,
                                                                            ml: 2,
                                                                            opacity: 0,
                                                                            transition: "opacity 0.2s ease-in-out",
                                                                            "&:hover": {
                                                                                bgcolor: "action.hover",
                                                                                "& svg": { color: "text.primary" },
                                                                            },
                                                                        }}
                                                                        onClick={(e) => handleLayoutMenuOpen(e, row)}
                                                                    >
                                                                        <MoreHorizIcon
                                                                            sx={{ fontSize: 22, color: "action.disabled" }}
                                                                        />
                                                                    </IconButton>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {getRowVal(row, "shared_to_text") ?? "—"}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                                                    <PersonOutlineIcon
                                                                        sx={{ fontSize: 18, color: "action.disabled" }}
                                                                    />
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {dateStr}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <LayoutStatusSwitchCell
                                                                    row={row}
                                                                    token={userToken?.access_token ?? ""}
                                                                    onSuccess={() => setRefreshKey((k) => k + 1)}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            <Menu
                                anchorEl={layoutMenuAnchor}
                                open={Boolean(layoutMenuAnchor)}
                                onClose={handleLayoutMenuClose}
                            >
                                <MenuItem onClick={handleLayoutMenuRename}>Rename</MenuItem>
                                <MenuItem onClick={handleLayoutMenuEdit}>Edit Layout</MenuItem>
                                <MenuItem onClick={handleLayoutMenuClone}>Clone Layout</MenuItem>
                                {isLeadsModule && (
                                    <>
                                        <Divider />
                                        <MenuItem onClick={handleLayoutMenuPermission}>Layout Permission</MenuItem>
                                        <MenuItem onClick={handleLeadConversionMapping}>
                                            Lead Conversion Mapping
                                        </MenuItem>
                                    </>
                                )}
                                {!isLeadsModule && (
                                    <MenuItem onClick={handleLayoutMenuPermission}>Layout Permission</MenuItem>
                                )}
                                {!getRowVal(layoutMenuRow, "is_core") && (
                                    <MenuItem onClick={handleLayoutMenuDelete} sx={{ color: "error.main" }}>
                                        Delete Layout
                                    </MenuItem>
                                )}
                            </Menu>

                            {activeTab === "fields" && (
                                <FieldsManager module={selectedModule} layoutRows={layoutRows} />
                            )}
                        </Box>
                    </>
                ) : (
                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "text.secondary",
                        }}
                    >
                        {modulesLoading ? (
                            <CircularProgress />
                        ) : (
                            <Typography variant="body2">
                                Select a module from the left to view layouts.
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>

            <CreateLayoutDialog
                open={openDrawer}
                onClose={() => setOpenDrawer(false)}
                onSubmitSuccess={() => setRefreshKey((prev) => prev + 1)}
                selectedModule={selectedModule}
                layoutRows={layoutRows}
                embedInSettings={embedInSettings}
            />
            <Dialog open={renameOpen} onClose={handleRenameClose} fullWidth maxWidth="sm">
                <DialogTitle>Rename Layout</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Layout Name"
                        fullWidth
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        error={!renameValue.trim()}
                        helperText={
                            !renameValue.trim() ? "Layout Name is required" : " "
                        }
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleRenameClose}
                        color="inherit"
                        disabled={renameSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRenameSubmit}
                        variant="contained"
                        color="primary"
                        disabled={renameSubmitting}
                    >
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
            <LayoutPermissionDialog
                open={permissionOpen}
                onClose={handlePermissionClose}
                layoutName={permissionLayoutName}
                initialSharedTo={permissionSharedTo}
                onSave={handlePermissionSave}
            />
            <Dialog open={deleteConfirmOpen} onClose={handleDeleteConfirmClose} maxWidth="xs" fullWidth>
                <DialogTitle>Delete Layout</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this layout? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleDeleteConfirmClose} color="inherit" disabled={deleteSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        color="error"
                        disabled={deleteSubmitting}
                    >
                        {deleteSubmitting ? "Deleting…" : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LayoutListing;
