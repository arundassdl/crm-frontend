import axios from 'axios';
import { CONSTANTS } from '@/services/config/app-config';


let response: any;
export const FetchCurrency = async (token: any) => {
  const version = CONSTANTS.VERSION;
  const curMethod = 'web_get_currency';
  const entity = 'company';
  const citiesParams = `?version=${version}&method=${curMethod}&entity=${entity}`;
  const config = {
    headers: {
      Authorization: token,
    },
  };
  await axios
    .get(
      `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}${citiesParams}`,
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