import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';


export const fetchinstallationdetail = async (request: any,token: any) => {
    let response: any;
    const version = CONSTANTS.VERSION;
    const method = 'get_installation_details';
    const entity = 'installation';
      
    const config = {
      headers: {
        Authorization: token,
      },
    };

    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}&installation_note_id=${request.installation_note_id}`;
      
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