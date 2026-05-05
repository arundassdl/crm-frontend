import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';

export const fetchProductmodel = async (token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_item_group';
  const entity = 'installation';

  const config = {
    headers: {
      Authorization: token,
    },
  };

  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;

  await axios
    .get(`${url}`, { ...config, timeout: 5000 })
    .then((res) => {
      console.log('filters check in product listing api res successful', res);
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

export const fetchProduct = async (productmodel: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_item_list';
    const entity = 'installation';
      
    const config = {
      headers: {
        Authorization: token,
      },
    };
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&item_group_name=${productmodel}`;
  
    await axios
      .get(`${url}`, { ...config, timeout: 5000 })
      .then((res) => {
        console.log('filters check in product listing api res successful', res);
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


  export const fetchProductcapacity = async (product: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_item_attribute';
    const entity = 'installation';
      
    const config = {
      headers: {
        Authorization: token,
      },
    };
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&item_name=${encodeURIComponent(product)}`;
  
    await axios
      .get(`${url}`, { ...config, timeout: 5000 })
      .then((res) => {
        console.log('filters check in product capacity api res successful', res);
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

  export const fetchdealer = async (token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_dealer_list';
    const entity = 'installation';
      
    const config = {
      headers: {
        Authorization: token,
      },
    };
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;
  
    await axios
      .get(`${url}`, { ...config, timeout: 5000 })
      .then((res) => {
        console.log('filters check in dealer api res successful', res);
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

