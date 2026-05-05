"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React, { useState, useEffect } from 'react';
import {
    Typography,
    Divider,
    TextField,
    FormControlLabel,
    Switch,
    Stack,
    IconButton,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    RadioGroup,
    Radio,
    Box,
    Menu,
    Checkbox,
    Link as MuiLink,
    Tooltip,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
} from '@mui/material';
import {
    Close as CloseIcon,
    Delete as DeleteIcon,
    Settings as SettingsIcon,
    OpenInFull as OpenInFullIcon,
    AddCircleOutline as AddCircleOutlineIcon,
    RemoveCircleOutline as RemoveCircleOutlineIcon,
    DragIndicator as DragIndicatorIcon,
    ArrowBack as ArrowBackIcon,
    InfoOutlined as InfoOutlinedIcon,
    DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import {
    layoutSelector,
    setSelectedField,
    updateFieldProperties,
    removeField,
    setPendingFieldChanges,
} from '@/store/slices/general_slices/layout-slice';
import {
    getUnusedPicklistOptions,
    getUnusedStageProbabilityOptions,
} from '@/services/api/general_apis/component-picklist-api';
import { useParams } from 'next/navigation';

const PREDEFINED_CHOICES: Record<string, string[]> = {
    'Days of the week': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    'Month of the year': [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ],
    'Time Zones': [
        'UTC', 'EST', 'CST', 'MST', 'PST', 'EDT', 'CDT', 'MDT', 'PDT',
        'GMT', 'CET', 'CEST', 'IST', 'JST', 'AEST', 'ACST', 'AWST',
    ],
    'US State': [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
        'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
        'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
        'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
        'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
        'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
        'Wisconsin', 'Wyoming',
    ],
    'Continents': ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'],
    'Countries / Regions': [
        'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'India',
        'Japan', 'China', 'Brazil', 'Mexico', 'Italy', 'Spain', 'Netherlands', 'South Korea',
        'Russia', 'South Africa', 'Nigeria', 'Egypt', 'Saudi Arabia', 'United Arab Emirates',
    ],
};

type AddressAvailableFieldState = {
    key: string;
    label: string;
    technicalName: string;
    enabled: boolean;
    required: boolean;
    hide: boolean;
};

type StageEntry = {
    stage_name: string;
    probability: number;
    record_category: 'Open' | 'Closed Won' | 'Closed Lost';
    forecast_category: 'Pipeline' | 'Best Case' | 'Commit' | 'Closed' | 'Omitted';
};

const STAGE_RECORD_CATEGORY_OPTIONS: StageEntry['record_category'][] = ['Open', 'Closed Won', 'Closed Lost'];
const STAGE_FORECAST_CATEGORY_OPTIONS: StageEntry['forecast_category'][] = [
    'Pipeline',
    'Best Case',
    'Commit',
    'Closed',
    'Omitted',
];

const createDefaultStageEntry = (index: number): StageEntry => ({
    stage_name: `Stage ${index + 1}`,
    probability: 0,
    record_category: 'Open',
    forecast_category: 'Pipeline',
});

/** Parse stage options from saved layout JSON into parallel arrays (entries, colors, stable option ids). */
const parseStageFieldState = (
    rawOptions: any,
    genId: () => string
): { entries: StageEntry[]; colors: (string | null)[]; optionIds: (string | null)[] } => {
    if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
        return {
            entries: [createDefaultStageEntry(0)],
            colors: [null],
            optionIds: [genId()],
        };
    }

    const entries: StageEntry[] = [];
    const colors: (string | null)[] = [];
    const optionIds: (string | null)[] = [];

    rawOptions.forEach((opt: any) => {
        if (typeof opt === 'string') {
            const label = opt.trim();
            if (!label) return;
            entries.push({
                stage_name: label,
                probability: 0,
                record_category: 'Open',
                forecast_category: 'Pipeline',
            });
            colors.push(null);
            optionIds.push(genId());
            return;
        }
        if (!opt || typeof opt !== 'object') return;

        const stageName = String(opt.stage_name ?? opt.label ?? opt.value ?? '').trim();
        if (!stageName) return;

        const parsedProbability = Number(opt.probability ?? 0);
        const probability = Number.isFinite(parsedProbability)
            ? Math.min(100, Math.max(0, parsedProbability))
            : 0;

        const record_category = STAGE_RECORD_CATEGORY_OPTIONS.includes(opt.record_category)
            ? opt.record_category
            : 'Open';
        const forecast_category = STAGE_FORECAST_CATEGORY_OPTIONS.includes(opt.forecast_category)
            ? opt.forecast_category
            : 'Pipeline';

        entries.push({
            stage_name: stageName,
            probability,
            record_category,
            forecast_category,
        });
        colors.push(opt.color ?? null);
        optionIds.push(opt.option_id != null && String(opt.option_id) ? String(opt.option_id) : genId());
    });

    if (entries.length === 0) {
        return {
            entries: [createDefaultStageEntry(0)],
            colors: [null],
            optionIds: [genId()],
        };
    }

    return { entries, colors, optionIds };
};

type FieldFormState = {
    label: string;
    name: string;
    placeholder: string;
    required: boolean;
    visible: boolean;
    in_list_view: boolean;
    no_duplicate: boolean;
    max_length: number | "";
    max_digits: number | "";
    decimal_places: number | "";
    salutation_options: string[];
    is_core: boolean;
    doctype: string;
    display_fields: string;
    search_fields: string;
    // Picklist specific fields
    picklistOptions: string[];
    picklistColors: (string | null)[];
    picklistOptionIds: (string | null)[];
    picklistDefault: string;
    picklistSortOrder: 'entered' | 'alphabetical';
    enableHistoryTracking: boolean;
    enableColorForOptions: boolean;
    unusedPicklistValues: any[];
    // Address specific config
    addressAvailableFields: AddressAvailableFieldState[];
    addressDefaultCountry: string;
    // Stage specific config
    stageEntries: StageEntry[];
    stageColors: (string | null)[];
    stageOptionIds: (string | null)[];
    stageEnableColorForOptions: boolean;
};

