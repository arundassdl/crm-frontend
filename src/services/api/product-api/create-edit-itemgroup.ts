import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { useState } from "react";
import {
  createResource,
  updateResource,
} from "../common-erpnext-api/create-edit-api";
import { fetchFromERPNext } from "../common-erpnext-api/listing-api-get";


export const CreateItemGroup = async (formData: any, token: string) => {
  // Step 1: Create Customer
  //if formData values and database fields are same pass formData  otherwise need to set custom fields cusPayload
  const itmGrpPayload = {
    item_group_name: formData.get("item_group_name"),
    parent_item_group: formData.get("parent_item_group"),
    is_group: formData.get("is_group"),
  };
  
  console.log("ItmGrp Payload", itmGrpPayload);
  
  try {
    const response = await fetch("/api/docs/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({
        module: "Item Group",
        formData: itmGrpPayload,
      }),
    });
  
    const itemGroupResponse = await response.json();
    
    if (itemGroupResponse.error) {      
      
      const errorMessage = itemGroupResponse.error;
    console.error("Failed to create Item Group:", errorMessage);
    return {
      success: false,
      message: errorMessage,
      data: { itemGroupResponse },
    };
    } 
  return {
    success: true,
    message: "Item Group created successfully",
    itemgroup: itemGroupResponse,
  };
} catch (err) {
  console.error("API call failed", err);
}
};

export async function RenameDoc(doctype: string,payload: Record<string, any>, token: string) {
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
        doctype:doctype,
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
export async function EditItemGroup(
  doctype: string,
  formData: FormData | Record<string, any>,
  token: string
) {
  try {
    let payload: Record<string, any> = {};

    // Convert formData to object if it's an instance of FormData
    if (formData instanceof FormData) {
      formData.forEach((value: any, key: string) => {
        payload[key] = value;
      });
    } else {
      payload = { ...formData }; // Copy object directly
    }



    // const updatedItemGroupRename = await RenameDoc(doctype,payload, token);

    // if (updatedItemGroupRename && updatedItemGroupRename.new_name) {      
    //   payload.name = updatedItemGroupRename.new_name
    // }

     // 2. Now update the other fields
     let isgroup = 0
     if(payload?.is_group == "true"){
      isgroup = 1
     }
     const updatedItemGroupData = {
      parent_item_group: payload?.parent_item_group,
      is_group: isgroup,
    };
    console.log("updatedItemGroupData",updatedItemGroupData);
    console.log("updatedItemGroupData payload",payload);
    
    if (payload?.item_group_name && payload?.item_group_name !== payload?.name) {
    const response = await fetch("/api/resource/rename", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({doctype, payload, token }),
    });
    
    const result = await response.json();
    
    if (result.success) {      
      console.log("Renamed successfully:", result.data);
      payload.name = result.data.new_name
    } else {
      console.error("Rename failed:", result.message);
    }
  }
    const response1 = await fetch("/api/docs/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({
        doctype: doctype,
        name: payload.name,
        updateData: updatedItemGroupData,
      }),
    });
    
    const result1 = await response1.json();
    console.error("Update failed error:", result1.error);
    if (result1.error) {      
      
      const errorMessage = result1.error;
    console.error("Update failed:", errorMessage);
    return {
      success: false,
      message: errorMessage,
      data: { result1 },
    };
    } else {
      return {
        success: true,
        message: "Item Group updated successfully.",
        data: { result1 },
      };
      console.log("Resource updated:", result1.data);
    }
    
    

    // const updatedItemGroup = await updateResource(
    //   "Item Group",
    //   payload?.name,
    //   updatedItemGroupData,
    //   token
    // );
  
    // console.log("Updated Item Group:", updatedItemGroup);

    
  } catch (error: any) {
    console.error("Error updating customer and address:", error);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
}