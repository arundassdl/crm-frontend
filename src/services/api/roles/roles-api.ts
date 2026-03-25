import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';
// import { URLSearchParams } from "url"
import { useSearchParams } from 'next/navigation'

export const getRolesListDatagrid = async (query: any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_roles_lists';
  const entity = 'roles';
  console.log(query, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  
 
  let page_no = 0;
  let limit =  20;
  page_no = query?.page;
  page_no = (page_no!=undefined)?page_no:1;
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
  console.log('token before');

  const config = {
    headers: {
      Authorization: token,
    },
  };
  console.log('tokentoken', token);

  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&page_no=${page_no}&limit=${limit}&${filterQuery}${sortParams}${searchparams}`;
  
  //    const val= JSON.stringify(body)

  await axios
    .get(`${url}`, { ...config, timeout: 5000 })
    .then((res) => {
      console.log('filters check in roles list api res successful', res);
      response = res?.data?.message?.data;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
};

export const fetchpermissionmodule = async (token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_all_modules_lists';
  const entity = 'roles';
  const appcode = CONSTANTS.APPCODE;
    
  const config = {
    headers: {
      Authorization: token,
    },
  };

  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&app_code=${appcode}`;
  console.log('fetchpermission', url);
  await axios
    .get(`${url}`, { ...config, timeout: 5000 })
    .then((res) => {
      console.log('filters check in permission module api res successful', res);
      response = res?.data?.message?.data;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
};


export const submit_addroles = async (request: any, token: any)=> {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'add_roles';
  const entity = 'roles';
  const appcode = CONSTANTS.APPCODE;
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}&app_code=${appcode}`;
  let url: any
  console.log('request',request);

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`

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
      console.log('Submit Roles:', response);
    } catch (error:any) {
      console.error('Error uploading images:', error);
      if (error.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (error.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (error.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = error;
      }
    }
    return response;
};

export const get_roleby_name = async (request: any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_roleby_name';
  const entity = 'roles';
  const appcode = CONSTANTS.APPCODE;
    
  const config = {
    headers: {
      Authorization: token,
    },
  };

  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&app_code=${appcode}&role_name=${request.rolename}`;
  console.log('fetchpermission', url);
  await axios
    .get(`${url}`, { ...config, timeout: 5000 })
    .then((res) => {
      console.log('filters check in permission module api res successful', res);
      response = res?.data?.message?.data;
    })
    .catch((err) => {
      if (err.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (err.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (err.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = err;
      }
    });
  return response;
};


export const submit_editroles = async (request: any, token: any)=> {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'edit_roles';
  const entity = 'roles';
  const appcode = CONSTANTS.APPCODE;
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}&app_code=${appcode}`;
  let url: any
  console.log('request',request);

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`

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
      console.log('Submit Roles:', response);
    } catch (error:any) {
      console.error('Error uploading images:', error);
      if (error.code === 'ECONNABORTED') {
        response = 'Request timed out';
      } else if (error.code === 'ERR_BAD_REQUEST') {
        response = 'Bad Request';
      } else if (error.code === 'ERR_INVALID_URL') {
        response = 'Invalid URL';
      } else {
        response = error;
      }
    }
    return response;
};


export const get_rolesname_list = async (token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_rolename_lists';
  const entity = 'roles';
  const appcode = CONSTANTS.APPCODE;
  const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}&appname=${appcode}`;
  const config = {
    headers: {
      Authorization: token,
    },
  };
  await axios
    .get(
      `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}${stateParams}`,
      config
    )
    .then((res: any) => {
      console.log('get_rolesname', res);
      response = res?.data?.message?.data;
    })
    .catch((err: any) => {
      console.log('err', err);
    });
  return response;
};
