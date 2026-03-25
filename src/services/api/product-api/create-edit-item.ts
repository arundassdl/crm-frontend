import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import axios from "axios";
import { NextApiRequest, NextApiResponse } from 'next';
import { useState } from "react";
import { createResource, updateResource } from "../common-erpnext-api/create-edit-api";
import { fetchFromERPNext } from "../common-erpnext-api/listing-api-get";

const convertToVariantList = (
  baseStockUom: string,
  baseItemCode: string,
  baseItemName: string,
  attributes: Record<string, string[]>,
  variants: {
    item_code: string;
    item_name: string;
    item_group: string;
    qty: number;
    cost_price: number;
    selling_price: number;
    pricelist: Record<string, string[]>,
    stock_uom: string;
    image: File | null;
  }[]
) => {
  const attributeKeys = Object.keys(attributes);
  const attributeValues = attributeKeys.map((key) => attributes[key]);

  const combinations: string[][] = [];

  const cartesian = (arr: string[][], prefix: string[] = []) => {
    if (!arr.length) return combinations.push(prefix);
    for (const val of arr[0]) {
      cartesian(arr.slice(1), [...prefix, val]);
    }
  };
  cartesian(attributeValues);

  const companyString = localStorage.getItem("userCompanyData")
  const company = companyString ? JSON.parse(companyString) : null;

  const variantList = combinations.map((combination, i) => {
    const attributePairs = combination.map((value, idx) => ({
      attribute: attributeKeys[idx],
      attribute_value: value,
    }));

    const v = variants[i];
    const priceFields = Object.entries(v ).filter(
      ([key, value]) => key.endsWith('_buying') || key.endsWith('_selling')
    );

    const filteredPrices = Object.fromEntries(priceFields);
    console.log("filteredPrices",filteredPrices);
    return {
      ...v,
      item_code: v.item_code,
      item_name: v.item_name,
      item_group: v.item_group,
      variant_of: baseItemCode,
      attributes: attributePairs,
      pricelist:filteredPrices,
      // selling_price: v.selling_price,
      // cost_price: v.cost_price,
      qty: v.qty,
      default_warehouse:company.default_warehouse_for_sales_return,
      company: company,
      stock_uom:baseStockUom
    };
  });

  return variantList;
};

export const uploadFileApi = async (
  file: File,
  itemCode: string,
  module: string,
  token: string,
  baseUrl?: string | "",
): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("item_code", itemCode);
  formData.append("module", module);
  
