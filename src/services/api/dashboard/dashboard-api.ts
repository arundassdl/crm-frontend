import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';
// import { URLSearchParams } from "url"
import { useSearchParams } from 'next/navigation'

export const getInstallationData = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'web_installationsummary';
  const entity = 'insights';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
 
  let page_no = 0;
  let limit =  20;
  page_no = request?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = request?.limit;

  let q = request?.q;
    
  let searchparams = (q!='' && q!=null)?`&q=${q}`:''

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}${searchparams}`
 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };
  //    const val= JSON.stringify(body)

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res, 'rrrr');
      response = res?.data?.message;
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

export const getSurveyData = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'web_surveysummary';
  const entity = 'insights';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
 
  let page_no = 0;
  let limit =  20;
  page_no = request?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = request?.limit;

  let q = request?.q;
    
  let searchparams = (q!='' && q!=null)?`&q=${q}`:''

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}${searchparams}`
 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res, 'rrrr');
      response = res?.data?.message;
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
export const getRewardsData = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'web_rewardsmonthsummary';
  const entity = 'insights';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
 
  let page_no = 0;
  let limit =  20;
  page_no = request?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = request?.limit;

  let q = request?.q;
    
  let searchparams = (q!='' && q!=null)?`&q=${q}`:''

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}${searchparams}`
 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res, 'rrrr');
      response = res?.data?.message;
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


export const getSalesPartnerData = async (request:any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'dashboard_salespartners_count';
  const entity = 'insights';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
 
  let page_no = 0;
  let limit =  20;
  page_no = request?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = request?.limit;

  let q = request?.q;
    
  let searchparams = (q!='' && q!=null)?`&q=${q}`:''

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}${searchparams}`
 
  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };

  await axios
    .post(
      url,
      request,
      { ...config, timeout: 5000 }
    )
    .then((res) => {
      console.log(res, 'rrrr');
      response = res?.data?.message;
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