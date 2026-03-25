import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';

export const deleteInstallImage = async (request: any,token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'delete_installation_image';
  const entity = 'installation';
    
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

export const deleteInstall = async (request: any,token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'delete_installation';
  const entity = 'installation';
    
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


export const approveInstall = async (request: any,token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'approved_installation';
  const entity = 'installation';
    
  const config = {
    headers: {
      Authorization: token,
      Accept: 'application/json',
    },
  };
  
  const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&name=${request.name}&tankserialno=${request.serial_no}&item_code=${encodeURIComponent(request.item_code)}`;

  await axios
  .post(
    url,
    undefined,
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

export const rejectInstall = async (request: any,token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'reject_installation';
  const entity = 'installation';
    
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

export const downloadPdf = async (request: any,token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'download_pdf';
  const entity = 'installation';
    
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
    res.data.message.serial_no = request.serial_no
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
