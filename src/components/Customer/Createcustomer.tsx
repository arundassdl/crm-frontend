import React, { useEffect, useState } from "react";
import { showToast } from "@/components/ToastNotificationNew";
import {
  createCustomerWithDetails,
  editCustomerAndAddress,
} from "@/services/api/customer-api/create-customer";
import { useRouter } from "next/navigation";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { getAddressTypes, getCountries, getIndustry, getNoOfEmployees, getTerritories } from "@/components/Common/Form/fetchCommonData";

interface AddEditCustomerDrawerProps {
  initialValues: [];
  open: boolean;
  onClose: () => void;
  operation: string;
  onSubmit?: () => void;
}

export default function AddEditCustomerDrawer({
  initialValues,
  open,
  onClose,
  operation,
  onSubmit,
}: AddEditCustomerDrawerProps) {
  const [addresstypes, setAddressTypes] = useState<any>([]);
  const [countries, setCountries] = useState<any>([]);
  const [territories, setTerritories] = useState<any>([]);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const router = useRouter();

  useEffect(() => {
    const getAddressTypeData = async () => {
      setAddressTypes(await getAddressTypes());
    };
    const getCountryData = async () => {
      setCountries(await getCountries());
    };
    const getTerritoryData = async () => {
      setTerritories(await getTerritories());
    };
    getCountryData();
    getTerritoryData();
    getAddressTypeData();
  }, []);

  const handlesubmit: any = async (values, action) => {
    const formData = new FormData();
    Object.keys(values).forEach(function (key) {
      console.log(key, "============", values[key]);

      formData.append(key, values[key]);
    });
    // return false;
    if (operation == "New") {
      action.resetForm();
      createCustomer(formData);
    } else if (operation == "Edit") {
      editCustomer(formData);
    }
    // action.resetForm();
    onClose();
    action.setSubmitting(false);
  };

  const createCustomer = async (formData) => {
    console.log("formData HERE ", formData);

    let customerApiRes: any = await createCustomerWithDetails(
      formData,
      userToken?.access_token
    );
    if (customerApiRes?.success) {
      showToast(customerApiRes?.message, "success");
      onSubmit
        ? onSubmit()
        : router.push("/accounts/detail/" + customerApiRes?.customer?.name);
    } else showToast(customerApiRes?.message, "warning");
    if (customerApiRes?.error) showToast(customerApiRes?.error, "error");
  };

  const editCustomer = async (formData) => {
    let customerApiRes: any = await editCustomerAndAddress(
      formData.get("name"),
      formData,
      userToken?.access_token
    );
    if (customerApiRes?.success) {
      showToast(customerApiRes?.message, "success");
      onSubmit ? onSubmit() : location.reload();
      // router.push("/customers/detail/" + customerApiRes?.data?.updatedCustomer?.data?.data?.name);
    } else showToast(customerApiRes?.message, "warning");
    if (customerApiRes?.error) showToast(customerApiRes?.error, "error");
  };

  const handleSubmit = (values, action) => {
    // Call API or handle form submission
    handlesubmit(values, action);
  };
  
    const [industryOptions, setIndustryOptions] = useState<any>([]);
  
    useEffect(() => {
      const fetchData = async () => {
        const data = await getIndustry("", "CRM Industry");
        setIndustryOptions(data);
      };
  
      fetchData();
    }, []);


  const custypeOptions = [
    { label: "Individual", value: "Individual" },
    { label: "Company", value: "Company" },
    // { label: "Partnership", value: "Partnership" },
  ];
   
  const formFields: FieldConfigNew[] = [
      { name: "organization_name", label: "Account Name ", type: "text", placeholder: "Enter Account Name", validate: true, section: "Account Details" },
      // { name: "customer_type", label: "Customer Type", type: "select",options:custypeOptions, placeholder: "Select Customer Type", validate: true, section: "Account Details" },
      { name: "website", label: "Website", type: "text", placeholder: "Enter Website", validate: false, section: "Account Details"},
      { name: "territory", label: "Territory", type: "select",options:territories, placeholder: "Enter territory", validate: false, section: "Account Details"},
      { name: "industry", label: "Industry", type: "select",options:industryOptions, placeholder: "Enter industry", validate: false, section: "Account Details"},
      { name: "no_of_employees", label: "No. of Employees", type: "select",options:getNoOfEmployees(), placeholder: "Select", validate: false, section: "Account Details"},
      // { name: "customer_phone", label: "Customer Phone", type: "text",options:custypeOptions, placeholder: "Enter Customer Phone", validate: (values) => values.customer_type === "Company", section: "Account Details" , dependsOn: "customer_type", showIf: (values) => values.customer_type === "Company",},
      //Primary Contact Details
      { name: "first_name", label: "First Name", type: "text", placeholder: "Enter First Name",  validate: (values) => values.customer_type === "Individual", section: "Primary Contact Details",sectiontype:"Accoridon" },
      { name: "last_name", label: "Last Name", type: "text", placeholder: "Enter Last Name",  validate: (values) => values.customer_type === "Individual", section: "Primary Contact Details",sectiontype:"Accoridon" },
      { name: "mobile_no", label: "Phone", type: "mobile_no", placeholder: "Enter Primary Mobile No",  validate: (values) => values.customer_type === "Individual", section: "Primary Contact Details",sectiontype:"Accoridon" },
      { name: "email_id", label: "Email", type: "email", placeholder: "Enter Email", validate: (values) => values.customer_type === "Individual", section: "Primary Contact Details" ,sectiontype:"Accoridon" },
       //Address Details
       { name: "address_title", label: "Address Title", type: "text", placeholder: "Enter Address Title", validate: true, section: "Primary Address Details",sectiontype:"Accoridon" },
       { name: "address_type", label: "Address Type", type: "select", options: addresstypes, validate: false, section: "Primary Address Details",sectiontype:"Accoridon"},
       { name: "address_line1", label: "Address Line 1", type: "textarea", placeholder: "Enter Address Line 1", validate: true, section: "Primary Address Details" ,sectiontype:"Accoridon"},
       { name: "address_line2", label: "Address Line 2", type: "textarea", placeholder: "Enter Address Line 2", validate: false, section: "Primary Address Details" ,sectiontype:"Accoridon"},  
       // Address-dependent fields (conditionally required)    
       { name: "country", label: "Country", type: "autocomplete",options:countries, placeholder: "Select Country", validate: true, section: "Primary Address Details",sectiontype:"Accoridon" },
       { name: "state", label: "State", type: "autocomplete",dependsOn: "country", placeholder: "Select State", validate: true, section: "Primary Address Details",sectiontype:"Accoridon" },
       { name: "city", label: "City", type: "autocomplete",dependsOn: "state", placeholder: "Select City", validate: true, section: "Primary Address Details",sectiontype:"Accoridon" },
       { name: "pincode", label: "Pincode", type: "autocomplete",dependsOn: "city", placeholder: "Select Pincode", validate: true, section: "Primary Address Details",sectiontype:"Accoridon" },
       { name: "territory", label: "Territory",type: "autocomplete",options:territories, placeholder: "Select Territory", validate: true, section: "Primary Address Details",sectiontype:"Accoridon" },
    ];
    console.log("formFields=>",formFields);
    
    type FormValueType = {
      [K in (typeof formFields)[number]["name"]]: string;
    };
    const formInitialValues: FormValueType = formFields.reduce((acc, field) => {
      acc[field.name] = ""; // Set default value as empty string
      return acc;
    }, {} as FormValueType);


return (
  <DrawerComponent
    open={open}
    onClose={onClose}
    title={`${operation} Account`}
  >
    <CustomForm
      fields={formFields}
      initialValues={formInitialValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      editValues={initialValues}
      // onFieldChange={onFieldChange}
    />
  </DrawerComponent>
);
}
