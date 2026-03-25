import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { useState } from "react";
import {
  conditionalUpdateResource,
  createResource,
  updateResource,
} from "../common-erpnext-api/create-edit-api";
import { fetchFromERPNext } from "../common-erpnext-api/listing-api-get";
import { fetchRecordsWithLinks } from "../common-erpnext-api/create-update-custom-api";

export const createContactWithDetails = async (
  formData: any,
  token: string
) => {
  const customerName = formData.get("company_name");
  // Step 1: Create Contact

  //if formData values and database fields are same pass formData  otherwise need to set custom fields cusPayload
  const contPayload: Record<string, any> = {
    first_name: formData.get("first_name"),
    // middle_name: formData.get("middle_name"),
    last_name: formData.get("last_name"),
    email_ids: [
      {
        doctype: "Contact Email",
        parent: "new-contact",
        parentfield: "contact_emails",
        parenttype: "Contact",
        email_id: formData.get("email_id"),
        is_primary: 0,
      },
    ],
    phone_nos: [
      ...(formData.get("phone")
        ? [
            {
              doctype: "Contact Phone",
              parentfield: "contact_phone_numbers",
              phone: formData.get("phone"),
              is_primary_phone: 1,
            },
          ]
        : []),
      ...(formData.get("mobile_no")
        ? [
            {
              doctype: "Contact Phone",
              parentfield: "contact_phone_numbers",
              phone: formData.get("mobile_no"),
              is_primary_mobile_no: 1,
            },
          ]
        : []),
    ],

    // mobile_no:formData.get("phone") || "",
    email_id: formData.get("email_id"),
    phone: formData.get("phone"),
    is_primary_contact: (formData.get("is_primary_contact"))?1:0,
    company_name: (formData.get("company_name")!="")?formData.get("company_name"):"",
  };
  
  if (customerName) {
    contPayload.links = [{ link_doctype: "CRM Organization", link_name: customerName }];
  }
  console.log("contPayload", contPayload);
  let addressData: any = null;
   if (
    (formData.get("first_name") != "" && formData.get("first_name") != null) &&
    (formData.get("email_id") != "" && formData.get("email_id") != null) &&
    (formData.get("phone") != "" && formData.get("phone") != null)
  ) {
    console.log("post here",formData.get("first_name"));
    
    if (customerName) {
      if(formData.get("is_primary_contact")){

        const updateContPayload = {
          is_primary_contact: 0, 
        };

        await conditionalUpdateResource(
          "Contact",
          updateContPayload,
          token,
          [["Dynamic Link", "link_name", "=", customerName],['is_primary_contact',"=","1"]]
        );
      }
    }
    
    const customerResponse = await createResource(
      "Contact",
      contPayload,
      token
    );
    if (!customerResponse.success) return customerResponse; // Return error if customer creation fails

    const contactData = customerResponse.data;
   

    let addressData: any = null;

    // Step 2: Create Address (if address fields exist)
    if (
      formData.get("address_line1") &&
      formData.get("city") &&
      formData.get("country")
    ) {
      const addressPayload: Record<string, any> = {
        address_title:
          formData.get("address_title") ||
          `${contactData?.full_name}-${formData.get("address_line1")}`,
        address_type: formData.get("address_type") || "Billing",
        address_line1: formData.get("address_line1"),
        address_line2: formData.get("address_line2"),
        city: formData.get("city"),
        state: formData.get("state"),
        country: formData.get("country"),
        pincode: formData.get("pincode"),
        territory: formData.get("territory"),
        // links: [{ link_doctype: "Contact", link_name: contactData?.name }],
      };
      if (contactData?.name) {
        addressPayload.links = [
          { link_doctype: "Contact", link_name: contactData.name },
        ];
      }

      const addressResponse = await createResource(
        "Address",
        addressPayload,
        token
      );

      // Assign data only if successful
      addressData = addressResponse.success ? addressResponse.data : null;

      // Assign data only if successful
      if (addressResponse.success) {
        addressData = addressResponse.data;

        // Step 3: Update Contact with Address Name
        const updateContactPayload = {
          address: addressData.name, // Assuming the Contact has an "address" field
        };

        await updateResource(
          "Contact",
          contactData.name,
          updateContactPayload,
          token
        );
      }
    } 
    return {
      success: true,
      message: "Contact created successfully",
      contact: contactData,
      address: addressData || "No address provided",
    };
  }else {
    return {
      success: false,
      message: "Contact not created",
      contact: [],
      address: addressData || "No address provided",
    };
  }

 
};

