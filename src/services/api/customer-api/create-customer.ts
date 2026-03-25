import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import axios from "axios";
import { NextApiRequest, NextApiResponse } from 'next';
import { useState } from "react";
import { createResource, updateResource } from "../common-erpnext-api/create-edit-api";
import { fetchFromERPNext } from "../common-erpnext-api/listing-api-get";

  export const createCustomerWithDetails = async (formData: any, token: string) => {
    // Step 1: Create Customer
    //if formData values and database fields are same pass formData  otherwise need to set custom fields cusPayload
    const cusPayload: Record<string, any> = {
      organization_name: formData.get("organization_name"),
      website: formData.get("website"),
      territory: formData.get("territory"),
      industry: formData.get("industry"),
      no_of_employees:formData.get("no_of_employees") || "",
    };
    console.log("cusPayload",cusPayload);
    
    console.log("cusPayload11111",cusPayload);
    // return false;
    
    const customerResponse = await createResource("CRM Organization", cusPayload, token);
    if (!customerResponse.success) return customerResponse; // Return error if customer creation fails
  
    const customerData = customerResponse.data;
    let addressData: any = null;
    let contactData: any = null;
  
  
    // Step 2: Create Address (if address fields exist)
    if (formData.get("address_line1") && formData.get("city") && formData.get("country")) {
      const addressPayload = {
        address_title: formData.get("address_title") || `${formData.get("organization_name")}-${formData.get("address_line1")}`,
        address_type: formData.get("address_type") || "Billing",
        address_line1: formData.get("address_line1"),
        address_line2: formData.get("address_line2"),
        city: formData.get("city"),
        state: formData.get("state"),
        country: formData.get("country"),
        pincode: formData.get("pincode"),
        territory: formData.get("territory"),
        is_primary_address:1,
        links: [{ link_doctype: "CRM Organization", link_name: customerData.name }],
      };
      const addressResponse = await createResource(
        "Address",
        addressPayload,
        token,
      );
  
      // Assign data only if successful
      addressData = addressResponse.success ? addressResponse.data : null;

       // Assign data only if successful
       if (addressResponse.success) {
        addressData = addressResponse.data;

        // Step 3: Update Contact with Address Name
        const updateCustomerPayload = {
          address: addressData.name // Assuming the Contact has an "address" field
        };

        await updateResource("CRM Organization", customerData.name, updateCustomerPayload, token);
      }
    }
    // Step 3: Create Contact (if email exists)
    if (formData.get("email_id") && formData.get("email_id").trim() !== "" && customerData.name) {
      
      const contPayload: Record<string, any> = {
        first_name: formData.get("first_name"),
        middle_name: "",
        last_name: formData.get("last_name"),
        email_ids: [
          {
            doctype: "Contact Email",
            parent: "new-contact",
            parentfield: "contact_emails",
            parenttype: "Contact",
            email_id: formData.get("email_id"),
            is_primary: 1,
          },
        ],
        phone_nos: [
          ...(formData.get("phone") || formData.get("mobile_no")
            ? [
                {
                  doctype: "Contact Phone",
                  parentfield: "contact_phone_numbers",
                  phone: formData.get("phone") || formData.get("mobile_no"),
                  is_primary_phone: 1,
                },
              ]
            : []),         
        ],
    
        // mobile_no:payload?.phone || "",
        email_id: formData.get("email_id"),
        phone: formData.get("phone") || formData.get("mobile_no"),
        company_name: customerData.name,
        links:[{ link_doctype: "CRM Organization", link_name: customerData.name }]
      };
      const contactResponse = await createResource("Contact", contPayload, token);


      // const contactResponse = await updateResource("Contact", customerData?.customer_primary_contact,contPayload, token);
      contactData = contactResponse.success ? contactResponse.data : null;
      console.log("contPayload",contPayload);
    }
    console.log("formData",formData);

    // - No need to build a contact separately; erpnext will create a contact in the customer api if an email address or mobile number is provided.
    // Step 3: Create Contact (if email exists) 
    // if (formData.get("email_id") && formData.get("email_id").trim() !== "") {
    //   const contactResponse = await createResource(
    //     "Contact",
    //     formData,
    //     token,
    //     [{ link_doctype: "CRM Organization", link_name: customerData.name }]
    //   );
  
    //   contactData = contactResponse.success ? contactResponse.data : null;
    // }
  
    return {
      success: true,
      message: "Account created successfully",
      customer: customerData,
      address: addressData || "No address provided",
      contact: contactData || "No contact created",
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
      const customerResponse = await fetchFromERPNext("CRM Organization", customerParams, token);
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
      "CRM Organization",
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

        await updateResource("CRM Organization", customer.name, updateCustomerPayload, token);
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
        links: [{ link_doctype: "CRM Organization", link_name: customer.name }],
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

        await updateResource("CRM Organization", customer.name, updateCustomerPayload, token);
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
