import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { getLayoutList } from './layout-api';

// Fetch unused picklist options for a given module/layout/field
export const getUnusedPicklistOptions = async (
    module: string,
    layoutName: string,
    fieldName: string,
    token: string
) => {
    const method = '/api/method/sdl_metadata.api.component_picklist.unused_picklist_option';
    const params = `?module=${encodeURIComponent(module)}&layout_name=${encodeURIComponent(
        layoutName
    )}&field_name=${encodeURIComponent(fieldName)}`;
    const url = `${CONSTANTS.API_BASE_URL}${method}${params}`;

    const config = {
        headers: {
            Authorization: token,
        },
        timeout: 5000,
    };

    try {
        const res = await axios.get(url, config);
        return res?.data?.message ?? [];
    } catch (error: any) {
        console.error('getUnusedPicklistOptions API Error:', error);
        return [];
    }
};

// ---------------------------------------------------------------------------
// Stage Probability – unused stage options for a given module/layout/field
// ---------------------------------------------------------------------------
export const getUnusedStageProbabilityOptions = async (
    module: string,
    layoutName: string,
    fieldName: string,
    token: string
) => {
    const method = '/api/method/sdl_metadata.api.stage_probability.unused_stage_probability_option';
    const params = `?module=${encodeURIComponent(module)}&layout_name=${encodeURIComponent(
        layoutName
    )}&field_name=${encodeURIComponent(fieldName)}`;
    const url = `${CONSTANTS.API_BASE_URL}${method}${params}`;

    const config = {
        headers: {
            Authorization: token,
        },
        timeout: 5000,
    };

    try {
        const res = await axios.get(url, config);
        return res?.data?.message ?? [];
    } catch (error: any) {
        console.error('getUnusedStageProbabilityOptions API Error:', error);
        return [];
    }
};

// ---------------------------------------------------------------------------
// Component Picklist – options for a field for a given module/layout/field
// ---------------------------------------------------------------------------

export interface ComponentPicklistOption {
    label: string;
    value: string;
    color?: string;
    // Backend may return 1/0 or true/false
    is_default?: number | boolean;
}

export const getComponentPicklist = async (
    module: string,
    layoutName: string,
    fieldName: string,
    token: string,
    parentValue?: string | null
): Promise<ComponentPicklistOption[]> => {
    const method = '/api/method/sdl_metadata.api.component_picklist.get_component_picklist';

    const searchParams = new URLSearchParams({
        module,
        layout_name: layoutName,
        field_name: fieldName,
    });

    if (parentValue != null && parentValue !== '') {
        searchParams.append('parent_value', parentValue);
    }

    const url = `${CONSTANTS.API_BASE_URL}${method}?${searchParams.toString()}`;

    const config = {
        headers: {
            Authorization: token,
        },
        timeout: 5000,
    };

    try {
        const res = await axios.get(url, config);
        return (res?.data?.message ?? []) as ComponentPicklistOption[];
    } catch (error: any) {
        console.error('getComponentPicklist API Error:', error);
        return [];
    }
};

/**
 * Caches the layout that actually yields a pick list for a given module+field, so
 * repeated lookups skip layout discovery. Only the resolved layout id is cached —
 * option values are always fetched fresh so the UI reflects the latest backend data.
 */
const resolvedLayoutCache = new Map<string, string>();

export interface ModulePicklistResult {
    options: ComponentPicklistOption[];
    /** The field key that actually yielded the pick list — use this for filtering/matching. */
    field: string | null;
    /** The layout the pick list was found on. */
    layoutId: string | null;
}

const EMPTY_RESULT: ModulePicklistResult = { options: [], field: null, layoutId: null };

/**
 * Generic, module-agnostic helper to fetch pick list options for any module/field.
 *
 * The Component Pick List is layout-scoped. When no `layoutId` is supplied this
 * resolves the right layout robustly: it tries the module's layouts (and each
 * candidate field name) until one returns the pick list, then caches the winning
 * layout+field for subsequent calls. Returns the resolved `field` so callers can
 * filter/match on the exact key the backend stores the value under.
 * Reuse this across the app instead of writing module-specific fetchers.
 */
export const fetchModulePicklistOptions = async (
    module: string,
    fieldName: string | string[],
    token: string,
    roleProfile: string = '',
    layoutId?: string
): Promise<ModulePicklistResult> => {
    const fieldCandidates = (Array.isArray(fieldName) ? fieldName : [fieldName]).filter(Boolean);
    if (!token || !module || fieldCandidates.length === 0) return EMPTY_RESULT;

    // Explicit layout: fetch directly, trying each candidate field.
    if (layoutId) {
        for (const field of fieldCandidates) {
            const options = await getComponentPicklist(module, layoutId, field, token);
            if (options.length > 0) return { options, field, layoutId };
        }
        return EMPTY_RESULT;
    }

    const cacheKey = `${module}|${fieldCandidates.join(',')}`;

    // Fast path: reuse the previously resolved layout+field (re-fetching fresh values).
    const cached = resolvedLayoutCache.get(cacheKey);
    if (cached) {
        const [cachedLayout, cachedField] = cached.split('||');
        const cachedOptions = await getComponentPicklist(module, cachedLayout, cachedField, token);
        if (cachedOptions.length > 0) return { options: cachedOptions, field: cachedField, layoutId: cachedLayout };
        // Cache went stale (layout/field changed) — fall through and rediscover.
        resolvedLayoutCache.delete(cacheKey);
    }

    const layouts = await getLayoutList(module, token, roleProfile);
    if (!Array.isArray(layouts) || layouts.length === 0) return EMPTY_RESULT;

    // Try each layout × candidate field until one returns the pick list.
    for (const layout of layouts) {
        const lid = layout?.value;
        if (!lid) continue;
        for (const field of fieldCandidates) {
            const options = await getComponentPicklist(module, lid, field, token);
            if (options.length > 0) {
                resolvedLayoutCache.set(cacheKey, `${lid}||${field}`);
                return { options, field, layoutId: lid };
            }
        }
    }

    return EMPTY_RESULT;
};

