import axios from 'axios';
import { CONSTANTS } from '@/services/config/app-config';


let response: any;
export const GetAllAddress = async (request: any,token: any) => {
  const version = CONSTANTS.VERSION;
  const AddrsMethod = 'web_get_address';
  const entity = 'company';
  const addrsParams = `?version=${version}&method=${AddrsMethod}&entity=${entity}&name=${request?.name}`;
  const config = {
    headers: {
      Authorization: token,
    },
  };
  await axios
    .get(
      `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}${addrsParams}`,
      { ...config, timeout: 5000 }
    )
    .then((res: any) => {
      response = res?.data?.message?.data;
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

export const setAsDefaultAddress = async (request: any,token: any) => {
  const version = CONSTANTS.VERSION;
  const setAddrsMethod = 'set_as_default_address';
  const entity = 'company';
  const addrsParams = `?version=${version}&method=${setAddrsMethod}&entity=${entity}`;
  const config = {
    headers: {
      Authorization: token,
    },
  };
    
  let url = `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}${addrsParams}`
console.log("url",url);

  try {
    const res = await axios.post(url, request, {
      ...config,
    });
    
    response = res?.data?.message;
    console.log('Submit Survey:', response);
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

export const setAsDefaultAddressUpdate = async (request: any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'set_as_default_address';
  const entity = 'company';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
  let form_data = request.files;


  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}`


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

export const AddEditAddresses = async (request: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'add_edit_address';
  const entity = 'company';

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

export const DeleteAddress = async (request: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'delete_address';
  const entity = 'company';

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