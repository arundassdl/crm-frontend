import React, { useEffect, useState } from "react";
import { showToast } from "@/components/ToastNotificationNew";
import { 
  editCustomerAndAddress,
} from "@/services/api/customer-api/create-customer";
import { useRouter } from "next/navigation";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import { getAddressTypes, getCountries, getIndustry, getNoOfEmployees, getTerritories } from "@/components/Common/Form/fetchCommonData";
 
import { ProfileDataFetch } from "@/services/api/general_apis/ProfilePageApi/profile-page-api";
import SelectCustomerField from "../Customer/SelectCustomerField";
import CustomerSearch from "../Customer/SearchCustomer";
import CommonSearchField from "../Common/CommonSearchField";
import { CreateDealWithDetails } from "@/services/api/customer-api/create-deal";
import { convertDate, formatCalDate } from "@/services/api/common-erpnext-api/libs/utils";

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
  const [selectedData, setSelectedData] = useState<any>([]);

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
    Object.keys(values).forEach(function (key) {
      console.log(key, "============", values[key]);
      if(key === "close_date" && values["close_date"]!=""){
        values[key] = formatCalDate(values[key])
      }
      formData.append(key, values[key]);
    });
    console.log("values===>",values);
    // return false;
    // return false;
    if (operation == "New") {      
      createDeal(formData);
    } else if (operation == "Edit") {
      editCustomer(formData);
    }
    // action.resetForm();
    onClose();
    action.setSubmitting(false);
  };

  const createDeal = async (formData) => {
    console.log("formData HERE ", formData.get("first_name"));
    
    let customerApiRes: any = await CreateDealWithDetails(
      "CRM Deal",
      formData,
      userToken?.access_token,
      true
    );
    console.log("customerApiRes",customerApiRes);
    
    if (customerApiRes?.success) {
      showToast(customerApiRes?.message, "success");
      onSubmit
        ? onSubmit()
        : router.push("/deals/detail/" + customerApiRes?.customer?.name);
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
  const [dealStatus, setDealStatus] = useState<any>([]);
  useEffect(() => {
    const fetchData = async () => {
      const data = await getIndustry("", "CRM Industry");
      setIndustryOptions(data);
    };
    const fetchStatusData = async () => {
      const status_data = await getIndustry("", "CRM Deal Status","CRM Deal");
      console.log("status data",status_data);
      
      setDealStatus(status_data);
    };

    fetchData();
    fetchStatusData();
  }, []);
     
   

  const custypeOptions = [
    { label: "Individual", value: "Individual" },
    { label: "Company", value: "Company" },
    // { label: "Partnership", value: "Partnership" },
  ];
    const [organization, setOrganization] = useState<any>("");

  const formFields: FieldConfigNew[] = [
    
      { name: "organization", label: "Account", type: "custom", component: SelectCustomerField,componentProps: { onCustomerSelect: (customer: any) => {console.log("Selected organization qqqq:", customer);setOrganization(customer?.value)},}, placeholder: "Select Account", validate: false, section: "Deal Information",value:organization },
      { name: "close_date", label: "Close Date", type: "date", placeholder: "Select Date", section: "Deal Information" },
       { name: "probability", label: "Probability (%)", type: "text", placeholder: "Enter probability", value:"0.00",section: "Deal Information" },

      { name: "status", label: "Status", type: "autocomplete", options: dealStatus, placeholder: "Select Status", validate: true, section: "Deal Information" },
       { 
        name: "contact", 
        label: "Contact", 
        type: "custom", 
        component: CommonSearchField,
        componentProps: {
          onUserSelect: (data: any) => {
            console.log("Selected Customer qqqq11:", data)
            if(data!=undefined){
            setSelectedData(data)
            return true
            }
          },
          doctype:"Contact", 
          label:"Contact"
        }, 
        placeholder: "Select Contact"
        , validate: false, 
        section: "Contacts", 
        value:selectedData?.name
    },
       //Primary Contact Details
      { name: "first_name", label: "First Name", type: "text", placeholder: "Enter First Name",  validate: (values) => values.customer_type === "Individual", section: "Contacts",sectiontype:"Accoridon",value:selectedData?.first_name,disable:true },
      { name: "last_name", label: "Last Name", type: "text", placeholder: "Enter Last Name",  validate: (values) => values.customer_type === "Individual", section: "Contacts",sectiontype:"Accoridon" ,value:selectedData?.last_name},
      { name: "mobile_no", label: "Phone", type: "mobile_no", placeholder: "Enter Primary Mobile No",  validate: (values) => values.customer_type === "Individual", section: "Contacts",sectiontype:"Accoridon",value:selectedData?.mobile_no },
      { name: "email", label: "Email", type: "email", placeholder: "Enter Email", validate: (values) => values.customer_type === "Individual", section: "Contacts" ,sectiontype:"Accoridon" ,value:selectedData?.email_id},
      

      //Lead Details
      { name: "lead", label: "Lead", type: "custom", component: CommonSearchField,
        componentProps: {
          onUserSelect: (data: any) => {
            console.log("Selected Lead qqqq11:", data)
            // setUserData(data)
          },
          doctype:"CRM Lead", 
          label:"Lead"
        },  placeholder: "Select Lead", validate: false, section: "Lead Details",sectiontype:"Accoridon"},
        { name: "lead_name", label: "Lead name", type: "text", placeholder: "Lead name", validate: false, section: "Lead Details",sectiontype:"Accoridon"},
        { name: "source", label: "Source", type: "custom", component: CommonSearchField,
        componentProps: {
          onUserSelect: (data: any) => {
            console.log("Selected Lead qqqq11:", data)
            // setUserData(data)
          },
          doctype:"CRM Lead Source", 
          label:"Source"
        },  placeholder: "Select Source", validate: false, section: "Lead Details",sectiontype:"Accoridon"},
        // Organization Details
      { name: "organziation_name", label: "Organization Name", type: "text", placeholder: "Enter Organization Name",  validate: (values) => values.customer_type === "Individual", section: "Organization Details",sectiontype:"Accoridon" },

      { name: "territory", label: "Territory", type: "select",options:territories, placeholder: "Enter territory", validate: false, section: "Organization Details"},
       { name: "no_of_employees", label: "No. of Employees", type: "select",options:getNoOfEmployees(), placeholder: "Select", validate: false, section: "Organization Details"},

      { name: "industry", label: "Industry", type: "select",options:industryOptions, placeholder: "Enter industry", validate: false, section: "Organization Details"},
      { name: "job_title", label: "Job Title", type: "text", placeholder: "Job Title", validate: false, section: "Organization Details"},
      { name: "deal_owner", label: "Deal Owner", type: "text", placeholder: "Deal Owner", validate: false, section: "Organization Details",value:userData?.email,hide:true},

     
      
     
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
    title={`${operation} Deal`}
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
