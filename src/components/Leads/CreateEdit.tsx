import React, { useEffect, useState } from "react";
import { showToast } from "@/components/ToastNotificationNew";
// import { 
//   editCustomerAndAddress,
// } from "@/services/api/customer-api/create-customer";
import { useRouter } from "next/navigation";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { getAddressTypes, getCountries, getIndustry, getNoOfEmployees, getTerritories } from "@/components/Common/Form/fetchCommonData";
 
// import { createLeadWithDetails } from "@/services/api/customer-api/create-lead";
import { ProfileDataFetch } from "@/services/api/general_apis/ProfilePageApi/profile-page-api";
// import SelectCustomerField from "../Customer/SelectCustomerField";
import { createCustomMultipleDocuments } from "@/services/api/common-erpnext-api/create-edit-api";
import { v4 as uuidv4 } from 'uuid';

interface AddEditLeadDrawerProps {
  initialValues: [];
  open: boolean;
  onClose: () => void;
  operation: string;
  onSubmit?: () => void;
}

export default function AddEditLeadDrawer({
  initialValues,
  open,
  onClose,
  operation,
  onSubmit,
}: AddEditLeadDrawerProps) {
  const [addresstypes, setAddressTypes] = useState<any>([]);
  const [countries, setCountries] = useState<any>([]);
  const [territories, setTerritories] = useState<any>([]);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
   const [userData, setUserData] = useState<any>(() => {
    const  userValue = JSON.parse(
      localStorage.getItem("userProfileData") || "{}"
    );
    return  userValue || "";
  });
  const leadKey = `lead_${uuidv4().split("-")[0]}`;
  
  console.log('localStorage.getItem("userProfileData")',userData);
  
  const router = useRouter();

  useEffect(() => {
     const getUserData = async () => {
      const ProfileOrderData = await ProfileDataFetch(userToken?.access_token);
      console.log("userData",ProfileOrderData);
      // localStorage.setItem("userProfileData",ProfileOrderData)
      
    };
//  getUserData()

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
    console.log("values===>",values);
    // return false
    
    // Object.keys(values).forEach(function (key) {
    //   console.log(key, "============", values[key]);

    //   formData.append(key, values[key]);
    // });
    if (operation == "New") {      
      createLead(values);
    } else if (operation == "Edit") {    
      editLead(values);
    }
    // action.resetForm();
    onClose();
    action.setSubmitting(false);
  };

  const createLead = async (formData) => {
    // console.log("formData HERE ", formData.get("first_name"));

    // const leadKey = formData?.first_name?.toLowerCase().replace(/\s/g, "_") || "lead1";
    
    const documents = [
    {
      "doctype": "CRM Lead",
      "key": leadKey,
      "data": formData
    },
    // {
    //   "doctype": "CRM Task",
    //   "data": {
    //     "title": "Initial Follow-up",
    //     "reference_doctype": "CRM Lead",
    //     "reference_docname": `{{${leadKey}.name}}`,
    //     "priority": "Medium",
    //     "status": "Todo",
    //     "assigned_to": userData?.email,
    //     "owner": userData?.full_name,
    //   }
    // }
  ]

  let customerApiRes: any = await createCustomMultipleDocuments(
      documents,
      userToken?.access_token
    );
    console.log("customerApiRes",customerApiRes);
    
    if (customerApiRes?.success) {
      showToast(customerApiRes?.message, "success");
      onSubmit
        ? onSubmit()
        : router.push("/leads/detail/" + customerApiRes?.customer?.name);
    } else showToast(customerApiRes?.message, "warning");
    if (customerApiRes?.error) showToast(customerApiRes?.error, "error");

    // let customerApiRes: any = await createLeadWithDetails(
    //   formData,
    //   userToken?.access_token
    // );
    // if (customerApiRes?.success) {
    //   showToast(customerApiRes?.message, "success");
    //   onSubmit
    //     ? onSubmit()
    //     : router.push("/leads/detail/" + customerApiRes?.customer?.name);
    // } else showToast(customerApiRes?.message, "warning");
    // if (customerApiRes?.error) showToast(customerApiRes?.error, "error");
  };

  const editLead = async (formData) => {

      const documents = [
    {
      "doctype": "CRM Lead",
      "key": leadKey,
      "data": formData
    },
    // {
    //   "doctype": "CRM Task",
    //   "data": {
    //     "title": "Initial Follow-up",
    //     "reference_doctype": "CRM Lead",
    //     "reference_docname": `{{${leadKey}.name}}`,
    //     "priority": "Medium",
    //     "status": "Todo",
    //     "assigned_to": userData?.email,
    //     "owner": userData?.full_name,
    //   }
    // }
  ]

    let customerApiRes: any = await createCustomMultipleDocuments(
      documents,
      userToken?.access_token
    );
    console.log("customerApiRes",customerApiRes);

    // let customerApiRes: any = await editCustomerAndAddress(
    //   formData.get("name"),
    //   formData,
    //   userToken?.access_token
    // );
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
    const [sourceOptions, setSourceOptions] = useState<any>([]);
  
    useEffect(() => {
      const fetchData = async () => {
        const data = await getIndustry("", "CRM Industry");
        setIndustryOptions(data);
      };
       const fetchSource = async () => {
        const data = await getIndustry("", "CRM Lead Source");
        setSourceOptions(data);
      };
      fetchSource();
      fetchData();
    }, []);


  const custypeOptions = [
    { label: "Individual", value: "Individual" },
    { label: "Company", value: "Company" },
    // { label: "Partnership", value: "Partnership" },
  ];
   
  const formFields: FieldConfigNew[] = [
    //Personal Details
      { name: "first_name", label: "First Name", type: "text", placeholder: "Enter First Name",  validate: true, section: "Personal Details" },
      { name: "last_name", label: "Last Name", type: "text", placeholder: "Enter Last Name",  validate: (values) => values.customer_type === "Individual", section: "Personal Details" },
      { name: "email", label: "Email", type: "email", placeholder: "Enter Email", validate: (values) => values.customer_type === "Individual", section: "Personal Details"  },
      { name: "mobile_no", label: "Mobile No", type: "mobile_no", placeholder: "Enter Mobile No",  validate: true, section: "Personal Details" },      

      { name: "organization", label: "Organization", type: "text", placeholder: "Enter Organization",  validate: false, section: "Details" },
      // { name: "organization", label: "Account", type: "custom", component: SelectCustomerField,componentProps: { onCustomerSelect: (customer: any) => {console.log("Selected Customer qqqq:", customer)},}, placeholder: "Select Account", validate: false, section: "Details" ,hideInEdit:true,value:""},
      { name: "website", label: "Website", type: "text", placeholder: "Enter Website", validate: false, section: "Details"},
      { name: "territory", label: "Territory", type: "select",options:territories, placeholder: "Enter territory", validate: false, section: "Details"},
      { name: "industry", label: "Industry", type: "select",options:industryOptions, placeholder: "Enter industry", validate: false, section: "Details"},
      { name: "source", label: "Source", type: "select",options:sourceOptions, placeholder: "Select Source", validate: false, section: "Details"},
      { name: "job_title", label: "Job Title", type: "text", placeholder: "Job Title", validate: false, section: "Details"},
      { name: "lead_owner", label: "Lead Owner", type: "text", placeholder: "Job Title", validate: false, section: "Details",value:userData?.email,hide:true},
     
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
    title={`${operation} Lead`}
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
