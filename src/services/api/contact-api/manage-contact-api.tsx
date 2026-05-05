
import axios from 'axios';
import { CONSTANTS } from '@/services/config/app-config';

export const fetchContactEmails = async (request: any,token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_contact_emails';
    const entity = 'contact';
      
    const config = {
      headers: {
        Authorization: token,
      },
    };

    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&contact_name=${request.contact_name}`;
      
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


export const CreateContactEmail = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'create_contact_email';
    const entity = 'contact';
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
  
 
export const EditContactEmail = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'edit_contact_email';
    const entity = 'contact';
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
        { ...config, timeout: 2000 }
      )
      .then((res) => {
         //alert(res)
        console.log(res, 'rrrr '+ res)//?.data?.message);
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

export const deleteContactEmail = async (request: any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'delete_contact_email';
  const entity = 'contact';
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

  export const CreateContactPhone = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'create_contact_phone';
    const entity = 'contact';
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

  export const EditContactPhone = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'edit_contact_phone';
    const entity = 'contact';
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
        { ...config, timeout: 2000 }
      )
      .then((res) => {
         //alert(res)
        console.log(res, 'rrrr '+ res)//?.data?.message);
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
 export const deleteContactPhone= async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'delete_contact_phone';
    const entity = 'contact';
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




  export const CreateContactAddress = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'create_contact_address';
    const entity = 'contact';
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

  export const EditContactAddress = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'edit_contact_address';
    const entity = 'contact';
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
        { ...config, timeout: 2000 }
      )
      .then((res) => {
         //alert(res)
        console.log(res, 'rrrr '+ res)//?.data?.message);
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

  export const deleteContactaddress = async (request: any, token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'delete_contact_address';
    const entity = 'contact';
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