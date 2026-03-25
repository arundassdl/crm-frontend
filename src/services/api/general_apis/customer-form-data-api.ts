import axios from 'axios';
import { CONSTANTS } from '../../config/app-config';
import { client } from './cookie-instance-api';

let response: any;

export async function fetchAddressTypes(token: string) {
  const url = `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.form.load.getdoctype?doctype=Address&with_parent=1`;

  const response = await fetch(url, {
    headers: {
      Authorization: `${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch address types");
  }

  const data = await response.json();

  // Extract `address_type` options
  const addressField = data.docs[0].fields.find(
    (field: any) => field.fieldname === "address_type"
  );

  return addressField?.options?.split("\n").filter((opt: string) => opt) || [];
}


export const FetchCountryList = async (token: any) => {
  const version = CONSTANTS.VERSION;
  const curMethod = 'get_countries';
  const entity = 'countrystatecity';
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

export const FetchStateForCountry = async (country?: any,token?: any) => {
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_states_by_country';
  const entity = 'countrystatecity';
  const stateParams = `?version=${version}&method=${stateMethod}&entity=${entity}&country=${country}`;
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
export const FetchStateForAddressForm = async (token?: any) => {
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_states';
  const entity = 'countrystatecity';
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

export const FetchCitiesForAddressForm = async (state: any, token: any) => {
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_cities';
  const entity = 'countrystatecity';
  const citiesParams = `?version=${version}&method=${stateMethod}&entity=${entity}&state=${state}`;
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

export const FetchPostalCodeByStateCity = async (state: any,city: any, token: any) => {
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_postalcode';
  const entity = 'countrystatecity';
  const citiesParams = `?version=${version}&method=${stateMethod}&entity=${entity}&state=${state}&city=${city}`;
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



export const get_arealist = async (token: any) => {
  const version = CONSTANTS.VERSION;
  const stateMethod = 'get_territory_list';
  const entity = 'territory';
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
