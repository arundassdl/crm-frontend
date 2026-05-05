import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';


  export const fetchRewardGiftslist = async (token: any,query: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'web_get_rewards_gift';
    const entity = 'rewards';
      
    let page_no = 0;
    let limit =  10;
    page_no = query?.page;
    page_no = (page_no!=undefined)?page_no:1;
    limit = (query?.rowsPerPage)?query?.rowsPerPage:query?.limit

    let q = query?.q;
    let searchparams = (q!='' && q!=null)?`&q=${q}`:''
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
  console.log('tokentoken',token);
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&page_no=${page_no}&limit=${limit}&${filterQuery}${sortParams}${searchparams}`;
  
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


  export const redeemRewards = async (request: any,token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'web_add_redeemrewards';
    const entity = 'rewards';
      
    const config = {
      headers: {
        Authorization: token,
        // Accept: 'application/json',
        'Content-Type': 'multipart/form-data' 
      },
    };
  
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;
  
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
  
