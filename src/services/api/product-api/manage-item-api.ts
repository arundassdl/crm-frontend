import axios from 'axios';
import { CONSTANTS } from '@/services/config/app-config';
import { client } from '../general_apis/cookie-instance-api';


export const fetchitemSearch = async (request: any,token: any,item_group: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'search_item';
    const entity = 'product';
      
    const config = {
      headers: {
        Authorization: token,
      },
    };

    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&query=${request}&item_group=${item_group}`;
      
    await axios
      .get(`${url}`, { ...config, timeout: 5000 })
      .then((res) => {
        console.log('filters check in contact list api res successful', res);
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

  export const AddEditCustomer = async (request: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'create_contact';
    const entity = 'contact';
  
    const config = {
      headers: {
        Authorization: request.token,
      },
    };
  
    const requestValues = request?.value;
  
    let body = {
      version: version,
      method: method,
      entity: entity,
      ...requestValues,
    };
  
    await axios
      .post(`${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}`, body, {
        ...config,
        timeout: 5000,
      })
      .then((res: any) => {
        // if(res?.data?.message?.msg === "success") {
        //   localStorage.setItem("guestId", action?.payload?.customer_id?.name);
        // }
        console.log('address post res', res);
        response = res?.data?.message;
      })
      .catch((err: any) => {
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
  