export async function fetchContactWithAddress(name: string, token: string) {
  try {
    const contactParams = {
      filters: JSON.stringify({ name: name }),
      fields: JSON.stringify([
        "name",
        "full_name",
        "first_name",
        "middle_name",
        "last_name",
        "email_id",
        "phone",
      ]),
    };
    console.log("contact details contactParams", contactParams);
    // Fetch contact details
    const contactResponse = await fetchFromERPNext(
      "Contact",
      contactParams,
      token
    );
    console.log("contact details contactResponse", contactResponse);
    const contact = contactResponse.data[0];

    if (!contact) {
      throw new Error("Contact not found");
    }
    const addrsParams = {
      filters: JSON.stringify({ name: contact?.address }),
      // filters: JSON.stringify([["Dynamic Link", "link_name", "=", name]]),
      // fields: JSON.stringify(["name", "address_line1", "address_line2", "city", "state", "country", "pincode"])
    };

    // Fetch linked addresses
    const addressResponse = await fetchFromERPNext(
      "Address",
      addrsParams,
      token
    );
    const addresses = addressResponse.data;
    console.log("contact details addressResponse", addressResponse);
    return { contact, addresses };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

export async function editContactAndAddress(
  name: string,
  formData: FormData | Record<string, any>,
  token: string
) {
  try {
    console.log("Fetching customer details for:", name);

    // Step 1: Fetch customer and address data

    const getRecords = await fetchRecordsWithLinks("Contact", name, token);

    // const customerData = await fetchContactWithAddress(name, token);
    if (!getRecords) {
      return { success: false, message: "Contact not found." };
    }

    const contact = getRecords?.record;
    const primaryAddress =
      getRecords?.related_address?.length > 0
        ? getRecords?.related_address[0][0]
        : [];
    console.log("primaryAddress", primaryAddress);
    console.log("primaryAddress getRecords", getRecords);

    let payload: Record<string, any> = {};

    // Convert FormData to Object
    if (formData instanceof FormData) {
      formData.forEach((value: any, key: string) => {
        payload[key] = value;
      });
    } else {
      payload = { ...formData };
    }
    console.log("primaryAddress payload", payload);
    console.log("primaryAddress primaryAddress length", primaryAddress?.name);

    // Step 2: Update Contact Details (Including Email & Phone)
    const updatedContactData: Record<string, any> = {
      first_name: payload?.first_name || contact.first_name,
      middle_name: "",
      last_name: payload?.last_name || contact.last_name,
      email_id: payload?.email_id || contact.email_id,
      phone: payload?.phone || contact.phone,
      // mobile_no: payload?.mobile_no || contact.mobile_no,
      is_primary_contact: (payload?.is_primary_contact)?1:0  || contact.is_primary_contact,
      email_ids: [
        {
          doctype: "Contact Email",
          parentfield: "contact_emails",
          email_id: payload?.email_id || contact.email_id,
          is_primary: 1,
        },
      ],
      phone_nos: [
        ...(payload?.phone || contact.phone
          ? [
              {
                doctype: "Contact Phone",
                parentfield: "contact_phone_numbers",
                phone: payload?.phone || contact.phone,
                is_primary_phone: 1,
              },
            ]
          : []),
        ...(payload?.mobile_no || contact.mobile_no
          ? [
              {
                doctype: "Contact Phone",
                parentfield: "contact_phone_numbers",
                phone: payload?.mobile_no || contact.mobile_no, // Standardizing key
                is_primary_mobile_no: 1,
              },
            ]
          : []),
      ],
    
    };
    const customerName = formData.get("company_name");
    
    if(payload?.is_primary_contact){

      const updateContPayload = {
        is_primary_contact: 0, 
      };

      await conditionalUpdateResource(
        "Contact",
        updateContPayload,
        token,
        [["Dynamic Link", "link_name", "=", customerName],['is_primary_contact',"=","1"]]
      );
    }
    if (customerName) {
      // updatedContactData.links = [{ link_doctype: "CRM Organization", link_name: customerName }];
    }
    const updatedContact = await updateResource(
      "Contact",
      contact.name,
      updatedContactData,
      token
    );
    if (updatedContact.success) {     
      if (customerName) {
      // Step 3: Update CRM Organization with primary contact
      if(payload?.is_primary_contact){
        const updateCusPayload = {
          customer_primary_contact: contact.name, 
        };

        await updateResource(
          "CRM Organization",
          customerName,
          updateCusPayload,
          token,
        );
      }
    }
  }


    if (!updatedContact || !updatedContact.success) {
      throw new Error("Failed to update contact details.");
    }

    // console.log("Updated Contact:", updatedContact);

    // Step 3: Update Address Details (if exists)
    let updatedAddress = null;
    if (payload?.address_line1 && payload?.city && payload?.country) {
      if (primaryAddress?.name != "" && primaryAddress?.name != undefined) {
        const updatedAddressData = {
          address_title: payload?.address_title || primaryAddress.address_title,
          address_type: payload?.address_type || primaryAddress.address_type,
          address_line1: payload?.address_line1 || primaryAddress.address_line1,
          address_line2: payload?.address_line2 || primaryAddress.address_line2,
          country: payload?.country || primaryAddress.country,
          city: payload?.city || primaryAddress.city,
          state: payload?.state || primaryAddress.state,
          pincode: payload?.pincode || primaryAddress.pincode,
          territory: payload?.territory || primaryAddress.territory,
        };
        console.log("updatedAddressData", updatedAddressData);
        console.log("updatedAddressData primaryAddress", primaryAddress);
        // return false
        let updatedAddress = await updateResource(
          "Address",
          primaryAddress.name,
          updatedAddressData,
          token
        );
        if (!updatedAddress || !updatedAddress.success) {
          throw new Error("Failed to update address details.");
        }
        console.log("✅ Updated Address:", updatedAddress);
      } else {
        const updatedAddressData = {
          address_title:
            payload?.address_title ||
            `${contact?.full_name}-${payload?.address_line1}`,
          address_type: payload?.address_type || "Billing",
          address_line1: payload?.address_line1,
          address_line2: payload?.address_line2,
          country: payload?.country,
          city: payload?.city,
          state: payload?.state,
          pincode: payload?.pincode,
          territory: payload?.territory,
          links: [{ link_doctype: "Contact", link_name: contact?.name }],
        };
        let updatedAddress = await createResource(
          "Address",
          updatedAddressData,
          token
        );
        // Assign data only if successful
        if (updatedAddress.success) {
          let addressData = updatedAddress.data;

          // Step 3: Update Contact with Address Name
          const updateContactPayload = {
            address: addressData.name, // Assuming the Contact has an "address" field
          };

          await updateResource(
            "Contact",
            contact.name,
            updateContactPayload,
            token
          );
        }
      }
    }
    return {
      success: true,
      message: "Contact updated successfully.",
      data: { updatedContact, updatedAddress },
    };
  } catch (error: any) {
    console.error("Error updating customer and address:", error.message);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
}
