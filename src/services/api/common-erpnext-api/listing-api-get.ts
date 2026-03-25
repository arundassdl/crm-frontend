import { convertDate, isGridValidDate } from "./libs/utils";
import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import axios from "axios";
interface FetchParams {
  page: number;
  pageSize: number;
  filters?: any;
  sort?: any;
}
export interface LinkedDoctype {
  field: string; // Field name (e.g., "Dynamic Link")
  key: string; // Specific key inside the field (e.g., "link_doctype")
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE"; // Comparison operator
  value: string; // Value for the filter
}
interface RawDatgridParams {
  module: string;
  fields: any[];
  filters: ([string, string, string | string[]] | [string, string, string, string])[];
  limit_start: number;
  limit_page_length: number;
  order_by: string;
  include_contact: string;
  include_address: string;
  related?: string[]; // Optional related field
  Joinquery: string;
  whereconditon: string;
  role_profile: string;
  username: string;
};
const constructLinkedDocs = (linkedDocs) => {};
export async function fetchRawDataGridListing(
  params: FetchParams,
  token: string,
  fields: any[],
  doctype: string,
  relatedDocs?: any[],  
  include_contact: string = "",
  include_address: string = "",
  linkedDoctypes: LinkedDoctype[] = [],
  Joinquery: string = "",
  whereconditon: string ="",
  role_profile: string="",
  username: string="",
) {
  console.log("linkedDoctypes==>>",linkedDoctypes);
  
  const { page, pageSize, filters, sort } = params;
  const orderby =
    sort?.length > 0
      ? sort[0]?.field + " " + sort[0]?.sort
      : `${doctype}.modified desc`;

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

  if (linkedDoctypes?.length > 0) {
    // Ensure filtersObj is an array before pushing data
    if (!Array.isArray(filtersObj)) {
      throw new Error("filtersObj must be an array to append linkedDoctypes.");
    }
    // Append linkedDoctypes dynamically (3 or 4 elements based on operator existence)
    linkedDoctypes.forEach((docType) => {
      // if (docType.value) {
      if (docType.operator) {
        // Push 4-element array if operator exists
        filtersObj.push([
          docType.field,
          docType.key,
          docType.operator,
          docType.value != undefined &&
          docType.value != null &&
          typeof docType.value == "string"
            ? docType.value
            : "",
        ]);
      } else {
        // Push 3-element array if operator is not defined
        filtersObj.push([docType.field, docType.key, docType.value]);
      }
      // }
    });
  }

  try {  
    // Fetch data from API
    // const response = await axios.get(`/api/data?${queryString}`);
    const requestBody: RawDatgridParams = {
      module: doctype,
      fields,
      filters: filtersObj,
      limit_start: page * pageSize,
      limit_page_length: pageSize,
      order_by: orderby,
      include_contact,
      include_address,
      Joinquery,
      whereconditon,
      role_profile,
      username,
    };

    // Append related doctypes if they exist
    if (relatedDocs && relatedDocs.length > 0) {
      requestBody.related = relatedDocs;
    }    
    console.log("requestBodyresponse000",requestBody)
    // Fetch data from API using POST
    const response = await axios.post("/api/datalist", requestBody);
    console.log("response000",response);
    
    return {
      data: response?.data?.records || [],
      totalCount: response?.data?.total_count || 0,
    };
  } catch (error: unknown) {
    return {
      data: [],
      totalCount: 0,
    };
  }
}

export async function fetchCommonListingGet(
  params: FetchParams,
  token: string,
  fields: any[],
  doctype: string,
  linkedDoctypes: LinkedDoctype[] = [],
  Joinquery: string = "",
  whereconditon: string="",
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
  console.log("filtersObj linkedDoctypes?.length dsd", linkedDoctypes);

  if (linkedDoctypes?.length > 0) {
    // Ensure filtersObj is an array before pushing data
    if (!Array.isArray(filtersObj)) {
      throw new Error("filtersObj must be an array to append linkedDoctypes.");
    }
    // Append linkedDoctypes dynamically (3 or 4 elements based on operator existence)
    linkedDoctypes.forEach((docType) => {
      // if (docType.value) {
      if (docType.operator) {
        // Push 4-element array if operator exists
        filtersObj.push([
          docType.field,
          docType.key,
          docType.operator,
          docType.value != undefined &&
          docType.value != null &&
          typeof docType.value == "string"
            ? docType.value
            : "",
        ]);
      } else {
        // Push 3-element array if operator is not defined
        filtersObj.push([docType.field, docType.key, docType.value]);
      }
      // }
    });
  }

  console.log("filtersObj h", filtersObj);

  try {
    // Define the customer API parameters
    const dataParams = {
      fields: JSON.stringify(fields),
      limit_start: page * pageSize, // Start index for pagination
      limit_page_length: pageSize, // Number of records per page
      ...(filters && { filters: JSON.stringify(filtersObj) }),
      ...(sort && { order_by: orderby }),
    };
    const dataCntParams = {
      doctype: doctype,
      ...(filters && { filters: JSON.stringify(filtersObj) }),
      ...(sort && { order_by: orderby }),
    };

    // Fetch data
    const getData = await fetchFromERPNext(doctype, dataParams, token);
    const dataWithDetails = getData.data.map((data: any, index: number) => {
      return {
        ...data,
      };
    });

    return {
      data: dataWithDetails,
      totalCount: await getTotalCount(doctype, token, dataCntParams),
    };
  } catch (error: unknown) {
    return {
      data: [],
      totalCount: 0,
    };
  }
}

