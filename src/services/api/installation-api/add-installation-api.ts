import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';

const InstallationFetch = async (request: any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'create_installation';
  const entity = 'installation';
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

const InstallationApi = (request: any, token: any) => InstallationFetch(request, token);

export default InstallationApi;
