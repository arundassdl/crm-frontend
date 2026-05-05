import axios from 'axios';

// Assuming CONSTANTS are available in the same way as other API files
import { CONSTANTS } from '../../config/app-config';

const handleError = (error: any) => {
    console.error('API Error:', error);
    return error?.response?.data || error.message || error;
};

export const getLayout = async (module: string | undefined, layoutId: string | undefined, token: string) => {
    const params = new URLSearchParams();
    if (module) {
        params.set('module', module);
    }
    if (layoutId) {
        params.set('name', layoutId);
    }
    const query = params.toString();
    const url = `${CONSTANTS.API_BASE_URL}/api/method/sdl_metadata.api.layout.get_layout${query ? `?${query}` : ''}`;

    const config = {
        headers: {
            Authorization: token,
        },
    };

    try {
        const res = await axios.get(url, config);
        // Backend may return doc in message or at data root
        return res?.data?.message ?? res?.data;
    } catch (error) {
        return handleError(error);
    }
};

export const saveLayout = async (module: string, layoutId: string | undefined, layout: any, token: string, isDefault: boolean = false, layoutName?: string, sharedTo?: string[], unusedFields?: any[], unusedRelatedLists?: any[]) => {
    const url = `${CONSTANTS.API_BASE_URL}/api/method/sdl_metadata.api.layout.save_layout`;
    const config = {
        headers: {
            Authorization: token,
        },
    };

    const payload: any = {
        module,
        layout_json: JSON.stringify(layout),
        is_default: isDefault,
        unused_fields: unusedFields,
        unused_related_list: unusedRelatedLists
    };

    // Backend requires layout_name; prefer the explicit layoutName from UI,
    // then name stored in the layout JSON, then fall back to layoutId.


    console.log(sharedTo, 'sharedTo');
    payload.layout_name = layoutName;


    if (layoutId) {
        // Decode if coming from URL (e.g. Territories_Base%20Layout → Territories_Base Layout)
        payload.name = layoutId.includes('%') ? decodeURIComponent(layoutId) : layoutId;
    }
    if (sharedTo != null && Array.isArray(sharedTo)) {
        payload.shared_to = sharedTo.reduce<Record<string, number>>((acc, roleId) => {
            acc[roleId] = 1;
            return acc;
        }, {});
    }
    console.log(url, 'url');
    console.log(config, 'config');
    console.log(payload, 'payload');
    try {
        const res = await axios.post(url, payload, config);
        return res?.data?.message;
    } catch (error) {
        return handleError(error);
    }
};

export const getCustomFields = async (module: string, token: string) => {
    const url = `${CONSTANTS.API_BASE_URL}/api/method/sdl_metadata.api.custom_field.get_custom_fields?module=${module}`;
    const config = {
        headers: {
            Authorization: token,
        },
    };

    try {
        const res = await axios.get(url, config);
        return res?.data?.message;
    } catch (error) {
        return handleError(error);
    }
};

export const addCustomField = async (module: string, fieldData: any, token: string) => {
    const url = `${CONSTANTS.API_BASE_URL}/api/method/sdl_metadata.api.custom_field.add_custom_field`;
    const config = {
        headers: {
            Authorization: token,
        },
    };

    try {
        const res = await axios.post(url, { module, ...fieldData }, config);
        return res?.data?.message;
    } catch (error) {
        return handleError(error);
    }
};

export const getCustomizeFields = async (moduleName: string, token: string) => {
    const url = `${CONSTANTS.API_BASE_URL}/api/method/sdl_metadata.api.custom_field.get_customize_field?module_name=${moduleName}`;
    const config = {
        headers: {
            Authorization: token,
        },
    };

    try {
        const res = await axios.get(url, config);
        return res?.data?.message;
    } catch (error) {
        return handleError(error);
    }
};
