"use client";
import { readAccessTokenDataParsed, readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useState } from 'react';
import { Droppable, Draggable, DragDropContext } from '@hello-pangea/dnd';
import {
    Box,
    Typography,
    Button,
    Paper,
    Stack,
    TextField,
    IconButton,
    Menu,
    MenuItem,
    Tabs,
    Tab,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    Select,
    CircularProgress,
    Link,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Checkbox,
    InputAdornment,
    Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { layoutSelector, saveLayoutData, setSharedTo, removeRelatedList, setLayoutName, fetchCustomizeFieldsData, updateRelatedListFields } from '@/store/slices/general_slices/layout-slice';
import FieldPalette from './FieldPalette';
import RelatedListPalette from './RelatedListPalette';
import BusinessCardSection from './BusinessCardSection';
import FieldProperties from './FieldProperties';
import SectionBlock from './SectionBlock';
import LayoutPermissionDialog from './LayoutPermissionDialog';
import CreateLayoutDialog from './CreateLayoutDialog';
import DrawerComponent from '@/components/Common/Form/Drawer/DrawerComponent';
import CustomForm from '@/components/Common/Form/Drawer/CustomForm';
import { getLayoutList } from '@/services/api/general_apis/layout-api';
import { getLayout } from '@/services/api/crm/crm-api';
import {
    ArrowBack as ArrowBackIcon,
    Save as SaveIcon,
    Settings as SettingsIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { showToast } from '@/components/ToastNotificationNew';
import QuickCreateTab from './QuickCreateTab';
import { validateQuickCreateConfig } from './quickCreateUtils';
import QuickCreateAvailableFieldsPanel from './QuickCreateAvailableFieldsPanel';
import {
    moduleSettingsDetailPath,
    moduleSettingsLayoutEditPath,
} from '@/app/settings/utils/moduleSettingsRoutes';

export interface LayoutCanvasProps {
    module?: string | null;
    layoutId?: string;
    layout_name?: string;
    /** When true, saving will create a new layout (no existing layoutId) and the name starts blank. */
    isClone?: boolean;
    embedInSettings?: boolean;
}

const LayoutCanvas = ({
    module: moduleProp,
    layoutId: layoutIdProp,
    layout_name,
    isClone,
    embedInSettings = false,
}: LayoutCanvasProps) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const safeSearchParams = useSearchParams() ?? new URLSearchParams();
    const params = useParams();
    const router = useRouter();
    const rawLayoutId = layoutIdProp ?? (params?.id as string);
    // Decode URL-encoded layout id for display (e.g. Territories_Base%20Layout → Territories_Base Layout)
    const layoutId = rawLayoutId && rawLayoutId.includes('%') ? decodeURIComponent(rawLayoutId) : rawLayoutId;
    const { activeLayout, unusedFields, unusedRelatedLists, pendingFieldChanges, module: stateModule, layoutName, sharedTo, isCore } = useSelector(layoutSelector) as any;
    const [permissionsOpen, setPermissionsOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<'save' | 'saveAndClose' | null>(null);
    const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
    const layoutNameInputRef = React.useRef<HTMLInputElement>(null);
    const initialLayoutRef = React.useRef<{
        layout: any;
        unusedFields: any[];
        unusedRelatedLists: any[];
        layoutName: string;
        layoutId: string | null;
    } | null>(null);
    const settingsOpen = Boolean(settingsAnchorEl);
    const [hasChanges, setHasChanges] = useState(false);

    const isCloneMode = isClone || safeSearchParams.get('clone') === '1';

    const [userToken] = useState<any>(() => {
        try {
            return readAccessTokenDataParsed() || {};
        } catch {
            return {};
        }
    });
    const [layoutOptions, setLayoutOptions] = useState<{ value: string; label: string }[]>([]);
    const [layoutOptionsLoading, setLayoutOptionsLoading] = useState(false);
    const [layoutOptionsError, setLayoutOptionsError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLayout, setPreviewLayout] = useState<string>('');
    const [previewLayoutData, setPreviewLayoutData] = useState<{ sections: any[] } | null>(null);
    const [previewLayoutLoading, setPreviewLayoutLoading] = useState(false);

    const [canvasTab, setCanvasTab] = useState<'create' | 'quick_create' | 'detail'>('create');

    // Prefer prop (from URL), then Redux (from get_layout response), then search params
    const module = moduleProp ?? stateModule ?? safeSearchParams.get('frontend_module') ?? '';
    console.log('module in layout canvas' + module);

    // Users module does not support Quick Create or Detail View — only the Create tab is available.
    const isUsersModule = typeof module === 'string' && module.trim().toLowerCase() === 'users';

    useEffect(() => {
        if (isUsersModule && canvasTab !== 'create') {
            setCanvasTab('create');
        }
    }, [isUsersModule, canvasTab]);

    const singularModuleName = React.useMemo(() => {
        if (!module || typeof module !== 'string') return 'Record';
        const name = module.trim();
        if (name.endsWith('ies')) {
            return name.slice(0, -3) + 'y';
        }
        if (name.endsWith('s')) {
            return name.slice(0, -1);
        }
        return name;
    }, [module]);

    const handleLayoutNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isCore && !isCloneMode) {
            return;
        }
        const newName = event.target.value;
        dispatch(setLayoutName(newName));
    };

    /** Clone: only Redux `layoutName` (starts blank). Edit: allow prop fallback until Redux is set. */
    const getTrimmedLayoutNameForSave = () => {
        if (isCloneMode) {
            return (layoutName ?? "").trim();
        }
        return (layoutName ?? layout_name ?? "").trim();
    };

    const performSave = async (sharedToOverride?: string[]) => {
        const token = readAccessTokenString();
        const currentLayoutName = getTrimmedLayoutNameForSave();

        // Do not allow saving without a layout name
        if (!currentLayoutName) {
            showToast("Layout Name is required", "error");
            layoutNameInputRef.current?.focus();
            return null;
        }

        if (token && activeLayout) {
            const quickCreateError = validateQuickCreateConfig(activeLayout);
            if (quickCreateError) {
                showToast(quickCreateError, 'warning');
                return null;
            }

            // Send the current value from the Layout Name text box to backend
            const layoutIdForSave = isCloneMode ? undefined : rawLayoutId;
            const sharedToPayload = sharedToOverride ?? sharedTo ?? [];

            const action = await dispatch(
                saveLayoutData({
                    module,
                    layoutId: layoutIdForSave,
                    layout: activeLayout,
                    token,
                    layoutName: currentLayoutName,
                    sharedTo: sharedToPayload,
                    unusedFields: unusedFields,
                    unusedRelatedLists: unusedRelatedLists
                }) as any
            );

            // If save succeeded, reset the "initial" snapshot so buttons disable again
            if (saveLayoutData.fulfilled.match(action)) {
                const snapshotId = (layoutIdForSave ?? rawLayoutId ?? '') as string | null;
                initialLayoutRef.current = {
                    layout: JSON.parse(JSON.stringify(activeLayout)),
                    unusedFields: JSON.parse(JSON.stringify(unusedFields ?? [])),
                    unusedRelatedLists: JSON.parse(JSON.stringify(unusedRelatedLists ?? [])),
                    layoutName: currentLayoutName,
                    layoutId: snapshotId,
                };
                setHasChanges(false);
            }

            return action;
        }
        return null;
    };

    const openPermissions = (action: 'save' | 'saveAndClose') => {
        setPendingAction(action);
        setPermissionsOpen(true);
    };

    const handleSave = async () => {
        if (!getTrimmedLayoutNameForSave()) {
            showToast("Layout Name is required", "error");
            if (isCloneMode) layoutNameInputRef.current?.focus();
            return;
        }
        if (sharedTo && (sharedTo as string[]).length > 0) {
            await performSave();
            return;
        }
        openPermissions('save');
    };

    const handleSaveAndClose = async () => {
        if (!getTrimmedLayoutNameForSave()) {
            showToast("Layout Name is required", "error");
            if (isCloneMode) layoutNameInputRef.current?.focus();
            return;
        }
        if (sharedTo && (sharedTo as string[]).length > 0) {
            const action = await performSave();
            if (action && saveLayoutData.fulfilled.match(action)) {
                if (module) {
                    if (embedInSettings) {
                        router.push(
                            moduleSettingsDetailPath({ moduleName: module, moduleTab: 'layouts' })
                        );
                    } else {
                        const moduleSlug = encodeURIComponent(module);
                        router.push(`/setup/customization/modules/${moduleSlug}?tab=layouts`);
                    }
                } else {
                    router.back();
                }
            }
            return;
        }
        openPermissions('saveAndClose');
    };

    const handleClose = () => {
        if (module) {
            if (embedInSettings) {
                router.push(moduleSettingsDetailPath({ moduleName: module, moduleTab: 'layouts' }));
            } else {
                const moduleSlug = encodeURIComponent(module);
                router.push(`/setup/customization/modules/${moduleSlug}?tab=layouts`);
            }
        } else {
            router.back();
        }
    };

    const handlePermissionsCancel = () => {
        setPermissionsOpen(false);
        setPendingAction(null);
    };

    const handlePermissionsSave = async (sharedToIds: string[]) => {
        dispatch(setSharedTo(sharedToIds));
        if (pendingAction) {
            const action = await performSave(sharedToIds);
            if (pendingAction === 'saveAndClose' && action && saveLayoutData.fulfilled.match(action)) {
                if (embedInSettings && module) {
                    router.push(
                        moduleSettingsDetailPath({ moduleName: module, moduleTab: 'layouts' })
                    );
                } else {
                    router.back();
                }
            }
        }
        setPendingAction(null);
    };

    // Load layouts for the current module for the Layout Name dropdown
    useEffect(() => {
        const loadLayouts = async () => {
            if (!module || !userToken?.access_token) return;
            setLayoutOptionsLoading(true);
            setLayoutOptionsError(null);
            try {
                const roleProfile = userToken?.role_profile || "";
                const list = await getLayoutList(module, userToken.access_token, roleProfile);
                const normalized = Array.isArray(list) ? list : [];
                setLayoutOptions(normalized);

                // Default preview layout: current layoutId if present, else first option
                if (normalized.length) {
                    const currentId = layoutId ?? '';
                    const match = normalized.find((opt) => opt.value === currentId);
                    setPreviewLayout((match?.value ?? normalized[0].value) || '');
                }
            } catch (err) {
                console.error('Failed to load layouts for LayoutCanvas:', err);
                setLayoutOptionsError('Failed to load layouts');
            } finally {
                setLayoutOptionsLoading(false);
            }
        };

        loadLayouts();
    }, [module, userToken?.access_token, userToken?.role_profile]);

    // Track whether there are unsaved changes to the active layout or layout name
    useEffect(() => {
        if (!activeLayout) return;

        const currentLayoutName = (layoutName ?? layout_name ?? layoutId ?? '').toString().trim();
        const currentId = (layoutId ?? '') as string | null;

        if (
            !initialLayoutRef.current ||
            initialLayoutRef.current.layoutId !== currentId
        ) {
            // Initialize snapshot for this layout id
            initialLayoutRef.current = {
                layout: JSON.parse(JSON.stringify(activeLayout)),
                unusedFields: JSON.parse(JSON.stringify(unusedFields ?? [])),
                unusedRelatedLists: JSON.parse(JSON.stringify(unusedRelatedLists ?? [])),
                layoutName: currentLayoutName,
                layoutId: currentId,
            };
            setHasChanges(false);
            return;
        }

        const initial = initialLayoutRef.current;
        const layoutChanged =
            JSON.stringify(activeLayout) !== JSON.stringify(initial.layout);
        const unusedChanged =
            JSON.stringify(unusedFields ?? []) !== JSON.stringify(initial.unusedFields ?? []);
        const unusedRLChanged =
            JSON.stringify(unusedRelatedLists ?? []) !== JSON.stringify(initial.unusedRelatedLists ?? []);
        const nameChanged = currentLayoutName !== initial.layoutName;
        setHasChanges(layoutChanged || unusedChanged || unusedRLChanged || nameChanged || !!pendingFieldChanges);
    }, [activeLayout, unusedFields, unusedRelatedLists, pendingFieldChanges, layoutName, layout_name, layoutId]);

    // When Preview dialog is open and a layout is selected, load that layout's JSON for preview
    useEffect(() => {
        if (!previewOpen || !previewLayout || !module || !userToken?.access_token) {
            if (!previewOpen) setPreviewLayoutData(null);
            return;
        }
        const currentId = layoutId ?? '';
        if (previewLayout === currentId && activeLayout?.sections) {
            setPreviewLayoutData(activeLayout);
            return;
        }
        let cancelled = false;
        setPreviewLayoutLoading(true);
        setPreviewLayoutData(null);
        getLayout(module, previewLayout, userToken.access_token)
            .then((data: any) => {
                if (cancelled) return;
                const doc = data?.doc ?? data;
                const rawJson = doc?.layout_json ?? doc?.layout;
                let layoutContent: any = null;
                if (rawJson != null) {
                    if (typeof rawJson === 'string') {
                        try {
                            layoutContent = JSON.parse(rawJson);
                        } catch {
                            layoutContent = { sections: [] };
                        }
                    } else {
                        layoutContent = rawJson;
                    }
                }
                if (layoutContent && !layoutContent.sections && Array.isArray(layoutContent)) {
                    layoutContent = { sections: layoutContent };
                }
                setPreviewLayoutData(layoutContent?.sections ? { sections: layoutContent.sections } : { sections: [] });
            })
            .catch(() => {
                if (!cancelled) setPreviewLayoutData({ sections: [] });
            })
            .finally(() => {
                if (!cancelled) setPreviewLayoutLoading(false);
            });
        return () => { cancelled = true; };
    }, [previewOpen, previewLayout, module, userToken?.access_token, layoutId, activeLayout]);

    const handleLayoutSelectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value as string;
        if (!value) return;
        if (value === '__create_new__') {
            setCreateDialogOpen(true);
            return;
        }
        if (value === (rawLayoutId ?? '')) return;

        const moduleSlug = encodeURIComponent(module || '');
        const layoutSlug = encodeURIComponent(value);
        if (embedInSettings && module) {
            router.push(moduleSettingsLayoutEditPath(module, value));
        } else {
            router.push(`/setup/customization/modules/${moduleSlug}/layouts/edit/${layoutSlug}`);
        }
    };

    const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
        setSettingsAnchorEl(event.currentTarget);
    };

    const handleSettingsClose = () => {
        setSettingsAnchorEl(null);
    };

    const handleRenameLayout = () => {
        handleSettingsClose();
        layoutNameInputRef.current?.focus();
    };

    const handleLayoutPermissionFromMenu = () => {
        handleSettingsClose();
        setPendingAction(null);
        setPermissionsOpen(true);
    };

    const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
    const [currentRLToCustomize, setCurrentRLToCustomize] = useState<any>(null);

    const handleCustomizeRL = (rl: any) => {
        setCurrentRLToCustomize(rl);
        setCustomizeDialogOpen(true);
    };

    const handleSaveCustomization = (relatedListId: string, fields: { label: string; name: string }[]) => {
        dispatch(updateRelatedListFields({ relatedListId, fields }));
        setCustomizeDialogOpen(false);
        setCurrentRLToCustomize(null);
    };

    return (
        <Box
            sx={{
                px: 3,
                py: 2,
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                overflow: 'hidden',
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', minHeight: 64, px: 2, py: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, mr: 3, bgcolor: 'background.paper' }}>
                    <IconButton
                        aria-label="Back"
                        onClick={handleClose}
                        size="small"
                        sx={{ mt: 0.5 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {/* Module name — auto width based on text length */}
                            <TextField
                                value={module || ''}
                                size="small"
                                InputProps={{
                                    readOnly: true,
                                    sx: {
                                        fontSize: '0.8rem',
                                        lineHeight: 1.3,
                                        '& input': { paddingY: 0.5 },
                                    },
                                }}
                                sx={{
                                    width: `${Math.max((module?.length ?? 4) + 2, 6)}ch`,
                                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                                }}
                            />
                            <Box sx={{ height: 32, borderLeft: '1px solid', borderColor: 'divider' }} />
                            {isCloneMode ? (() => {
                                const cloneValue = (layoutName ?? "").toString();
                                return (
                                    <TextField
                                        inputRef={layoutNameInputRef}
                                        value={cloneValue}
                                        size="small"
                                        placeholder="Layout Name"
                                        onChange={handleLayoutNameChange}
                                        disabled={!!isCore && !isCloneMode}
                                        required
                                        error={!isCore && !cloneValue.trim()}
                                        helperText={!isCore && !cloneValue.trim() ? 'Layout Name is required' : ''}
                                        InputProps={{
                                            readOnly: !!isCore && !isCloneMode,
                                            sx: {
                                                fontSize: '0.8rem',
                                                lineHeight: 1.3,
                                                '& input': { paddingY: 0.5 },
                                            },
                                        }}
                                        sx={{
                                            width: `${Math.max(cloneValue.length + 4, 12)}ch`,
                                            '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                                        }}
                                    />
                                );
                            })() : (() => {
                                const selectedLabel =
                                    layoutId === '__create_new__'
                                        ? 'Create New Layout'
                                        : (layoutOptions.find((o) => o.value === layoutId)?.label ?? layoutId ?? '');
                                return (
                                    <TextField
                                        select
                                        size="small"
                                        value={layoutId ?? ''}
                                        onChange={handleLayoutSelectChange}
                                        SelectProps={{ displayEmpty: false }}
                                        disabled={layoutOptionsLoading || !layoutOptions.length}
                                        sx={{
                                            width: `${Math.max((selectedLabel?.length ?? 8) + 4, 10)}ch`,
                                            '& .MuiInputLabel-root': { fontSize: '0.8rem' },
                                            /* Text area: flush padding so label sits like plain text */
                                            '& .MuiSelect-select.MuiSelect-outlined': {
                                                fontSize: '0.8rem',
                                                fontWeight: 500,
                                                lineHeight: 1.4,
                                                paddingTop: '4px',
                                                paddingBottom: '4px',
                                                paddingLeft: '6px',
                                                paddingRight: '24px !important',
                                            },
                                            /* Arrow icon — sit tight against the text */
                                            '& .MuiSelect-icon': {
                                                fontSize: '1rem',
                                                right: 2,
                                                color: 'text.secondary',
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                border: '1px solid',
                                                borderColor: 'divider',
                                            },
                                            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                border: '1px solid',
                                                borderColor: 'primary.main',
                                            },
                                        }}
                                    >
                                        {layoutOptions.map((opt) => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </MenuItem>
                                        ))}
                                        <MenuItem value="__create_new__">
                                            <em>Create New Layout</em>
                                        </MenuItem>
                                    </TextField>
                                );
                            })()}
                            <IconButton
                                aria-label="Layout settings"
                                aria-controls={settingsOpen ? 'layout-settings-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={settingsOpen ? 'true' : undefined}
                                onClick={handleSettingsOpen}
                                size="small"
                                sx={{ mt: 0.5 }}
                            >
                                <SettingsIcon />
                            </IconButton>
                        </Stack>
                    </Stack>
                </Stack>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleClose}
                        sx={{
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            py: 0.7,
                            px: 1.75,
                            textTransform: 'none',
                            fontWeight: 600,
                            color: isDark ? '#9CA3AF' : '#64748B',
                            borderColor: isDark ? '#3F3F46' : '#E3ECFC',
                            bgcolor: 'transparent',
                            '&:hover': {
                                bgcolor: isDark ? '#18181B' : '#F8FAFC',
                                borderColor: isDark ? '#3F3F46' : '#E3ECFC',
                            },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleSaveAndClose}
                        disabled={!hasChanges}
                        sx={{
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            py: 0.7,
                            px: 1.75,
                            textTransform: 'none',
                            fontWeight: 600,
                            color: isDark ? '#9CA3AF' : '#64748B',
                            borderColor: isDark ? '#3F3F46' : '#E3ECFC',
                            bgcolor: 'transparent',
                            '&:hover': {
                                bgcolor: isDark ? '#18181B' : '#F8FAFC',
                                borderColor: isDark ? '#3F3F46' : '#E3ECFC',
                            },
                        }}
                    >
                        Save and Close
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleSave}
                        disabled={!hasChanges}
                        sx={{
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            py: 0.7,
                            px: 2.5,
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: '#1D4ED8',
                            color: '#fff',
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: '#60A5FA',
                                boxShadow: 'none',
                            },
                        }}
                    >
                        Save
                    </Button>
                </Stack>
            </Stack>

            <Menu
                id="layout-settings-menu"
                anchorEl={settingsAnchorEl}
                open={settingsOpen}
                onClose={handleSettingsClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={handleRenameLayout}>Rename Layout</MenuItem>
                <MenuItem onClick={handleLayoutPermissionFromMenu}>Layout Permission</MenuItem>
            </Menu>

            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', paddingTop: 2 }}>
                {(canvasTab === 'create' || canvasTab === 'detail') && (
                    <Box
                        sx={{
                            width: 300,
                            flexShrink: 0,
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRight: 1,
                            borderColor: 'divider',
                        }}
                    >
                        {canvasTab === 'create' ? <FieldPalette /> : <RelatedListPalette />}
                    </Box>
                )}
                {canvasTab === 'quick_create' && (
                    <Box
                        sx={{
                            width: 300,
                            flexShrink: 0,
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRight: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <QuickCreateAvailableFieldsPanel layout={activeLayout} />
                    </Box>
                )}
                <Box
                    sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        px: 2,
                        pb: 2,
                        bgcolor: 'background.paper',
                        height: "calc(100vh - 120px)",
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: 1,
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                        }}
                    >
                        <Tabs
                            value={canvasTab}
                            onChange={(_, v) => setCanvasTab(v)}
                            sx={{
                                minHeight: 44,
                                bgcolor: 'transparent !important',
                                '& .MuiTabs-flexContainer': { gap: 0 },
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    minHeight: 44,
                                    px: 2.5,
                                    py: 1.25,
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    backgroundColor: 'transparent !important',
                                    boxShadow: 'none !important',
                                    color: isDark ? '#71717A' : '#94A3B8',
                                },
                                '& .MuiTab-root:hover': {
                                    backgroundColor: 'transparent !important',
                                    color: isDark ? '#D4D4D8' : '#475569',
                                },
                                '& .MuiTab-root.Mui-selected': {
                                    backgroundColor: 'transparent !important',
                                    color: `${isDark ? '#60A5FA' : '#1D4ED8'} !important`,
                                    fontWeight: 700,
                                    boxShadow: 'none !important',
                                },
                                '& .MuiTab-root.Mui-selected:hover': {
                                    backgroundColor: 'transparent !important',
                                    color: `${isDark ? '#60A5FA' : '#1D4ED8'} !important`,
                                },
                                '& .MuiTabs-indicator': {
                                    backgroundColor: isDark ? '#60A5FA' : '#1D4ED8',
                                    height: 2,
                                },
                            }}
                        >
                            <Tab label="Create" value="create" />
                            {!isUsersModule && <Tab label="Quick Create" value="quick_create" />}
                            {!isUsersModule && <Tab label="Detail View" value="detail" />}
                        </Tabs>
                    </Box>
                    <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
                        {/* Preview row */}
                        {canvasTab !== 'detail' && canvasTab !== 'quick_create' && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pr: 2, pt: 1 }}>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => setPreviewOpen(true)}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        color: 'primary.main',
                                    }}
                                >
                                    Preview
                                </Button>
                            </Box>
                        )}
                        {/* Canvas sections */}
                        <Box sx={{ pt: 1, pr: canvasTab === 'create' ? 10 : 2, flexGrow: 1 }}>
                            {canvasTab === 'create' && (
                                <>
                                    <Droppable droppableId="canvas" type="SECTION">
                                        {(provided) => (
                                            <Box
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                sx={{ minHeight: '100%' }}
                                            >
                                                {activeLayout?.sections?.map((section, index) => (
                                                    <SectionBlock
                                                        key={section.id}
                                                        section={section}
                                                        index={index}
                                                    />
                                                ))}
                                                {provided.placeholder}
                                            </Box>
                                        )}
                                    </Droppable>

                                    {(!activeLayout?.sections || activeLayout.sections.length === 0) && (
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 12,
                                                textAlign: 'center',
                                                borderStyle: 'dashed',
                                                borderRadius: 4,
                                                bgcolor: 'transparent'
                                            }}
                                        >
                                            <Typography color="text.secondary">
                                                Drag and drop fields here or add a section to get started.
                                            </Typography>
                                        </Paper>
                                    )}
                                </>
                            )}

                            {canvasTab === 'quick_create' && (
                                <Box sx={{ height: '100%', pr: 2, overflow: 'hidden' }}>
                                    <QuickCreateTab layout={activeLayout} moduleName={module} />
                                </Box>
                            )}

                            {canvasTab === 'detail' && (
                                <Box sx={{ height: '100%', pr: 2, pb: 4, pt: 4, overflowY: 'auto', pl: 2 }}>
                                    {/* Business Card Section */}
                                    <Box sx={{ mb: 4, width: '100%' }}>
                                        <BusinessCardSection />
                                    </Box>

                                    {/* Details Section */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, letterSpacing: '0.5px' }}>
                                            DETAILS
                                        </Typography>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                bgcolor: 'rgba(76, 111, 255, 0.04)',
                                                borderColor: 'rgba(76, 111, 255, 0.1)',
                                                borderRadius: 2
                                            }}
                                        >
                                            <Typography variant="body2" color="text.secondary">
                                                Fields customized in the Create page will appear here.
                                            </Typography>
                                        </Paper>
                                    </Box>

                                    {/* Related List Section */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, letterSpacing: '0.5px' }}>
                                            RELATED LIST
                                        </Typography>

                                        <Droppable droppableId="related-list-canvas" type="RELATED_LIST">
                                            {(provided) => (
                                                <Box
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    sx={{
                                                        minHeight: 150,
                                                        p: 1,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 3,
                                                    }}
                                                >

                                                    {(activeLayout?.related_lists || []).map((rl: any, index: number) => (
                                                        <Draggable key={rl.id} draggableId={`canvas-${rl.id}`} index={index}>
                                                            {(dProvided, dSnapshot) => (
                                                                <Box
                                                                    ref={dProvided.innerRef}
                                                                    {...dProvided.draggableProps}
                                                                    {...dProvided.dragHandleProps}
                                                                    sx={{
                                                                        mb: 3,
                                                                        p: 0,
                                                                        bgcolor: 'background.paper',
                                                                        border: 'none',
                                                                        boxShadow: dSnapshot.isDragging ? 4 : 0,
                                                                        opacity: dSnapshot.isDragging ? 0.8 : 1,
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 1 }}>
                                                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                                            {rl.label}
                                                                        </Typography>
                                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                                            {!(rl?.label?.toLowerCase()?.includes('notes') || rl?.label?.toLowerCase()?.includes('attachments')) && (
                                                                                <Link
                                                                                    component="button"
                                                                                    variant="body2"
                                                                                    onClick={() => handleCustomizeRL(rl)}
                                                                                    sx={{
                                                                                        textDecoration: 'none',
                                                                                        fontWeight: 500,
                                                                                        color: 'primary.main',
                                                                                        cursor: 'pointer',
                                                                                        '&:hover': { textDecoration: 'underline' }
                                                                                    }}
                                                                                >
                                                                                    Customize
                                                                                </Link>
                                                                            )}
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => dispatch(removeRelatedList(rl.id))}
                                                                                sx={{ color: 'text.disabled', ml: 1 }}
                                                                            >
                                                                                <DeleteIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Stack>
                                                                    </Box>

                                                                    {/* Field Headers for non-Notes/Attachments */}
                                                                    {(!(rl?.label?.toLowerCase()?.includes('notes') || rl?.label?.toLowerCase()?.includes('attachments'))) && rl.fields && rl.fields.length > 0 && (
                                                                        <Box
                                                                            sx={{
                                                                                display: 'flex',
                                                                                border: '1px solid',
                                                                                borderColor: 'divider',
                                                                                borderRadius: 1,
                                                                                overflow: 'hidden',
                                                                                bgcolor: 'grey.50'
                                                                            }}
                                                                        >
                                                                            {rl.fields.map((field: any, fIdx: number) => (
                                                                                <Box
                                                                                    key={fIdx}
                                                                                    sx={{
                                                                                        flex: 1,
                                                                                        p: 1.5,
                                                                                        textAlign: 'center',
                                                                                        borderRight: fIdx < rl.fields.length - 1 ? '1px solid' : 'none',
                                                                                        borderColor: 'divider',
                                                                                        minWidth: 100,
                                                                                        bgcolor: 'background.paper'
                                                                                    }}
                                                                                >
                                                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                                        {field.label}
                                                                                    </Typography>
                                                                                </Box>
                                                                            ))}
                                                                        </Box>
                                                                    )}

                                                                    {/* Empty State / Notes & Attachments */}
                                                                    {((rl?.label?.toLowerCase()?.includes('notes') || rl?.label?.toLowerCase()?.includes('attachments')) || !rl.fields || rl.fields.length === 0) && (
                                                                        <Box
                                                                            sx={{
                                                                                p: 2,
                                                                                border: '1px dashed',
                                                                                borderColor: 'divider',
                                                                                borderRadius: 1,
                                                                                textAlign: 'center',
                                                                                bgcolor: 'rgba(0,0,0,0.02)'
                                                                            }}
                                                                        >
                                                                            <Typography variant="body2" color="text.secondary">
                                                                                {rl?.label?.toLowerCase()?.includes('notes') || rl?.label?.toLowerCase()?.includes('attachments')
                                                                                    ? `This is a standard ${rl.label} section.`
                                                                                    : "No fields selected for this related list."}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}


                                                </Box>
                                            )}
                                        </Droppable>
                                    </Box>
                                </Box>
                            )}
                        </Box>{/* end pt:3 pr:10 inner box */}
                    </Box>
                </Box>
                {canvasTab === 'create' && <FieldProperties />}
            </Box>

            <LayoutPermissionDialog
                open={permissionsOpen}
                onClose={handlePermissionsCancel}
                layoutName={layoutName || 'Untitled'}
                initialSharedTo={sharedTo ?? []}
                onSave={handlePermissionsSave}
            />
            <DrawerComponent
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                title={`Preview ${singularModuleName}`}
                width={900}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Preview layout
                    </Typography>
                    <FormControl size="small" variant="outlined">
                        <Select
                            value={previewLayout}
                            onChange={(e) =>
                                setPreviewLayout(e.target.value as string)
                            }
                            sx={{
                                minWidth: 180,
                                '& .MuiOutlinedInput-notchedOutline': {
                                    border: '1px solid',
                                    borderColor: 'divider',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderWidth: '1px',
                                    borderColor: 'primary.main',
                                },
                                '& .MuiSelect-select': {
                                    py: 0.5,
                                    px: 1.5,
                                },
                            }}
                            displayEmpty
                        >
                            {layoutOptions.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ pb: 2 }}
                >
                    {`Create ${singularModuleName}`}
                </Typography>
                <Box
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                /> */}

                {previewLayoutLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (!previewLayoutData?.sections || previewLayoutData.sections.length === 0) ? (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                        No sections defined yet. Add sections and fields to preview the
                        layout.
                    </Typography>
                ) : (
                    <Box sx={{ pt: 3, pb: 2 }}>
                        <CustomForm
                            // Flatten sections into a single fields array for CustomForm,
                            // and attach the section title so grouping/labels match runtime forms
                            fields={previewLayoutData.sections.flatMap(
                                (section: any) =>
                                    (section.fields || []).map((f: any) => ({
                                        ...f,
                                        section: f.section ?? section.title ?? "",
                                        section_column_count: Number(section.column_count) === 1 ? 1 : 2,
                                    }))
                            )}
                            // Simple empty initial values for preview
                            initialValues={previewLayoutData.sections
                                .flatMap((section: any) => section.fields || [])
                                .reduce((acc: any, f: any) => {
                                    const name =
                                        f.name || f.fieldname || f.id || "";
                                    if (name && !(name in acc)) {
                                        acc[name] = "";
                                    }
                                    return acc;
                                }, {})}
                            onSubmit={() => { }}
                            onClose={() => { }}
                            editValues={{}}
                            mode="Add"
                            moduleName={module}
                            layoutId={previewLayout}
                            hideActions={true}
                        />
                        <Box
                            sx={{
                                mt: 2,
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => setPreviewOpen(false)}
                            >
                                Close
                            </Button>
                        </Box>
                    </Box>
                )}
            </DrawerComponent>
            <CreateLayoutDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                selectedModule={module || null}
                layoutRows={layoutOptions.map((opt) => ({
                    name: opt.value,
                    layout_name: opt.label,
                }))}
            />
            {customizeDialogOpen && currentRLToCustomize && (
                <CustomizeRelatedListDialog
                    open={customizeDialogOpen}
                    onClose={() => {
                        setCustomizeDialogOpen(false);
                        setCurrentRLToCustomize(null);
                    }}
                    relatedList={currentRLToCustomize}
                    onSave={handleSaveCustomization}
                />
            )}
        </Box>
    );
};

