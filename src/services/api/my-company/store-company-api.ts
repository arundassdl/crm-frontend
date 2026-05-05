import axios from 'axios';
import { CONSTANTS } from '@/services/config/app-config';

const CompanyUpdate = async (request: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'company_update';
  const entity = 'company';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let token = request.token
  let values =  request.value

  console.log('request',request);

  let url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params} `

  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };
  //    const val= JSON.stringify(body)


  try {
    const res = await axios.post(url, values, {
      ...config,
    });
    
    response = res?.data?.message;
    console.log('Submit profile:', response);
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

const storeCompanyUpdate = (request: any) => CompanyUpdate(request);

export default storeCompanyUpdate;
