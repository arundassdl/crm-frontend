import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { deleteClient } from '../common-erpnext-api/create-edit-api';

/** Frappe doctype for pipeline stage options tied to a layout/field. */
const COMPONENT_STAGE_PROBABILITY_DOCTYPE = 'Component Stage Probability';

/** Picklist rows for layout-bound fields; also block SDL Layout delete if left linked. */
const COMPONENT_PICKLIST_DOCTYPE = 'Component Picklist';

/** Layout-level config that references SDL Layout (delete before layout). */
const COMPONENT_STAGE_PROBABILITY_LAYOUT_CONFIG_DOCTYPE = 'Component Stage Probability Layout Config';

/** Layout-level pick list config that references SDL Layout (delete before layout). */
const COMPONENT_PICK_LIST_LAYOUT_CONFIG_DOCTYPE = 'Component Pick List Layout Config';

/** Order: config/parent-ish docs first, then row-level component tables. */
const CLEANUP_BEFORE_SDL_LAYOUT_DELETE: string[] = [
    COMPONENT_PICK_LIST_LAYOUT_CONFIG_DOCTYPE,
    COMPONENT_STAGE_PROBABILITY_LAYOUT_CONFIG_DOCTYPE,
    COMPONENT_PICKLIST_DOCTYPE,
    COMPONENT_STAGE_PROBABILITY_DOCTYPE,
];

const SDL_LAYOUT_DOCTYPE = 'SDL Layout';

interface LinkedWithBlock {
    docs?: Array<{ name?: string }>;
}

/**
 * Uses Frappe’s reference map (same as Desk “linked with”) so we use the real Link fields,
 * not guessed filter fieldnames.
 */
async function collectLinkedNamesForLayout(
    layoutDocName: string,
    token: string
): Promise<Record<string, string[]>> {
    const out: Record<string, string[]> = {};
    try {
        const res = await axios.post(
            `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.form.linked_with.get`,
            {
                doctype: SDL_LAYOUT_DOCTYPE,
                docname: layoutDocName,
            },
            {
                headers: { Authorization: token, 'Content-Type': 'application/json' },
                timeout: 30000,
            }
        );
        const message = res?.data?.message as Record<string, LinkedWithBlock> | undefined;
        if (!message || typeof message !== 'object') return out;
        for (const [dt, block] of Object.entries(message)) {
            const docs = block?.docs;
            if (!Array.isArray(docs)) continue;
            const names: string[] = [];
            for (const row of docs) {
                const n = row?.name;
                if (n) names.push(String(n));
            }
            if (names.length) {
                out[dt] = names;
            }
        }
    } catch (e) {
        console.error('frappe.desk.form.linked_with.get failed', layoutDocName, e);
    }
    return out;
}

/**
 * Deletes layout-linked docs that block SDL Layout delete:
 * Component Pick List Layout Config, Component Stage Probability Layout Config,
 * Component Picklist, Component Stage Probability (from Desk linked-with).
 */
export async function deleteLinkedComponentStageProbabilityForLayout(
    layoutDocName: string,
    _layoutDisplayName: string | null | undefined,
    _moduleName: string | null | undefined,
    token: string
): Promise<{ deleted: number; error?: string }> {
    const namesByDoctype = new Map<string, Set<string>>();

    const addNames = (dt: string, list: string[]) => {
        if (!list.length) return;
        if (!namesByDoctype.has(dt)) namesByDoctype.set(dt, new Set());
        const set = namesByDoctype.get(dt)!;
        list.forEach((n) => set.add(n));
    };

    // 1) Canonical: Frappe Desk linked-with (config + row-level component tables)
    const deskLinked = await collectLinkedNamesForLayout(layoutDocName, token);
    for (const dt of CLEANUP_BEFORE_SDL_LAYOUT_DELETE) {
        addNames(dt, deskLinked[dt] ?? []);
    }

    // Do not use frappe.client.get_list here: Frappe often forbids filtering on Link fields
    // (e.g. "Field not permitted in query: layout"), which raises DataError.

    const deleteOrder = CLEANUP_BEFORE_SDL_LAYOUT_DELETE;
    let deleted = 0;
    for (const dt of deleteOrder) {
        const set = namesByDoctype.get(dt);
        const names = set ? Array.from(set) : [];
        for (const name of names) {
            const result = await deleteClient(dt, name, token);
            if ((result as { success?: boolean })?.success) {
                deleted++;
            } else {
                const msg =
                    (result as { message?: string })?.message ||
                    `Failed to delete linked ${dt} row`;
                return { deleted, error: msg };
            }
        }
    }
    return { deleted };
}

/** Fetch layout list for a module; returns array of { value, label } or raw message. Used to get default layout_id for getFormFields. */
export const getLayoutList = async (module: string, _token: string, role_profile: string) => {
    const method = '/api/method/sdl_metadata.api.layout.get_layout_list';
    const params = `?module=${encodeURIComponent(module)}&role_profile=${encodeURIComponent(role_profile || '')}`;
    const url = `${CONSTANTS.API_BASE_URL}${method}${params}`;
    const config = { timeout: 5000 };
    try {
        const res = await axios.get(url, config);
        const message = res?.data?.message;
        if (Array.isArray(message)) {
            return message.map((item: any) => ({ value: item.name || item.layout_name || '', label: item.layout_name || item.name || '' }));
        }
        if (Array.isArray(message?.layouts)) {
            return message.layouts.map((item: any) => ({ value: item.name || item.layout_name || '', label: item.layout_name || item.name || '' }));
        }
        if (message && (message.name || message.layout_name)) {
            return [{ value: message.name || message.layout_name, label: message.layout_name || message.name }];
        }
        return [];
    } catch (error: any) {
        console.error('getLayoutList API Error:', error);
        return [];
    }
};