console.log("baseUrl",baseUrl);

  // const baseUrl = window.location.origin;
  if(baseUrl=="" || baseUrl==undefined){
    baseUrl = ""
  }
  console.log("baseUrl1",baseUrl);

  const res = await fetch(`${baseUrl}/api/resource/items/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (res.ok) {
    console.log("✅ Image uploaded:", data.file_url);
    return data.file_url;
  } else {
    throw new Error(data.error || "Upload failed");
  }
};

export const deleteFileApi = async (file: File, itemCode: string, module: string, token: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("item_code", itemCode);
  formData.append("module", module);

   
  const res = await fetch("/api/resource/items/upload-image", {
    method: "POST",
    headers: {
      Authorization: `${token}`,
    },
    body: formData,
  });

  const data = await res.json();
  if (res.ok) {
    console.log("✅ Image uploaded:", data.file_url);
    return data.file_url;
  } else {
    throw new Error(data.error || "Upload failed");
  }
};

export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // remove "data:image/jpeg;base64,"
    };
    reader.onerror = reject;
  });
};


export const shortenFileName = (file: File) => {
  const maxLength = 140;
  const ext = file.name.split(".").pop() || "";
  const base = file.name
    .substring(0, file.name.lastIndexOf("."))
    .slice(0, maxLength - ext.length - 1);
  const newName = `${base}.${ext}`;
  return new File([file], newName, { type: file.type });
};

type Variant = {
  item_code: string;
  item_name: string;
  qty: number;
  cost_price: number;
  selling_price: number;
  image: File | null; // this holds the image file
};

async function  fetchData (
  doctype:string,
  linkField:string,
  linkValue:string,
  token:string,
  fields = '["*"]', // Default to fetching all fields
) {
  const res = await fetch(
    `/api/resource/get-detail`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token
    },
    body: JSON.stringify({
      module: doctype,
      linkField,
      linkValue,
      fields
    })
  });
  const data = await res.json();
  console.log("data get detail",data);
  return (data?.length>0)?data[0]:[]  
}; 

export const CreateItemAndVariants = async (formData: any, token: string) => {
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

    const companyString = localStorage.getItem("userCompanyData");
    const company = companyString ? JSON.parse(companyString) : null;
    
    if(payload.item_tax_template != ""){
      const newTaxRow = {
        doctype: "Item Tax",
        item_tax_template: payload.item_tax_template,
        idx: 1,
        parent: payload?.item_code,
        parenttype: "Item",
        parentfield: "taxes",
      };
    
      // 3. Update the taxes field
      payload.taxes = [newTaxRow];
    
    }
     const priceFields = Object.entries(payload).filter(
      ([key, value]) => key.endsWith('_buying') || key.endsWith('_selling')
    );

    const filteredPrices = Object.fromEntries(priceFields);

    // Step 2: Construct itemPayload with required fields
    const itemPayload = {
      ...payload,
      company,
      show_in_website: payload.meta_title?.trim() ? 1 : 0,
      has_variants: payload.has_variants ? 1 : 0,
      attributes: payload.attributes,
      filteredPrices:filteredPrices
      // file:fileUrl
    };
    let createvariantsmsg=""

    console.log("Upload payload.attributes?.length", payload.variants);
    

    // console.error(" API call failed:");
    // return { success: false, message: "Something went wrong" };
    console.log(" itemPayload:", (itemPayload));
   
// return false;
    const response = await fetch("/api/resource/create-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
      body: JSON.stringify(itemPayload),
    });

    const itemData = await response.json();
    console.log("itemData=>", itemData);
    console.log("itemData=>item", itemData?.item);
    if(itemData?.success == false){
      return {
        success: false,
        message: itemData?.error,
      };
    }
    console.log("itemPayload", itemPayload);
    
    
    if (payload?.image) {
      console.log("payload?.image",shortenFileName(payload?.image));
      // const fileUrl = await uploadFileApi(
      //   shortenFileName(payload?.image),
      //   payload?.item_code,
      //   "Item"
      // );
      try {
        const fileUrl = await uploadFileApi(shortenFileName(payload?.image), payload.item_code, "Item",token);
        // Do something with fileUrl (e.g., updating the item image in the database or UI)
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }

    //Create multiple item variants with item data and  item price (selling and buying) , Stock Reconciliation for each variant items
    if (payload.variants != undefined && payload.variants?.length > 0) {

      
      const formattedVariants = convertToVariantList(
        payload.stock_uom,
        payload.item_code,
        payload.item_name,
        payload.attributes,
        payload.variants
      );
      console.log("formattedVariants", formattedVariants);
      const response1 = await fetch("/api/resource/create-variants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ variants: formattedVariants }),
      });
      const itemData1 = await response1.json();
      console.log("itemData1", itemData1);
   

    const submitVariants = async (variants: Variant[]) => {
      const formData = new FormData();
    
      // Append variant JSON as string
      formData.append('variants', JSON.stringify(
        variants.map(({ image, ...rest }, index) => ({
          ...rest,
          image_field: image ? `variant_image_${index}` : null
        }))
      ));
    
      // Append image files with matching field names
      variants.forEach((variant, index) => {
        if (variant.image) {
          formData.append(`variant_image_${variant.item_code}`, variant.image);
        }
      });
      console.log('Upload variants', variants);
    
      // Send to ERPNext backend        
      const res = await fetch('/api/resource/upload-variants', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `${token}`,
        }
      });
      const data = await res.json();
      console.log('Upload Response', data);
     
    };
    // if(payload.variants!=undefined && payload.variants?.image!=undefined){
      submitVariants(payload.variants)
    // }
    // createvariantsmsg = "Item variants are being created in the background and will appear shortly."   
    createvariantsmsg = "and its associated variants were" 
    const getItemData  = await fetchData("Item","item_code",payload?.item_code,token);
    
    
    if(getItemData){
      setTimeout(async() => {
        getItemData.taxes = payload?.taxes;
        console.log("getItemData",getItemData);
        const itemRes = await fetch(`/api/docs/update`, {
          method: "POST",
          headers: {
            Authorization: `${token}`,
          },
          body: JSON.stringify({ doctype: "Item", name: getItemData.item_code,updateData:getItemData }),
        });
        const result1 = await itemRes.json();
        console.log("itemRes itemResitemRes",result1);
      }, 6000,getItemData);    
      
    }
  }

    // Step 3 Return item-only success if no variants
    return {
      success: true,
      message: `Item ${(createvariantsmsg)?" "+createvariantsmsg:""} created successfully`,
      item: itemData,
    };
  } catch (err: any) {
    console.error(" API call failed:", err);
    return {
      success: false,
      message: "Something went wrong",
      error: err.message,
    };
  }
};

export async function EditItemDetail(
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
   
    
    console.log("updatedItem payload",payload);
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
        message: "Item updated successfully.",
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
  
  