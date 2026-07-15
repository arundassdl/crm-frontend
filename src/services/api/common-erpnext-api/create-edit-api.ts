import axios from "axios";
import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import { FamilyRestroomTwoTone } from "@mui/icons-material";
import { fetchFromERPNext } from "./listing-api-get";

export const getDocument = async (
  doctype: string,
  name: string,
  token: string
) => {
  try {
    const url = `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.form.load.getdoc`;
    const params = {
      doctype,
      name,
    };

    const response = await axios.get(url, {
      params,
      headers: {
        Authorization: `${token}`,
      },
    });

    const docs = (response.data && response.data.docs) || [];
    return docs && docs.length > 0 ? docs[0] : null;
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

export const createSaveDocs = async (
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

    const doc = {
      ...payload,
      doctype,
      __unsaved: 1,
      ignore_version: 1, // ✅ only here, leave `modified` untouched
    };

    const postParams = {
      doc: JSON.stringify(doc),
      action: "Save"
    };
    console.log("postParams", postParams);

    const postUrl = `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.form.save.savedocs`
    // Send API request
    const response = await axios.post(
      `${postUrl}`,
      postParams,
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

export const updateSaveDocs = async (
  doctype: string,
  name: string,
  formData: object,
  token: string
) => {
  try {

    const { data: { data: latestDoc } } = await axios.get(
      `${CONSTANTS.API_BASE_URL}/api/resource/${doctype}/${name}`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    console.log("latestDoc", latestDoc);

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
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    // const doc = {
    //   ...payload,
    //   name,
    //   doctype,
    //   modified : now,
    //   ignore_version: 1 
    // };    
    const doc = {
      ...latestDoc,
      ...payload,
      doctype,
      ignore_version: 1, // ✅ only here, leave `modified` untouched
    };

    const postParams = {
      doc: JSON.stringify(doc),
      action: "Save"
    };
    // console.log("postParams",postParams);

    // const postUrl = `${CONSTANTS.API_BASE_URL}/api/method/frappe.client.save`
    const postUrl = `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.form.save.savedocs`
    // Send API request
    const response = await axios.post(
      `${postUrl}`,
      postParams,
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


export const createResource = async (
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

export async function conditionalUpdateResource(
  doctype: string,
  updateData: object,
  token: string,
  filters: any[] = [] // Ensure filters is always an array
) {
  // If filters are provided, fetch matching records first
  if (filters.length > 0) {
    try {
      const params = {
        filters: JSON.stringify(filters),
      };

      // Fetch linked contacts
      const contactResponse = await fetchFromERPNext(doctype, params, token);
      console.log("contactResponse ===>", contactResponse);
      const records = contactResponse.data;
      if (!records.length) {
        return { success: false, message: `No records found for filters.` };
      }
      // Update each record individually
      const updatePromises = records.map((record: any) =>
        updateResource(doctype, record.name, updateData, token)
      );
      const results = await Promise.all(updatePromises);

      return { success: true, data: results };
    } catch (error) {
      console.error(`Error fetching ${doctype}:`, error);
      return { success: false, message: "Error fetching records." };
    }
  }
}

export async function updateResource(
  doctype: string,
  name: string,
  updateData: object,
  token: string
) {
  let payload: Record<string, any> = {};

  // Check if formData is an instance of FormData
  if (updateData instanceof FormData) {
    updateData.forEach((value: any, key: string) => {
      updateData[key] = value;
    });
  } else {
    updateData = { ...updateData }; // If it's already an object, copy it directly
  }
  const url = `${CONSTANTS.API_BASE_URL}/api/resource/${doctype}/${encodeURIComponent(name)}`;
  console.log("updateData updatedCustomerData", updateData);

  try {
    const response = await fetch(url, {
      method: "PUT", // Use PUT for updating the document
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify(updateData), // Convert update data to JSON
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to update ${doctype}: ${response.statusText}`,
      };
    }

    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    console.error(`Error updating ${doctype}:`, error);
    return { success: false, message: (error as Error).message };
  }
}

export const deleteResource = async (
  doctype: string,
  docname: string,
  token: string
) => {
  try {
    const response = await fetch(
      `${CONSTANTS.API_BASE_URL}/api/resource/${doctype}/${encodeURIComponent(docname)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Deleted successfully:", result);
    return result;
  } catch (error) {
    console.error("Error deleting record:", error);
  }
};
export async function renameDoc(doctype: string, payload: Record<string, any>, token: string) {
  // 1. Rename the Item Group if name has changed
  if (payload?.item_group_name && payload?.item_group_name !== payload?.name) {
    // const url = `${CONSTANTS.API_BASE_URL}/api/method/frappe.model.rename_doc.rename_doc`;

    const fetchUrl = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}`;

    const response = await axios.post(
      fetchUrl,
      {
        version: CONSTANTS.VERSION,
        method: "rename_doc_name",
        entity: "datalist",
        doctype: doctype,
        old: payload.name,
        new: payload.item_group_name,
      },
      {
        headers: {
          Authorization: token || "",
          "Content-Type": "application/json",
        },
      }
    );

    return response?.data?.message;

  }
}

export const deleteClient = async (
  doctype: string,
  docname: string,
  token: string
) => {
  try {
    const response = await axios.post(
      `${CONSTANTS.API_BASE_URL}/api/method/frappe.client.delete`,
      {
        doctype: doctype,
        name: docname,
      },
      {
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, data: response.data.data };
  } catch (error: any) {
    console.error("Error deleting record:", error);

    // Extract and clean server messages
    let serverMessage = "An error occurred while deleting the record.";
    if (error.response?.data?._server_messages) {
      try {
        const messages = JSON.parse(error.response.data._server_messages);
        if (Array.isArray(messages) && messages.length > 0) {
          serverMessage = messages
            .map((msg) => {
              const cleanMessage = JSON.parse(msg).message;
              return cleanMessage.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1"); // Remove anchor tags
            })
            .join("\n");
        }
      } catch (parseError) {
        console.error("Error parsing _server_messages:", parseError);
      }
    }

    return { success: false, message: serverMessage };
  }
};

export const getNotes = async (
  doctype: string,
  docname: string,
  token: string
) => {
  const apiUrl = `${CONSTANTS.API_BASE_URL}/api/resource/Comment?filters=${encodeURIComponent(
    JSON.stringify([
      ["reference_doctype", "=", doctype],
      ["reference_name", "=", docname],
    ])
  )}&fields=${encodeURIComponent(JSON.stringify(["name", "content", "owner", "creation"]))}`;

  try {
    console.log("data Note apiUrl", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Comments:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching comments:", error);
  }
};

export const updateComment = async (commentName, newContent, token) => {
  try {
    const response = await fetch(
      `${CONSTANTS.API_BASE_URL}/api/resource/Comment/${commentName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newContent, // Updating the comment content
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update comment: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Comment updated successfully:", result);
    return result;
  } catch (error) {
    console.error("Error updating comment:", error);
  }
};

export async function postComment(formData: any, token: string) {
  let payload: Record<string, any> = {};


  // Check if formData is an instance of FormData
  if (formData instanceof FormData) {
    formData.forEach((value: any, key: string) => {
      payload[key] = value;
    });
  } else {
    payload = { ...formData }; // If it's already an object, copy it directly
  }
  const response = await fetch('/api/post-comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`, // or just token if Frappe doesn't require "Bearer"
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  // let url = `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.form.utils.add_comment`;
  // const response = await fetch(url, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `${token}`, // If using token authentication
  //   },
  //   body: JSON.stringify(payload),
  // });

  // const data = await response.json();
  return data;
}

export async function postNote(formData: any, token: string) {
  let payload: Record<string, any> = {};


  // Check if formData is an instance of FormData
  if (formData instanceof FormData) {
    formData.forEach((value: any, key: string) => {
      payload[key] = value;
    });
  } else {
    payload = { ...formData }; // If it's already an object, copy it directly
  }
  const postParams = {
    doc: (payload),

  };
  const response = await fetch('/api/post-note', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `${token}`, // or just token if Frappe doesn't require "Bearer"
    },
    body: JSON.stringify(postParams),
  });

  const data = await response.json();

  // let url = `${CONSTANTS.API_BASE_URL}/api/method/frappe.desk.form.utils.add_comment`;
  // const response = await fetch(url, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `${token}`, // If using token authentication
  //   },
  //   body: JSON.stringify(payload),
  // });

  // const data = await response.json();
  return data;
}


/**
 * Fetch  details along with linked data (e.g., Address, Phone, Emails)
 * * @param {string} doctype - The doctype of the contact.
 * @param {string} docname - The name of the contact.
 * @param {string} token - Frappe API authentication token.
 */
export const fetchDetailData = async (doctype: any,docname: any,token: any,linked_docname?:any) => {
  try {   
    const url = `'/api/detail-data'`;
 const res = await fetch('/api/detail-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ doctype: doctype, docname: docname,linked_docname:linked_docname }),
    });
     
    return res.json(); // Frappe returns data inside `message`
  } catch (error) {
    console.error(`Fetch ${doctype} with Links Error:`, error);
    return null;
  }
};

export async function createCustomDocument(doctype: string, data: any, token: string) {
  try {
    let payload: Record<string, any> = {};

    // Check if formData is an instance of FormData
    if (data instanceof FormData) {
      data.forEach((value: any, key: string) => {
        payload[key] = value;
      });
    } else {
      payload = { ...data }; // If it's already an object, copy it directly
    }

    payload = applySalutationKeyForApi(payload);

    const res = await fetch('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `${token}` },
      body: JSON.stringify({ doctype, data: payload }),
    });

    const body = await res.json().catch(() => ({}));

    // Success must reflect real persistence, not just a 2xx status: the backend
    // only returns a document `name` when the record was actually saved.
    const createdName = extractCreatedDocName(body);

    if (!res.ok || !createdName) {
      const serverMessage = extractFrappeMessage(body) || body?.error;
      return {
        success: false,
        message: serverMessage || 'Failed to create document',
        data: body,
      };
    }

    const cleanedDoctype = doctype.replace(/^CRM\s*/i, '').trim() || 'Module';
    return {
      success: true,
      message: `${cleanedDoctype} Created Successfully`,
      data: body,
      name: createdName,
    };
  } catch (error: any) {
    console.error('Document creation failed:', error);
    return {
      success: false,
      message: error?.message || 'Unknown error occurred',
    };
  }
}

/** Pull the created document identifier out of the various shapes create_document can return. */
function extractCreatedDocName(body: any): string | null {
  if (!body || typeof body !== 'object') return null;
  return (
    body.name ||
    body.docname ||
    body?.data?.name ||
    body?.message?.name ||
    null
  );
}
/**
 * 
 * ######### documents format ########
 * {
  "documents": [
    {
      "doctype": "Project",
      "key": "main_project",
      "data": {
       "name": "PROJ-0003",   // add if update the doc
        "project_name": "Onboarding Portal",
        "tasks": [
          {
            "doctype": "Project Task",
            "subject": "UI Wireframe",
            "status": "Open"
          },
          {
            "doctype": "Project Task",
            "subject": "Backend Setup",
            "status": "Open"
          }
        ]
      }
    },
    {
      "doctype": "Task",
      "data": {
        "subject": "Kickoff Meeting",
        "project": "{{main_project.name}}",
        "assignments": [
          {
            "doctype": "Task Assignment",
            "user": "admin@example.com"
          }
        ]
      }
    }
  ]
}
 * 
 */

/**
 * 
 * @param documents 
 * @param token 
 * @returns 
 */
/** Map Formik/UI key to ERPNext Contact field for salutation on first name. */
function applySalutationKeyForApi<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== "object") return data;
  if (!Object.prototype.hasOwnProperty.call(data, "first_name_salutation")) {
    return data;
  }
  const next = { ...data, salutation: data.first_name_salutation } as T;
  delete (next as any).first_name_salutation;
  return next;
}

export async function createCustomMultipleDocuments(documents: any, token: string) {
  try {
    // Pre-process documents: for any embedded address objects flagged via `addressFields`,
    // create Address docs first and replace the field value with the Address name.
    const processedDocuments = await Promise.all(
      (documents || []).map(async (doc: any) => {
        if (!doc || !doc.data) return doc;

        const addressFields: string[] = Array.isArray(doc.addressFields)
          ? doc.addressFields
          : [];

        let updatedData = { ...doc.data };

        const docKey: string =
          typeof doc.key === "string" && doc.key.trim()
            ? doc.key.trim()
            : "";

        for (const fieldName of addressFields) {
          const addrVal = updatedData[fieldName];
          if (!addrVal || typeof addrVal !== "object") continue;

          // Base address_title from form values…
          let address_title: string =
            addrVal.address_title ||
            addrVal.flat ||
            addrVal.address_line1 ||
            addrVal.city ||
            "Address";

          // …but when we have a document key (e.g. territoryKey) and this field
          // is coming from addressFieldNames, force address_title to
          // `${key}-${fieldName}` as requested.
          if (docKey) {
            address_title = `${docKey}-${fieldName}`;
          }

          const addressPayload: any = {
            address_title,
            address_type: addrVal.address_type || "Billing",
            address_line1: addrVal.address_line1 || "",
            address_line2: addrVal.flat || addrVal.address_line2 || "",
            city: addrVal.city || "",
            state: addrVal.state || "",
            country: addrVal.country || "",
            pincode: addrVal.pincode || "",
          };

          if (addrVal.latitude) {
            addressPayload.latitude = addrVal.latitude;
          }
          if (addrVal.longitude) {
            addressPayload.longitude = addrVal.longitude;
          }

          const addressRes = await createResource("Address", addressPayload, token);
          if (!addressRes?.success || !addressRes.data?.name) {
            throw new Error(
              (addressRes as any)?.error?.message ||
                "Failed to create Address document"
            );
          }

          updatedData[fieldName] = addressRes.data.name;
        }

        // create-multiple-doc / update-via-same-flow: backend expects `salutation`, not Formik's `first_name_salutation`
        updatedData = applySalutationKeyForApi(updatedData);

        return {
          ...doc,
          data: updatedData,
        };
      })
    );


    const res = await fetch('/api/create-multiple-doc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ documents: processedDocuments }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Failed to create document');
    }

    const firstDoc = processedDocuments?.[0];
    const isUpdate = !!firstDoc?.data?.name;

    const message = isUpdate ? 'Updated' : 'Created';
    const rawDoctype = firstDoc?.doctype || 'Module';
    const doctype = rawDoctype.replace(/^CRM\s*/i, '').trim() || 'Module';

    return {
      success: true,
      message: `${doctype} ${message} Successfully`,
    };
  } catch (error: any) {
    console.error("Document creation failed:", error);
    return {
      success: false,
      message: error.message || 'Unknown error occurred',
    };
  }
}

export async function updateFieldCustomDocument(
  doctype: string,
  name: string,
  updateData: object,
  token: string
) {
  try {
    const data = applySalutationKeyForApi({
      ...(updateData as Record<string, any>),
    });

    const res = await fetch('/api/update-doc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ doctype, name, data }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Failed to update document');
    }

    // ✅ Use a different variable name
    const cleanedDoctype = doctype.replace(/^CRM\s*/i, '').trim() || 'Module';

    return {
      success: true,
      message: `${name} Updated Successfully`,
    };
  } catch (error: any) {
    console.error("Document update failed:", error);
    return {
      success: false,
      message: error.message || 'Unknown error occurred',
    };
  }
}



export const deleteCustomDocument = async (
  doctype: string,
  docname: string,
  token: string
) => {
  try {
    const res = await fetch('/api/delete-doc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ doctype, name: docname }),
    });

    // Try to parse the JSON response
    const response = await res.json().catch(() => ({}));

    if (!res.ok) {
      const serverMessage = extractFrappeMessage(response);
      throw new Error(serverMessage || 'Failed to delete document');
    }

    const docTypeLabel = (doctype.replace(/^CRM/i, '').trim()) || 'Module';
    return {
      success: true,
      message: `${docTypeLabel} Deleted Successfully`,
    };
  } catch (error: any) {
    console.error("Error deleting record:", error);
    return {
      success: false,
      message: error?.message || "An error occurred while deleting the record.",
    };
  }
};

// ✅ Helper to extract _server_messages from Frappe errors
function extractFrappeMessage(response: any): string | null {
  const serverMessages = response?._server_messages;
  if (!serverMessages) return null;

  try {
    const messages = JSON.parse(serverMessages);
    if (Array.isArray(messages)) {
      return messages
        .map((msg) => {
          const parsed = JSON.parse(msg);
          return parsed?.message?.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1'); // Remove <a> tags
        })
        .join('\n');
    }
  } catch (e) {
    console.error("Failed to parse _server_messages:", e);
  }
  return null;
}
