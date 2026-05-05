import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';
// import { URLSearchParams } from "url"
import { useSearchParams } from 'next/navigation'





export const datagrid_listing = async (request: any, token: any, urlparamas: any)=> {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_list';
  const entity = 'datalist';
  const appcode = 'FSM';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}&app_code=${appcode}` + urlparamas;
  let url: any
  console.log('request',request);
  
  
  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`
  
  const config = {
    headers: {
      Authorization: token,
      'Content-Type': 'multipart/form-data' 
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
