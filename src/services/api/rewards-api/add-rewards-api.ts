import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';

export const deleteredeemlist = async (request: any,token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'delete_redeem';
  const entity = 'rewards';
    
  const config = {
    headers: {
      Authorization: token,
      Accept: 'application/json',
    },
  };

  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&name=${request.name}`;

  await axios
  .post(
    url,
    undefined,
    { ...config, timeout: 5000 }
  )
  .then((res) => {
    console.log(res, 'rrrr');
    response = res;
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


export const approvedredeemlist = async (request: any,token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'approved_redeem';
  const entity = 'rewards';
    
  const config = {
    headers: {
      Authorization: token,
      Accept: 'application/json',
    },
  };

  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&name=${request.name}`;

  await axios
  .post(
    url,
    undefined,
    { ...config, timeout: 5000 }
  )
  .then((res) => {
    console.log(res, 'rrrr');
    response = res;
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

export const rejectredeemlist = async (request: any,token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'reject_redeem';
  const entity = 'rewards';
    
  const config = {
    headers: {
      Authorization: token,
      Accept: 'application/json',
    },
  };

  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&name=${request.name}&tankserialno=${request.serial_no}&item_code=${request.item_code}`;

  await axios
  .post(
    url,
    undefined,
    { ...config, timeout: 5000 }
  )
  .then((res) => {
    console.log(res, 'rrrr');
    response = res;
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
