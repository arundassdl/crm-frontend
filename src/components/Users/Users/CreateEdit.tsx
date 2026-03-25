import React, { useEffect, useState } from "react";

import { showToast } from "@/components/ToastNotificationNew";
// import { 
//   editCustomerAndAddress,
// } from "@/services/api/customer-api/create-customer";
import { useRouter } from "next/navigation";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { getAddressTypes, getCountries, getIndustry, getNoOfEmployees, getTerritories, getRole } from "@/components/Common/Form/fetchCommonData";

 
// import { createLeadWithDetails } from "@/services/api/customer-api/create-lead";
import { ProfileDataFetch } from "@/services/api/general_apis/ProfilePageApi/profile-page-api";
// import SelectCustomerField from "../Customer/SelectCustomerField";
import { createCustomMultipleDocuments } from "@/services/api/common-erpnext-api/create-edit-api";
import { submit_adduser, submit_edituser } from "@/services/api/users/users-api";
import { v4 as uuidv4 } from 'uuid';
import { formatCalDate, formatToCalDate } from "@/services/api/common-erpnext-api/libs/utils";
 
type DynamicFormValues = {
  [key: string]: string | number | boolean | null | Date;
};

interface AddEditUserDrawerProps {
  initialValues: DynamicFormValues;
  open: boolean;
  onClose: () => void;
  operation: string;
  onSubmit?: () => void;
}

