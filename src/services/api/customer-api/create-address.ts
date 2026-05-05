import { createResource, updateResource } from "../common-erpnext-api/create-edit-api";

  export const createAdress = async (formData: any, token: string,links?: { link_doctype: string; link_name: string }[]) => {
    // Step 1: Create Contact
    //if formData values and database fields are same pass formData  otherwise need to set custom fields cusPayload
    let addressData: any = null;
    
    // Step 2: Create Address (if address fields exist)
    if (formData.get("address_line1") && formData.get("city") && formData.get("country")) {
      const addressPayload:Record<string, any> = {
        address_title: formData.get("address_title") || `${formData.get("link_name")}-${formData.get("address_line1")}`,
        address_type: formData.get("address_type") || "Billing",
        address_line1: formData.get("address_line1"),
        address_line2: formData.get("address_line2"),
        city: formData.get("city"),
        state: formData.get("state"),
        country: formData.get("country"),
        pincode: formData.get("pincode"),
        territory: formData.get("territory"),
        // links: [{ link_doctype: (formData.get("link_doctype"))?formData.get("link_doctype"):"Customer", link_name: formData.get("link_name") }],
      };
      if (links && links.length > 0) {
        addressPayload.links =links;
      }
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
      }
    }
  
    return {
      success: true,
      message: "Address created successfully",
      address: addressData || "No address provided",
    };
  };
  
 
export async function editAddress(
  name: string,
  formData: FormData | Record<string, any>,
  token: string
) {
  try {
    console.log("Fetching customer details for:", name);
   
    let payload: Record<string, any> = {};

    // Convert FormData to Object
    if (formData instanceof FormData) {
      formData.forEach((value: any, key: string) => {
        payload[key] = value;
      });
    } else {
      payload = { ...formData };
    }

    // Step 3: Update Address Details (if exists)
    let updatedAddress = null;
    if (payload?.address_line1 && payload?.city && payload?.country) {
     
        const updatedAddressData = {
          address_title: payload?.address_title ,
          address_type: payload?.address_type ,
          address_line1: payload?.address_line1 ,
          address_line2: payload?.address_line2,
          country: payload?.country,
          city: payload?.city ,
          state: payload?.state ,
          pincode: payload?.pincode,
          territory: payload?.territory,
        };
        let updatedAddress = await updateResource("Address", name, updatedAddressData, token);
        if (!updatedAddress || !updatedAddress.success) {
          throw new Error("Failed to update address details.");
        }
        console.log("✅ Updated Address:", updatedAddress);
    }
    return {
      success: true,
      message: "Address updated successfully.",
      data: {  updatedAddress },
    };
  } catch (error: any) {
    console.error("Error updating customer and address:", error.message);
    return {
      success: false,
      message: error.message || "An unexpected error occurred.",
    };
  }
}
 
 