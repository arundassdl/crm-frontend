"use client";
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'
import { normalizeModuleListingRows } from '@/utils/normalizeModuleListingRows'

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
    Tooltip,
    ListItemIcon,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CloseIcon from "@mui/icons-material/Close";
import FolderIcon from "@mui/icons-material/Folder";
import { getMuiIconByName } from "@/utils/muiIconByName";
import {
    ArrowLeft,
    MagnifyingGlass,
    House,
    CaretRight,
    User as UserIcon,
    DotsThreeVertical,
    PencilSimple,
    Rows,
    CopySimple,
    ShieldCheck,
    ArrowsLeftRight,
    Trash,
    X,
} from "@phosphor-icons/react";
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

/** Icon-chip accent colours, cycled per module (mirrors the reference MODULE_DEFS palette). */
const ICON_PALETTE = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#06B6D4"];

function getModuleIconComponent(iconName?: string) {
    return getMuiIconByName(iconName, FolderIcon);
}

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

    const isDisabled = disabled || loading;
    return (
        <button
            type="button"
            disabled={isDisabled}
            onClick={() => handleChange(undefined as any, !localChecked)}
            aria-label="Toggle layout status"
            className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                localChecked ? "bg-[#10B981]" : "bg-slate-200 dark:bg-[#3F3F46]"
            } ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <span
                className={`inline-block w-[14px] h-[14px] rounded-full bg-white shadow transform transition-transform duration-200 absolute top-[3px] ${
                    localChecked ? "translate-x-[19px]" : "translate-x-[3px]"
                }`}
            />
        </button>
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
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const searchParams = useSearchParams();
    const tabFromUrl = embedInSettings
        ? searchParams?.get("moduleTab")
        : searchParams?.get("tab");
    const showLeadConversionLayoutPicker =
        searchParams?.get("leadConversionPicker") === "1" ||
        searchParams?.get("leadConversionPicker") === "true";
    const module = "SDL Layout";
    const module_name = "Layouts";

    const [userToken, setUserToken] = useState<any>(() => readAccessTokenDataParsed() || "");

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
                const rows = normalizeModuleListingRows(message);
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
        <div className={`flex h-full min-h-0 overflow-hidden ${isDark ? "bg-[#0A0A0A]" : "bg-white"}`} style={{ minHeight: "calc(90vh - 120px)" }}>
            {/* Sub-sidebar - Modules */}
            <div className={`w-[220px] flex-shrink-0 border-r flex flex-col ${isDark ? "border-[#27272A] bg-[#111113]" : "border-[#E3ECFC] bg-[#f9fbff]"}`}>
                <div className={`flex items-center justify-between gap-1 px-3 py-3 border-b ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
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
                        <>
                            <Link
                                href={
                                    embedInSettings
                                        ? `/settings?tab=customization&subtab=modules`
                                        : "/setup/customization/modules"
                                }
                                style={{ textDecoration: "none" }}
                            >
                                <span className={`flex items-center gap-1 text-[13px] font-semibold transition-colors ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>
                                    <ArrowLeft size={13} weight="bold" />
                                    Modules
                                </span>
                            </Link>
                            <IconButton
                                size="small"
                                onClick={() => setSearchExpanded(true)}
                                aria-label="Search modules"
                                sx={{ p: 0.4, color: "#94A3B8", "&:hover": { color: "#1D4ED8", bgcolor: isDark ? "#27272A" : "#EFF6FF" }, borderRadius: "6px" }}
                            >
                                <MagnifyingGlass size={13} weight="duotone" />
                            </IconButton>
                        </>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                    {modulesLoading ? (
                        <div className="flex justify-center py-6">
                            <CircularProgress size={22} />
                        </div>
                    ) : (
                        filteredModuleRows.map((row: any, idx: number) => {
                            const displayName = row.frontend_module ?? row.name ?? "";
                            const isSelected = selectedModule === row.name;
                            const color = ICON_PALETTE[idx % ICON_PALETTE.length];
                            const ModIcon = getModuleIconComponent(row.menu_icon);
                            return (
                                <button
                                    key={row.name}
                                    onClick={() => setSelectedModule(row.name)}
                                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-[15px] font-medium transition-colors min-h-[40px] ${
                                        isSelected
                                            ? "bg-[#1D4ED8] text-white"
                                            : isDark
                                                ? "text-[#D4D4D8] hover:bg-[#27272A]"
                                                : "text-slate-600 hover:bg-[#EFF6FF]"
                                    }`}
                                >
                                    <ModIcon sx={{ fontSize: 15, color: isSelected ? "#fff" : color }} />
                                    <span className="truncate">{displayName}</span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main content area */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {selectedModule ? (
                    <>
                        <div>
                            {/* Breadcrumb */}
                            <div className={`px-6 pt-5 pb-1 flex items-center gap-1.5 text-[12px] ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
                                <House size={11} weight="duotone" />
                                {["Setup", "Customization", "Modules"].map((crumb) => (
                                    <span key={crumb} className="flex items-center gap-1.5">
                                        <CaretRight size={9} weight="bold" />
                                        <span className="hover:text-[#1D4ED8] cursor-pointer transition-colors">{crumb}</span>
                                    </span>
                                ))}
                                <span className="flex items-center gap-1.5">
                                    <CaretRight size={9} weight="bold" />
                                    <span className={`font-semibold ${isDark ? "text-[#D4D4D8]" : "text-slate-600"}`}>{selectedModuleDisplayName}</span>
                                </span>
                            </div>

                            {/* Title */}
                            <div className="px-6 pt-2 pb-3">
                                <div className={`text-[22px] font-extrabold ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>{selectedModuleDisplayName}</div>
                            </div>

                            {/* Tabs */}
                            <div className={`px-6 border-b flex items-center gap-1 ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
                                {(["layouts", "fields"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => handleMainTabChange(undefined as any, t)}
                                        className={`px-4 py-2.5 text-[15px] font-semibold capitalize transition-all border-b-2 -mb-px ${
                                            activeTab === t
                                                ? "border-[#1D4ED8] text-[#1D4ED8]"
                                                : isDark
                                                    ? "border-transparent text-[#71717A] hover:text-[#A1A1AA]"
                                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                        }`}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {activeTab === "layouts" &&
                                !(showLeadConversionMapping && isLeadsModule) && (
                                    <div className="px-6 pt-5">
                                        <div className="text-[14px] text-[#1D4ED8] mb-4 leading-relaxed">
                                            Design your own layouts to fit your business processes, then assign them to your user accounts based on permission profiles.
                                        </div>
                                        <div className="flex justify-end mb-4">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={handleAddNew}
                                                sx={{ bgcolor: isDark ? "#27272A" : "#1D4ED8", color: isDark ? "#F4F4F5" : "white", borderRadius: "8px", textTransform: "none", fontWeight: 700, fontSize: "0.75rem", px: 2, py: 0.8, boxShadow: isDark ? "none" : "0 1px 6px #1D4ED833", "&:hover": { bgcolor: isDark ? "#3F3F46" : "#2563EB" } }}
                                            >
                                                Create New Layout
                                            </Button>
                                        </div>
                                    </div>
                                )}
                        </div>

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
                                <div className={`mt-3 border rounded-xl overflow-hidden ${isDark ? "border-[#27272A]" : "border-[#E3ECFC]"}`}>
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className={isDark ? "bg-[#111113] border-b border-[#27272A]" : "bg-[#f9fbff] border-b border-[#E3ECFC]"}>
                                                <th className={`px-4 py-3 text-[12.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>Name</th>
                                                <th className={`px-4 py-3 text-[12.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>Shared To</th>
                                                <th className={`px-4 py-3 text-[12.5px] font-bold uppercase tracking-wider ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>Last Modified</th>
                                                <th className={`px-4 py-3 text-[12.5px] font-bold uppercase tracking-wider text-right ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {layoutsLoading ? (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center">
                                                        <CircularProgress size={24} />
                                                    </td>
                                                </tr>
                                            ) : layoutRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className={`px-4 py-8 text-center text-[15px] ${isDark ? "text-[#3F3F46]" : "text-slate-300"}`}>
                                                        No records found.
                                                    </td>
                                                </tr>
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
                                                        <tr
                                                            key={docName}
                                                            className={`border-b last:border-0 transition-colors ${isDark ? "border-[#18181B] hover:bg-[#111113]" : "border-[#EFF6FF] hover:bg-[#fafcff]"}`}
                                                        >
                                                            <td className="px-4 py-3">
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
                                                                    style={{ textDecoration: "none" }}
                                                                >
                                                                    <span className={`text-[15px] font-semibold hover:underline ${isDark ? "text-[#60A5FA]" : "text-[#1D4ED8]"}`}>
                                                                        {layoutName ?? docName}
                                                                    </span>
                                                                </Link>
                                                            </td>
                                                            <td className={`px-4 py-3 text-[13px] ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>
                                                                {getRowVal(row, "shared_to_text") ?? "—"}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className={`flex items-center gap-1.5 text-[13px] ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>
                                                                    <UserIcon size={12} weight="duotone" />
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        {dateStr}
                                                                    </Typography>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Tooltip title="More actions">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={(e) => handleLayoutMenuOpen(e, row)}
                                                                            sx={{ p: 0.3, color: isDark ? "#9CA3AF" : "#94A3B8", "&:hover": { color: "#1D4ED8", bgcolor: isDark ? "#27272A" : "#EFF6FF" }, borderRadius: "6px" }}
                                                                        >
                                                                            <DotsThreeVertical size={15} weight="bold" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <LayoutStatusSwitchCell
                                                                        row={row}
                                                                        token={userToken?.access_token ?? ""}
                                                                        onSuccess={() => setRefreshKey((k) => k + 1)}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <Menu
                                anchorEl={layoutMenuAnchor}
                                open={Boolean(layoutMenuAnchor)}
                                onClose={handleLayoutMenuClose}
                                transformOrigin={{ horizontal: "right", vertical: "top" }}
                                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                                PaperProps={{
                                    elevation: 4,
                                    sx: {
                                        mt: 0.5,
                                        borderRadius: "12px",
                                        minWidth: 200,
                                        border: isDark ? "1px solid #27272A" : "1px solid #E3ECFC",
                                        bgcolor: isDark ? "#1C1C1E" : "#fff",
                                        boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(12,36,114,0.10)",
                                        "& .MuiMenuItem-root": {
                                            fontSize: "14px",
                                            py: 1.2,
                                            px: 2.5,
                                            gap: 1.25,
                                            color: isDark ? "#D4D4D8" : "#334155",
                                            "&:hover": { bgcolor: isDark ? "#27272A" : "#EFF6FF", color: isDark ? "#F4F4F5" : "#1D4ED8" },
                                        },
                                        "& .MuiListItemIcon-root": { minWidth: 0, color: "inherit" },
                                    },
                                }}
                            >
                                <MenuItem onClick={handleLayoutMenuRename}>
                                    <ListItemIcon><PencilSimple size={15} weight="duotone" /></ListItemIcon>
                                    Rename
                                </MenuItem>
                                <MenuItem onClick={handleLayoutMenuEdit}>
                                    <ListItemIcon><Rows size={15} weight="duotone" /></ListItemIcon>
                                    Edit Layout
                                </MenuItem>
                                <MenuItem onClick={handleLayoutMenuClone}>
                                    <ListItemIcon><CopySimple size={15} weight="duotone" /></ListItemIcon>
                                    Clone Layout
                                </MenuItem>
                                <MenuItem onClick={handleLayoutMenuPermission}>
                                    <ListItemIcon><ShieldCheck size={15} weight="duotone" /></ListItemIcon>
                                    Layout Permission
                                </MenuItem>
                                {isLeadsModule && (
                                    <MenuItem onClick={handleLeadConversionMapping}>
                                        <ListItemIcon><ArrowsLeftRight size={15} weight="duotone" /></ListItemIcon>
                                        Lead Conversion Mapping
                                    </MenuItem>
                                )}
                                {!getRowVal(layoutMenuRow, "is_core") && (
                                    <MenuItem onClick={handleLayoutMenuDelete} sx={{ color: "#EF4444 !important" }}>
                                        <ListItemIcon><Trash size={15} weight="duotone" color="#EF4444" /></ListItemIcon>
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
                    <div className={`flex-1 flex items-center justify-center text-[14px] ${isDark ? "text-[#71717A]" : "text-slate-500"}`}>
                        {modulesLoading ? (
                            <CircularProgress />
                        ) : (
                            <span>Select a module from the left to view layouts.</span>
                        )}
                    </div>
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
        </div>
    );
};

export default LayoutListing;
