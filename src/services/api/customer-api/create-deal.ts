import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import axios from "axios";
import { NextApiRequest, NextApiResponse } from 'next';
import { useState } from "react";
import { createResource, updateResource } from "../common-erpnext-api/create-edit-api";
import { fetchFromERPNext } from "../common-erpnext-api/listing-api-get";


export async function CreateDealWithDetails(
  doctype: string,
  formData: FormData | Record<string, any>,
  token: string,
  create?: false | boolean
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
     // 2. Now update the other fields
    const contacts = [
      {
        docstatus: 0,
        doctype: "CRM Contact",
        __islocal: 1,
        __unsaved: 1,
        owner: payload?.deal_owner,
        is_primary: 0,
        parentfield: "contacts",
        parenttype: "CRM Deal",
        idx: 1,
        __unedited: false,
        full_name: `${payload?.first_name ?? ""} ${payload?.last_name ?? ""}`.trim(),
        email: payload?.email ?? "",
        gender: null,
        mobile_no: "",
        phone: payload?.mobile_no ?? "",
        contact: payload?.contact ?? "",
      },
    ];

    // 3️⃣ Append to payload
  if (contacts) {
    payload['contacts'] =  (contacts);
  }
    
    console.log("updatedItem payload",payload);
    // return false
    let response1: Response;

    if (create === true) {
      response1 = await fetch("/api/docs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          module: doctype,
          formData: payload,
        }),
      });
    } else {
      response1 = await fetch("/api/docs/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          doctype: doctype,
          name: payload.name,
          updateData: payload,
        }),
      });
    }

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
        message: `Deal ${(create === true)?"created":"updated"} successfully.`,
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

export const CreateItemAndVariantsOld = async (formData: any, token: string) => {
  try {
    // Step 1: Parse form data into payload
    let payload: Record<string, any> = {};

    if (formData instanceof FormData) {
      formData.forEach((value: any, key: string) => {
        payload[key] = value;
      });
    } else {
      payload = { ...formData };
    }

    // Step 2: Construct itemPayload with required fields
    const itemPayload = {
      ...payload,
      show_in_website: payload.meta_title?.trim() ? 1 : 0,
      has_variants: payload.has_variants ? 1 : 0,
      attributes: Object.keys(payload.attributes || {}).map((attr, idx) => ({
        attribute: attr,
        idx: idx + 1,
      })),
    };

    console.log("🔧 itemPayload:", itemPayload);

    // Step 3: Create Item via API
    const createItemResponse = await fetch("/api/docs/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify({
        module: "Item",
        formData: itemPayload,
      }),
    });

    const itemData = await createItemResponse.json();
    console.log("✅ Item Create Response:", itemData);

    if (itemData.error) {
      console.error("❌ Item creation failed:", itemData.error);
      return { success: false, message: itemData.error };
    }

    // Step 4: Create variants (if applicable)
    if (payload.has_variants && payload.attributes) {
      const variantRes = await fetch("/api/resource/item-variants/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          item_code: itemData.data?.name || payload.item_code,
          attributes: payload.attributes,
        }),
      });

      const variantData = await variantRes.json();
      console.log("🧬 Variant Create Response:", variantData);

      if (variantData?.success) {
        return {
          success: true,
          message: "Item and Variants created successfully",
          item: itemData,
        };
      } else {
        return {
          success: false,
          message: "Item created but variant creation failed",
          item: itemData,
          variantError: variantData,
        };
      }
    }

    // Step 5: Return item-only success if no variants
    return {
      success: true,
      message: "Item created successfully",
      item: itemData,
    };
  } catch (err: any) {
    console.error("🔥 API call failed:", err);
    return { success: false, message: "Something went wrong", error: err.message };
  }
};





