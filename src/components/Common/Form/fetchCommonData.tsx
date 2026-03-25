import { fetchDataBySearch } from "@/services/api/common-erpnext-api/listing-api-get";
import {
  fetchAddressTypes,
  FetchCountryList,
  get_arealist,
} from "@/services/api/general_apis/customer-form-data-api";

import { get_rolesname_list } from "@/services/api/roles/roles-api";
import { EditOption } from "../EditableField";

const getAccessToken = () => {
  const tokenData = JSON.parse(localStorage.getItem("AccessTokenData") || "{}");
  return tokenData?.access_token || "";
};

export const fetchOptions = async (
  apiFunction: Function,
  valueKey: string,
  labelKey: string
) => {
  const token = getAccessToken();
  const responseData = await apiFunction(token);

  if (Array.isArray(responseData) && responseData.length > 0) {
    return responseData.map((item: any) => ({
      value: item[valueKey],
      label: item[labelKey],
    }));
  }
  return [];
};

export const getAddressTypes = async () => {
  const token = getAccessToken();
  const getPincodesFromStateCity = await fetchAddressTypes(token);
  if (getPincodesFromStateCity?.length > 0) {
    const pinArrys = getPincodesFromStateCity.map((item: any) => ({
      value: item,
      label: item,
    }));
    return pinArrys;
  } else {
    return [];
  }
};

export const getTerritories = async () => {
  const token = getAccessToken();
  const areaData = await get_arealist(token);
  if (areaData?.length > 0) {
    const areaArrys = areaData.map((item: any) => ({
      value: item.name,
      label: item.territory_name,
    }));
    console.log("areaData", areaArrys);
    return areaArrys;
  } else {
    return [];
  }
};

// /** Fetch Countries */
export const getCountries = async () => {
  const token = getAccessToken();
  const countryData = await FetchCountryList(token);
  if (countryData?.length > 0) {
    const countryArrys = countryData.map((item: any) => ({
      value: item.country_name,
      label: item.country_name,
    }));
    return countryArrys;
  }
};

export const getCustomerTypes = () => [
  {label:"Individual", value:"Individual"},
  {label:"Company",  value:"Company"}
  // "Partnership",
];

export const getNoOfEmployees = () => [
  {label:"1-10", value:"1-10"},
  {label:"11-50",  value:"11-50"},
  {label:"51-200",  value:"51-200"},
  {label:"201-500",  value:"201-500"},
  {label:"501-1000",  value:"501-1000"},
  {label:"1000+",  value:"1000+"}
  // "Partnership",
];

export const getIndustry = async (txt = "", doctype,ref_doc_type = "",): Promise<EditOption[]> => {
  const token = getAccessToken();
  const industryData = await fetchDataBySearch(txt, doctype, token,ref_doc_type);
 
  if (industryData?.length > 0) {
    return industryData.map((item: any) => ({
      label: item.value,
      value: item.value,
    }));
  }

  return [];
};


export const getRole = async (txt = "", doctype,ref_doc_type = "",): Promise<EditOption[]> => {
  const token = getAccessToken();
  const roleData = await get_rolesname_list(token);

   if (roleData?.length > 0) {
    const areaArrys = roleData.map((item: any) => ({
      value: item.rolekey,
      label: item.label,
    }));
    console.log("roleData", areaArrys);
    return areaArrys;
  } else {
    return [];
  }
};
