import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';
import { string } from 'yup';


export const fetchcontactlist = async (token: any, query: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_contacts';
  const entity = 'contact';

  let page_no = 0;
  let limit = 20;
  page_no = query?.page;
  page_no = (page_no != undefined) ? page_no : 1;
  limit = (query?.rowsPerPage) ? query?.rowsPerPage : query?.limit;

  let q = query?.q;

  let searchparams = (q != '' && q != null) ? `&q=${q}` : ''
  let filterQuery = ""
  if (query?.items?.length > 0) {
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
  console.log('tokentoken', token);
//version=${version}
//&${filterQuery}${sortParams}${searchparams}`;
  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&page_no=${page_no}&limit=${limit}&${filterQuery}${sortParams}${searchparams}`;

  await axios
    .get(`${url}`, { ...config, timeout: 5000 })
     
    // .get('http://localhost:8000/api/method/summitapp.api.v2.test.get_users',{ ...config, timeout: 5000 })
    .then((res) => {
      console.log(url)
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
    console.log("resp"+response)
  return response;
};


export const fetchlist = async (request:any,token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'get_contact_detailslist';
  const entity = 'contact';

  // let page_no = 0;
  // let limit = 20;
  // page_no = query?.page;
  // page_no = (page_no != undefined) ? page_no : 1;
  // limit = (query?.rowsPerPage) ? query?.rowsPerPage : query?.limit;

  // let q = query?.q;

  // let searchparams = (q != '' && q != null) ? `&q=${q}` : ''
  // let filterQuery = ""
  // if (query?.items?.length > 0) {
  //   filterQuery = query.items
  //     .map(item => `field=${item.field}&value=${item.value}&operator=${item.operator}`)
  //     .join('&');
  // }
  // let sortParams = "";
  // if (query?.sortModel) {
  //   const sortQuery = query.sortModel.map(item => `${item.field}=${item.sort}`)
  //     .join('&');
  //   if (sortQuery != '') {
  //     sortParams = `&sort=[${sortQuery}]`
  //   }
  // }


  const config = {
    headers: {
      Authorization: token,
    },
  };
  console.log('tokentoken', token);
//version=${version}
//&${filterQuery}${sortParams}${searchparams}`;
  let nam=request.name;
  
  let arr=nam.split('%3B')
  console.log('########## nam '+nam +' name ' +arr[0] +' email '+arr[1])
  //if(arr[0]!=undefined && arr[1]!=undefined)
  let url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&name=${arr[0]}&email_id=${arr[1]}`;
  // else if(request.email_id!=undefined)
  //   url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&email_id=${request.email_id}`;
  await axios
    .get(`${url}`, { ...config, timeout: 5000 })
     
    // .get('http://localhost:8000/api/method/summitapp.api.v2.test.get_users',{ ...config, timeout: 5000 })
    .then((res) => {
      console.log(url)
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
    console.log("resp"+response)
  return response;
};