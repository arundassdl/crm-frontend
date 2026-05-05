import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getLayout, saveLayout, getCustomFields, getCustomizeFields } from '../../../services/api/crm/crm-api';
import { RootState } from '../../root-reducer';

export const fetchLayoutData = createAsyncThunk(
    'layout/fetchLayout',
    async ({
        module,
        layoutId,
        token,
        isClone,
    }: { module?: string; layoutId?: string; token: string; isClone?: boolean }) => {
        // isClone is intentionally accepted here so it can be inspected in extraReducers
        // via action.meta.arg, even though it is not needed to perform the API call.
        const response = await getLayout(module, layoutId, token);
        return response;
    }
);

export const fetchCustomFieldsData = createAsyncThunk(
    'layout/fetchCustomFields',
    async ({ module, token }: { module: string; token: string }) => {
        const response = await getCustomFields(module, token);
        return response;
    }
);

export const fetchCustomizeFieldsData = createAsyncThunk(
    'layout/fetchCustomizeFields',
    async ({ moduleName, token }: { moduleName: string; token: string }) => {
        const response = await getCustomizeFields(moduleName, token);
        return response;
    }
);

export const saveLayoutData = createAsyncThunk(
    'layout/saveLayout',
    async ({ module, layoutId, layout, token, isDefault, layoutName, sharedTo, unusedFields, unusedRelatedLists }: { module: string; layoutId?: string; layout: any; token: string; isDefault?: boolean; layoutName?: string; sharedTo?: string[]; unusedFields?: any[]; unusedRelatedLists?: any[] }) => {
        // Map related_lists back to singular related_list if needed, or ensure field headers are correctly structured.
        // For the sake of this implementation, we will pass them as provided since the backend handles JSON.
        const response = await (saveLayout as any)(module, layoutId, layout, token, isDefault, layoutName, sharedTo, unusedFields, unusedRelatedLists);
        return response;
    }
);

export interface AddressAvailableFieldConfig {
    key: string;
    label: string;
    technical_name: string;
    enabled: boolean;
    visible?: boolean;
    required?: boolean;
    hide?: boolean;
}

export interface LayoutField {
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    visible: boolean;
    placeholder?: string;
    // For select / picklist fields this is rendered by DynamicForm as { label, value, color?, option_id? }[]
    options?: { label: string; value: string; color?: string; option_id?: string }[];
    // Default value for the field (used especially for picklists)
    default_value?: string;
    // Picklist specific settings
    picklist_sort_order?: 'entered' | 'alphabetical';
    enable_history_tracking?: boolean;
    enable_color_for_options?: boolean;
    column: number; // 0 or 1 for 2-column layout
    is_core?: boolean;
    doctype?: string;
    display_fields?: string;
    search_fields?: string;
    in_list_view?: boolean;
    no_duplicate?: boolean;
    max_length?: number;
    // When true, this field is marked as permission-specific in the layout builder
    permission_only?: boolean;
    // For address type: sub-field labels that are required (e.g. 'Country / Region', 'City')
    address_required_subfields?: string[];
    // For address type: configuration of available sub-fields and default country
    address_available_fields?: AddressAvailableFieldConfig[];
    address_default_country?: string;
}

export interface RelatedList {
    id: string;
    label: string;
    name?: string;
    visible?: boolean;
    fields?: { label: string; name: string }[];
    related_list_columns?: { label: string; field_name: string }[];
    order?: number;
}

