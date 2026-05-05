import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import React, { useEffect, useMemo, useState } from "react";

import { showToast } from "@/components/ToastNotificationNew";
// import { 
//   editCustomerAndAddress,
// } from "@/services/api/customer-api/create-customer";
import { useRouter } from "next/navigation";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { getIndustry, getRole } from "@/components/Common/Form/fetchCommonData";

 
// import { createLeadWithDetails } from "@/services/api/customer-api/create-lead";
import { ProfileDataFetch } from "@/services/api/general_apis/ProfilePageApi/profile-page-api";
// import SelectCustomerField from "../Customer/SelectCustomerField";
import { submit_adduser, submit_edituser } from "@/services/api/users/users-api";
import { formatToCalDate } from "@/services/api/common-erpnext-api/libs/utils";
 
type DynamicFormValues = {
  [key: string]: string | number | boolean | null | Date;
};

const ADDRESS_FORM_KEYS = [
  "country",
  "address_line1",
  "address_line2",
  "city",
  "state",
  "pincode",
  "latitude",
  "longitude",
] as const;

function normalizeUserRow(row: unknown): Record<string, any> {
  if (row && typeof row === "object" && !Array.isArray(row)) {
    return row as Record<string, any>;
  }
  return {};
}

function buildEditValuesForUserForm(row: Record<string, any>): Record<string, any> {
  const address: Record<string, string> = {};
  ADDRESS_FORM_KEYS.forEach((k) => {
    const v = row[k];
    if (v != null && v !== "") address[k] = String(v);
  });
  const rest = { ...row };
  ADDRESS_FORM_KEYS.forEach((k) => {
    delete rest[k];
  });
  return {
    ...rest,
    address,
    address_type: row.address_type ?? "Billing",
  };
}

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
  const [departmentOptions, setDepartmentOptions] = useState<any>([]);
  const [designationOptions, setDesignationOptions] = useState<any>([]);
  const [branchOptions, setBranchOptions] = useState<any>([]);
  const [roleOptions, setRoleOptions] = useState<any>([]);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });
   const [userData, setUserData] = useState<any>(() => {
    const  userValue = JSON.parse(
      localStorage.getItem("userProfileData") || "{}"
    );
    return  userValue || "";
  });
  console.log('localStorage.getItem("userProfileData")',userData);
  
  const router = useRouter();

  const userRow = useMemo(() => normalizeUserRow(initialValues), [initialValues]);
  const editValuesForForm = useMemo(() => {
    const built = buildEditValuesForUserForm(userRow);
    if (
      typeof built.birth_date === "string" ||
      built.birth_date instanceof Date ||
      built.birth_date === null
    ) {
      built.birth_date = formatToCalDate(built.birth_date);
    }
    if (
      typeof built.date_of_joining === "string" ||
      built.date_of_joining instanceof Date ||
      built.date_of_joining === null
    ) {
      built.date_of_joining = formatToCalDate(built.date_of_joining);
    }
    return built;
  }, [userRow]);

  useEffect(() => {
     const getUserData = async () => {
      const ProfileOrderData = await ProfileDataFetch(userToken?.access_token);
      console.log("userData",ProfileOrderData);
      // localStorage.setItem("userProfileData",ProfileOrderData)


    };
//  getUserData()

    const fetchRole = async () => {
      const data = await getRole("", "SDL Role");
      setRoleOptions(data);
    };



    fetchRole();
  }, []);

  const handlesubmit: any = async (values, action) => {
    const formData = new FormData();
    console.log("values===>",values);
    // return false
    
    Object.keys(values).forEach(function (key) {
      const val = values[key];
      console.log(key, "============", val);
      if (
        key === "address" &&
        val &&
        typeof val === "object" &&
        !Array.isArray(val)
      ) {
        Object.entries(val).forEach(([subKey, subVal]) => {
          if (subVal === undefined || subVal === null) return;
          if (String(subVal).trim() === "") return;
          formData.append(subKey, String(subVal));
        });
        return;
      }
      if (val === undefined || val === null) return;
      formData.append(key, val as string | Blob);
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
    
    action.setSubmitting(false);
  };

  const createUser = async (formData) => {
    let customerApiRes: any = await submit_adduser(
        formData,
        userToken?.access_token
      );
      console.log("customerApiRes",customerApiRes);
      
      if (customerApiRes?.msg === "success") {
        showToast(customerApiRes?.data.msg, "success");
        onSubmit
          ? onSubmit()
          : location.reload();
        onClose();
      } else showToast(customerApiRes?.message, "warning");
      if (customerApiRes?.error) showToast(customerApiRes?.error, "error");

   
  };

  const editUser = async (formData) => {


    let customerApiRes: any = await submit_edituser(
      formData,
      userToken?.access_token
    );
    console.log("customerApiRes",customerApiRes);

    
    if (customerApiRes?.msg === "success") {
      showToast(customerApiRes?.data.msg, "success");
      onSubmit ? onSubmit() : location.reload();
      onClose();
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
      
      // { name: "employeeid", label: "Employee id", type: "text", placeholder: "Enter Employee Number",  validate: false, section: "Basic Info", hide: true },
      

      { name: "role_profile_name", label: "Role", type: "autocomplete" ,options:roleOptions, placeholder: "Select Role", validate: true, section: "Role"},
      
      // { name: "report_to", label: "Reports To", type: "autocomplete" ,dependsOn: "role_profile_name", placeholder: "Select Reports to", validate: true, section: "Role"},


      { name: "gender", label: "Gender", type: "select",options:genderOptions, placeholder: "Select Gender", validate: true, section: "More Information"},
      { name: "birth_date", label: "Date Of Birth", type: "date" , placeholder: "Enter Date of Birth", validate: true, section: "More Information"},
      // { name: "birth_date", label: "Date Of Birth", type: "text" , placeholder: "Enter Date of Birth", validate: true, section: "More Information"},
      { name: "date_of_joining", label: "Date Of Joining", type: "date" , placeholder: "Enter Date of Joining", validate: true, section: "More Information", hide: false },

      // { name: "employee_number", label: "Employee Number", type: "text", placeholder: "Enter Employee Number",  validate: false, section: "Company Details", hide: false },
      // { name: "designation", label: "Designation", type: "select",options:designationOptions, placeholder: "Select Designation", validate: false, section: "Company Details", hide: false},
      // { name: "department", label: "Department", type: "select",options:departmentOptions, placeholder: "Select Department", validate: false, section: "Company Details", hide: false},
      // { name: "branch", label: "Branch", type: "select",options:branchOptions, placeholder: "Select Branch", validate: false, section: "Company Details", hide: false },

      {
        name: "address",
        label: "Address",
        type: "address",
        validate: false,
        section: "Address Details",
      },
      {
        name: "address_type",
        label: "Address Type",
        type: "text",
        validate: false,
        section: "Address Details",
        hide: true,
      },
      {
        name: "addressid",
        label: "Address id",
        type: "text",
        validate: false,
        section: "Address Details",
        hide: true,
      },
    ];
    console.log("formFields=>",formFields);

    const formInitialValues: Record<string, unknown> = formFields.reduce(
      (acc, field) => {
        if (field.type === "address") {
          acc[field.name] = {};
        } else if (field.name === "address_type") {
          acc[field.name] = "Billing";
        } else {
          acc[field.name] = "";
        }
        console.log(field, "formInitialValues", field.name);
        return acc;
      },
      {} as Record<string, unknown>
    );


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
      editValues={editValuesForForm}
      mode={operation}
    />
  </DrawerComponent>
);
}