// ---------------------------------------------------------------------------
// Stage Probability – options for a field for a given module/layout/field
// ---------------------------------------------------------------------------
export interface StageProbabilityOption {
    label: string;
    value: string;
    option_id: string;
    probability: number;
    record_category: string;
    forecast_category: string;
    color?: string;
    // backend may return 1/0 or true/false
    is_default?: number | boolean;
    // optional fields seen in some responses
    display_order?: number;
    in_active?: number | boolean;
}

export const getComponentStageProbability = async (
    module: string,
    layoutName: string,
    fieldName: string,
    token: string
): Promise<StageProbabilityOption[]> => {
    const method = '/api/method/sdl_metadata.api.stage_probability.get_component_stageprobability';

    const searchParams = new URLSearchParams({
        module,
        layout_name: layoutName,
        field_name: fieldName,
    });

    const url = `${CONSTANTS.API_BASE_URL}${method}?${searchParams.toString()}`;

    const config = {
        headers: {
            Authorization: token,
        },
        timeout: 5000,
    };

    try {
        const res = await axios.get(url, config);
        return (res?.data?.message ?? []) as StageProbabilityOption[];
    } catch (error: any) {
        console.error('getComponentStageProbability API Error:', error);
        return [];
    }
};

/**
 * Caches the layout+field that yields stage options for a module, so repeated
 * lookups skip layout discovery. Only the resolved layout id is cached — option
 * values are always fetched fresh so the UI reflects the latest backend data.
 */
const resolvedStageLayoutCache = new Map<string, string>();

export interface ModuleStageResult {
    options: StageProbabilityOption[];
    /** The field key that yielded the stage options — use this for filtering/matching. */
    field: string | null;
    /** The layout the stage options were found on (the value passed as layout_name). */
    layoutId: string | null;
}

const EMPTY_STAGE_RESULT: ModuleStageResult = { options: [], field: null, layoutId: null };

/**
 * Generic, module-agnostic helper to fetch Stage Probability options for any
 * module/field (deals stages, etc.). Mirrors {@link fetchModulePicklistOptions}
 * but targets the Stage Probability API, which backs `type: "stage"` fields.
 *
 * When no `layoutId` is supplied the correct layout is resolved robustly: it tries
 * the module's layouts (both the layout `value` and its `label`, since the stage
 * API keys on `layout_name`) and each candidate field until one returns options,
 * then caches the winning layout+field for subsequent calls.
 */
export const fetchModuleStageOptions = async (
    module: string,
    fieldName: string | string[],
    token: string,
    roleProfile: string = '',
    layoutId?: string
): Promise<ModuleStageResult> => {
    const fieldCandidates = (Array.isArray(fieldName) ? fieldName : [fieldName]).filter(Boolean);
    if (!token || !module || fieldCandidates.length === 0) return EMPTY_STAGE_RESULT;

    // Explicit layout: fetch directly, trying each candidate field.
    if (layoutId) {
        for (const field of fieldCandidates) {
            const options = await getComponentStageProbability(module, layoutId, field, token);
            if (options.length > 0) return { options, field, layoutId };
        }
        return EMPTY_STAGE_RESULT;
    }

    const cacheKey = `${module}|${fieldCandidates.join(',')}`;

    // Fast path: reuse the previously resolved layout+field (re-fetching fresh values).
    const cached = resolvedStageLayoutCache.get(cacheKey);
    if (cached) {
        const [cachedLayout, cachedField] = cached.split('||');
        const cachedOptions = await getComponentStageProbability(module, cachedLayout, cachedField, token);
        if (cachedOptions.length > 0) return { options: cachedOptions, field: cachedField, layoutId: cachedLayout };
        // Cache went stale (layout/field changed) — fall through and rediscover.
        resolvedStageLayoutCache.delete(cacheKey);
    }

    const layouts = await getLayoutList(module, token, roleProfile);
    if (!Array.isArray(layouts) || layouts.length === 0) return EMPTY_STAGE_RESULT;

    // Try each layout (by value then label) × candidate field until one returns options.
    for (const layout of layouts) {
        const layoutNames = [layout?.value, layout?.label].filter(Boolean) as string[];
        for (const lname of layoutNames) {
            for (const field of fieldCandidates) {
                const options = await getComponentStageProbability(module, lname, field, token);
                if (options.length > 0) {
                    resolvedStageLayoutCache.set(cacheKey, `${lname}||${field}`);
                    return { options, field, layoutId: lname };
                }
            }
        }
    }

    return EMPTY_STAGE_RESULT;
};

// ---------------------------------------------------------------------------
// Stage Probability – pipeline component options (get_component)
// ---------------------------------------------------------------------------
export const getComponentStagePipeline = async (
    module: string,
    layoutName: string,
    fieldName: string,
    token: string
): Promise<StageProbabilityOption[]> => {
    const method = '/api/method/sdl_metadata.api.stage_probability.get_component_stageprobability';

    const searchParams = new URLSearchParams({
        module,
        layout_name: layoutName,
        field_name: fieldName,
    });

    const url = `${CONSTANTS.API_BASE_URL}${method}?${searchParams.toString()}`;

    const config = {
        headers: {
            Authorization: token,
        },
        timeout: 5000,
    };

    try {
        const res = await axios.get(url, config);
        return (res?.data?.message ?? []) as StageProbabilityOption[];
    } catch (error: any) {
        console.error('getComponentStagePipeline API Error:', error);
        return [];
    }
};

