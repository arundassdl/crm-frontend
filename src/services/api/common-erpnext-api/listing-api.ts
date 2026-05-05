import { convertDate, isGridValidDate } from "./libs/utils";
import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import axios from "axios";
interface FetchParams {
  doctype:string,
  page: number;
  pageSize: number;
  filters?: any;
  sort?: any;
}

export async function fetchCommonListing(
  params: FetchParams,
  token: string,
  fields: any[],
  doctype: string,
) {
  const { page, pageSize, filters, sort } = params;
  const orderby =
    sort?.length > 0 ? sort[0]?.field + " " + sort[0]?.sort : "modified desc";

    let filterArray = filters?.items?.length > 0 ? filters.items : []; // Use filters.items directly, no need to wrap it in an array
  const quickFilterValues =
    filters?.quickFilterValues?.length > 0
      ? filters.quickFilterValues.join(" ")
      : "";

  const queryParams = filterArray.map((item) => ({
    field: item.field,
    value: item.value,
    operator: item.operator,
  }));

  // If quickFilterValues exists, add it to the queryParams array as a separate filter
  if (quickFilterValues) {
    queryParams.push({
      field: "q",
      value: quickFilterValues,
      operator: fields?.length ? fields[0] : "name",
    }); 
  }
  // Now pass queryParams (array of { field, value }) to constructFilters
  const filtersObj = constructFilters(queryParams, fields);

  try {
    // Define the customer API parameters
    const customerParams = {
      doctype: doctype,
      fields: JSON.stringify(fields),
      start	: page+1 * pageSize, // Start index for pagination
      page_length	: pageSize, // Number of records per page
      ...(filters && { filters: JSON.stringify(filtersObj)}),
      ...(sort && { order_by: orderby }),
    };
    console.log("customerParams",customerParams);
    
    const customerCntParams = {
      doctype: doctype,
      ...(filters && { filters: JSON.stringify(filtersObj)}),
      ...(sort && { order_by: orderby }),
    };

    // Fetch customers
    const customerData = await fetchFromERPNext(
      doctype,
      customerParams,
      token
    );
    console.log("customerData+++",customerData);
    const keys = customerData.message.keys;
    const values = customerData.message.values[0];

    const result = transformData(customerData);
    console.log("result", result);

    // const customersWithDetails = customerData.data.map(
    //   (customer: any, index: number) => {
    //     console.log("customer+++",customer);
        
    //     return {
    //       ...customer,
    //       contacts: [],
    //       addresses: [],
    //       // contacts: contactsData[index].data,
    //       // addresses: addressData[index].data,
    //     };
    //   }
    // );

    return {
      customers: result?.data,
      totalCount: await getTotalCount(doctype, token, customerCntParams),
    };
  } catch (error: unknown) {
    return {
      customers: [],
      totalCount: 0,
    };   
  }
}

const transformData = (input: any) => {
  const { keys, values } = input.message;
  
  const data = values.map((valueArray: any[]) => {
    return keys.reduce((obj: any, key: string, index: number) => {
      obj[key] = valueArray[index] !== undefined ? valueArray[index] : null;
      return obj;
    }, {});
  });

  return { data };
};

const getTotalCount = async (
  endpoint: string, 
  token: string, 
  params: FetchParams
) => {
  try {
    // Ensure 'doctype' is included in params
    if (!params.doctype) {
      throw new Error("Missing 'doctype' in params");
    }

    const response = await fetch(
      `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.reportview.get_count`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch from ERPNext: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("response count:", data?.message);

    return data?.message;
  } catch (error) {
    console.error("Error fetching total customer count:", error);
    return 0;
  }
};

const fetchFromERPNext = async (
  endpoint: string,
  params: any,
  token: string
) => {
  const url = `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.reportview.get`;

  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${url}`, {
    method: "POST",
    headers: {
      Authorization: `${token}`, // Use the token passed in the request header
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from ERPNext: ${response.statusText}`);
  }

  return response.json();
};

const fetchFromERPNext1 = async (
  endpoint: string,
  params: any,
  token: string
) => {
  const url = `${CONSTANTS.API_BASE_URL}/api/resource/${endpoint}`;

  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${url}?${queryString}`, {
    method: "GET",
    headers: {
      Authorization: `${token}`, // Use the token passed in the request header
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from ERPNext: ${response.statusText}`);
  }

  return response.json();
};

function checkDateParams(param: any, filters) {
  try {
    const date_string = convertDate(param.value); // Convert the date value
    console.log("date_string", date_string);

    switch (param.operator) {
      case "is":
        filters.push(
          [param.field, ">=", date_string + " 00:00:00"],
          [param.field, "<=", date_string + " 23:59:59"]
        );
        break;
      case "not":
        filters.push([param.field, "!=", date_string]);
        break;
      case "after":
        filters.push([param.field, ">", date_string + " 00:00:00"]);
        break;
      case "onOrAfter":
        filters.push([param.field, ">=", date_string + " 00:00:00"]);
        break;
      case "before":
        filters.push([param.field, "<", date_string + " 23:59:59"]);
        break;
      case "onOrBefore":
        filters.push([param.field, "<=", date_string + " 23:59:59"]);
        break;
      default:
        console.error("Unknown operator: " + param.operator);
    }
  } catch (error) {
    console.error("Invalid date format: " + param.value);
  }
}
const constructFilters = (
  queryParams: Array<{ field: string; value: string; operator: string }>,
  fields: string[]
): Array<[string, string, string | string[]]> => {
  const filters: Array<[string, string, string | string[]]> = [];
  console.log("queryParams yyyyyyyyyyy", queryParams);

  // If queryParams contains q (quick search term)
  if (queryParams.some((param) => param.field === "q" && param.value)) {
    const quickFilter = queryParams.find((param) => param.field === "q");
    console.log("quickFilterquickFilter0000", quickFilter);

    if (quickFilter && quickFilter.value !== "") {
      if (Array.isArray(fields) && fields.length > 0) {
        console.log("fields filters1111", fields);
        filters.push([
          quickFilter.operator as string,
          "like",
          `%${quickFilter.value}%`,
        ]);
      }
    }
  }
  console.log("filtersyyyyyyyyyyyy", filters);
  // Handle additional conditions based on operator in queryParams
  queryParams.forEach((param) => {
    if (param.field !== "q" && param.value !== "") {
      if (param.operator) {
        console.log("isGridValidDate(param.value)", isGridValidDate(param.value));

        if (isGridValidDate(param.value)) {
          checkDateParams(param, filters);
        } else {
          switch (param.operator) {
            case "isNotEmpty":
              filters.push([param.field, "!=", ""]);
              break;
            case "isEmpty":
              filters.push([param.field, "=", ""]);
              break;
            case "contains":
            case "startsWith":
            case "endsWith":
              filters.push([
                param.field,
                "like",
                param.operator === "startsWith"
                  ? `${param.value}%`
                  : param.operator === "endsWith"
                    ? `%${param.value}`
                    : `%${param.value}%`,
              ]);
              break;
            case "equals":
            case "is":
              filters.push([param.field, "=", param.value]);
              break;
            case "not":
              filters.push([param.field, "!=", param.value]);
              break;
          }
        }
      }
    }
  });
  return filters;
};