export const getFormFields = async (module: string, _token: string, role_profile: string, layout_id) => {
    let response: any;
    const method = '/api/method/sdl_metadata.api.layout.get_formFields';
    const params = `?module=${encodeURIComponent(module)}&role_profile=${encodeURIComponent(role_profile || '')}&layout_id=${encodeURIComponent(layout_id || '')}`;
    const apiUrl = `${CONSTANTS.API_BASE_URL}${method}${params}`;
    console.log(apiUrl, 'apiUrl layout');

    try {
        const res = await axios.get(apiUrl, { timeout: 5000 });
        response = res?.data?.message;
        console.log(response, 'response layout');
    } catch (error: any) {
        console.error('API Error:', error);
        response = { status: 'error', error: error.message };
        console.log(response, 'response error layout');
    }
    return response;
};

export const getQuickCreateFormFields = async (
    module: string,
    role: string,
    _token: string
) => {
    let response: any;
    const method = '/api/method/sdl_metadata.api.layout.get_quickcreate_form_fields';
    const params = `?module=${encodeURIComponent(module)}&role=${encodeURIComponent(role || '')}`;
    const config = { timeout: 5000 };
    const apiUrl = `${CONSTANTS.API_BASE_URL}${method}${params}`;

    try {
        const res = await axios.get(apiUrl, config);
        // Expected shape: { message: { name, layout_name, fields: [...] } }
        response = res?.data?.message ?? res?.data;
    } catch (error: any) {
        console.error('getQuickCreateFormFields API Error:', error);
        response = { status: 'error', error: error.message };
    }
    return response;
};

export const getRelatedList = async (module: string, layout_name: string, _token: string) => {
    const method = '/api/method/sdl_metadata.api.layout.get_relatedlist';
    const params = `?module=${encodeURIComponent(module)}&layout_name=${encodeURIComponent(layout_name)}`;
    const url = `${CONSTANTS.API_BASE_URL}${method}${params}`;
    const config = { timeout: 5000 };
    try {
        const res = await axios.get(url, config);
        return res?.data?.message || [];
    } catch (error: any) {
        console.error('getRelatedList API Error:', error);
        return [];
    }
};

export interface ConversionMapTargetModule {
    target_module: string;
    target_layout: string;
}

export interface ConversionMapRow {
    source_field: string;
    mapping_json: Record<string, string>;
}

export interface SaveConversionMapParams {
    source_module: string;
    source_layout: string;
    target_module: ConversionMapTargetModule[];
    mapping_rows: ConversionMapRow[];
}

/** Child row on Module Conversion Mapping (from get_conversion_map). */
export interface ConversionMapTargetModuleDoc {
    target_doctype?: string;
    target_layout?: string;
    [key: string]: unknown;
}

export interface ConversionMapRowDoc {
    source_field?: string;
    /** API may return a JSON string or a parsed object. */
    mapping_json?: string | Record<string, string>;
    [key: string]: unknown;
}

/** `message` from sdl_metadata.api.conversionmap.get_conversion_map */
export interface ConversionMapMessage {
    name?: string;
    source_module?: string;
    source_layout?: string;
    target_modules?: ConversionMapTargetModuleDoc[];
    mapping_rows?: ConversionMapRowDoc[];
    [key: string]: unknown;
}

/**
 * Load saved conversion mapping for a lead/source layout.
 * GET .../get_conversion_map?source_module=...&source_layout=... (both URL-encoded)
 */
export const getConversionMap = async (
    sourceModule: string,
    sourceLayout: string,
    token: string
): Promise<ConversionMapMessage | null> => {
    const method = '/api/method/sdl_metadata.api.conversionmap.get_conversion_map';
    const params = `?source_module=${encodeURIComponent(sourceModule)}&source_layout=${encodeURIComponent(sourceLayout)}`;
    const url = `${CONSTANTS.API_BASE_URL}${method}${params}`;
    const config = { headers: { Authorization: token }, timeout: 15000 };
    try {
        const res = await axios.get(url, config);
        const message = res?.data?.message;
        if (message && typeof message === 'object') {
            return message as ConversionMapMessage;
        }
        return null;
    } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404 || status === 204) {
            return null;
        }
        console.error('getConversionMap API Error:', error?.response?.data || error);
        return null;
    }
};

/** Persist lead conversion field/layout mapping (sdl_metadata.api.conversionmap.save_conversion_map). */
export const saveConversionMap = async (params: SaveConversionMapParams, token: string) => {
    const method = '/api/method/sdl_metadata.api.conversionmap.save_conversion_map';
    const url = `${CONSTANTS.API_BASE_URL}${method}`;
    const config = {
        headers: {
            Authorization: token,
            'Content-Type': 'application/json',
        },
        timeout: 60000,
    };
    const body = {
        source_module: params.source_module,
        source_layout: params.source_layout,
        target_module: params.target_module,
        mapping_rows: params.mapping_rows,
    };
    try {
        const res = await axios.post(url, body, config);
        const data = res?.data;
        if (data?.exc) {
            throw new Error(typeof data.exc === 'string' ? data.exc : JSON.stringify(data.exc));
        }
        return data;
    } catch (error: any) {
        const msg =
            error?.response?.data?.message ||
            error?.response?.data?.exc ||
            error?.response?.data?._server_messages ||
            error?.message;
        console.error('saveConversionMap API Error:', error?.response?.data || error);
        throw new Error(typeof msg === 'string' ? msg : 'Failed to save conversion map');
    }
};