const CustomizeRelatedListDialog = ({ open, onClose, relatedList, onSave }: { open: boolean; onClose: () => void; relatedList: any; onSave: (id: string, fields: any[]) => void }) => {
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [allFields, setAllFields] = useState<any[]>([]);
    const [selectedFields, setSelectedFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && (relatedList?.child_module || relatedList?.link_field_name === 'stage_history')) {
            const token = readAccessTokenString();
            const moduleName = relatedList?.link_field_name === 'stage_history' ? 'Stage Probability History' : relatedList.child_module;
            if (!token || !moduleName) {
                setLoading(false);
                return;
            }
            setLoading(true);

            dispatch(fetchCustomizeFieldsData({ moduleName, token }) as any)
                .then((action: any) => {
                    if (fetchCustomizeFieldsData.fulfilled.match(action)) {
                        const rawFields = action.payload || [];

                        // Filter out 'Link' type fields and flatten 'sub_fields'
                        const processedFields: any[] = [];
                        rawFields.forEach((f: any) => {
                            if (f.type === 'Link' || f.field_type === 'Link') {
                                if (Array.isArray(f.sub_fields)) {
                                    f.sub_fields.forEach((sf: any) => {
                                        processedFields.push({
                                            ...sf,
                                            label: sf.label || sf.field_label || sf.display_name || sf.fieldname || sf.field_name || sf.name || '',
                                            name: sf.fieldname || sf.field_name || sf.name || ''
                                        });
                                    });
                                }
                            } else {
                                processedFields.push({
                                    ...f,
                                    label: f.label || f.field_label || f.display_name || f.fieldname || f.field_name || f.name || '',
                                    name: f.fieldname || f.field_name || f.name || ''
                                });
                            }
                        });

                        if (relatedList?.link_field_name === 'stage_history') {
                            const stageHistoryConfig = [
                                { name: 'stage', label: 'Stage' },
                                { name: 'moved_from', label: 'Moved From' },
                                { name: 'amount', label: 'Amount' },
                                { name: 'probability', label: 'Probability' },
                                { name: 'expected_revenue', label: 'Expected Revenue' },
                                { name: 'stage_duration', label: 'Stage Duration' },
                                { name: 'forecast_category', label: 'Forecast Category' },
                                { name: 'record_category', label: 'Record Category' },
                                { name: 'is_current', label: 'Is Current' }
                            ];

                            const finalStageFields: any[] = [];
                            stageHistoryConfig.forEach(config => {
                                const found = processedFields.find((f: any) =>
                                    (f.fieldname || f.field_name || f.name) === config.name
                                );
                                if (found) {
                                    finalStageFields.push(found);
                                } else {
                                    finalStageFields.push({
                                        name: config.name,
                                        label: config.label,
                                        is_virtual: true
                                    });
                                }
                            });
                            setAllFields(finalStageFields);

                            // Initialize selected fields
                            const currentFields = relatedList.fields || [];
                            const validCurrentFields = currentFields.map((cf: any) => {
                                const cfName = cf.fieldname || cf.field_name || cf.name;
                                const fieldInList = finalStageFields.find((f: any) => (f.fieldname || f.field_name || f.name) === cfName);
                                if (!fieldInList) return null;

                                // Auto-uncheck hidden fields as per requirement
                                const isHidden = fieldInList.hidden || fieldInList.hide || fieldInList.visible === 0 || fieldInList.visible === false;
                                if (isHidden) return null;

                                return { ...fieldInList, label: cf.label || fieldInList.label, name: cfName };
                            }).filter(Boolean);

                            setSelectedFields(validCurrentFields);
                        } else {
                            setAllFields(processedFields);

                            // Initialize selected fields from current related list fields
                            // and ensure they exist in the fetched fields
                            const currentFields = relatedList.fields || [];
                            const validCurrentFields = currentFields.map((cf: any) => {
                                const cfName = cf.fieldname || cf.field_name || cf.name;
                                const found = processedFields.find((f: any) => {
                                    const fName = f.fieldname || f.field_name || f.name;
                                    return (fName === cfName) ||
                                        (f.fieldname && f.fieldname === cfName) ||
                                        (f.field_name && f.field_name === cfName) ||
                                        (f.name && f.name === cfName);
                                });
                                return found ? { ...found, label: cf.label, name: cfName } : null;
                            }).filter(Boolean);

                            setSelectedFields(validCurrentFields);
                        }
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [open, relatedList, dispatch]);

    const handleToggleField = (field: any) => {
        const fieldName = field.fieldname || field.field_name || field.name;
        const isSelected = selectedFields.some(f =>
            (f.fieldname || f.field_name || f.name) === fieldName
        );

        if (isSelected) {
            setSelectedFields(selectedFields.filter(f =>
                (f.fieldname || f.field_name || f.name) !== fieldName
            ));
        } else {
            setSelectedFields([...selectedFields, { ...field, label: field.label, name: fieldName }]);
        }
    };

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;
        const items = Array.from(selectedFields);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setSelectedFields(items);
    };

    const filteredFields = allFields.filter(f =>
        f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.name ?? f.fieldname).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={false}
            PaperProps={{
                sx: {
                    width: 320,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    m: 2
                }
            }}
        >
            <DialogContent sx={{ p: '12px 16px' }}>
                <Box sx={{ mb: 1.5 }}>
                    <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        InputProps={{
                            disableUnderline: false,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: '#9e9e9e' }} />
                                </InputAdornment>
                            ),
                            sx: {
                                pb: 0.5,
                                fontSize: '0.9rem',
                                '&:after': { borderBottomColor: '#2563eb' },
                                '&:before': { borderBottomColor: '#e5e7eb' },
                                '&:hover:not(.Mui-disabled):before': { borderBottomColor: '#d1d5db' }
                            }
                        }}
                    />
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={24} thickness={4} sx={{ color: '#2563eb' }} />
                    </Box>
                ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="customize-fields">
                            {(provided) => (
                                <List
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    sx={{
                                        maxHeight: 250,
                                        overflowY: 'auto',
                                        px: 0,
                                        '&::-webkit-scrollbar': { width: 4 },
                                        '&::-webkit-scrollbar-thumb': { bgcolor: '#e5e7eb', borderRadius: 2 }
                                    }}
                                >
                                    {/* Selected Fields - Draggable */}
                                    {selectedFields.map((field, index) => (
                                        <Draggable key={field.name ?? field.fieldname} draggableId={field.name ?? field.fieldname} index={index}>
                                            {(dProvided, snapshot) => (
                                                <ListItem
                                                    ref={dProvided.innerRef}
                                                    {...dProvided.draggableProps}
                                                    disablePadding
                                                    onKeyDown={(e) => {
                                                        if (e.key === ' ') {
                                                            e.preventDefault();
                                                            handleToggleField(field);
                                                        }
                                                    }}
                                                    sx={{
                                                        mb: '2px',
                                                        bgcolor: snapshot.isDragging ? '#eff6ff' : '#f8fafc',
                                                        borderRadius: '4px',
                                                        '&:hover': { bgcolor: '#f1f5f9' },
                                                        transition: 'background-color 0.2s'
                                                    }}
                                                >
                                                    <Checkbox
                                                        edge="start"
                                                        checked={true}
                                                        onChange={() => handleToggleField(field)}
                                                        size="small"
                                                        sx={{
                                                            ml: 0.5,
                                                            color: '#2563eb',
                                                            '&.Mui-checked': { color: '#2563eb' }
                                                        }}
                                                    />
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b' }}>
                                                                    {field.label}
                                                                </Typography>
                                                                {field.required && (
                                                                    <Typography variant="caption" sx={{ color: '#ef4444', ml: 0.5 }}>*</Typography>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                    <ListItemIcon
                                                        {...dProvided.dragHandleProps}
                                                        sx={{ minWidth: 28, justifyContent: 'center', cursor: 'grab' }}
                                                    >
                                                        <DragIndicatorIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                    </ListItemIcon>
                                                </ListItem>
                                            )}
                                        </Draggable>
                                    ))}

                                    {selectedFields.length > 0 && filteredFields.some(f =>
                                        !selectedFields.some(sf =>
                                            (sf.name || sf.fieldname || sf.field_name) === (f.name || f.fieldname || f.field_name)
                                        )
                                    ) && (
                                            <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />
                                        )}

                                    {/* Unselected Fields */}
                                    {filteredFields
                                        .filter(f => !selectedFields.some(sf =>
                                            (sf.name || sf.fieldname || sf.field_name) === (f.name || f.fieldname || f.field_name)
                                        ))
                                        .map((field) => (
                                            <ListItem
                                                key={field.name ?? field.fieldname}
                                                disablePadding
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ') {
                                                        e.preventDefault();
                                                        handleToggleField(field);
                                                    }
                                                }}
                                                sx={{ mb: '2px', '&:hover': { bgcolor: '#f8fafc' }, borderRadius: '4px' }}
                                            >
                                                <Checkbox
                                                    edge="start"
                                                    checked={false}
                                                    onChange={() => handleToggleField(field)}
                                                    size="small"
                                                    sx={{ ml: 0.5, color: '#cbd5e1' }}
                                                />
                                                <ListItemText
                                                    primary={field.label}
                                                    primaryTypographyProps={{ variant: 'body2', fontSize: '0.85rem', color: '#64748b' }}
                                                />
                                                <ListItemIcon sx={{ minWidth: 28 }} />
                                            </ListItem>
                                        ))
                                    }
                                    {provided.placeholder}
                                </List>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2, justifyContent: 'flex-end', gap: 1 }}>
                <Button
                    onClick={() => onSave(relatedList.id, selectedFields)}
                    variant="contained"
                    size="small"
                    disabled={selectedFields.length === 0}
                    sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        px: 2.5,
                        py: 0.75,
                        bgcolor: '#2563eb',
                        boxShadow: 'none',
                        fontSize: '0.85rem',
                        '&:hover': { bgcolor: '#1d4ed8' }
                    }}
                >
                    Save
                </Button>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="small"
                    sx={{
                        textTransform: 'none',
                        borderRadius: '6px',
                        px: 2.5,
                        py: 0.75,
                        color: '#475569',
                        borderColor: '#e2e8f0',
                        fontSize: '0.85rem',
                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LayoutCanvas;