const getTotalCount = async (
  endpoint: string,
  token: string,
  params: FetchParams
) => {
  try {
    const response = await axios.get(
      `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.reportview.get_count`,
      {
        headers: {
          Authorization: `${token}`,
        },
        params: params,
      }
    );
    return response.data.message; // Total  count
  } catch (error) {
    console.error("Error fetching total customer count:", error);
    return 0;
  }
};

export const fetchFromERPNext = async (
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
  queryParams: Array<{
    field: string;
    value: string | string[];
    operator: string;
  }>,
  fields: Array<{ doctype: string; field: string }>
): Array<
  [string, string, string | string[]] | [string, string, string, string]
> => {
  const filters: Array<
    [string, string, string | string[]] | [string, string, string, string]
  > = [];

  console.log("queryParams:", queryParams);

  // Handle "q" quick search across multiple fields
  const quickFilter = queryParams.find(
    (param) => param.field === "q" && param.value
  );
  if (quickFilter) {
    const searchValue = `%${quickFilter.value}%`;

    if (fields.length > 0) {
      const orConditions = fields.map(({ doctype, field }) => [
        `tab${doctype}.${field}`,
        "like",
        searchValue,
      ]);

      filters.push(["OR", ...orConditions] as any); // Push OR conditions
    }
  }

  // Handle additional filters
  queryParams.forEach((param) => {
    if (param.field !== "q" && param.value !== "") {
      if (param.operator) {
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
            case "doesNotContain":
              filters.push([param.field, "not like", `%${param.value}%`]);
              break;
            case "equals":
            case "is":
              filters.push([param.field, "=", param.value]);
              break;
            case "not":
            case "doesNotEqual":
              filters.push([param.field, "!=", param.value]);
              break;
            case "isAnyOf":
              if (Array.isArray(param.value) && param.value.length > 0) {
                filters.push([param.field, "in", param.value]);
              }
              break;
          }
        }
      }
    }
  });

  console.log("Generated Filters:", filters);
  return filters;
};


interface FetchByLinkParams {
  doctype: string; // The doctype to fetch (e.g., "Address", "Contact")
  linkField: string; // The field that links to the parent doctype (e.g., "link_name")
  linkValue: string; // The actual value of the linked field (e.g., Customer name)
  token: string;
  fields?: string[]; // Optional: Specify fields to fetch
}

function extractDetailData(response: any) {
  if (!response || !response.docs || response.docs.length === 0) {
    return null; // No data available
  }

  const doc = response.docs[0]; // Extract first document (assuming single object)

  // Extract basic fields
  const extractedData: any = {
    name: doc.name,
    doctype: doc.doctype,
    createdBy: doc.owner,
    modifiedBy: doc.modified_by,
    createdAt: doc.creation,
    updatedAt: doc.modified,
  };

  // Extract all other fields dynamically (excluding internal fields)
  Object.keys(doc).forEach((key) => {
    if (
      ![
        "name",
        "doctype",
        "owner",
        "modified_by",
        "creation",
        "modified",
      ].includes(key)
    ) {
      extractedData[key] = doc[key];
    }
  });

  // Extract additional data from __onload (if available)
  if (doc.__onload) {
    extractedData.onLoadData = doc.__onload;
  }

  return extractedData;
}
export async function getDetailData(
  doctype: string,
  name: string,
  token: string
) {
  const url = `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.form.load.getdoc?doctype=${doctype}&name=${name}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${token}`,
    },
  });

  const data = await response.json();
  console.log("address adadadad ", data);

  // return data.data.map((item: any) => item.parent); // Returns array of Address names
  return extractDetailData(data);
}

export async function fetchDataByLinkName({
  doctype,
  linkField,
  linkValue,
  token,
  fields = ["*"], // Default to fetching all fields
}: FetchByLinkParams) {
  try {
    // Construct filters object
    const filters = JSON.stringify({ [linkField]: linkValue });

    // API Request
    const response = await fetch(
      `${CONSTANTS.API_BASE_URL}/api/resource/${doctype}?filters=${encodeURIComponent(filters)}&fields=${encodeURIComponent(JSON.stringify(fields))}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
      }
    );

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching ${doctype} by ${linkField}:`, error);
    return [];
  }
}
interface SearchResultItem {
  value: string;
  label?: string;
  // Add more fields if your API returns more
}

export async function fetchDataBySearch(
  txt: string,
  doctype: string,
  token: string,
  reference_doctype?: string
): Promise<SearchResultItem[]> {
  try {
    const res = await fetch('/api/search-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${token}`,
      },
      body: JSON.stringify({
        txt,
        module: doctype,
        ...(reference_doctype && { reference_doctype }), // only include if defined
      }),
    });

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching ${doctype}:`, error);
    return [];
  }
}
