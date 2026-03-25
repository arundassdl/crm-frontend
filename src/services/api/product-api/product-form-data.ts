import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';


let response: any;
export const FetchItemGroups = async (token?: any) => {
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_itemgroups';
  const entity = 'product';
  const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}`;
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
      response = res?.data?.message?.data;
    })
    .catch((err: any) => {
      console.log('err', err);
    });
  return response;
};


export const FetchUOMList = async (token?: any) => {
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_uom_list';
  const entity = 'product';
  const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}`;
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
      response = res?.data?.message?.data;
    })
    .catch((err: any) => {
      console.log('err', err);
    });
  return response;
};

export const FetchItemVariantAttributeList = async (itemCode:string,token?: any) => {
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_itemvariantattribute_list';
  const entity = 'product';
  const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}`;
  const config = {
    headers: {
      Authorization: token,
    },
  };
  await axios
    .get(
      `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${stateParams}&item_code=${itemCode}`,
      config
    )
    .then((res: any) => {
      response = res?.data?.message?.data;
    })
    .catch((err: any) => {
      console.log('err', err);
    });
  return response;
};