const FieldProperties: React.FC = () => {
    const dispatch = useDispatch();
    const { activeLayout, selectedField, layoutName, module } = useSelector(layoutSelector) as any;
    const params = useParams();
    const [localField, setLocalField] = useState<FieldFormState | null>(null);
    const [picklistExpanded, setPicklistExpanded] = useState(true);
    const [picklistSettingsAnchor, setPicklistSettingsAnchor] = useState<null | HTMLElement>(null);
    const [stageSettingsAnchor, setStageSettingsAnchor] = useState<null | HTMLElement>(null);
    const [draggingOptionIndex, setDraggingOptionIndex] = useState<number | null>(null);
    const [draggingStageIndex, setDraggingStageIndex] = useState<number | null>(null);
    const [stageExpanded, setStageExpanded] = useState(true);
    const [unusedValuesTarget, setUnusedValuesTarget] = useState<'picklist' | 'stage'>('picklist');
    // Tracks Stage rows removed in this session so they cannot be re-added via "View / Add Unused Values".
    const [stageRemovedOptionLabels, setStageRemovedOptionLabels] = useState<string[]>([]);
    const [showUnusedValues, setShowUnusedValues] = useState(false);
    const [selectedUnusedValues, setSelectedUnusedValues] = useState<string[]>([]);
    const [unusedValuesSearchQuery, setUnusedValuesSearchQuery] = useState('');
    const [duplicateOptionError, setDuplicateOptionError] = useState<string | null>(null);
    const [showPredefinedChoices, setShowPredefinedChoices] = useState(false);
    const [showBulkOptions, setShowBulkOptions] = useState(false);
    const [bulkOptionsText, setBulkOptionsText] = useState('');
    const [selectedPredefinedCategory, setSelectedPredefinedCategory] = useState<string>(
        Object.keys(PREDEFINED_CHOICES)[0] || ''
    );

    const section = activeLayout?.sections?.find(s => s.id === selectedField?.sectionId);
    const field = section?.fields?.find(f => f.id === selectedField?.fieldId);

    const generateOptionId = () => {
        try {
            if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
                return (crypto as any).randomUUID();
            }
        } catch {
            // ignore and fall through
        }
        return `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    };

    useEffect(() => {
        if (field) {
            // Normalize options for picklist / firstname fields into arrays of labels, colors, and IDs
            let picklistOptions: string[] = [];
            let picklistColors: (string | null)[] = [];
            let picklistOptionIds: (string | null)[] = [];

            // Stage fields use dedicated stage* arrays — do not mirror options into picklist state
            if (field.type !== 'stage') {
                const rawOptionsSource =
                    field.type === 'firstname'
                        ? (Array.isArray((field as any).salutation_options)
                            ? (field as any).salutation_options.map((s: string) => ({ label: s, value: s }))
                            : [
                                { label: 'Mr.', value: 'Mr.' },
                                { label: 'Mrs.', value: 'Mrs.' },
                                { label: 'Ms.', value: 'Ms.' },
                                { label: 'Dr.', value: 'Dr.' },
                                { label: 'Prof.', value: 'Prof.' },
                              ])
                        : field.options;

                if (Array.isArray(rawOptionsSource)) {
                    rawOptionsSource.forEach((opt: any) => {
                        if (typeof opt === 'string') {
                            const label = opt;
                            picklistOptions.push(label);
                            picklistColors.push(null);
                            picklistOptionIds.push(generateOptionId());
                        } else if (opt && typeof opt === 'object') {
                            const label = (opt.label ?? opt.value ?? '') as string;
                            if (label) {
                                picklistOptions.push(label);
                                picklistColors.push(opt.color ?? null);
                                picklistOptionIds.push(opt.option_id ?? generateOptionId());
                            }
                        }
                    });
                } else if (typeof rawOptionsSource === 'string') {
                    (rawOptionsSource as string)
                        .split('\n')
                        .map((o: string) => o.trim())
                        .filter(Boolean)
                        .forEach((label: string) => {
                            picklistOptions.push(label);
                            picklistColors.push(null);
                            picklistOptionIds.push(generateOptionId());
                        });
                }
            }

            // Address field defaults
            const ADDRESS_AVAILABLE_DEFAULTS: AddressAvailableFieldState[] = [
                { key: 'country', label: 'Country / Region', technicalName: 'country', enabled: true, required: false, hide: false },
                { key: 'flat', label: 'Flat / House No. / Building / Apartment Name', technicalName: 'address_line1', enabled: true, required: false, hide: false },
                { key: 'address_line1', label: 'Address Line 1', technicalName: 'address_line2', enabled: true, required: false, hide: false },
                // { key: 'address_title', label: 'Address Line 2', technicalName: 'address_title', enabled: true, required: false, hide: false },
                { key: 'city', label: 'City', technicalName: 'city', enabled: true, required: false, hide: false },
                { key: 'state', label: 'State / Province', technicalName: 'state', enabled: true, required: false, hide: false },
                { key: 'pincode', label: 'Pincode / Zip / Postal Code', technicalName: 'pincode', enabled: true, required: false, hide: false },
                { key: 'latitude', label: 'Latitude', technicalName: 'latitude', enabled: true, required: false, hide: false },
                { key: 'longitude', label: 'Longitude', technicalName: 'longitude', enabled: true, required: false, hide: false },
            ];

            const rawAddressAvailable = (field as any).address_available_fields as
                | { key: string; label: string; technical_name: string; enabled: boolean; visible?: boolean; required?: boolean; hide?: boolean }[]
                | undefined;

            const addressAvailableFields: AddressAvailableFieldState[] = ADDRESS_AVAILABLE_DEFAULTS.map(def => {
                const existing = rawAddressAvailable?.find(a => a.key === def.key) || null;
                if (existing) {
                    const hide = existing.hide === true || existing.visible === false || existing.enabled === false;
                    return {
                        key: existing.key,
                        label: existing.label || def.label,
                        technicalName: existing.technical_name || def.technicalName,
                        enabled: !hide,
                        required: !!existing.required,
                        hide,
                    };
                }
                return {
                    ...def,
                    required: false,
                    hide: false,
                };
            });

            const addressDefaultCountry =
                (field as any).address_default_country && typeof (field as any).address_default_country === 'string'
                    ? (field as any).address_default_country
                    : '';
            const stageParsed =
                field.type === 'stage'
                    ? parseStageFieldState((field as any).options, generateOptionId)
                    : parseStageFieldState([], generateOptionId);

            setStageRemovedOptionLabels([]);
            setLocalField({
                label: field.label ?? '',
                name: field.name ?? '',
                placeholder: field.placeholder ?? '',
                required: !!field.required,
                visible: field.visible !== false,
                in_list_view: !!field.in_list_view,
                no_duplicate: !!field.no_duplicate,
                max_length: typeof (field as any).max_length === 'number' ? (field as any).max_length : "",
                max_digits: typeof (field as any).max_digits === 'number'
                    ? (field as any).max_digits
                    : field.type === 'longinteger' || field.type === 'currency' ? 18 : field.type === 'number' ? 9 : "",
                decimal_places: typeof (field as any).decimal_places === 'number'
                    ? (field as any).decimal_places
                    : field.type === 'currency' ? 2 : "",
                salutation_options: Array.isArray((field as any).salutation_options)
                    ? (field as any).salutation_options
                    : ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'],
                is_core: !!field.is_core,
                doctype: field.doctype ?? '',
                display_fields: field.display_fields ?? '',
                search_fields: field.search_fields ?? '',
                picklistOptions,
                picklistColors,
                picklistOptionIds,
                picklistDefault: field.default_value ?? '',
                picklistSortOrder: field.picklist_sort_order === 'alphabetical' ? 'alphabetical' : 'entered',
                enableHistoryTracking: !!field.enable_history_tracking,
                enableColorForOptions:
                    field.type === 'stage' ? false : !!field.enable_color_for_options,
                unusedPicklistValues: [],
                addressAvailableFields,
                addressDefaultCountry,
                stageEntries: stageParsed.entries,
                stageColors: stageParsed.colors,
                stageOptionIds: stageParsed.optionIds,
                stageEnableColorForOptions:
                    field.type === 'stage' ? !!(field as any).enable_color_for_options : false,
            });
            setPicklistExpanded(true);
            setStageExpanded(true);
            setUnusedValuesTarget('picklist');
            setStageSettingsAnchor(null);
            setDraggingStageIndex(null);
            setShowUnusedValues(false);
            setSelectedUnusedValues([]);
            setShowPredefinedChoices(false);
            setSelectedPredefinedCategory(Object.keys(PREDEFINED_CHOICES)[0] || '');
            setShowBulkOptions(false);
            setBulkOptionsText('');
        } else {
            setLocalField(null);
        }
    }, [field, selectedField?.sectionId, selectedField?.fieldId]);

    // On load of picklist or stage field properties, fetch unused picklist values once
    useEffect(() => {
        if (!field || (field.type !== 'select' && field.type !== 'stage') || !localField) return;
        if (localField.unusedPicklistValues && localField.unusedPicklistValues.length > 0) return;
        // Fire and forget; errors are already handled inside helper
        loadUnusedPicklistValues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        field?.id,
        field?.type,
        field?.type === 'select'
            ? localField?.picklistOptions.join('|')
            : localField?.stageEntries.map((e) => e.stage_name).join('|'),
    ]);

    // Signal pending (unapplied) field property changes so Save buttons enable
    useEffect(() => {
        if (!localField || !field) {
            dispatch(setPendingFieldChanges(false));
            return;
        }
        // Compare a lightweight subset of editable properties
        const savedPicklistLabels = Array.isArray(field.options)
            ? field.options.map((o: any) => (typeof o === 'string' ? o : o.label ?? ''))
            : [];
        const savedStageForDirty = parseStageFieldState((field as any).options, () => '');
        const picklistOptionsDirty =
            field.type !== 'stage' &&
            JSON.stringify(localField.picklistOptions) !== JSON.stringify(savedPicklistLabels);
        const stageDirty =
            field.type === 'stage' &&
            JSON.stringify({
                entries: localField.stageEntries,
                colors: localField.stageColors,
                enable: localField.stageEnableColorForOptions,
            }) !==
                JSON.stringify({
                    entries: savedStageForDirty.entries,
                    colors: savedStageForDirty.colors,
                    enable: !!(field as any).enable_color_for_options,
                });

        const dirty =
            localField.label !== (field.label ?? '') ||
            localField.placeholder !== (field.placeholder ?? '') ||
            localField.required !== (field.required ?? false) ||
            localField.visible !== (field.visible ?? true) ||
            localField.in_list_view !== (field.in_list_view ?? false) ||
            localField.no_duplicate !== (field.no_duplicate ?? false) ||
            localField.max_length !== ((field as any).max_length ?? "") ||
            localField.max_digits !== ((field as any).max_digits ?? "") ||
            localField.decimal_places !== ((field as any).decimal_places ?? "") ||
            JSON.stringify(localField.salutation_options) !== JSON.stringify((field as any).salutation_options ?? ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']) ||
            picklistOptionsDirty ||
            stageDirty;
        dispatch(setPendingFieldChanges(dirty));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localField]);

    if (!selectedField || !activeLayout) return null;
    if (!field) return null;
    if (!localField) return null;

    // Treat fields created from the palette in this session as "new" – allow
    // editing their technical name, but keep names for existing/unused fields read-only.
    const isNewRuntimeField = !field.is_core && typeof field.id === 'string' && field.id.startsWith('field-');

    const hasDuplicatePicklistOptions =
        (field.type === 'select' || field.type === 'firstname')
            ? (() => {
                  const seen = new Set<string>();
                  for (const raw of localField.picklistOptions) {
                      const label = raw.trim();
                      if (!label) continue;
                      const key = label.toLowerCase();
                      if (seen.has(key)) return true;
                      seen.add(key);
                  }
                  return false;
              })()
            : false;

    const updateLocal = (key: keyof FieldFormState, value: any) => {
        setLocalField(prev => prev ? { ...prev, [key]: value } : null);
    };

    const updateAddressFieldEnabled = (subKey: string, enabled: boolean) => {
        setLocalField(prev =>
            prev
                ? {
                      ...prev,
                      addressAvailableFields: prev.addressAvailableFields.map(sub =>
                          sub.key === subKey ? { ...sub, enabled, hide: !enabled } : sub
                      ),
                  }
                : prev
        );
    };

    const updateStageEntry = (index: number, key: keyof StageEntry, value: any) => {
        setLocalField(prev => {
            if (!prev) return prev;
            const next = [...prev.stageEntries];
            const current = next[index];
            if (!current) return prev;

            if (key === 'probability') {
                const n = Number(value);
                next[index] = {
                    ...current,
                    probability: Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0,
                };
            } else {
                next[index] = { ...current, [key]: value };
            }

            return { ...prev, stageEntries: next };
        });
    };

    const handleAddStageEntry = (index?: number) => {
        setLocalField(prev => {
            if (!prev) return prev;
            const nextE = [...prev.stageEntries];
            const nextC = [...prev.stageColors];
            const nextI = [...prev.stageOptionIds];
            const insertAt = typeof index === 'number' ? index + 1 : nextE.length;
            nextE.splice(insertAt, 0, createDefaultStageEntry(nextE.length));
            nextC.splice(insertAt, 0, null);
            nextI.splice(insertAt, 0, generateOptionId());
            return { ...prev, stageEntries: nextE, stageColors: nextC, stageOptionIds: nextI };
        });
    };

    const handleRemoveStageEntry = (index: number) => {
        setLocalField(prev => {
            if (!prev) return prev;
            if (prev.stageEntries.length <= 1) return prev;
            const removedName = prev.stageEntries[index]?.stage_name;
            const nextE = prev.stageEntries.filter((_, i) => i !== index);
            const nextC = prev.stageColors.filter((_, i) => i !== index);
            const nextI = prev.stageOptionIds.filter((_, i) => i !== index);
            if (removedName?.trim()) {
                const removedLower = removedName.trim().toLowerCase();
                setStageRemovedOptionLabels(prevLabels =>
                    prevLabels.includes(removedLower) ? prevLabels : [...prevLabels, removedLower]
                );
            }
            return {
                ...prev,
                stageEntries: nextE,
                stageColors: nextC,
                stageOptionIds: nextI,
            };
        });
    };

    const moveStageOption = (index: number, direction: 'up' | 'down') => {
        setLocalField(prev => {
            if (!prev) return prev;
            const nextE = [...prev.stageEntries];
            const nextC = [...prev.stageColors];
            const nextI = [...prev.stageOptionIds];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= nextE.length) return prev;
            const tmpE = nextE[index];
            nextE[index] = nextE[targetIndex];
            nextE[targetIndex] = tmpE;
            const tmpC = nextC[index];
            nextC[index] = nextC[targetIndex];
            nextC[targetIndex] = tmpC;
            const tmpI = nextI[index];
            nextI[index] = nextI[targetIndex];
            nextI[targetIndex] = tmpI;
            return { ...prev, stageEntries: nextE, stageColors: nextC, stageOptionIds: nextI };
        });
    };

    const handleStageColorChange = (index: number, color: string) => {
        setLocalField(prev => {
            if (!prev) return prev;
            const next = [...prev.stageColors];
            next[index] = color;
            return { ...prev, stageColors: next };
        });
    };

    const handleStageSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
        setStageSettingsAnchor(event.currentTarget);
    };

    const handleStageSettingsClose = () => {
        setStageSettingsAnchor(null);
    };

    const handleStageViewAddUnusedValues = () => {
        setUnusedValuesTarget('stage');
        setSelectedUnusedValues([]);
        setDuplicateOptionError(null);
        setUnusedValuesSearchQuery('');
        setShowUnusedValues(true);
        handleStageSettingsClose();
    };


    const handleCancel = () => {
        dispatch(setSelectedField(null));
    };

    const optionValueExistsInUnusedList = (value: string) => {
        if (!value || !(localField.unusedPicklistValues || []).length) return false;
        const key = (value || '').trim().toLowerCase();
        return (localField.unusedPicklistValues || []).some(
            (u: any) =>
                (typeof u === 'string' ? u : u?.label ?? u?.value ?? '').trim().toLowerCase() === key
        );
    };

    const hasOptionInUnusedList =
        (field.type === 'select' || field.type === 'firstname')
            ? localField.picklistOptions.some((opt) => opt.trim() && optionValueExistsInUnusedList(opt))
            : false;

    const hasDuplicateStageOptions =
        field.type === 'stage'
            ? (() => {
                  const seen = new Set<string>();
                  for (const e of localField.stageEntries) {
                      const label = e.stage_name.trim();
                      if (!label) continue;
                      const k = label.toLowerCase();
                      if (seen.has(k)) return true;
                      seen.add(k);
                  }
                  return false;
              })()
            : false;

    const getStageNameFieldError = (index: number) => {
        const name = localField.stageEntries[index]?.stage_name?.trim() ?? '';
        if (!name) return false;
        const dupCount = localField.stageEntries.filter(
            (e) => e.stage_name.trim().toLowerCase() === name.toLowerCase()
        ).length;
        if (dupCount > 1) return true;
        // For stage fields, we only want to flag duplicates within `stageEntries`.
        // `unusedPicklistValues` can still contain the option until the dialog/API refresh,
        // so treating it as an error causes false positives right after "Add".
        return false;
    };

    const handleDone = () => {
        if (hasDuplicatePicklistOptions) {
            // Prevent saving when duplicate picklist option values are present
            return;
        }
        if (hasDuplicateStageOptions) {
            return;
        }
        if (hasOptionInUnusedList) {
            setDuplicateOptionError('Duplicate option found. Enter a unique option.');
            return;
        }
        setDuplicateOptionError(null);

        const nameSanitized = localField.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

        const baseProperties: any = {
            label: localField.label,
            name: nameSanitized,
            placeholder: localField.placeholder || undefined,
            required: localField.required,
            visible: localField.visible,
            in_list_view: localField.in_list_view,
            no_duplicate: localField.no_duplicate,
            max_length: localField.max_length !== "" ? Number(localField.max_length) : undefined,
            max_digits: localField.max_digits !== "" ? Number(localField.max_digits) : undefined,
            decimal_places: localField.decimal_places !== "" ? Number(localField.decimal_places) : undefined,
            salutation_options: field.type === 'firstname' ? localField.salutation_options : undefined,
            is_core: localField.is_core,
            doctype: localField.doctype || undefined,
            display_fields: localField.display_fields || undefined,
            search_fields: localField.search_fields || undefined,
        };

        if (field.type === 'address') {
            baseProperties.address_available_fields = localField.addressAvailableFields.map(sub => ({
                key: sub.key,
                label: sub.label,
                technical_name: sub.technicalName,
                enabled: sub.enabled,
                visible: !sub.hide,
                required: sub.required,
                hide: sub.hide,
            }));
            baseProperties.address_default_country = localField.addressDefaultCountry || undefined;
        }

        if (field.type === 'stage') {
            const defaultColorPalette = ['#7367F0', '#00CFE8', '#28C76F', '#EA5455', '#FF9F43'];

            const normalizedStageOptions = localField.stageEntries.reduce(
                (
                    acc: {
                        label: string;
                        value: string;
                        option_id: string;
                        probability: number;
                        record_category: StageEntry['record_category'];
                        forecast_category: StageEntry['forecast_category'];
                        color?: string;
                    }[],
                    entry,
                    index
                ) => {
                    const label = entry.stage_name.trim();
                    if (!label) return acc;

                    let color: string | undefined = localField.stageColors[index] || undefined;
                    if (localField.stageEnableColorForOptions) {
                        color = color || defaultColorPalette[index % defaultColorPalette.length];
                    } else {
                        color = undefined;
                    }

                    const option_id = localField.stageOptionIds[index] || generateOptionId();

                    acc.push(
                        color
                            ? {
                                  label,
                                  value: label,
                                  option_id,
                                  probability: Number(entry.probability) || 0,
                                  record_category: entry.record_category,
                                  forecast_category: entry.forecast_category,
                                  color,
                              }
                            : {
                                  label,
                                  value: label,
                                  option_id,
                                  probability: Number(entry.probability) || 0,
                                  record_category: entry.record_category,
                                  forecast_category: entry.forecast_category,
                              }
                    );
                    return acc;
                },
                []
            );

            baseProperties.options = normalizedStageOptions;
            baseProperties.default_value = normalizedStageOptions[0]?.value || undefined;
            baseProperties.default_value_option_id = normalizedStageOptions[0]?.option_id || undefined;
            baseProperties.enable_color_for_options = localField.stageEnableColorForOptions;
        }

        // Persist picklist configuration for select and firstname (salutation) fields
        if (field.type === 'select' || field.type === 'firstname') {
            const defaultColorPalette = ['#7367F0', '#00CFE8', '#28C76F', '#EA5455', '#FF9F43'];

            const normalizedOptions = localField.picklistOptions.reduce(
                (acc: { label: string; value: string; color?: string; option_id?: string }[], rawLabel, index) => {
                    const label = rawLabel.trim();
                    if (!label) return acc;

                    let color: string | undefined = localField.picklistColors[index] || undefined;
                    if (localField.enableColorForOptions) {
                        color = color || defaultColorPalette[index % defaultColorPalette.length];
                    } else {
                        color = undefined;
                    }

                    const option_id = localField.picklistOptionIds[index] || generateOptionId();

                    acc.push(
                        color
                            ? { label, value: label, color, option_id }
                            : { label, value: label, option_id }
                    );
                    return acc;
                },
                []
            );

            if (field.type === 'firstname') {
                // Store as salutation_options plain labels array
                baseProperties.salutation_options = normalizedOptions.map((o) => o.label);
                baseProperties.default_value = localField.picklistDefault || undefined;
                baseProperties.picklist_sort_order = localField.picklistSortOrder;
                baseProperties.enable_history_tracking = localField.enableHistoryTracking;
                baseProperties.enable_color_for_options = localField.enableColorForOptions;
            } else {
                baseProperties.options = normalizedOptions;
                baseProperties.default_value = localField.picklistDefault || undefined;
                if (localField.picklistDefault) {
                    const defaultIndex = localField.picklistOptions.findIndex(
                        (opt) => opt.trim() === localField.picklistDefault.trim()
                    );
                    baseProperties.default_value_option_id =
                        defaultIndex >= 0 ? localField.picklistOptionIds[defaultIndex] : undefined;
                } else {
                    baseProperties.default_value_option_id = undefined;
                }
                baseProperties.picklist_sort_order = localField.picklistSortOrder;
                baseProperties.enable_history_tracking = localField.enableHistoryTracking;
                baseProperties.enable_color_for_options = localField.enableColorForOptions;
            }
        }

        dispatch(updateFieldProperties({
            sectionId: selectedField.sectionId,
            fieldId: selectedField.fieldId,
            properties: baseProperties
        }));
        dispatch(setPendingFieldChanges(false));
        dispatch(setSelectedField(null));
    };

    const handleRemoveField = () => {
        dispatch(removeField({
            sectionId: selectedField.sectionId,
            fieldId: selectedField.fieldId
        }));
        dispatch(setPendingFieldChanges(false));
        dispatch(setSelectedField(null));
    };

    const handleNameChange = (value: string) => {
        const sanitized = value.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        updateLocal('name', sanitized);
    };

    const handlePicklistOptionChange = (index: number, value: string) => {
        if (!localField) return;
        setDuplicateOptionError(null);
        const nextOptions = [...localField.picklistOptions];
        nextOptions[index] = value;
        setLocalField(prev =>
            prev
                ? {
                      ...prev,
                      picklistOptions: nextOptions,
                  }
                : null
        );
    };

    const handlePicklistColorChange = (index: number, color: string) => {
        if (!localField) return;
        const nextColors = [...localField.picklistColors];
        nextColors[index] = color;
        setLocalField(prev =>
            prev
                ? {
                      ...prev,
                      picklistColors: nextColors,
                  }
                : null
        );
    };

    const handleAddPicklistOption = () => {
        if (!localField) return;
        const nextOptions = [...localField.picklistOptions, `Option ${localField.picklistOptions.length + 1}`];
        const nextColors = [...localField.picklistColors, null];
        const nextIds = [...localField.picklistOptionIds, generateOptionId()];
        setLocalField(prev =>
            prev
                ? {
                      ...prev,
                      picklistOptions: nextOptions,
                      picklistColors: nextColors,
                      picklistOptionIds: nextIds,
                  }
                : null
        );
    };

    const handleRemovePicklistOption = (index: number) => {
        if (!localField) return;
        const nextOptions = localField.picklistOptions.filter((_, i) => i !== index);
        const nextColors = localField.picklistColors.filter((_, i) => i !== index);
        const nextIds = localField.picklistOptionIds.filter((_, i) => i !== index);
        const removedValue = localField.picklistOptions[index];
        const nextDefault = localField.picklistDefault === removedValue ? '' : localField.picklistDefault;
        // Add removed option back to unused values list
        const currentUnused = localField.unusedPicklistValues || [];
        const alreadyInUnused = currentUnused.some(
            (u: any) =>
                (typeof u === 'string' ? u : u?.label ?? u?.value ?? '') === removedValue
        );
        const nextUnused = alreadyInUnused
            ? currentUnused
            : [...currentUnused, { label: removedValue, value: removedValue }];
        setLocalField(prev =>
            prev
                ? {
                      ...prev,
                      picklistOptions: nextOptions,
                      picklistColors: nextColors,
                      picklistOptionIds: nextIds,
                      picklistDefault: nextDefault,
                      unusedPicklistValues: nextUnused,
                  }
                : null
        );
    };

    const movePicklistOption = (index: number, direction: 'up' | 'down') => {
        if (!localField) return;
        const nextOptions = [...localField.picklistOptions];
        const nextColors = [...localField.picklistColors];
        const nextIds = [...localField.picklistOptionIds];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= nextOptions.length) return;
        const tempOption = nextOptions[index];
        nextOptions[index] = nextOptions[targetIndex];
        nextOptions[targetIndex] = tempOption;
        const tempColor = nextColors[index];
        nextColors[index] = nextColors[targetIndex];
        nextColors[targetIndex] = tempColor;
        const tempId = nextIds[index];
        nextIds[index] = nextIds[targetIndex];
        nextIds[targetIndex] = tempId;
        setLocalField(prev =>
            prev
                ? {
                      ...prev,
                      picklistOptions: nextOptions,
                      picklistColors: nextColors,
                      picklistOptionIds: nextIds,
                  }
                : null
        );
    };

    const handleAddPicklistOptionBelow = (index: number) => {
        if (!localField) return;
        const nextOptions = [...localField.picklistOptions];
        const nextColors = [...localField.picklistColors];
        const nextIds = [...localField.picklistOptionIds];
        nextOptions.splice(index + 1, 0, `Option ${nextOptions.length + 1}`);
        nextColors.splice(index + 1, 0, null);
        nextIds.splice(index + 1, 0, generateOptionId());
        setLocalField(prev =>
            prev
                ? {
                      ...prev,
                      picklistOptions: nextOptions,
                      picklistColors: nextColors,
                      picklistOptionIds: nextIds,
                  }
                : null
        );
    };

    const handlePicklistSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
        setPicklistSettingsAnchor(event.currentTarget);
    };

    const handlePicklistSettingsClose = () => {
        setPicklistSettingsAnchor(null);
    };

    // Fetch unused picklist values from backend and store in hidden state.
    const loadUnusedPicklistValues = async () => {
        try {
            const token =
                readAccessTokenString() ?? '';
            const moduleName = module;
            // Use selected layout id from route params as identifier for API
            const selectedLayoutId = (params as any)?.id as string | undefined;
            const layoutIdentifier = selectedLayoutId || layoutName || '';
            const fieldName = field.name ?? field.fieldname;

            if (!token || !moduleName || !layoutIdentifier || !fieldName) {
                handlePicklistSettingsClose();
                setStageSettingsAnchor(null);
                return;
            }

            const values =
                field.type === 'stage'
                    ? await getUnusedStageProbabilityOptions(
                          moduleName,
                          layoutIdentifier,
                          fieldName,
                          token
                      )
                    : await getUnusedPicklistOptions(moduleName, layoutIdentifier, fieldName, token);

            setLocalField(prev =>
                prev
                    ? {
                          ...prev,
                          unusedPicklistValues: Array.isArray(values) ? values : [],
                      }
                    : prev
            );
        } catch (e) {
            console.error('Failed to load unused picklist values', e);
        }
    };

    const handleViewAddUnusedValues = () => {
        setUnusedValuesTarget('picklist');
        setSelectedUnusedValues([]);
        setDuplicateOptionError(null);
        setUnusedValuesSearchQuery('');
        setShowUnusedValues(true);
        handlePicklistSettingsClose();
    };

    const handleViewAddPredefinedChoices = () => {
        setDuplicateOptionError(null);
        setSelectedPredefinedCategory(Object.keys(PREDEFINED_CHOICES)[0] || '');
        setShowPredefinedChoices(true);
        handlePicklistSettingsClose();
    };

    const handleViewAddBulkOptions = () => {
        setDuplicateOptionError(null);
        setBulkOptionsText('');
        setShowBulkOptions(true);
        handlePicklistSettingsClose();
    };

    const addPredefinedCategoryToOptions = (categoryKey: string) => {
        if (!localField) return;
        const choices = PREDEFINED_CHOICES[categoryKey] || [];
        const nextOptions = [...localField.picklistOptions];
        const nextColors = [...localField.picklistColors];
        const nextIds = [...localField.picklistOptionIds];
        const existingSet = new Set(
            localField.picklistOptions.map((o) => (o || '').trim().toLowerCase())
        );
        // Also treat values already present in unusedPicklistValues as existing,
        // so predefined choices that match them are skipped silently.
        (localField.unusedPicklistValues || []).forEach((u: any) => {
            const label =
                typeof u === 'string' ? u : u?.label ?? u?.value ?? '';
            if (!label) return;
            existingSet.add(label.trim().toLowerCase());
        });
        choices.forEach((label) => {
            if (existingSet.has((label || '').trim().toLowerCase())) return;
            existingSet.add((label || '').trim().toLowerCase());
            nextOptions.push(label);
            nextColors.push(null);
            nextIds.push(generateOptionId());
        });
        setLocalField((prev) =>
            prev
                ? {
                      ...prev,
                      picklistOptions: nextOptions,
                      picklistColors: nextColors,
                      picklistOptionIds: nextIds,
                  }
                : prev
        );
    };

    const handlePicklistSortSelect = (order: 'entered' | 'alphabetical') => {
        updateLocal('picklistSortOrder', order);
        setPicklistSettingsAnchor(null);
    };

    return (
        <Dialog
            open={!!field}
            onClose={handleCancel}
            fullWidth
            maxWidth={field.type === 'stage' ? 'lg' : 'sm'}
        >
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                {showPredefinedChoices ? (
                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ width: '100%' }}>
                        <IconButton size="small" onClick={() => setShowPredefinedChoices(false)}>
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="h6" fontWeight="600">
                            Import Predefined Choices
                        </Typography>
                    </Stack>
                ) : showBulkOptions ? (
                    <Stack direction="row" alignItems="center" gap={0.5} sx={{ width: '100%' }}>
                        <IconButton size="small" onClick={() => setShowBulkOptions(false)}>
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="h6" fontWeight="600">
                            Add Bulk Options
                        </Typography>
                    </Stack>
                ) : showUnusedValues ? (
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 1, width: '100%' }}
                    >
                        <Stack direction="row" alignItems="center" gap={0.5}>
                            <IconButton size="small" onClick={() => setShowUnusedValues(false)}>
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="h6" fontWeight="600">
                                Unused Values{unusedValuesTarget === 'stage' ? ' - Standard' : ''}
                            </Typography>
                            {unusedValuesTarget === 'stage' && (
                                <Chip size="small" label="Standard" sx={{ ml: 1 }} />
                            )}
                        </Stack>
                        <MuiLink
                            component="button"
                            type="button"
                            onClick={() => {
                                const isStage = unusedValuesTarget === 'stage';
                                const stagePresent = new Set(
                                    (localField.stageEntries || [])
                                        .map((e: any) => String(e?.stage_name ?? '').trim().toLowerCase())
                                        .filter(Boolean)
                                );
                                const stageRemoved = new Set(stageRemovedOptionLabels);
                                const allLabels = (localField.unusedPicklistValues || [])
                                    .map((val: any) =>
                                        typeof val === 'string'
                                            ? val
                                            : val?.label ?? val?.value ?? ''
                                    )
                                    .filter((l: string) => !!l)
                                    .filter((l: string) => {
                                        if (!isStage) return true;
                                        const lower = String(l).trim().toLowerCase();
                                        return !stagePresent.has(lower) && !stageRemoved.has(lower);
                                    });
                                const allSelected =
                                    allLabels.length > 0 &&
                                    allLabels.every((l: string) => selectedUnusedValues.includes(l));
                                setSelectedUnusedValues(allSelected ? [] : allLabels);
                            }}
                            sx={{ fontSize: 12 }}
                        >
                            {(() => {
                                const isStage = unusedValuesTarget === 'stage';
                                const stagePresent = new Set(
                                    (localField.stageEntries || [])
                                        .map((e: any) => String(e?.stage_name ?? '').trim().toLowerCase())
                                        .filter(Boolean)
                                );
                                const stageRemoved = new Set(stageRemovedOptionLabels);
                                const allLabels = (localField.unusedPicklistValues || [])
                                    .map((val: any) =>
                                        typeof val === 'string'
                                            ? val
                                            : val?.label ?? val?.value ?? ''
                                    )
                                    .filter((l: string) => !!l)
                                    .filter((l: string) => {
                                        if (!isStage) return true;
                                        const lower = String(l).trim().toLowerCase();
                                        return !stagePresent.has(lower) && !stageRemoved.has(lower);
                                    });
                                const allSelected =
                                    allLabels.length > 0 &&
                                    allLabels.every((l: string) => selectedUnusedValues.includes(l));
                                return allSelected ? 'Unselect All' : 'Select All';
                            })()}
                        </MuiLink>
                    </Stack>
                    ) : (
                        <>
                            <Typography variant="h6" fontWeight="600">
                                Field Properties
                            </Typography>
                            {/* <IconButton size="small" onClick={handleCancel}>
                                <CloseIcon fontSize="small" />
                            </IconButton> */}
                        </>
                    )}
                </Stack>
            </DialogTitle>
            <DialogContent
                dividers
                sx={{
                    height: '600px',
                    overflowY: 'auto',
                    ...(field.type === 'stage' ? { minWidth: { sm: 720 } } : {}),
                }}
            >
               { showPredefinedChoices ? (
                                        <Stack spacing={2} sx={{ height: '100%', overflowY: 'auto' }}>
                                            {duplicateOptionError && (
                                                <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                                                    {duplicateOptionError}
                                                </Typography>
                                            )}
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Import Predefined Choices
                                            </Typography>
                                            <Stack direction="row" spacing={0} sx={{ flex: 1, minHeight: 320 }}>
                                                <Stack
                                                    sx={{
                                                        borderRight: '1px solid',
                                                        borderColor: 'divider',
                                                        overflowY: 'auto',
                                                    }}
                                                >
                                                    {Object.keys(PREDEFINED_CHOICES).map((category) => (
                                                        <Box
                                                            key={category}
                                                            onClick={() => {
                                                                setDuplicateOptionError(null);
                                                                setSelectedPredefinedCategory(category);
                                                            }}
                                                            sx={{
                                                                px: 1.5,
                                                                py: 1.25,
                                                                cursor: 'pointer',
                                                                borderBottom: '1px solid',
                                                                borderColor: 'divider',
                                                                bgcolor:
                                                                    selectedPredefinedCategory === category
                                                                        ? 'action.selected'
                                                                        : 'transparent',
                                                                '&:hover': {
                                                                    bgcolor:
                                                                        selectedPredefinedCategory === category
                                                                            ? 'action.selected'
                                                                            : 'action.hover',
                                                                },
                                                            }}
                                                        >
                                                            <Typography variant="body2">{category}</Typography>
                                                        </Box>
                                                    ))}
                                                </Stack>
                                                <Box
                                                    sx={{
                                                        width: 400,
                                                        p: 1.5,
                                                        border: '1px solid',
                                                        borderColor: 'primary.main',
                                                        borderRadius: 1,
                                                        mx: 1,
                                                        overflowY: 'auto',
                                                        bgcolor: 'background.paper',
                                                    }}
                                                >
                                                    {(PREDEFINED_CHOICES[selectedPredefinedCategory] || []).map(
                                                        (choice: string, idx: number) => (
                                                            <Box
                                                                key={`${choice}-${idx}`}
                                                                sx={{
                                                                    py: 0.75,
                                                                }}
                                                            >
                                                                <Typography variant="body2">{choice}</Typography>
                                                            </Box>
                                                        )
                                                    )}
                                                </Box>
                                            </Stack>
                                        </Stack>
                                    ) : showBulkOptions ? (
                                        <Stack spacing={2} sx={{ height: '100%', overflowY: 'auto' }}>
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                Add Bulk Options
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                minRows={20}
                                                placeholder="Please enter your values sequentially."
                                                value={bulkOptionsText}
                                                onChange={(e) => setBulkOptionsText(e.target.value)}
                                                variant="outlined"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        alignItems: 'flex-start',
                                                    },
                                                }}
                                            />
                                        </Stack>
                                    ) : showUnusedValues ? (
                                        <Stack spacing={3} sx={{ height: '100%', overflowY: 'auto' }}>
                                            {duplicateOptionError && (
                                                <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                                                    {duplicateOptionError}
                                                </Typography>
                                            )}
                                            <Stack spacing={0.5}>
                                                {(localField.unusedPicklistValues || []).length === 0 ? (
                                                    <Typography variant="body2" color="text.secondary">
                                                        No unused values available.
                                                    </Typography>
                                                ) : unusedValuesTarget === 'stage' ? (
                                                    <>
                                                        <TextField
                                                            size="small"
                                                            fullWidth
                                                            placeholder="Search"
                                                            value={unusedValuesSearchQuery}
                                                            onChange={(e) => setUnusedValuesSearchQuery(e.target.value)}
                                                        />
                                                        <TableContainer
                                                            sx={{
                                                                border: '1px solid',
                                                                borderColor: 'divider',
                                                                borderRadius: 1,
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell padding="checkbox" sx={{ width: 48 }} />
                                                                        <TableCell>Stage Name</TableCell>
                                                                        <TableCell>Probability(%)</TableCell>
                                                                        <TableCell>Record Category</TableCell>
                                                                        <TableCell>Forecast Category</TableCell>
                                                                        <TableCell>Layouts Used</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {(localField.unusedPicklistValues || [])
                                                                        .map((val: any, idx: number) => {
                                                                            const label =
                                                                                typeof val === 'string'
                                                                                    ? val
                                                                                    : val?.label ?? val?.value ?? '';
                                                                            if (!label) return null;
                                                                            const labelLower = String(label).trim().toLowerCase();

                                                                            const inStage = (localField.stageEntries || []).some(
                                                                                (e) =>
                                                                                    (e.stage_name || '').trim().toLowerCase() ===
                                                                                    labelLower
                                                                            );
                                                                            const isRemoved = stageRemovedOptionLabels.includes(labelLower);
                                                                            if (inStage || isRemoved) return null;

                                                                            const q = unusedValuesSearchQuery.trim().toLowerCase();
                                                                            const probability =
                                                                                typeof val === 'object' && val != null
                                                                                    ? Number(val?.probability ?? val?.probability_percent ?? 0) || 0
                                                                                    : 0;
                                                                            const recordCategory =
                                                                                typeof val === 'object' && val != null
                                                                                    ? (val?.record_category ?? 'Open')
                                                                                    : 'Open';
                                                                            const forecastCategory =
                                                                                typeof val === 'object' && val != null
                                                                                    ? (val?.forecast_category ?? 'Pipeline')
                                                                                    : 'Pipeline';
                                                                            const usedLayoutName =
                                                                                typeof val === 'object' && val != null
                                                                                    ? val.used_layout_name ??
                                                                                      (Array.isArray(val.used_layouts)
                                                                                          ? val.used_layouts.join(', ')
                                                                                          : val.used_layouts ?? '')
                                                                                    : '';

                                                                            const rowMatches = !q
                                                                                ? true
                                                                                : [
                                                                                      label,
                                                                                      String(probability),
                                                                                      String(recordCategory),
                                                                                      String(forecastCategory),
                                                                                      String(usedLayoutName),
                                                                                  ]
                                                                                      .join(' ')
                                                                                      .toLowerCase()
                                                                                      .includes(q);
                                                                            if (!rowMatches) return null;

                                                                            const checked = selectedUnusedValues.includes(label);
                                                                            return (
                                                                                <TableRow key={`${label}-${idx}`}>
                                                                                    <TableCell padding="checkbox">
                                                                                        <Checkbox
                                                                                            size="small"
                                                                                            checked={checked}
                                                                                            onChange={(e) => {
                                                                                                setSelectedUnusedValues((prev) =>
                                                                                                    e.target.checked
                                                                                                        ? [...prev, label]
                                                                                                        : prev.filter((l) => l !== label)
                                                                                                );
                                                                                            }}
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell sx={{ minWidth: 160 }}>
                                                                                        {label}
                                                                                    </TableCell>
                                                                                    <TableCell sx={{ width: 140 }}>
                                                                                        {probability}
                                                                                    </TableCell>
                                                                                    <TableCell sx={{ width: 160 }}>
                                                                                        {recordCategory}
                                                                                    </TableCell>
                                                                                    <TableCell sx={{ width: 180 }}>
                                                                                        {forecastCategory}
                                                                                    </TableCell>
                                                                                    <TableCell sx={{ minWidth: 180 }}>
                                                                                        {usedLayoutName || '-'}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            );
                                                                        })
                                                                        .filter(Boolean)}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </>
                                                ) : (
                                                    <>
                                                        {(localField.unusedPicklistValues || []).map((val: any, idx: number) => {
                                                            const label =
                                                                typeof val === 'string'
                                                                    ? val
                                                                    : val?.label ?? val?.value ?? '';
                                                            if (!label) return null;
                                                            const labelLower = String(label).trim().toLowerCase();

                                                            const checked = selectedUnusedValues.includes(label);
                                                            const usedLayoutName =
                                                                typeof val === 'object' && val != null
                                                                    ? val.used_layout_name ??
                                                                      (Array.isArray(val.used_layouts)
                                                                          ? val.used_layouts.join(', ')
                                                                          : val.used_layouts ?? '')
                                                                    : '';
                                                            const tooltipTitle = usedLayoutName
                                                                ? `Used Layouts ${usedLayoutName}`
                                                                : 'Used Layouts';
                                                            return (
                                                                <Box
                                                                    key={`${label}-${idx}`}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        px: 1.5,
                                                                        py: 0.75,
                                                                        borderRadius: 1,
                                                                        borderBottom: '1px solid',
                                                                        borderColor: 'divider',
                                                                        bgcolor: checked ? 'action.selected' : 'transparent',
                                                                        '&:hover': {
                                                                            bgcolor: 'action.hover',
                                                                        },
                                                                    }}
                                                                >
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Checkbox
                                                                            size="small"
                                                                            checked={checked}
                                                                            onChange={(e) => {
                                                                                setSelectedUnusedValues((prev) =>
                                                                                    e.target.checked
                                                                                        ? [...prev, label]
                                                                                        : prev.filter((l) => l !== label)
                                                                                );
                                                                            }}
                                                                        />
                                                                        <Typography variant="body2">{label}</Typography>
                                                                        <Tooltip title={tooltipTitle} placement="top">
                                                                            <span>
                                                                                <InfoOutlinedIcon
                                                                                    fontSize="small"
                                                                                    sx={{ color: 'text.disabled', cursor: 'help' }}
                                                                                />
                                                                            </span>
                                                                        </Tooltip>
                                                                    </Box>
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{ color: 'text.disabled' }}
                                                                    >
                                                                        <DeleteOutlineIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </Stack>

                                        </Stack>
                                    ) : (
                                        <Stack spacing={3}>
                                            <TextField
                                                label="Field Label"
                                                fullWidth
                                                value={field.type === 'firstname' ? 'Salutation' : localField.label}
                                                onChange={(e) => {
                                                    if (field.type !== 'firstname') updateLocal('label', e.target.value);
                                                }}
                                                size="small"
                                                disabled={localField.is_core || field.type === 'firstname'}
                                                InputProps={{ readOnly: field.type === 'firstname' }}
                                            />

                                            {/* Technical Name — hidden for firstname (always fixed to first_name) */}
                                            {field.type !== 'firstname' && (
                                                <TextField
                                                    label="Technical Name"
                                                    fullWidth
                                                    value={localField.name}
                                                    onChange={(e) => {
                                                        if (isNewRuntimeField) {
                                                            handleNameChange(e.target.value);
                                                        }
                                                    }}
                                                    size="small"
                                                    InputProps={{ readOnly: !isNewRuntimeField }}
                                                    disabled={!!localField.is_core}
                                                />
                                            )}

                                            {field.type !== 'address' && field.type !== 'firstname' && field.type !== 'stage' && (
                                                <TextField
                                                    label="Placeholder"
                                                    fullWidth
                                                    value={localField.placeholder}
                                                    onChange={(e) => updateLocal('placeholder', e.target.value)}
                                                    size="small"
                                                />
                                            )}

                                            {field.type === 'address' && (
                                                <Box
                                                    sx={{
                                                        mt: 1,
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: 'action.hover',
                                                    }}
                                                >
                                                    <Stack spacing={2}>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            Available fields *
                                                        </Typography>
                                                        <Stack spacing={1}>
                                                            {localField.addressAvailableFields.map(sub => (
                                                                <Box
                                                                    key={sub.key}
                                                                    sx={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        px: 1.5,
                                                                        py: 1,
                                                                        borderRadius: 1,
                                                                        bgcolor: 'background.paper',
                                                                    }}
                                                                >
                                                                    <FormControlLabel
                                                                        control={
                                                                            <Checkbox
                                                                                size="small"
                                                                                checked={sub.enabled}
                                                                                onChange={e =>
                                                                                    updateAddressFieldEnabled(
                                                                                        sub.key,
                                                                                        e.target.checked
                                                                                    )
                                                                                }
                                                                            />
                                                                        }
                                                                        label={sub.label}
                                                                    />
                                                                </Box>
                                                            ))}
                                                        </Stack>

                                                        <Box>
                                                            <Typography
                                                                variant="subtitle2"
                                                                fontWeight={600}
                                                                sx={{ mb: 1 }}
                                                            >
                                                                Default Country
                                                            </Typography>
                                                            <FormControl fullWidth size="small">
                                                                <Select
                                                                    value={localField.addressDefaultCountry}
                                                                    onChange={e =>
                                                                        updateLocal(
                                                                            'addressDefaultCountry',
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    displayEmpty
                                                                >
                                                                    <MenuItem value="">
                                                                        <em>None</em>
                                                                    </MenuItem>
                                                                    {(PREDEFINED_CHOICES['Countries / Regions'] || []).map(
                                                                        country => (
                                                                            <MenuItem key={country} value={country}>
                                                                                {country}
                                                                            </MenuItem>
                                                                        )
                                                                    )}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                    </Stack>
                                                </Box>
                                            )}

                                            {field.type === 'stage' && (
                                                <Box
                                                    sx={{
                                                        mt: 1,
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: 'action.hover',
                                                        width: '100%',
                                                        maxWidth: '100%',
                                                    }}
                                                    onMouseUp={() => setDraggingStageIndex(null)}
                                                    onMouseLeave={() => setDraggingStageIndex(null)}
                                                >
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            Stages
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <IconButton size="small" onClick={handleStageSettingsClick}>
                                                                <SettingsIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setStageExpanded((prev) => !prev)}
                                                            >
                                                                <OpenInFullIcon fontSize="small" />
                                                            </IconButton>
                                                        </Stack>
                                                    </Stack>

                                                    <Menu
                                                        anchorEl={stageSettingsAnchor}
                                                        open={Boolean(stageSettingsAnchor)}
                                                        onClose={handleStageSettingsClose}
                                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                                    >
                                                        <MenuItem onClick={handleStageViewAddUnusedValues}>
                                                            View / Add Unused Values
                                                        </MenuItem>
                                                    </Menu>

                                                    {stageExpanded && (
                                                        <Stack spacing={2} sx={{ maxHeight: 360, overflowY: 'auto' }}>
                                                            {duplicateOptionError && (
                                                                <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                                                                    {duplicateOptionError}
                                                                </Typography>
                                                            )}
                                                            {hasDuplicateStageOptions && (
                                                                <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                                                                    Duplicate stage names are not allowed.
                                                                </Typography>
                                                            )}
                                                            <Box
                                                                sx={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: localField.stageEnableColorForOptions
                                                                        ? '36px 40px minmax(140px, 1.6fr) minmax(90px, 0.9fr) minmax(95px, 0.75fr) minmax(95px, 0.75fr) auto'
                                                                        : '36px minmax(140px, 1.6fr) minmax(90px, 0.9fr) minmax(95px, 0.75fr) minmax(95px, 0.75fr) auto',
                                                                    gap: 1,
                                                                    px: 0.5,
                                                                    py: 0.5,
                                                                    color: 'text.secondary',
                                                                    fontSize: 12,
                                                                    fontWeight: 600,
                                                                    alignItems: 'center',
                                                                }}
                                                            >
                                                                <Box />
                                                                {localField.stageEnableColorForOptions && <Box> </Box>}
                                                                <Box>Stage Name</Box>
                                                                <Box>Probability (%)</Box>
                                                                <Box>Record Category</Box>
                                                                <Box>Forecast Category</Box>
                                                                <Box />
                                                            </Box>

                                                            {localField.stageEntries.map((entry, idx) => {
                                                                const rowKey =
                                                                    localField.stageOptionIds[idx] ?? `stage-row-${idx}`;
                                                                const swatchColor =
                                                                    localField.stageEnableColorForOptions &&
                                                                    localField.stageColors[idx]
                                                                        ? localField.stageColors[idx]
                                                                        : '#7367F0';
                                                                return (
                                                                    <Box
                                                                        key={rowKey}
                                                                        sx={{
                                                                            display: 'grid',
                                                                            gridTemplateColumns: localField.stageEnableColorForOptions
                                                                                ? '36px 40px minmax(140px, 1.6fr) minmax(90px, 0.9fr) minmax(95px, 0.75fr) minmax(95px, 0.75fr) auto'
                                                                                : '36px minmax(140px, 1.6fr) minmax(90px, 0.9fr) minmax(95px, 0.75fr) minmax(95px, 0.75fr) auto',
                                                                            gap: 1,
                                                                            alignItems: 'center',
                                                                        }}
                                                                        onMouseEnter={() => {
                                                                            if (
                                                                                draggingStageIndex !== null &&
                                                                                draggingStageIndex !== idx
                                                                            ) {
                                                                                const direction =
                                                                                    idx > draggingStageIndex ? 'down' : 'up';
                                                                                moveStageOption(draggingStageIndex, direction);
                                                                                setDraggingStageIndex(
                                                                                    direction === 'down'
                                                                                        ? draggingStageIndex + 1
                                                                                        : draggingStageIndex - 1
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <IconButton
                                                                            size="small"
                                                                            onMouseDown={() => setDraggingStageIndex(idx)}
                                                                        >
                                                                            <DragIndicatorIcon fontSize="small" color="disabled" />
                                                                        </IconButton>

                                                                        {localField.stageEnableColorForOptions && (
                                                                            <Box
                                                                                sx={{
                                                                                    position: 'relative',
                                                                                    width: 32,
                                                                                    height: 32,
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                }}
                                                                            >
                                                                                <IconButton size="small" sx={{ p: 0.5 }}>
                                                                                    <Box
                                                                                        sx={{
                                                                                            width: 16,
                                                                                            height: 16,
                                                                                            borderRadius: '50%',
                                                                                            bgcolor: swatchColor,
                                                                                            border: '2px solid',
                                                                                            borderColor: 'background.paper',
                                                                                            boxShadow: 1,
                                                                                        }}
                                                                                    />
                                                                                </IconButton>
                                                                                <input
                                                                                    type="color"
                                                                                    value={swatchColor || '#000000'}
                                                                                    onChange={(e) =>
                                                                                        handleStageColorChange(idx, e.target.value)
                                                                                    }
                                                                                    style={{
                                                                                        position: 'absolute',
                                                                                        inset: 0,
                                                                                        opacity: 0,
                                                                                        cursor: 'pointer',
                                                                                    }}
                                                                                />
                                                                            </Box>
                                                                        )}

                                                                        <TextField
                                                                            size="small"
                                                                            fullWidth
                                                                            value={entry.stage_name}
                                                                    error={getStageNameFieldError(idx)}
                                                                            onChange={(e) => {
                                                                                setDuplicateOptionError(null);
                                                                                updateStageEntry(idx, 'stage_name', e.target.value);
                                                                            }}
                                                                            placeholder="Stage Name"
                                                                    sx={{ minWidth: 0 }}
                                                                    helperText={
                                                                        getStageNameFieldError(idx)
                                                                            ? 'Duplicate or unused-list conflict.'
                                                                            : undefined
                                                                    }
                                                                        />
                                                                        <TextField
                                                                            size="small"
                                                                            fullWidth
                                                                            type="number"
                                                                            value={entry.probability}
                                                                            onChange={(e) =>
                                                                                updateStageEntry(idx, 'probability', e.target.value)
                                                                            }
                                                                            inputProps={{ min: 0, max: 100 }}
                                                                            sx={{ minWidth: 0 }}
                                                                        />
                                                                        <FormControl size="small" fullWidth sx={{ minWidth: 0 }}>
                                                                            <Select
                                                                                value={entry.record_category}
                                                                                onChange={(e) =>
                                                                                    updateStageEntry(
                                                                                        idx,
                                                                                        'record_category',
                                                                                        e.target.value as StageEntry['record_category']
                                                                                    )
                                                                                }
                                                                            >
                                                                                {STAGE_RECORD_CATEGORY_OPTIONS.map((option) => (
                                                                                    <MenuItem key={option} value={option}>
                                                                                        {option}
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>
                                                                        <FormControl size="small" fullWidth sx={{ minWidth: 0 }}>
                                                                            <Select
                                                                                value={entry.forecast_category}
                                                                                onChange={(e) =>
                                                                                    updateStageEntry(
                                                                                        idx,
                                                                                        'forecast_category',
                                                                                        e.target.value as StageEntry['forecast_category']
                                                                                    )
                                                                                }
                                                                            >
                                                                                {STAGE_FORECAST_CATEGORY_OPTIONS.map((option) => (
                                                                                    <MenuItem key={option} value={option}>
                                                                                        {option}
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>
                                                                        <Stack direction="row" spacing={0.5}>
                                                                            <IconButton
                                                                                size="small"
                                                                                color="primary"
                                                                                onClick={() => handleAddStageEntry(idx)}
                                                                                aria-label="Add stage row"
                                                                            >
                                                                                <AddCircleOutlineIcon fontSize="small" />
                                                                            </IconButton>
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => handleRemoveStageEntry(idx)}
                                                                                disabled={localField.stageEntries.length <= 1}
                                                                                aria-label="Remove stage row"
                                                                            >
                                                                                <RemoveCircleOutlineIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Stack>
                                                                    </Box>
                                                                );
                                                            })}

                                                            <FormControlLabel
                                                                control={
                                                                    <Switch
                                                                        checked={localField.stageEnableColorForOptions}
                                                                        onChange={(e) =>
                                                                            updateLocal(
                                                                                'stageEnableColorForOptions',
                                                                                e.target.checked
                                                                            )
                                                                        }
                                                                        size="small"
                                                                    />
                                                                }
                                                                label="Enable color for options."
                                                            />
                                                        </Stack>
                                                    )}
                                                </Box>
                                            )}

                                            {(field.type === 'select' || field.type === 'firstname') && (
                                                <>
                                                    <Box
                                                        sx={{
                                                            mt: 1,
                                                            p: 2,
                                                            borderRadius: 2,
                                                            bgcolor: 'action.hover',
                                                        }}
                                                        onMouseUp={() => setDraggingOptionIndex(null)}
                                                        onMouseLeave={() => setDraggingOptionIndex(null)}
                                                    >
                                                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                                                            <Typography variant="subtitle2" fontWeight={600}>
                                                                Pick List Option
                                                            </Typography>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={handlePicklistSettingsClick}
                                                                >
                                                                    <SettingsIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => setPicklistExpanded(prev => !prev)}
                                                                >
                                                                    <OpenInFullIcon fontSize="small" />
                                                                </IconButton>
                                                            </Stack>
                                                        </Stack>

                                                        <Menu
                                                            anchorEl={picklistSettingsAnchor}
                                                            open={Boolean(picklistSettingsAnchor)}
                                                            onClose={handlePicklistSettingsClose}
                                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                                        >
                                                            <MenuItem onClick={handleViewAddUnusedValues}>
                                                                View / Add Unused Values
                                                            </MenuItem>
                                                            <Divider />
                                                            <MenuItem onClick={handleViewAddPredefinedChoices}>
                                                                Add Predefined Choices
                                                            </MenuItem>
                                                            <MenuItem onClick={handleViewAddBulkOptions}>
                                                                Add Bulk Options
                                                            </MenuItem>
                                                            {/* <Divider />
                                                            <MenuItem onClick={handlePicklistSettingsClose}>
                                                                Convert to Global Set
                                                            </MenuItem> */}
                                                        </Menu>

                                                        {picklistExpanded && (
                                                                <Stack spacing={2} sx={{ height: 300, overflowY: 'auto' }}>
                                                                    {duplicateOptionError && (
                                                                        <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                                                                            {duplicateOptionError}
                                                                        </Typography>
                                                                    )}
                                                                    <Stack spacing={1} mt={1}>
                                                                        {localField.picklistOptions.map((opt, index) => {
                                                                            const color =
                                                                                localField.enableColorForOptions &&
                                                                                localField.picklistColors[index]
                                                                                    ? localField.picklistColors[index]
                                                                                    : '#7367F0';
                                                                            return (
                                                                                <Stack
                                                                                    direction="row"
                                                                                    spacing={1}
                                                                                    alignItems="center"
                                                                                    key={index}
                                                                                    onMouseEnter={() => {
                                                                                        if (
                                                                                            draggingOptionIndex !== null &&
                                                                                            draggingOptionIndex !== index
                                                                                        ) {
                                                                                            const direction =
                                                                                                index > draggingOptionIndex ? 'down' : 'up';
                                                                                            movePicklistOption(draggingOptionIndex, direction);
                                                                                            setDraggingOptionIndex(
                                                                                                direction === 'down'
                                                                                                    ? draggingOptionIndex + 1
                                                                                                    : draggingOptionIndex - 1
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        onMouseDown={() => setDraggingOptionIndex(index)}
                                                                                    >
                                                                                        <DragIndicatorIcon
                                                                                            fontSize="small"
                                                                                            color="disabled"
                                                                                        />
                                                                                    </IconButton>

                                                                                    {localField.enableColorForOptions && (
                                                                                        <Box
                                                                                            sx={{
                                                                                                position: 'relative',
                                                                                                width: 32,
                                                                                                height: 32,
                                                                                                display: 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                            }}
                                                                                        >
                                                                                            <IconButton
                                                                                                size="small"
                                                                                                sx={{ p: 0.5 }}
                                                                                            >
                                                                                                <Box
                                                                                                    sx={{
                                                                                                        width: 16,
                                                                                                        height: 16,
                                                                                                        borderRadius: '50%',
                                                                                                        bgcolor: color,
                                                                                                        border: '2px solid #fff',
                                                                                                        boxShadow: 1,
                                                                                                    }}
                                                                                                />
                                                                                            </IconButton>
                                                                                            <input
                                                                                                type="color"
                                                                                                value={color || '#000000'}
                                                                                                onChange={(e) =>
                                                                                                    handlePicklistColorChange(
                                                                                                        index,
                                                                                                        e.target.value
                                                                                                    )
                                                                                                }
                                                                                                style={{
                                                                                                    position: 'absolute',
                                                                                                    inset: 0,
                                                                                                    opacity: 0,
                                                                                                    cursor: 'pointer',
                                                                                                }}
                                                                                            />
                                                                                        </Box>
                                                                                    )}

                                                                                    <TextField
                                                                                        fullWidth
                                                                                        size="small"
                                                                                        value={opt}
                                                                                        onChange={(e) =>
                                                                                            handlePicklistOptionChange(index, e.target.value)
                                                                                        }
                                                                                        error={
                                                                                            !!opt.trim() &&
                                                                                            (localField.picklistOptions.filter(
                                                                                                (v) =>
                                                                                                    v
                                                                                                        .trim()
                                                                                                        .toLowerCase() === opt.trim().toLowerCase()
                                                                                            ).length > 1 ||
                                                                                                optionValueExistsInUnusedList(opt))
                                                                                        }
                                                                                        helperText={
                                                                                            !!opt.trim() &&
                                                                                            (localField.picklistOptions.filter(
                                                                                                (v) =>
                                                                                                    v
                                                                                                        .trim()
                                                                                                        .toLowerCase() === opt.trim().toLowerCase()
                                                                                            ).length > 1 ||
                                                                                                optionValueExistsInUnusedList(opt))
                                                                                                ? 'Duplicate option found. Enter a unique option.'
                                                                                                : ' '
                                                                                        }
                                                                                        FormHelperTextProps={{ sx: { mt: 0.25 } }}
                                                                                        sx={{
                                                                                            '& .MuiInputBase-root': {
                                                                                                minHeight: 44,
                                                                                                bgcolor: 'common.white',
                                                                                            },
                                                                                            '& .MuiInputBase-input': {
                                                                                                py: 1.25,
                                                                                            },
                                                                                        }}
                                                                                    />
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        color="primary"
                                                                                        onClick={() => handleAddPicklistOptionBelow(index)}
                                                                                    >
                                                                                        <AddCircleOutlineIcon fontSize="small" />
                                                                                    </IconButton>
                                                                                    <IconButton
                                                                                        size="small"
                                                                                        color="default"
                                                                                        onClick={() => handleRemovePicklistOption(index)}
                                                                                    >
                                                                                        <RemoveCircleOutlineIcon fontSize="small" />
                                                                                    </IconButton>
                                                                                </Stack>
                                                                            );
                                                                        })}
                                                                    </Stack>
                                                                </Stack>
                                                            
                                                        )}
                                                    </Box>

                                                    <TextField
                                                        select
                                                        label="Select default value"
                                                        fullWidth
                                                        size="small"
                                                        value={localField.picklistDefault || ''}
                                                        onChange={(e) => updateLocal('picklistDefault', e.target.value)}
                                                        sx={{ mt: 2 }}
                                                    >
                                                        <MenuItem value="">
                                                            <em>-None-</em>
                                                        </MenuItem>
                                                        {localField.picklistOptions
                                                            .map((opt) => opt.trim())
                                                            .filter(Boolean)
                                                            .map((opt) => (
                                                                <MenuItem key={opt} value={opt}>
                                                                    {opt}
                                                                </MenuItem>
                                                            ))}
                                                    </TextField>

                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={localField.enableHistoryTracking}
                                                                onChange={(e) =>
                                                                    updateLocal('enableHistoryTracking', e.target.checked)
                                                                }
                                                                size="small"
                                                            />
                                                        }
                                                        label="Enable history tracking for picklist values."
                                                        sx={{ mt: 1 }}
                                                    />

                                                    <Typography variant="subtitle2" sx={{ mt: 2 }}>
                                                        Sort order preference
                                                    </Typography>
                                                    <RadioGroup
                                                        row
                                                        value={localField.picklistSortOrder}
                                                        onChange={(e) =>
                                                            updateLocal('picklistSortOrder', e.target.value as 'entered' | 'alphabetical')
                                                        }
                                                    >
                                                        <FormControlLabel
                                                            value="entered"
                                                            control={<Radio size="small" />}
                                                            label="Entered order"
                                                        />
                                                        <FormControlLabel
                                                            value="alphabetical"
                                                            control={<Radio size="small" />}
                                                            label="Alphabetical order"
                                                        />
                                                    </RadioGroup>
                                                    <Box
                                                        sx={{
                                                            mt: 1,
                                                            p: 1.5,
                                                            borderRadius: 1,
                                                            bgcolor: 'background.paper',
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                        }}
                                                    >
                                                        <Typography variant="caption" color="text.secondary">
                                                            {localField.picklistSortOrder === 'alphabetical'
                                                                ? 'Values will be sorted alphabetically in respective languages.'
                                                                : 'The order customized here will be followed in list views, reports and dashboards where sorting is applied for this picklist field.'}
                                                        </Typography>
                                                    </Box>

                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={localField.enableColorForOptions}
                                                                onChange={(e) =>
                                                                    updateLocal('enableColorForOptions', e.target.checked)
                                                                }
                                                                size="small"
                                                            />
                                                        }
                                                        label="Enable color for options."
                                                        sx={{ mt: 1 }}
                                                    />
                                                </>
                                            )}

                                            {field.type === 'lookup' && (
                                                <>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Module</InputLabel>
                                                        <Select
                                                            value={localField.doctype}
                                                            label="Module"
                                                            onChange={(e) => updateLocal('doctype', e.target.value)}
                                                            disabled={localField.is_core}
                                                        >
                                                            <MenuItem value="Leads">Leads</MenuItem>
                                                            <MenuItem value="User">User</MenuItem>
                                                            <MenuItem value="Contact">Contact</MenuItem>
                                                            <MenuItem value="CRM Organization">Accounts</MenuItem>
                                                            {typeof module === 'string' && module.trim().toLowerCase() === 'users' && (
                                                                <MenuItem value="SDL Role">Role</MenuItem>
                                                            )}
                                                            {typeof module === 'string' && module.trim().toLowerCase() === 'users' && (
                                                                <MenuItem value="Language">Language</MenuItem>
                                                            )}
                                                        </Select>
                                                    </FormControl>

                                                    <TextField
                                                        label="Display Fields"
                                                        fullWidth
                                                        value={localField.display_fields}
                                                        onChange={(e) => updateLocal('display_fields', e.target.value)}
                                                        size="small"
                                                        placeholder="e.g. first_name, last_name"
                                                    />

                                                    <TextField
                                                        label="Search Fields"
                                                        fullWidth
                                                        value={localField.search_fields}
                                                        onChange={(e) => updateLocal('search_fields', e.target.value)}
                                                        size="small"
                                                        placeholder="e.g. email, phone"
                                                    />
                                                </>
                                            )}

                                            {field.type !== 'address' && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={localField.required}
                                                            onChange={(e) => updateLocal('required', e.target.checked)}
                                                            size="small"
                                                        />
                                                    }
                                                    label="Required Field"
                                                />
                                            )}

                                            {['text', 'email', 'phone', 'mobile_no'].includes(field.type) && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={localField.no_duplicate}
                                                            onChange={(e) => updateLocal('no_duplicate', e.target.checked)}
                                                            size="small"
                                                        />
                                                    }
                                                    label="Do Not Allow Duplicate Value"
                                                />
                                            )}

                                            {['text', 'phone', 'url'].includes(field.type) && (
                                                <Box sx={{ mt: 1 }}>
                                                    <TextField
                                                        label="Maximum Length"
                                                        type="number"
                                                        size="small"
                                                        fullWidth
                                                        value={localField.max_length}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            if (raw === "") {
                                                                updateLocal('max_length', "");
                                                            } else {
                                                                const n = Math.min(255, Math.max(1, parseInt(raw, 10) || 1));
                                                                updateLocal('max_length', n);
                                                            }
                                                        }}
                                                        inputProps={{ min: 1, max: 255 }}
                                                        helperText="1 – 255 characters (leave blank for no limit)"
                                                    />
                                                </Box>
                                            )}

                                            {['number', 'longinteger', 'currency'].includes(field.type) && (
                                                <Box sx={{ mt: 1 }}>
                                                    <TextField
                                                        label="Maximum Digits Allowed"
                                                        type="number"
                                                        size="small"
                                                        fullWidth
                                                        value={localField.max_digits}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            if (raw === "") {
                                                                updateLocal('max_digits', "");
                                                            } else {
                                                                const cap = field.type === 'number' ? 9 : 18;
                                                                const n = Math.min(cap, Math.max(1, parseInt(raw, 10) || 1));
                                                                updateLocal('max_digits', n);
                                                            }
                                                        }}
                                                        inputProps={{
                                                            min: 1,
                                                            max: field.type === 'number' ? 9 : 18,
                                                        }}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <Tooltip title={
                                                                        field.type === 'currency' ? 'Eg: 12345.55' :
                                                                        field.type === 'longinteger' ? 'Eg: 123456789012345678' :
                                                                        'Eg: 123456789'
                                                                    }>
                                                                        <Typography variant="caption" color="text.secondary" sx={{ cursor: 'default' }}>
                                                                            {field.type === 'currency' ? 'Eg: 12345.55' : 'Digits'}&nbsp;ⓘ
                                                                        </Typography>
                                                                    </Tooltip>
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        helperText={
                                                            field.type === 'number' ? 'Max 9 digits for Number' :
                                                            field.type === 'currency' ? 'Max 18 digits for Currency' :
                                                            'Max 18 digits for Long Integer'
                                                        }
                                                    />
                                                </Box>
                                            )}

                                            {field.type === 'currency' && (
                                                <Box sx={{ mt: 1 }}>
                                                    <TextField
                                                        label="Number of Decimal Places"
                                                        type="number"
                                                        size="small"
                                                        fullWidth
                                                        value={localField.decimal_places}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            if (raw === "") {
                                                                updateLocal('decimal_places', "");
                                                            } else {
                                                                const n = Math.min(10, Math.max(0, parseInt(raw, 10) || 0));
                                                                updateLocal('decimal_places', n);
                                                            }
                                                        }}
                                                        inputProps={{ min: 0, max: 10 }}
                                                        InputProps={{
                                                            endAdornment: (
                                                                <InputAdornment position="end">
                                                                    <Tooltip title="Eg: 12345.55">
                                                                        <Typography variant="caption" color="text.secondary" sx={{ cursor: 'default' }}>
                                                                            Eg: 12345.55&nbsp;ⓘ
                                                                        </Typography>
                                                                    </Tooltip>
                                                                </InputAdornment>
                                                            ),
                                                        }}
                                                        helperText="0 – 10 decimal places (default: 2)"
                                                    />
                                                </Box>
                                            )}

                                            {field.type !== 'address' && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={localField.visible}
                                                            onChange={(e) => updateLocal('visible', e.target.checked)}
                                                            size="small"
                                                        />
                                                    }
                                                    label="Visible by Default"
                                                />
                                            )}

                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={localField.in_list_view}
                                                        onChange={(e) => updateLocal('in_list_view', e.target.checked)}
                                                        size="small"
                                                    />
                                                }
                                                label="In List View"
                                            />

                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={localField.is_core}
                                                        onChange={(e) => updateLocal('is_core', e.target.checked)}
                                                        size="small"
                                                        disabled={localField.is_core}
                                                    />
                                                }
                                                label="Core Field (Cannot be deleted)"
                                            />

                                            <Divider sx={{ my: 1 }} />

                                            {!field.is_core && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    fullWidth
                                                    onClick={handleRemoveField}
                                                    sx={{ mt: 2 }}
                                                >
                                                    Remove Field
                                                </Button>
                                            )}
                                        </Stack> 
                                    )}
            </DialogContent>
            {showPredefinedChoices ? (
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            setDuplicateOptionError(null);
                            setShowPredefinedChoices(false);
                        }}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            if (!localField) return;
                            setDuplicateOptionError(null);
                            addPredefinedCategoryToOptions(selectedPredefinedCategory);
                            setShowPredefinedChoices(false);
                        }}
                    >
                        Add Values
                    </Button>
                </DialogActions>
            ) : showBulkOptions ? (
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            setDuplicateOptionError(null);
                            setShowBulkOptions(false);
                            setBulkOptionsText('');
                        }}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            if (!localField) return;
                            const rawLines = bulkOptionsText.split(/\r?\n/);
                            const cleaned = rawLines
                                .map((line) => line.trim())
                                .filter((line) => !!line);
                            if (cleaned.length === 0) {
                                setShowBulkOptions(false);
                                setBulkOptionsText('');
                                return;
                            }
                            const nextOptions = [...localField.picklistOptions];
                            const nextColors = [...localField.picklistColors];
                            const nextIds = [...localField.picklistOptionIds];
                            const existingSet = new Set(
                                localField.picklistOptions.map((o) => (o || '').trim().toLowerCase())
                            );
                            (localField.unusedPicklistValues || []).forEach((u: any) => {
                                const label =
                                    typeof u === 'string' ? u : u?.label ?? u?.value ?? '';
                                if (!label) return;
                                existingSet.add(label.trim().toLowerCase());
                            });
                            cleaned.forEach((label) => {
                                const key = label.trim().toLowerCase();
                                if (existingSet.has(key)) return;
                                existingSet.add(key);
                                nextOptions.push(label);
                                nextColors.push(null);
                                nextIds.push(generateOptionId());
                            });
                            setLocalField((prev) =>
                                prev
                                    ? {
                                          ...prev,
                                          picklistOptions: nextOptions,
                                          picklistColors: nextColors,
                                          picklistOptionIds: nextIds,
                                      }
                                    : prev
                            );
                            setBulkOptionsText('');
                            setShowBulkOptions(false);
                        }}
                    >
                        Add Values
                    </Button>
                </DialogActions>
            ) : showUnusedValues ? (
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            setDuplicateOptionError(null);
                            setShowUnusedValues(false);
                        }}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        disabled={selectedUnusedValues.length === 0}
                        onClick={() => {
                            setDuplicateOptionError(null);

                            if (unusedValuesTarget === 'stage') {
                                const removedSet = new Set(stageRemovedOptionLabels.map((l) => l.trim().toLowerCase()));
                                const unusedList = localField.unusedPicklistValues || [];

                                let nextEntries = [...localField.stageEntries];
                                let nextColors = [...localField.stageColors];
                                let nextIds = [...localField.stageOptionIds];

                                selectedUnusedValues.forEach((label) => {
                                    const labelTrim = (label || '').trim();
                                    if (!labelTrim) return;
                                    const labelLower = labelTrim.toLowerCase();

                                    const exists = nextEntries.some(
                                        (e) =>
                                            (e.stage_name || '').trim().toLowerCase() === labelLower
                                    );
                                    if (exists) return;
                                    if (removedSet.has(labelLower)) return;

                                    const unusedItem = unusedList.find(
                                        (u: any) =>
                                            (typeof u === 'string' ? u : u?.label ?? u?.value ?? '').trim().toLowerCase() ===
                                            labelLower
                                    );

                                    const optionId =
                                        typeof unusedItem === 'object' && unusedItem?.option_id
                                            ? unusedItem.option_id
                                            : generateOptionId();

                                    const color =
                                        localField.stageEnableColorForOptions &&
                                        typeof unusedItem === 'object' &&
                                        unusedItem?.color != null
                                            ? unusedItem.color
                                            : null;

                                    const probability =
                                        typeof unusedItem === 'object' && unusedItem != null
                                            ? Number(unusedItem?.probability ?? unusedItem?.probability_percent ?? 0) || 0
                                            : 0;
                                    const record_category =
                                        typeof unusedItem === 'object' && unusedItem != null
                                            ? (STAGE_RECORD_CATEGORY_OPTIONS.includes(unusedItem?.record_category)
                                                  ? unusedItem?.record_category
                                                  : 'Open')
                                            : 'Open';
                                    const forecast_category =
                                        typeof unusedItem === 'object' && unusedItem != null
                                            ? (STAGE_FORECAST_CATEGORY_OPTIONS.includes(unusedItem?.forecast_category)
                                                  ? unusedItem?.forecast_category
                                                  : 'Pipeline')
                                            : 'Pipeline';

                                    nextEntries.push({
                                        stage_name: labelTrim,
                                        probability: Math.min(100, Math.max(0, probability)),
                                        record_category,
                                        forecast_category,
                                    });
                                    nextColors.push(color);
                                    nextIds.push(optionId);
                                });

                                const addedSet = new Set(
                                    selectedUnusedValues.map((l) => (l || '').trim().toLowerCase())
                                );
                                const nextUnused = (localField.unusedPicklistValues || []).filter((u: any) => {
                                    const l = typeof u === 'string' ? u : u?.label ?? u?.value ?? '';
                                    return !addedSet.has((l || '').trim().toLowerCase());
                                });

                                setLocalField((prev) =>
                                    prev
                                        ? {
                                              ...prev,
                                              stageEntries: nextEntries,
                                              stageColors: nextColors,
                                              stageOptionIds: nextIds,
                                              unusedPicklistValues: nextUnused,
                                          }
                                        : prev
                                );

                                setShowUnusedValues(false);
                                setSelectedUnusedValues([]);
                                return;
                            }

                            const currentOptions = localField.picklistOptions || [];
                            const hasDuplicate = selectedUnusedValues.some((label) =>
                                currentOptions.some(
                                    (opt) =>
                                        (opt || '').trim().toLowerCase() ===
                                        (label || '').trim().toLowerCase()
                                )
                            );
                            if (hasDuplicate) {
                                setDuplicateOptionError('Duplicate option found. Enter a unique option.');
                                return;
                            }

                            let nextOptions = [...localField.picklistOptions];
                            let nextColors = [...localField.picklistColors];
                            let nextIds = [...localField.picklistOptionIds];
                            const unusedList = localField.unusedPicklistValues || [];

                            selectedUnusedValues.forEach((label) => {
                                const exists = nextOptions.some(
                                    (opt) =>
                                        opt.trim().toLowerCase() ===
                                        label.trim().toLowerCase()
                                );
                                if (!exists) {
                                    const unusedItem = unusedList.find(
                                        (u: any) =>
                                            (typeof u === 'string' ? u : u?.label ?? u?.value ?? '').trim().toLowerCase() ===
                                            label.trim().toLowerCase()
                                    );
                                    const optionId =
                                        typeof unusedItem === 'object' && unusedItem?.option_id
                                            ? unusedItem.option_id
                                            : generateOptionId();
                                    const color =
                                        typeof unusedItem === 'object' && unusedItem?.color != null
                                            ? unusedItem.color
                                            : null;
                                    nextOptions.push(label);
                                    nextColors.push(color);
                                    nextIds.push(optionId);
                                }
                            });

                            const addedSet = new Set(
                                selectedUnusedValues.map((l) => (l || '').trim().toLowerCase())
                            );
                            const nextUnused = (localField.unusedPicklistValues || []).filter((u: any) => {
                                const l = typeof u === 'string' ? u : u?.label ?? u?.value ?? '';
                                return !addedSet.has((l || '').trim().toLowerCase());
                            });

                            setLocalField((prev) =>
                                prev
                                    ? {
                                          ...prev,
                                          picklistOptions: nextOptions,
                                          picklistColors: nextColors,
                                          picklistOptionIds: nextIds,
                                          unusedPicklistValues: nextUnused,
                                      }
                                    : prev
                            );
                            setShowUnusedValues(false);
                            setSelectedUnusedValues([]);
                        }}
                    >
                        Add
                    </Button>
                </DialogActions>
            ) : (
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCancel} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleDone} variant="contained" color="primary">
                        Done
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};

export default FieldProperties;