function normalizeLayoutField(raw: any): LayoutField {
    const rawType = (raw.type ?? raw.fieldtype ?? 'text') as string;
    const normalizedType = typeof rawType === 'string' ? rawType.toLowerCase() : rawType;

    // Normalize options, especially for select / picklist fields that may come
    // from backend in different shapes (strings, nested objects, or JSON-like strings)
    let normalizedOptions: any = raw.options;

    if (normalizedType === 'select') {
        if (Array.isArray(raw.options)) {
            normalizedOptions = raw.options.map((opt: any) => {
                // If backend sent a JSON-like string inside label, try to parse it
                if (opt && typeof opt === 'object' && typeof opt.label === 'string') {
                    const labelStr = opt.label.trim();
                    if (labelStr.startsWith('{') && labelStr.includes("'label'")) {
                        try {
                            const jsonLike = JSON.parse(labelStr.replace(/'/g, '"'));
                            return {
                                label: jsonLike.label ?? jsonLike.value ?? '',
                                value: jsonLike.value ?? jsonLike.label ?? '',
                                color: jsonLike.color ?? opt.color,
                                option_id: jsonLike.option_id ?? opt.option_id,
                            };
                        } catch {
                            // fall through to default handling
                        }
                    }
                }

                if (typeof opt === 'string') {
                    const label = opt.trim();
                    return { label, value: label, option_id: undefined };
                }
                if (opt && typeof opt === 'object') {
                    const label = (opt.label ?? opt.value ?? '').toString();
                    const value = (opt.value ?? opt.label ?? '').toString();
                    const color = opt.color;
                    const option_id = opt.option_id;
                    return color ? { label, value, color, option_id } : { label, value, option_id };
                }
                return opt;
            });
        } else if (typeof raw.options === 'string') {
            const parts = raw.options
                .split('\n')
                .map((o: string) => o.trim())
                .filter(Boolean);
            normalizedOptions = parts.map((label: string) => ({ label, value: label, option_id: undefined }));
        }
    }

    return {
        id: raw.id ?? raw.fieldname ?? raw.name ?? `field-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: raw.fieldname ?? raw.name ?? raw.id ?? '',
        label: raw.label ?? raw.field_label ?? raw.display_name ?? raw.name ?? raw.fieldname ?? '',
        type: normalizedType,
        required: !!raw.required,
        visible: raw.visible !== false,
        placeholder: raw.placeholder,
        options: normalizedOptions,
        // Backend may use either `default_value` or `default` for picklists
        default_value: raw.default_value ?? raw.default,
        picklist_sort_order: raw.picklist_sort_order,
        enable_history_tracking: raw.enable_history_tracking,
        enable_color_for_options: raw.enable_color_for_options,
        column: typeof raw.column === 'number' ? raw.column : 0,
        is_core: raw.is_core,
        doctype: raw.doctype ?? raw.lookup_module,
        display_fields: raw.display_fields,
        search_fields: raw.search_fields,
        in_list_view: raw.in_list_view ?? raw.list_view,
        no_duplicate: !!raw.no_duplicate,
        max_length: typeof raw.max_length === 'number' ? raw.max_length : undefined,
        permission_only: raw.permission_only,
        address_required_subfields: Array.isArray(raw.address_required_subfields) ? raw.address_required_subfields : undefined,
        address_available_fields: Array.isArray(raw.address_available_fields) ? raw.address_available_fields : undefined,
        address_default_country: typeof raw.address_default_country === 'string' ? raw.address_default_country : undefined,
    };
}

function normalizeRelatedList(raw: any): RelatedList {
    const rawFields = raw.fields ?? raw.related_list_columns ?? [];
    const fields = Array.isArray(rawFields) ? rawFields.map((f: any) => ({
        label: f.label || f.related_list_label || f.field_label || f.display_name || f.field_name || f.name || '',
        name: f.field_name || f.fieldname || f.name || '',
        // preserve original properties for save/backend consistency
        field_name: f.field_name || f.fieldname || f.name || '',
        field_type: f.field_type || f.type || f.field_type || ''
    })) : [];

    const label = raw.label || raw.related_list_label || raw.module_label || raw.module || raw.name;
    let finalLabel = label || 'Related List';

    // Explicit mapping for standard ERPNext/CRM modules
    if (finalLabel === 'Note') finalLabel = 'Notes';
    if (finalLabel === 'Attachment') finalLabel = 'Attachments';

    return {
        ...raw, // preserve other backend properties like parent_module, child_module, etc.
        id: raw.id || raw.name || raw.module || `rl-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        label: finalLabel,
        name: raw.name || raw.module || raw.label || '',
        visible: raw.visible !== false && raw.is_active !== 0,
        fields: fields,
        // Ensure consistent naming for backend if needed
        related_list_columns: raw.related_list_columns || fields
    };
}

interface LayoutSection {
    id: string;
    title: string;
    fields: LayoutField[];
    isExpanded: boolean;
    column_count?: 1 | 2;
    tab_order?: 'left_to_right' | 'top_to_bottom';
}

interface QuickCreateConfig {
    enabled: boolean;
    fields: string[]; // fieldname strings
}

interface LayoutState {
    activeLayout: {
        sections: LayoutSection[];
        quick_create?: QuickCreateConfig;
        business_card_fields?: string[];
        business_card_enabled?: boolean;
        related_lists?: RelatedList[];
    } | null;
    unusedRelatedLists: RelatedList[];
    availableFields: any[];
    unusedFields: LayoutField[];
    layoutName: string | null;
    sharedTo: string[];
    isCore: boolean;
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    isSaving: boolean;
    selectedField: { sectionId: string; fieldId: string } | null;
    module: string | null;
    pendingFieldChanges: boolean;
}

const initialState: LayoutState = {
    activeLayout: null,
    unusedRelatedLists: [],
    availableFields: [],
    unusedFields: [],
    layoutName: null,
    sharedTo: [],
    isCore: false,
    loading: 'idle',
    isSaving: false,
    selectedField: null,
    module: null,
    pendingFieldChanges: false,
};

const layoutSlice = createSlice({
    name: 'layout-slice',
    initialState,
    reducers: {
        setLayoutName: (state, action: PayloadAction<string>) => {
            state.layoutName = action.payload;
            if (state.activeLayout) {
                // Also keep name/layout_name in the active layout object in sync
                (state.activeLayout as any).layout_name = action.payload;
                (state.activeLayout as any).name = action.payload;
            }
        },
        setSharedTo: (state, action: PayloadAction<string[]>) => {
            state.sharedTo = action.payload;
        },
        setSections: (state, action: PayloadAction<LayoutSection[]>) => {
            if (state.activeLayout) {
                state.activeLayout.sections = action.payload;
            } else {
                state.activeLayout = { sections: action.payload };
            }
        },
        updateSection: (state, action: PayloadAction<LayoutSection>) => {
            if (state.activeLayout && state.activeLayout.sections) {
                const index = state.activeLayout.sections.findIndex(s => s.id === action.payload.id);
                if (index !== -1) {
                    state.activeLayout.sections[index] = action.payload;
                }
            }
        },
        addSection: (state) => {
            const newSection: LayoutSection = {
                id: `section-${Date.now()}`,
                title: 'New Section',
                fields: [],
                isExpanded: true,
            };
            if (state.activeLayout) {
                if (!state.activeLayout.sections) {
                    state.activeLayout.sections = [newSection];
                } else {
                    state.activeLayout.sections.push(newSection);
                }
            } else {
                state.activeLayout = { sections: [newSection] };
            }
        },
        setSelectedField: (state, action: PayloadAction<{ sectionId: string; fieldId: string } | null>) => {
            state.selectedField = action.payload;
        },
        updateFieldProperties: (state, action: PayloadAction<{ sectionId: string; fieldId: string; properties: Partial<LayoutField> }>) => {
            if (state.activeLayout && state.activeLayout.sections) {
                const section = state.activeLayout.sections.find(s => s.id === action.payload.sectionId);
                if (section && section.fields) {
                    const field = section.fields.find(f => f.id === action.payload.fieldId);
                    if (field) {
                        Object.assign(field, action.payload.properties);

                        // If field is marked required in Create tab, ensure it is present in quick_create.
                        if (action.payload.properties.required === true) {
                            const fieldname = (field as any)?.name ?? (field as any)?.fieldname;
                            if (fieldname) {
                                const qc = (state.activeLayout as any).quick_create;
                                const current = Array.isArray(qc?.fields) ? qc.fields : [];
                                if (!current.includes(fieldname)) {
                                    (state.activeLayout as any).quick_create = {
                                        enabled: true,
                                        fields: Array.from(new Set([...current, fieldname])),
                                    };
                                } else if (!qc) {
                                    (state.activeLayout as any).quick_create = {
                                        enabled: true,
                                        fields: current,
                                    };
                                }
                            }
                        }
                    }
                }
            }
        },
        removeField: (state, action: PayloadAction<{ sectionId: string; fieldId: string }>) => {
            if (state.activeLayout && state.activeLayout.sections) {
                const section = state.activeLayout.sections.find(s => s.id === action.payload.sectionId);
                if (section && section.fields) {
                    const field = section.fields.find(f => f.id === action.payload.fieldId);
                    const removedFieldName = (field as any)?.name ?? (field as any)?.fieldname;
                    if (field) {
                        field.visible = false;
                        state.unusedFields = state.unusedFields.some(f => f.id === field.id) ? state.unusedFields : [...state.unusedFields, field];
                    }
                    section.fields = section.fields.filter(f => f.id !== action.payload.fieldId);

                    // Cleanup quick_create if field was removed from sections
                    const qc = (state.activeLayout as any)?.quick_create;
                    if (qc?.fields && removedFieldName) {
                        qc.fields = Array.from(new Set(qc.fields.filter((f: string) => f !== removedFieldName)));
                    }
                }
            }
        },
        removeSection: (state, action: PayloadAction<string>) => {
            if (state.activeLayout && state.activeLayout.sections) {
                const section = state.activeLayout.sections.find(s => s.id === action.payload);
                const removedFieldNames = section?.fields?.map(f => (f as any)?.name ?? (f as any)?.fieldname).filter(Boolean) ?? [];
                if (section?.fields?.length) {
                    for (const field of section.fields) {
                        if (!state.unusedFields.some(f => f.id === field.id)) {
                            state.unusedFields.push(field);
                        }
                    }
                }
                state.activeLayout.sections = state.activeLayout.sections.filter(s => s.id !== action.payload);

                // Cleanup quick_create fields from removed section
                const qc = (state.activeLayout as any)?.quick_create;
                if (qc?.fields?.length && removedFieldNames.length) {
                    qc.fields = Array.from(new Set(qc.fields.filter((f: string) => !removedFieldNames.includes(f))));
                }
            }
        },
        setQuickCreateFields: (state, action: PayloadAction<string[]>) => {
            if (!state.activeLayout) return;
            const fields = action.payload ?? [];
            const maxFields = 10;

            const existingFieldNames = new Set(
                (state.activeLayout.sections ?? []).flatMap(s => (s.fields ?? []).map((f: any) => f?.name ?? f?.fieldname))
            );

            // Preserve order, remove duplicates, and keep only fields that exist in sections
            const seen = new Set<string>();
            const sanitized: string[] = [];
            for (const f of fields) {
                const fieldname = (f as any)?.toString?.() ?? '';
                if (!fieldname) continue;
                if (seen.has(fieldname)) continue;
                if (!existingFieldNames.has(fieldname)) continue;
                seen.add(fieldname);
                sanitized.push(fieldname);
                if (sanitized.length >= maxFields) break;
            }

            state.activeLayout.quick_create = {
                enabled: true,
                fields: sanitized,
            };
        },
        renameSection: (state, action: PayloadAction<{ sectionId: string; title: string }>) => {
            if (state.activeLayout && state.activeLayout.sections) {
                const section = state.activeLayout.sections.find(s => s.id === action.payload.sectionId);
                if (section) {
                    section.title = action.payload.title;
                }
            }
        },
        updateSectionProperties: (state, action: PayloadAction<{ sectionId: string; column_count?: 1 | 2; tab_order?: 'left_to_right' | 'top_to_bottom' }>) => {
            if (state.activeLayout?.sections) {
                const section = state.activeLayout.sections.find(s => s.id === action.payload.sectionId);
                if (section) {
                    if (action.payload.column_count !== undefined) section.column_count = action.payload.column_count;
                    if (action.payload.tab_order !== undefined) section.tab_order = action.payload.tab_order;
                }
            }
        },
        setPendingFieldChanges: (state, action: PayloadAction<boolean>) => {
            state.pendingFieldChanges = action.payload;
        },
        addToUnusedField: (state, action: PayloadAction<LayoutField>) => {
            const field = normalizeLayoutField(action.payload);
            if (!state.unusedFields.some(f => f.id === field.id || f.name === field.name)) {
                state.unusedFields.push(field);
            }
        },
        removeFromUnusedField: (state, action: PayloadAction<string>) => {
            state.unusedFields = state.unusedFields.filter(f => f.id !== action.payload);
        },
        setBusinessCardFields: (state, action: PayloadAction<string[]>) => {
            if (state.activeLayout) {
                state.activeLayout.business_card_fields = action.payload;
            }
        },
        setBusinessCardEnabled: (state, action: PayloadAction<boolean>) => {
            if (state.activeLayout) {
                state.activeLayout.business_card_enabled = action.payload;
            }
        },
        addRelatedList: (state, action: PayloadAction<RelatedList>) => {
            if (state.activeLayout) {
                if (!state.activeLayout.related_lists) {
                    state.activeLayout.related_lists = [];
                }
                const exists = state.activeLayout.related_lists.some(rl => rl.id === action.payload.id);
                if (!exists) {
                    state.activeLayout.related_lists.push({ ...action.payload });
                }
                state.unusedRelatedLists = state.unusedRelatedLists.filter(rl => rl.id !== action.payload.id);
                // Update orders safely
                state.activeLayout.related_lists = state.activeLayout.related_lists.map((rl, idx) => ({
                    ...rl,
                    order: idx + 1
                }));
            }
        },
        insertRelatedList: (state, action: PayloadAction<{ relatedList: RelatedList; index: number }>) => {
            if (state.activeLayout) {
                if (!state.activeLayout.related_lists) {
                    state.activeLayout.related_lists = [];
                }
                const { relatedList, index } = action.payload;
                // Remove if already exists (to prevent duplicates)
                state.activeLayout.related_lists = state.activeLayout.related_lists.filter(rl => rl.id !== relatedList.id);
                // Insert at specified index
                state.activeLayout.related_lists.splice(index, 0, { ...relatedList });
                // Remove from unused
                state.unusedRelatedLists = state.unusedRelatedLists.filter(rl => rl.id !== relatedList.id);
                // Update orders safely
                state.activeLayout.related_lists = state.activeLayout.related_lists.map((rl, idx) => ({
                    ...rl,
                    order: idx + 1
                }));
            }
        },
        removeRelatedList: (state, action: PayloadAction<string>) => {
            if (state.activeLayout?.related_lists) {
                const removed = state.activeLayout.related_lists.find(rl => rl.id === action.payload);
                if (removed) {
                    state.unusedRelatedLists.push(removed);
                }
                state.activeLayout.related_lists = state.activeLayout.related_lists.filter(rl => rl.id !== action.payload);
                // Update orders safely
                state.activeLayout.related_lists = state.activeLayout.related_lists.map((rl, idx) => ({
                    ...rl,
                    order: idx + 1
                }));
            }
        },
        reorderRelatedLists: (state, action: PayloadAction<RelatedList[]>) => {
            if (state.activeLayout) {
                // Map to create new object copies with updated order property
                // This avoids mutating frozen action payload objects.
                state.activeLayout.related_lists = action.payload.map((rl, idx) => ({
                    ...rl,
                    order: idx + 1
                }));
            }
        },
        updateRelatedListFields: (state, action: PayloadAction<{ relatedListId: string; fields: { label: string; name: string }[] }>) => {
            if (state.activeLayout?.related_lists) {
                const rl = state.activeLayout.related_lists.find(r => r.id === action.payload.relatedListId);
                if (rl) {
                    rl.fields = action.payload.fields;
                    // also update related_list_columns for backend consistency
                    rl.related_list_columns = action.payload.fields.map(f => ({
                        label: f.label,
                        field_name: f.name || (f as any).fieldname || (f as any).field_name || ''
                    })) as any;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLayoutData.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(fetchLayoutData.fulfilled, (state, action) => {
                const isClone = (action as any)?.meta?.arg?.isClone;
                state.loading = 'succeeded';
                let data = action.payload;
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        console.error('Failed to parse layout data string:', e);
                    }
                }

                // Unwrap if backend returns doc inside a wrapper (e.g. { doc: { ... } })
                const doc = data?.doc ?? data;
                if (!doc) {
                    return;
                }

                state.module = doc.module ?? data?.module ?? null;
                state.layoutName = doc.layout_name ?? doc.name ?? data?.layout_name ?? data?.name ?? null;
                const rawSharedTo = doc.shared_to ?? data?.shared_to;
                state.sharedTo = Array.isArray(rawSharedTo) ? rawSharedTo : [];
                state.isCore = !!doc.is_core || !!data?.is_core;

                // Resolve layout JSON from multiple possible keys and shapes
                let layoutContent: any = null;
                const rawJson = doc.layout_json ?? doc.layout ?? data?.layout_json ?? data?.layout;
                if (rawJson != null) {
                    if (typeof rawJson === 'string') {
                        try {
                            layoutContent = JSON.parse(rawJson);
                        } catch (e) {
                            console.error('Failed to parse layout_json string:', e);
                        }
                    } else {
                        layoutContent = rawJson;
                    }
                }
                // Backend may return layout with sections at top level
                if (layoutContent && !layoutContent.sections && Array.isArray(layoutContent)) {
                    layoutContent = { sections: layoutContent };
                }
                if (layoutContent?.sections) {
                    state.activeLayout = layoutContent;
                } else if (doc.sections ?? data?.sections) {
                    state.activeLayout = {
                        sections: doc.sections ?? data.sections,
                        related_lists: []
                    };
                } else {
                    // Metadata loaded but no layout body – show empty canvas
                    state.activeLayout = { sections: [], related_lists: [] };
                }

                // Initialize related_lists from multiple possible source locations
                const rawRelatedListSource = doc.related_list ?? data?.related_list ?? doc.related_lists ?? data?.related_lists;
                const normalizedRelatedLists = Array.isArray(rawRelatedListSource)
                    ? rawRelatedListSource.map((rl: any) => normalizeRelatedList(rl))
                    : [];

                if (state.activeLayout) {
                    const savedRelatedLists = Array.isArray(state.activeLayout.related_lists)
                        ? state.activeLayout.related_lists.map((rl: any) => normalizeRelatedList(rl))
                        : [];

                    // Sync logic: Add missing/different items from normalizedRelatedLists (top-level source) 
                    // to the activeLayout.related_lists (from layout_json)
                    const syncedRelatedLists = [...savedRelatedLists];

                    normalizedRelatedLists.forEach(sourceRL => {
                        const existingIdx = syncedRelatedLists.findIndex(savedRL =>
                            savedRL.id === sourceRL.id ||
                            (savedRL.name && sourceRL.name && savedRL.name === sourceRL.name)
                        );
                        if (existingIdx === -1) {
                            syncedRelatedLists.push(sourceRL);
                        } else {
                            // Merge metadata from source but preserve customized fields
                            const existing = syncedRelatedLists[existingIdx];
                            syncedRelatedLists[existingIdx] = {
                                ...sourceRL,
                                ...existing,
                                label: sourceRL.label || existing.label,
                            };
                        }
                    });

                    // Update order field based on sequence
                    syncedRelatedLists.forEach((rl, idx) => {
                        rl.order = idx + 1;
                    });

                    state.activeLayout.related_lists = syncedRelatedLists;

                    // Also filter out any synced related lists from the unused list
                    const syncedIds = new Set(syncedRelatedLists.map(rl => rl.id));
                    const syncedNames = new Set(syncedRelatedLists.map(rl => rl.name).filter(Boolean));
                    state.unusedRelatedLists = state.unusedRelatedLists.filter(url =>
                        !syncedIds.has(url.id) && (!url.name || !syncedNames.has(url.name))
                    );
                }

                // Initialize business_card_fields and business_card_enabled
                // Initialize business_card_fields and business_card_enabled
                if (state.activeLayout) {
                    let rawBCFields = doc.business_card_fields ?? data.business_card_fields ??
                        doc.business_card_config ?? data.business_card_config ??
                        layoutContent?.business_card_fields ?? layoutContent?.business_card_config ?? [];

                    // Handle string representation if any
                    if (typeof rawBCFields === 'string') {
                        try { rawBCFields = JSON.parse(rawBCFields); } catch { rawBCFields = []; }
                    }

                    // Normalize to array of strings (ID/name)
                    if (Array.isArray(rawBCFields)) {
                        state.activeLayout.business_card_fields = rawBCFields.map((item: any) =>
                            typeof item === 'object' ? (item.name || item.fieldname || item.id) : item
                        ).filter(Boolean);
                    } else {
                        state.activeLayout.business_card_fields = [];
                    }

                    state.activeLayout.business_card_enabled = !!(doc.business_card_enabled ?? data.business_card_enabled ??
                        layoutContent?.business_card_enabled ?? false);
                }

                // Normalize all fields in activeLayout sections so they share the same shape
                if (state.activeLayout?.sections) {
                    state.activeLayout.sections = state.activeLayout.sections.map((section: any) => ({
                        ...section,
                        fields: Array.isArray(section.fields)
                            ? section.fields.map((f: any) => normalizeLayoutField(f))
                            : [],
                    }));
                }

                // Default quick_create config (required fields) if missing
                if (state.activeLayout) {
                    const allFields: LayoutField[] = (state.activeLayout.sections ?? []).flatMap(s => s.fields ?? []);
                    const requiredFieldNames = allFields
                        .filter((f: LayoutField) => !!f.required)
                        .map((f: LayoutField) => (f as any)?.name ?? (f as any)?.fieldname)
                        .filter(Boolean);

                    const qc = (state.activeLayout as any).quick_create;
                    const shouldInit = !qc || !Array.isArray(qc.fields);
                    if (shouldInit) {
                        (state.activeLayout as any).quick_create = {
                            enabled: true,
                            fields: Array.from(new Set(requiredFieldNames)).slice(0, 10),
                        };
                    } else {
                        const existingFieldNames = new Set(
                            (state.activeLayout.sections ?? []).flatMap(s => (s.fields ?? []).map((f: any) => f?.name ?? f?.fieldname))
                        );

                        const deduped: string[] = [];
                        const seen = new Set<string>();
                        for (const fn of Array.isArray(qc.fields) ? qc.fields : []) {
                            const fieldname = String(fn);
                            if (!fieldname) continue;
                            if (!existingFieldNames.has(fieldname)) continue;
                            if (seen.has(fieldname)) continue;
                            seen.add(fieldname);
                            deduped.push(fieldname);
                            if (deduped.length >= 10) break;
                        }

                        // Sanitize existing config: unique + must exist in current sections
                        state.activeLayout.quick_create = {
                            enabled: true,
                            fields: deduped,
                        };
                    }
                }

                const rawUnused = doc.unused_fields ?? data?.unused_fields;
                state.unusedFields = Array.isArray(rawUnused)
                    ? rawUnused.map((f: any) => normalizeLayoutField(f))
                    : [];

                const rawUnusedRelated = doc.unused_related_list ?? data?.unused_related_list;
                state.unusedRelatedLists = Array.isArray(rawUnusedRelated)
                    ? rawUnusedRelated.map((rl: any) => normalizeRelatedList(rl))
                    : [];

                // When cloning, start with a blank, editable layout name and clear any core flag
                if (isClone) {
                    state.layoutName = null;
                    state.sharedTo = [];
                    state.isCore = false;
                    if (state.activeLayout) {
                        (state.activeLayout as any).layout_name = '';
                        (state.activeLayout as any).name = '';
                    }
                }
            })
            .addCase(fetchLayoutData.rejected, (state) => {
                state.loading = 'failed';
            })
            .addCase(fetchCustomFieldsData.fulfilled, (state, action) => {
                state.availableFields = action.payload;
            })
            .addCase(saveLayoutData.pending, (state) => {
                state.isSaving = true;
            })
            .addCase(saveLayoutData.fulfilled, (state) => {
                state.isSaving = false;
            })
            .addCase(saveLayoutData.rejected, (state) => {
                state.isSaving = false;
            });
    },
});

export const {
    setLayoutName,
    setSharedTo,
    setSections,
    updateSection,
    addSection,
    setSelectedField,
    updateFieldProperties,
    removeField,
    removeSection,
    setQuickCreateFields,
    renameSection,
    updateSectionProperties,
    addToUnusedField,
    removeFromUnusedField,
    setPendingFieldChanges,
    addRelatedList,
    insertRelatedList,
    removeRelatedList,
    reorderRelatedLists,
    updateRelatedListFields,
    setBusinessCardFields,
    setBusinessCardEnabled,
} = layoutSlice.actions;

export const layoutSelector = (state: RootState) => state.LayoutBuilder;

export default layoutSlice.reducer;