export const CreateItem = async (formdata: any, token: string) => {
    // Step 1: Create Customer
    //if formData values and database fields are same pass formData  otherwise need to set custom fields cusPayload
    // const itmPayload = {     
    //   item_code: data.formData.get("item_code"),
    //   item_name: data.formData.get("item_name"),
    //   item_group:  data.formData.get("item_group"),
    //   description: data.formData.get("description"),
    //   stock_uom: data.formData.get("stock_uom"),
    //   disabled: data.formData.get("disabled"),
    //   has_variants: data.formData.get("has_variants"),
    //   image: data.formData.get("image"),
    //   attribute_table:data.attribuite_table
    // };
    let data:any={}

    if(formdata?.attributes!=null || formdata?.attributes!=undefined)

       data = {     
        item_code: formdata.item_code,
        item_name: formdata.item_name,
        item_group:  formdata.item_group,
        description: formdata.description ,     
        stock_uom: formdata.stock_uom,
        disabled: formdata.disabled,
        has_variants: Number(formdata.has_variants),
        image: "/files/"+ formdata.image,
        attributes:formdata.attributes        
      };
    else if(formdata?.attribute_table!=null || formdata?.attribute_table!=undefined)
    {
      data = {     
          item_code: formdata.item_code,
          item_name: formdata.item_name,
          item_group:  formdata.item_group,
          description: formdata.description ,     
          stock_uom: formdata.stock_uom,
          disabled: formdata.disabled,
          has_variants:0,
          image: "/files/"+ formdata.image,       
          attribute_table: [{ attribute: '', value: '' }]      
      };
    }

  
    console.log("Itm Payload",data);
    
    
    
    
    const itemResponse = await createResource("Item", data, token);
    if (!itemResponse.success) return itemResponse; // Return error if customer creation fails
  
   
    return {
      success: true,
      message: "Item created successfully",
      item: itemResponse,
     
    };
  };

  export async function EditItem(
    itemName: string,
    // formdata: FormData | Record<string, any>,
    formdata:any,
    token: string
  ) {
    try {
    
  
      // // Step 2: Update customer details
      // const updatedItemData = {
      //   item_code: formdata.item_code,
      //   item_name: formdata.item_name,
      //   item_group:  formdata.item_group,
      //   description: formdata.description ,     
      //   stock_uom: formdata.stock_uom,
      //   disabled: formdata.disabled,
      //   has_variants: Number(formdata.has_variants),
      //   image: "/files/"+ formdata.image,
      //   attribute_table: formdata.attribuite_table
      //   //[{ attribute: '', value: '' }]
      // };


      let updatedItemData:any={}

      if(formdata?.attributes!=null)
  
        updatedItemData = {     
          item_code: formdata.item_code,
          item_name: formdata.item_name,
          item_group:  formdata.item_group,
          description: formdata.description ,     
          stock_uom: formdata.stock_uom,
          disabled: formdata.disabled,
          has_variants: Number(formdata.has_variants),
          image: "/files/"+ formdata.image,
          attributes:formdata.attributes        
        };
      else if(formdata?.attribute_table!=null || formdata?.attribute_table!=undefined)
      {
        updatedItemData = {     
            item_code: formdata.item_code,
            item_name: formdata.item_name,
            item_group:  formdata.item_group,
            description: formdata.description ,     
            stock_uom: formdata.stock_uom,
            disabled: formdata.disabled,
            has_variants:0,
            image: "/files/"+ formdata.image,       
            attribute_table: [{ attribute: '', value: '' }]      
        };
      }
  
    
      console.log("Item updatedItemData ", updatedItemData)
      // console.log("ItemGrp 'is group' ",payload?.is_group_value)
      const updatedItem = await updateResource(
        "Item",
        formdata.name,
        updatedItemData,
        token
      );
  
      if (!updatedItem || !updatedItem.success) {
        throw new Error("Failed to update Item Group details.");
      }
  
      console.log("Updated Item:", updatedItem);
  
      
      return {
        success: true,
        message: "Item updated successfully.",
        data: { updatedItem},
      };
    } catch (error: any) {
      console.error("Error updating customer and address:", error.message);
      return {
        success: false,
        message: error.message || "An unexpected error occurred.",
      };
    }
  }
  
  