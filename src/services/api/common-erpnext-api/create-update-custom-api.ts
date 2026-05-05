import axios from "axios";
import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure


/**
 * Fetch Contact details along with linked data (e.g., Address, Phone, Emails)
 * * @param {string} doctype - The doctype of the contact.
 * @param {string} docname - The name of the contact.
 * @param {string} token - Frappe API authentication token.
 */
export const fetchRecordsWithLinks = async (doctype: any,docname: any,token: any,linked_docname?:any) => {
  try {
    const version = CONSTANTS.VERSION;
    const method = 'get_record_with_links';
    const entity = 'datalist';
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;

    const response = await axios.get(
      url, 
      {
        params: { doctype: doctype, docname: docname,linked_docname:linked_docname },
        headers: { Authorization: `${token}` },
      }
    );
    return response.data.message; // Frappe returns data inside `message`
  } catch (error) {
    console.error(`Fetch ${doctype} with Links Error:`, error);
    return null;
  }
};


export const fetchCommentsWithOwner = async (doctype: any,docname: any,token: any) => {
  try {
    const version = CONSTANTS.VERSION;
    const method = 'get_comments_with_owner';
    const entity = 'datalist';
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;

    const response = await axios.get(
      url, 
      {
        params: { doctype: doctype, docname: docname },
        headers: { Authorization: `${token}` },
      }
    );
    return response.data.message; // Frappe returns data inside `message`
  } catch (error) {
    console.error(`Fetch ${doctype} with Links Error:`, error);
    return null;
  }
};

export const fetchTimelineComments = async (
  doctype: string,
  docname: string,
  token: string
) => {
  try {
    const url = `${CONSTANTS.API_BASE_URL}/api/resource/Comment`;

    const filters = [
      ["Comment", "reference_doctype", "=", doctype],
      ["Comment", "reference_name", "=", docname],
    ];

    const fields = [
      "name",
      "creation",
      "owner",
      "reference_doctype",
      "reference_name",
      "comment_type",
      "content",
    ];

    const response = await axios.get(url, {
      params: {
        filters: JSON.stringify(filters),
        fields: JSON.stringify(fields),
        order_by: "creation desc",
      },
      headers: {
        Authorization: `${token}`,
      },
    });

    return response.data?.data || [];
  } catch (error) {
    console.error(`Fetch timeline comments failed for ${doctype} ${docname}:`, error);
    return [];
  }
};



export const fetchNotesWithOwner = async (doctype: any,docname: any,token: any) => {
  try {
    const version = CONSTANTS.VERSION;
    const method = 'get_notes_with_owner';
    const entity = 'datalist';
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;

    const response = await axios.get(
      url, 
      {
        params: { doctype: doctype, docname: docname },
        headers: { Authorization: `${token}` },
      }
    );
    return response.data.message; // Frappe returns data inside `message`
  } catch (error) {
    console.error(`Fetch ${doctype} with Links Error:`, error);
    return null;
  }
};

export interface ActivityLogEntry {
  name: string;
  creation: string;
  owner: string;
  full_name?: string;
  reference_doctype?: string;
  reference_name?: string;
  subject?: string;
  timeline_doctype?: string;
  timeline_name?: string;
}

export const fetchActivityLog = async (
  doctype: string,
  docname: string,
  token: string
): Promise<ActivityLogEntry[]> => {
  try {
    const url = `${CONSTANTS.API_BASE_URL}/api/resource/Activity Log`;

    const filters = [
      ["Activity Log", "reference_doctype", "=", doctype],
      ["Activity Log", "reference_name", "=", docname],
    ];

    const fields = [
      "name",
      "creation",
      "owner",
      "full_name",
      "reference_doctype",
      "reference_name",
      "subject",
    ];

    const response = await axios.get(url, {
      params: {
        filters: JSON.stringify(filters),
        fields: JSON.stringify(fields),
        order_by: "creation desc",
      },
      headers: {
        Authorization: `${token}`,
      },
    });

    return response.data?.data || [];
  } catch (error) {
    console.error(`Fetch Activity Log failed for ${doctype} ${docname}:`, error);
    return [];
  }
};
export type Task = {
    owner: string;
    name: string;
    title: string;
    assigned_to: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    status: string;
    completed: boolean;
    due_date: string;
    image: string;
    owner_name: string;
};

export const fetchTasksWithOwner = async (
  doctype: string,
  docname: string,
  token: string,
  limit: number = 5,
  offset: number = 0
): Promise<{ data: Task[]; total: number }> => {
  try {
    const version = CONSTANTS.VERSION;
    const method = 'get_tasks_with_owner';
    const entity = 'datalist';
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;

    const response = await axios.get(url, {
      params: {
        doctype,
        docname,
        limit,
        offset,
      },
      headers: {
        Authorization: `${token}`,
      },
    });

    const resData = response.data?.message || [];

    return {
      data: resData?.data || [],
      total: resData?.total_count || 0,
    };
  } catch (error) {
    console.error(`Fetch ${doctype} tasks failed:`, error);
    return {
      data: [],
      total: 0,
    };
  }
};





export const createOrUpdateRecord = async (
  doctype: string,
  formData: any,
  token: string,
  links?: { link_doctype: string; link_name: string }[]
) => {
  try {
    // Convert FormData to JSON
    let payload: Record<string, any> = {};

    // Check if formData is an instance of FormData
    if (formData instanceof FormData) {
      formData.forEach((value: any, key: string) => {
        payload[key] = value;
      });
    } else {
      payload = { ...formData }; // If it's already an object, copy it directly
    }

    // Attach links if provided
    if (links && links.length > 0) {
      payload.links = links;
    }

    // Send API request
    const response = await axios.post(
      `${CONSTANTS.API_BASE_URL}/api/resource/${doctype}`,
      payload,
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data: response.data.data };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return { error: error.response?.data || "API request failed" };
    } else if (error instanceof Error) {
      return { error: error.message };
    } else {
      return { error: "Something went wrong" };
    }
  }
};


export const fetchdocumenttimeline = async (doctype: any,docname: any,token: any) => {
  try {
    const version = CONSTANTS.VERSION;
    const method = 'get_doctype_timeline';
    const entity = 'datalist';
    const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;

    const response = await axios.get(
      url, 
      {
        params: { doctype: doctype, docname: docname },
        headers: { Authorization: `${token}` },
      }
    );
    return response.data.message; // Frappe returns data inside `message`
  } catch (error) {
    console.error(`Fetch ${doctype} with Links Error:`, error);
    return null;
  }
};
