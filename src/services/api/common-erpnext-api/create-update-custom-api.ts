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
  // R55: Frappe CRM tenant via the BFF (/api/related), not the SalesBond method.
  try {
    if (!docname) return [];
    const response = await axios.post('/api/related', { kind: 'comments', doctype, docname });
    return response.data?.data || [];
  } catch (error) {
    console.error(`Fetch ${doctype} comments failed:`, (error as any)?.response?.status);
    return [];
  }
};

export const fetchNotesWithOwner = async (doctype: any,docname: any,token: any) => {
  // R55: FCRM Note via the BFF (/api/related).
  try {
    if (!docname) return [];
    const response = await axios.post('/api/related', { kind: 'notes', doctype, docname });
    return response.data?.data || [];
  } catch (error) {
    console.error(`Fetch ${doctype} notes failed:`, (error as any)?.response?.status);
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
  // R55: CRM Task via the BFF (/api/related).
  try {
    if (!docname) return { data: [], total: 0 };
    const response = await axios.post('/api/related', { kind: 'tasks', doctype, docname, limit, offset });
    return {
      data: response.data?.data || [],
      total: response.data?.total || 0,
    };
  } catch (error) {
    console.error(`Fetch ${doctype} tasks failed:`, (error as any)?.response?.status);
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
