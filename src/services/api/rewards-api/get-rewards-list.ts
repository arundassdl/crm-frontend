import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';


export const fetchRewardRedeemedHistory = async (token: any,query: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'web_detail_redeemed_history';
  const entity = 'rewards';
    
  let page_no: any;
  let limit: any;
  page_no = query?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = (query?.rowsPerPage) ? query?.rowsPerPage : query?.limit;

  let q = query?.q;

    let searchparams = (q != '' && q != null) ? `&q=${q}` : ''
    let filterQuery = ""
    if (query.items?.length > 0) {
      filterQuery = query.items
        .map(item => `&field=${item.field}&value=${item.value}&operator=${item.operator}`)
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
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&page_no=${page_no}&limit=${limit}${filterQuery}${sortParams}${searchparams}&redeemed_id=${query?.redeemed_id}&username=${query?.username}`;
    
  await axios
    .get(`${url}`, { ...config, timeout: 5000 })
    .then((res) => {
      console.log('filters check in installation list api res successful', res);
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

export const fetchrewardredemptionlist = async (token: any,query: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'web_get_redeemhistorylist';
  const entity = 'rewards';
    
  let page_no: any;
  let limit: any;
  page_no = query?.page;
  page_no = (page_no!=undefined)?page_no:1;
  limit = (query?.rowsPerPage) ? query?.rowsPerPage : query?.limit;

  let q = query?.q;

    let searchparams = (q != '' && q != null) ? `&q=${q}` : ''
    let filterQuery = ""
    if (query.items?.length > 0) {
      filterQuery = query.items
        .map(item => `&field=${item.field}&value=${item.value}&operator=${item.operator}`)
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
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&page_no=${page_no}&limit=${limit}${filterQuery}${sortParams}${searchparams}`;
    

  await axios
    .get(`${url}`, { ...config, timeout: 5000 })
    .then((res) => {
      console.log('filters check in installation list api res successful', res);
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


export const fetchinstallationlist = async (token: any,query: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_redeemhistorylist';
    const entity = 'rewards';
      
    let page_no = 0;
    let limit =  10;
    page_no = query?.page;
    page_no = (page_no!=undefined)?page_no:1;
    limit = query?.limit;

    let q = query?.q;
      
    let searchparams = (q!='' && q!=null)?`&q=${q}`:''
    const config = {
      headers: {
        Authorization: token,
      },
    };
  console.log('tokentoken',token);
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&page_no=${page_no}&limit=${limit}${searchparams}`;
  
    await axios
      .get(`${url}`, { ...config, timeout: 5000 })
      .then((res) => {
        console.log('filters check in installation list api res successful', res);
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


  export const fetchRewardHistorylist = async (query: any,token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'web_get_top10_rewardhistory';
    const entity = 'rewards';
      
    let page_no = 0;
    let limit =  10;
    page_no = query?.page;
    page_no = (page_no!=undefined)?page_no:1;
    limit = query?.limit;

    let q = query?.q;
      
    // let searchparams = (q!='' && q!=null)?`&q=${q}`:''

    const searchparams = new URLSearchParams();
    if((q!='' && q!=null)) {
      searchparams.append('q', q); 
    }
    // if((query?.username!='' && query?.username!=null)) {
    //   searchparams.append('username', query?.username); 
    // } 


    const config = {
      headers: {
        Authorization: token,
      },
    };
  console.log('tokentoken',token);
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&page_no=${page_no}&limit=${limit}${searchparams}`;
  
    await axios
      .get(`${url}`, { ...config, timeout: 5000 })
      .then((res) => {
        console.log('filters check in installation list api res successful', res);
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
