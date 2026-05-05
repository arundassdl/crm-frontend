import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';

export const getCustomFields = async (module: string, token: string) => {
    let response: any;
    const method = '/api/method/sdl_metadata.api.custom_field.get_custom_fields';
    const params = `?module=${module}`;

    const config = {
        headers: {
            Authorization: token,
        },
    };
    const apiUrl = `${CONSTANTS.API_BASE_URL}${method}${params}`;
    console.log(apiUrl, 'apiUrl custom fields');

    try {
        const res = await axios.get(apiUrl, { ...config, timeout: 5000 });
        response = res?.data?.message;
        console.log(response, 'response custom fields');
    } catch (error: any) {
        console.error('API Error:', error);
        response = { status: 'error', error: error.message };
        console.log(response, 'response error custom fields');
    }
    return response;
};

export const createCustomField = async (data: any, token: string) => {
    let response: any;
    const method = '/api/method/sdl_metadata.api.custom_field.create_custom_field';

    const config = {
        headers: {
            Authorization: token,
        },
    };
    const apiUrl = `${CONSTANTS.API_BASE_URL}${method}`;
    console.log(apiUrl, 'apiUrl create custom field');

    try {
        const res = await axios.post(apiUrl, data, { ...config, timeout: 5000 });
        response = res?.data?.message;
        console.log(response, 'response create custom field');
    } catch (error: any) {
        console.error('API Error:', error);
        response = { status: 'error', error: error.message };
        console.log(response, 'response error create custom field');
    }
    return response;
};

export const updateCustomField = async (data: any, token: string) => {
    let response: any;
    const method = '/api/method/sdl_metadata.api.custom_field.update_custom_field';

    const config = {
        headers: {
            Authorization: token,
        },
    };
    const apiUrl = `${CONSTANTS.API_BASE_URL}${method}`;
    console.log(apiUrl, 'apiUrl update custom field');

    try {
        const res = await axios.post(apiUrl, data, { ...config, timeout: 5000 });
        response = res?.data?.message;
        console.log(response, 'response update custom field');
    } catch (error: any) {
        console.error('API Error:', error);
        response = { status: 'error', error: error.message };
        console.log(response, 'response error update custom field');
    }
    return response;
};

export const deleteCustomField = async (name: string, token: string) => {
    let response: any;
    const method = '/api/method/sdl_metadata.api.custom_field.delete_custom_field';
    const data = { name };

    const config = {
        headers: {
            Authorization: token,
        },
    };
    const apiUrl = `${CONSTANTS.API_BASE_URL}${method}`;
    console.log(apiUrl, 'apiUrl delete custom field');

    try {
        const res = await axios.post(apiUrl, data, { ...config, timeout: 5000 });
        response = res?.data?.message;
        console.log(response, 'response delete custom field');
    } catch (error: any) {
        console.error('API Error:', error);
        response = { status: 'error', error: error.message };
        console.log(response, 'response error delete custom field');
    }
    return response;
};
