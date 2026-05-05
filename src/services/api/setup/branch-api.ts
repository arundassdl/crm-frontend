import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from '../general_apis/cookie-instance-api';
import { API_CONFIG } from '../../config/api-config';
// import { URLSearchParams } from "url"
import { useSearchParams } from 'next/navigation'




export const get_branch_list = async (token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_branch_list';
  const entity = 'setup';
  const appcode = 'FSM';
  const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}&appname=${appcode}`;
  const config = {
    headers: {
      Authorization: token,
    },
  };
  await axios
    .get(
      `${CONSTANTS.API_BASE_URL}/${CONSTANTS.API_MANDATE_PARAMS}${stateParams}`,
      config
    )
    .then((res: any) => {
      console.log('get_branch_list', res);
      response = res?.data?.message?.data;
    })
    .catch((err: any) => {
      console.log('err', err);
    });
  return response;
};