import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';

export const getFieldPermissions = async (module: string, role: string, token: string) => {
    const version = CONSTANTS.VERSION;
    const method = '/api/method/sdl_metadata.api.permission.get_field_permissions';
    const params = `?module=${module}&role=${role}`;
    const config = {
        headers: {
            Authorization: token,
        },
    };
    const apiUrl = `${CONSTANTS.API_BASE_URL}${method}${params}`;
    try {
        const res = await axios.get(apiUrl, { ...config });
        return res?.data?.message;
    } catch (error: any) {
        console.error('API Error:', error);
        return { status: 'error', error: error.message };
    }
};

export const saveFieldPermissions = async (data: any, token: string) => {
    const version = CONSTANTS.VERSION;
    const method = '/api/method/sdl_metadata.api.permission.save_field_permission';
    const config = {
        headers: {
            Authorization: token,
        },
    };
    const apiUrl = `${CONSTANTS.API_BASE_URL}${method}`;
    try {
        const res = await axios.post(apiUrl, data, { ...config });
        return res?.data?.message;
    } catch (error: any) {
        console.error('API Error:', error);
        return { status: 'error', error: error.message };
    }
};
