import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';

export const getTerritoryList = async (query: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_territory_group_list';
    const entity = 'territory';
    console.log(query, 'body');
    const params = `?version=${version}&method=${method}&entity=${entity}`;


    let page_no = 0;
    let limit = 20;
    page_no = query?.page;
    page_no = (page_no != undefined) ? page_no : 1;
    limit = (query?.rowsPerPage) ? query?.rowsPerPage : query?.limit;

    let q = query?.q;

    let searchparams = (q != '' && q != null) ? `&q=${q}` : ''
    let filterQuery = ""
    if (query.items?.length > 0) {
        filterQuery = query.items
            .map(item => `field=${item.field}&value=${item.value}&operator=${item.operator}`)
            .join('&');
    }
    let sortParams = "";
    if (query?.sortModel) {
        const sortQuery = query.sortModel.map(item => `${item.field}=${item.sort}`)
            .join('&');
        if (sortQuery != '') {
            sortParams = `&sort=[${sortQuery}]`
        }
    }

    const config = {
        headers: {
            Authorization: token,
        },
    };

    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&page_no=${page_no}&limit=${limit}&${filterQuery}${sortParams}${searchparams}`;

    await axios
        .get(`${url}`, { ...config, timeout: 5000 })
        .then((res) => {
            response = res?.data?.message?.data;
        })
        .catch((err) => {
            response = handleError(err);
        });
    return response;
};

export const submit_addterritory = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'add_territory';
    const entity = 'territory';
    const appcode = CONSTANTS.APPCODE;
    // const params = `?version=${version}&method=${method}&entity=${entity}&app_code=${appcode}`;
    const params = `?version=${version}&method=${method}&entity=${entity}`; // Assuming app_code might not be needed or key is different, mimicking general structure

    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`

    const config = {
        headers: {
            Authorization: token,
            Accept: 'application/json',
        },
    };
    try {
        const res = await axios.post(url, request, {
            ...config,
        });

        response = res?.data?.message;
    } catch (error: any) {
        response = handleError(error);
    }
    return response;
};

export const get_territory_details = async (territory_name: string, token: any) => {
    // Mimicking get_roleby_name
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_territory_details'; // Assuming this method exists or similar
    const entity = 'territory';

    const config = {
        headers: {
            Authorization: token,
        },
    };

    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&name=${territory_name}`;

    await axios
        .get(`${url}`, { ...config, timeout: 5000 })
        .then((res) => {
            response = res?.data?.message?.data;
        })
        .catch((err) => {
            response = handleError(err);
        });
    return response;
};


export const submit_editterritory = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'update_territory';
    const entity = 'territory';

    const params = `?version=${version}&method=${method}&entity=${entity}`;

    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`

    const config = {
        headers: {
            Authorization: token,
            Accept: 'application/json',
        },
    };
    try {
        const res = await axios.post(url, request, {
            ...config,
        });

        response = res?.data?.message;
    } catch (error: any) {
        response = handleError(error);
    }
    return response;
};

export const delete_territory = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'delete_territory';
    const entity = 'territory';

    const params = `?version=${version}&method=${method}&entity=${entity}`;

    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`;

    const config = {
        headers: {
            Authorization: token,
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
        },
    };

    try {
        const res = await axios.post(url, request, {
            ...config,
            timeout: 5000,
        });

        response = res?.data?.message;
    } catch (error: any) {
        response = handleError(error);
    }
    return response;
};

export const get_full_territory_tree = async (token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const stateMethod = 'get_territory_group_list'; // Using group list for tree
    const entity = 'territory';
    const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}`;

    const config = {
        headers: {
            Authorization: token,
        },
    };

    await axios
        .get(
            `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${stateParams}`,
            { ...config, timeout: 5000 }
        )
        .then((res: any) => {
            response = res?.data?.message?.data;
        })
        .catch((err: any) => {
            console.log('err', err);
        });
    return response;
};

const handleError = (error: any) => {
    let response;
    console.error('API Error:', error);
    if (error.code === 'ECONNABORTED') {
        response = 'Request timed out';
    } else if (error.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
    } else if (error.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
    } else {
        response = error;
    }
    return response;
}
