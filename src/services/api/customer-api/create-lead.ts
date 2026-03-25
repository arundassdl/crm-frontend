import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import axios from "axios";
import { NextApiRequest, NextApiResponse } from 'next';
import { useState } from "react";
import { createResource, updateResource } from "../common-erpnext-api/create-edit-api";
import { fetchFromERPNext } from "../common-erpnext-api/listing-api-get";

export const createLeadWithDetails = async (formData: any, token: string) => {
    // Step 1: Create LEad
    //if formData values and database fields are same pass formData  otherwise need to set custom fields cusPayload
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
    console.log("cusPayload11111",payload);
    // return false;
    
    const customerResponse = await createResource("CRM Lead", payload, token);
    if (!customerResponse.success) return customerResponse; // Return error if customer creation fails
  
    const customerData = customerResponse.data;
    
  
    return {
      success: true,
      message: "Lead created successfully",
      lead: customerData,  
    };
  };
  
 

  async function fetchCustomerWithAddress(customerName: string, token: string) {
    try {
      const customerParams = {
        filters: JSON.stringify({ name: customerName }),
        fields: JSON.stringify(["name","customer_type","customer_group","territory"])
      };
      console.log("customer details customerParams", customerParams);
      // Fetch customer details
      const customerResponse = await fetchFromERPNext("CRM Lead", customerParams, token);
      console.log("customer details customerResponse", customerResponse);
      const customer = customerResponse.data[0];
      
      if (!customer) {
        throw new Error("Customer not found");
      }
      const addrsParams = {
        filters: JSON.stringify([["Dynamic Link", "link_name", "=", customerName],['is_primary_address',"=","1"]]),
        fields: JSON.stringify(["name", "address_line1", "address_line2", "city", "state", "country", "pincode"])
      };
  
      // Fetch linked addresses
      const addressResponse = await fetchFromERPNext("Address", addrsParams, token);
      const addresses = addressResponse.data;
      console.log("customer details addressResponse", addressResponse);
      return { customer, addresses };
    } catch (error) {
      console.error("Error fetching customer:", error);
      return null;
    }
  }
  

export async function editCustomerAndAddress(
  customerName: string,
  formData: FormData | Record<string, any>,
  token: string
) {
  try {
    console.log("Fetching customer details for:", customerName);

    // Step 1: Fetch customer and address data
    const customerData = await fetchCustomerWithAddress(customerName, token);
    
    // return false;
    if (!customerData) {
      return { success: false, message: "Customer not found." };
    }

    const { customer, addresses } = customerData;
    const primaryAddress = addresses.length > 0 ? addresses[0] : null;
    console.log("primaryAddress",primaryAddress);
    // return false;
    let payload: Record<string, any> = {};

    // Convert formData to object if it's an instance of FormData
    if (formData instanceof FormData) {
      formData.forEach((value: any, key: string) => {
        payload[key] = value;
      });
    } else {
      payload = { ...formData }; // Copy object directly
    }
    
    
    // Ensure customer group and territory are valid
    if (!customer.customer_group || !customer.territory) {
      payload["customer_group"] = customer.customer_type || "Individual"; // Default to "Individual"
      payload["territory"] = primaryAddress?.territory || "India"; // Default to "India"
    }

    // Step 2: Update customer details
    const updatedCustomerData = {
      organization_name: payload?.organization_name,
      customer_type: payload?.customer_type,
      customer_email_id: payload?.customer_email_id,
      customer_phone: payload?.customer_phone,
    };
    console.log("updatedCustomerData 111",updatedCustomerData);
    const updatedCustomer = await updateResource(
      "CRM Lead",
      customer.name,
      updatedCustomerData,
      token
    ); 

    if (!updatedCustomer || !updatedCustomer.success) {
      throw new Error("Failed to update customer details.");
    }
    console.log("Updated Customer:", updatedCustomer);
   
    const contPayload: Record<string, any> = {
      first_name: payload?.first_name,
      middle_name: "",
      last_name: payload?.last_name,
      email_ids: [
        {
          doctype: "Contact Email",
          parent: "new-contact",
          parentfield: "contact_emails",
          parenttype: "Contact",
          email_id: payload?.email_id,
          // is_primary: 1,
        },
      ],
      phone_nos: [
        ...(payload?.phone || payload?.mobile_no
          ? [
              {
                doctype: "Contact Phone",
                parentfield: "contact_phone_numbers",
                phone: payload?.phone || payload?.mobile_no,
                is_primary_phone: 1,
              },
            ]
          : []),
        // ...(payload?.mobile_no
        //   ? [
        //       {
        //         doctype: "Contact Phone",
        //         parentfield: "contact_phone_numbers",
        //         phone: payload?.mobile_no,
        //         is_primary_mobile_no: 1,
        //       },
        //     ]
        //   : []),
      ],
  
      // mobile_no:payload?.phone || "",
      email_id: payload?.email_id,
      phone: payload?.phone || payload?.mobile_no,
    };

    // Step 3: Update address details (if exists)
    let updatedAddress = null;
    if (
      primaryAddress != null && 
      payload?.address_line1 && 
      payload?.address_line1.trim().toLowerCase() !== "null"
    ) {
      
      const updatedAddressData = {
        address_title: payload?.address_title,
        address_type: payload?.address_type,
        address_line1: payload?.address_line1,
        address_line2: payload?.address_line2,
        pincode: payload?.pincode,
        country: payload?.country,
        city: payload?.city,
        state: payload?.state,
        is_primary_address:1,
        territory:payload?.territory
      };
      console.log("updatedAddressData",updatedAddressData);
      

      let updatedAddress = await updateResource(
        "Address",
        primaryAddress.name,
        updatedAddressData,
        token
      );

      if (!updatedAddress || !updatedAddress.success) {
        throw new Error("Failed to update address details.");
      }

      console.log("Updated Address:", updatedAddress);
      // Assign data only if successful
      if (updatedAddress.success) {
        let addressData = updatedAddress.data.data;

        // Step 3: Update Customer with Address Name
        const updateCustomerPayload = {
          customer_primary_address: addressData.name  
        };

        await updateResource("CRM Lead", customer.name, updateCustomerPayload, token);
      }
    }else{
      if (
        payload?.address_line1 && 
        payload?.address_line1.trim().toLowerCase() !== "null"
      ) {
      const updatedAddressData = {
        address_title: payload?.address_title,
        address_type: payload?.address_type,
        address_line1: payload?.address_line1,
        address_line2: payload?.address_line2,
        country: payload?.country,
        city: payload?.city,
        state: payload?.state,
        pincode: payload?.pincode,
        is_primary_address:1,
        territory:payload?.territory,
        links: [{ link_doctype: "CRM Lead", link_name: customer.name }],
      };

      let updatedAddress = await createResource("Address", updatedAddressData, token);
      console.log("updatedAddress hhhh",updatedAddress);
      
       // Assign data only if successful
       if (updatedAddress.success) {
        let addressData = updatedAddress.data;        
        // Step 3: Update Customer with Address Name
        const updateCustomerPayload = {
          customer_primary_address: addressData.name  
        };

        await updateResource("CRM Lead", customer.name, updateCustomerPayload, token);
      }
    }
    }

    return {
      success: true,
      message: "Customer updated successfully.",
      data: { updatedCustomer, updatedAddress },
    };
  } catch (error: any) {
    console.error("Error updating customer and address:", error.message);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
}
