import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';
// import { URLSearchParams } from "url"
import { useSearchParams } from 'next/navigation'


export const get_customer_byemailid = async (customeremailid: any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_customerbyemail';
  const entity = 'customer';
    
  const config = {
    headers: {
      Authorization: token,
    },
  };

  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_FSM_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&emailid=${customeremailid}`;
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

export const get_customer_byphone = async (customerphoneno: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_customerbymobile';
    const entity = 'customer';
      
    const config = {
      headers: {
        Authorization: token,
      },
    };
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_FSM_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&phone=${customerphoneno}`;
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