export default function AddEditUserDrawer({
  initialValues,
  open,
  onClose,
  operation,
  onSubmit,
}: AddEditUserDrawerProps) {
  const [addresstypes, setAddressTypes] = useState<any>([]);
  const [countries, setCountries] = useState<any>([]);
  const [territories, setTerritories] = useState<any>([]);
  const [departmentOptions, setDepartmentOptions] = useState<any>([]);
  const [designationOptions, setDesignationOptions] = useState<any>([]);
  const [branchOptions, setBranchOptions] = useState<any>([]);
  const [roleOptions, setRoleOptions] = useState<any>([]);
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

    const fetchRole = async () => {
      const data = await getRole("", "SDL Role");
      setRoleOptions(data);
    };



    getCountryData();
    getTerritoryData();
    getAddressTypeData();
    fetchRole();

    if (typeof initialValues.birth_date === "string" || initialValues.birth_date instanceof Date || initialValues.birth_date === null) {
      initialValues.birth_date = formatToCalDate(initialValues.birth_date);
    }
    if (typeof initialValues.date_of_joining === "string" || initialValues.date_of_joining instanceof Date || initialValues.date_of_joining === null) {
      initialValues.date_of_joining = formatToCalDate(initialValues.date_of_joining);
    }

  }, []);

  const handlesubmit: any = async (values, action) => {
    const formData = new FormData();
    console.log("values===>",values);
    // return false
    
    Object.keys(values).forEach(function (key) {
      console.log(key, "============", values[key]);
      // if (key == "birth_date" || key == "date_of_joining") {
      //   formData.append(key, formatToCalDate(values[key]));
      // } else {
      //   formData.append(key, values[key]);  
      // }
      formData.append(key, values[key]);  
      
    });
    formData.append('username',userToken?.username);
    formData.append('useremailid', userToken?.email);
    formData.append('siteurl', window.location.origin)
    if (operation == "New") {      
      createUser(formData);
    } else if (operation == "Edit") {    
      editUser(formData);
    }
    // action.resetForm();
    onClose();
    action.setSubmitting(false);
  };

  const createUser = async (formData) => {
    let customerApiRes: any = await submit_adduser(
        formData,
        userToken?.access_token
      );
      console.log("customerApiRes",customerApiRes);
      
      if (customerApiRes?.success) {
        showToast(customerApiRes?.message, "success");
        onSubmit
          ? onSubmit()
          : location.reload();
      } else showToast(customerApiRes?.message, "warning");
      if (customerApiRes?.error) showToast(customerApiRes?.error, "error");

   
  };

  const editUser = async (formData) => {


    let customerApiRes: any = await submit_edituser(
      formData,
      userToken?.access_token
    );
    console.log("customerApiRes",customerApiRes);

    
    if (customerApiRes?.success) {
      showToast(customerApiRes?.message, "success");
      onSubmit ? onSubmit() : location.reload();
    } else showToast(customerApiRes?.message, "warning");
    if (customerApiRes?.error) showToast(customerApiRes?.error, "error");
  };

  const handleSubmit = (values, action) => {
    // Call API or handle form submission
    handlesubmit(values, action);
  };
  
    const [genderOptions, setGenderOptions] = useState<any>([]);
    
    const [industryOptions, setIndustryOptions] = useState<any>([]);
  
    useEffect(() => {
      const fetchData = async () => {
        const data = await getIndustry("", "CRM Industry");
        setIndustryOptions(data);
      };
      const fetchGender = async () => {
        const data = await getIndustry("", "Gender");
        setGenderOptions(data);
      };
      

      const fetchDeparment = async () => {
        const data = await getIndustry("", "SDL CRM Department");
        setDepartmentOptions(data);
      };

      const fetchDesignation = async () => {
        const data = await getIndustry("", "SDL CRM Designation");
        setDesignationOptions(data);
      };

      const fetchBranch = async () => {
        const data = await getIndustry("", "SDL CRM Branch");
        setBranchOptions(data);
      };



      fetchData();
      fetchGender();
      fetchDeparment();
      fetchDesignation();
      fetchBranch();
    }, []);


  const custypeOptions = [
    { label: "Individual", value: "Individual" },
    { label: "Company", value: "Company" },
    // { label: "Partnership", value: "Partnership" },
  ];
   
  const formFields: FieldConfigNew[] = [
    //Personal Details
      { name: "first_name", label: "First Name", type: "text", placeholder: "Enter First Name",  validate: true, section: "Basic Info" },
      { name: "last_name", label: "Last Name", type: "text", placeholder: "Enter Last Name",  validate: true, section: "Basic Info" },
      { name: "email", label: "Email", type: "email", placeholder: "Enter Email", validate : true, section: "Basic Info"  },
      { name: "mobile_no", label: "Mobile No", type: "text", placeholder: "Enter Mobile No",  validate: true, section: "Basic Info" },      
      { name: "employee_number", label: "Employee Number", type: "text", placeholder: "Enter Employee Number",  validate: false, section: "Basic Info", hide: false },
      { name: "employeeid", label: "Employee id", type: "text", placeholder: "Enter Employee Number",  validate: false, section: "Basic Info", hide: true },
      

      { name: "role_profile_name", label: "Role", type: "autocomplete" ,options:roleOptions, placeholder: "Select Role", validate: true, section: "Role"},


      { name: "gender", label: "Gender", type: "select",options:genderOptions, placeholder: "Select Gender", validate: true, section: "More Information"},
      { name: "birth_date", label: "Date Of Birth", type: "date" , placeholder: "Enter Date of Birth", validate: true, section: "More Information"},
      // { name: "birth_date", label: "Date Of Birth", type: "text" , placeholder: "Enter Date of Birth", validate: true, section: "More Information"},
      { name: "date_of_joining", label: "Date Of Joining", type: "date" , placeholder: "Enter Date of Joining", validate: true, section: "More Information", hide: false },


      { name: "designation", label: "Designation", type: "select",options:designationOptions, placeholder: "Select Designation", validate: false, section: "Company Details", hide: false},
      { name: "department", label: "Department", type: "select",options:departmentOptions, placeholder: "Select Department", validate: false, section: "Company Details", hide: false},
      { name: "branch", label: "Branch", type: "select",options:branchOptions, placeholder: "Select Branch", validate: false, section: "Company Details", hide: false },

      { name: "addressid", label: "Address id", type: "text", placeholder: "Enter Address Title", validate: false, section: "Address Details" , hide: true },
      { name: "address_title", label: "Address Title", type: "text", placeholder: "Enter Address Title", validate: true, section: "Address Details" },
      { name: "address_type", label: "Address Type", type: "select", options: addresstypes, validate: true, section: "Address Details"     },
      { name: "address_line1", label: "Address Line 1", type: "textarea", placeholder: "Enter Address Line 1", validate: true, section: "Address Details" },
      { name: "address_line2", label: "Address Line 2", type: "textarea", placeholder: "Enter Address Line 2", validate: true, section: "Address Details" },  
      // Address-dependent fields (conditionally required)    
      { name: "country", label: "Country", type: "autocomplete",options:countries, placeholder: "Select Country", validate: true, section: "Address Details" },
      { name: "state", label: "State", type: "autocomplete",dependsOn: "country", placeholder: "Select State", validate: true, section: "Address Details" },
      { name: "city", label: "City", type: "autocomplete",dependsOn: "state", placeholder: "Select City", validate: true, section: "Address Details" },
      { name: "pincode", label: "Pincode", type: "autocomplete",dependsOn: "city", placeholder: "Select Pincode", validate: true, section: "Address Details" },
      { name: "territory", label: "Territory",type: "autocomplete",options:territories, placeholder: "Select Territory", validate: true, section: "Address Details" },

      
    ];
    console.log("formFields=>",formFields);
    
    type FormValueType = {
      [K in (typeof formFields)[number]["name"]]: string;
    };
    const formInitialValues: FormValueType = formFields.reduce((acc, field) => {
      acc[field.name] = ""; // Set default value as empty string
      console.log(field, 'formInitialValues-262')
      return acc;
    }, {} as FormValueType);


return (
  <DrawerComponent
    open={open}
    onClose={onClose}
    title={`${operation} User`}
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

