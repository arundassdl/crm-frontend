import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';

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

