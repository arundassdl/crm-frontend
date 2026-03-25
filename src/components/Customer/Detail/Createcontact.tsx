import React, { useEffect, useState } from "react";
import {
  CircularProgress,
  Backdrop,
} from "@mui/material";
import { showToast } from "@/components/ToastNotificationNew";
import {
  fetchAddressTypes,
  FetchCitiesForAddressForm,
  FetchCountryList,
  FetchPostalCodeByStateCity,
  FetchStateForCountry,
  get_arealist,
} from "@/services/api/general_apis/customer-form-data-api";
import { useSelector } from "react-redux";
import { get_access_token } from "@/store/slices/auth/token-login-slice";
import { ContactFormValidation } from "@/validation/contactFormValidation";
import {
  createContactWithDetails,
  editContactAndAddress,
} from "@/services/api/customer-api/create-contact";
import { useRouter } from "next/navigation";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import DrawerComponent from "@/components/Common/Form/Drawer/DrawerComponent";
import SelectCustomerField from "@/components/Customer/SelectCustomerField";
import { getAddressTypes, getCountries, getTerritories } from "@/components/Common/Form/fetchCommonData";

interface FormValueType {
  first_name: string;
  // middle_name: string;
  last_name: string;
  email_id: string;
  phone: string;
  // mobile_no: string;
  address_title: string;
  address_line1: string;
  address_line2: string;
  address_type: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  territory: string;
  customer_name: string;
}

const formInitialValues: FormValueType = {
  first_name: "",
  // middle_name: "",
  last_name: "",
  email_id: "",
  phone: "",
  // mobile_no: "",
  address_title: "",
  address_line1: "",
  address_line2: "",
  address_type: "",
  country: "",
  state: "",
  city: "",
  pincode: "",
  territory: "",
  customer_name: "",
};

interface AddEditContactDrawerProps {
  link_name?: string;
  initialValues: FormValueType;
  open: boolean;
  onClose: () => void;
  operation: string;
  onSubmit?: () => void;
}

export default function AddEditConctactDrawer({
  link_name,
  initialValues,
  open,
  onClose,
  operation,
  onSubmit,
}: AddEditContactDrawerProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const TokenFromStore: any = useSelector(get_access_token);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [addresstypes, setAddressTypes] = useState<any>([]);
  const [countries, setCountries] = useState<any>([]);
  const [territories, setTerritories] = useState<any>([]);
  const [states, setStates] = useState<any>([]);
  const [cities, setCities] = useState<any>([]);
  const [pincodes, setPincodes] = useState<any>([]);
  const [err, setErr] = useState<boolean>(false);

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

  /** Fetch States when Country changes */
  useEffect(() => {
    if (!initialValues?.country) return;
    const getStateData = async () => {
      const stateData = await FetchStateForCountry(
        initialValues?.country,
        userToken?.access_token
      );
      if (stateData?.length > 0) {
        const stateArrys = stateData.map((item: any) => ({
          value: item.name,
          label: item.name,
        }));
        setStates(stateArrys);
      } else {
        setStates([]);
      }
    };
    getStateData();
  }, [initialValues?.country]);

  /** Fetch Cities when State changes */
  useEffect(() => {
    if (!initialValues?.state) return;
    const getCityData = async () => {
      const getCitiesFromState = await FetchCitiesForAddressForm(
        initialValues?.state,
        userToken?.access_token
      );
      if (getCitiesFromState?.length > 0) {
        const cityArrys = getCitiesFromState.map((item: any) => ({
          value: item.name,
          label: item.name,
        }));
        setCities(cityArrys);
      } else {
        setCities([]);
      }
    };
    getCityData();
  }, [initialValues?.state]);

  /** Fetch Pincodes when City changes */
  useEffect(() => {
    if (!initialValues?.city) return;
    const getPincodeData = async () => {
      const getPincodesFromStateCity = await FetchPostalCodeByStateCity(
        initialValues?.state,
        initialValues?.city,
        userToken?.access_token
      );
      if (getPincodesFromStateCity?.length > 0) {
        const pinArrys = getPincodesFromStateCity.map((item: any) => ({
          value: item.label,
          label: item.label,
        }));
        setPincodes(pinArrys);
      } else {
        setPincodes([]);
      }
    };
    getPincodeData();
  }, [initialValues?.city]);


  useEffect(() => {
    const getAddressTypeData = async () => {
      const getPincodesFromStateCity = await fetchAddressTypes(
        userToken?.access_token
      );
      if (getPincodesFromStateCity?.length > 0) {
        const pinArrys = getPincodesFromStateCity.map((item: any) => ({
          value: item,
          label: item,
        }));
        setAddressTypes(pinArrys);
      } else {
        setAddressTypes([]);
      }
    };
    getAddressTypeData();
  }, []);

  useEffect(() => {
    setTimeout(() => setLoading(false), 2000); // Simulating API call
  }, []);

  const handlesubmit: any = async (values, action) => {   
      const formData = new FormData();
      Object.keys(values).forEach(function (key) {
        console.log(key, "============", values[key]);
        formData.append(key, values[key]);
      });
      if (link_name) {
        formData.append("company_name", link_name ?? "");
      }
      // return false;
      if (operation == "New") {
        action.resetForm();
        createContact(formData);
      } else if (operation == "Edit") {
        editContact(formData);
      }
      // action.resetForm();
      onClose();
      action.setSubmitting(false);
  };

  const createContact = async (formData) => {
    console.log("formData HERE ", formData);

    let customerApiRes: any = await createContactWithDetails(
      formData,
      userToken?.access_token
    );
    if (customerApiRes?.success) {
      showToast(customerApiRes?.message, "success");
      onSubmit ? onSubmit() : router.push("/contacts/detail/" + customerApiRes?.contact?.name);
    } else showToast(customerApiRes?.message, "warning");

    if (customerApiRes?.error) showToast(customerApiRes?.error, "error");
  };

  const editContact = async (formData) => {
    console.log("formData edit", formData);

    let customerApiRes: any = await editContactAndAddress(
      formData.get("name"),
      formData,
      userToken?.access_token
    );

    if (customerApiRes?.success) {
      showToast(customerApiRes?.message, "success");
      onSubmit ? onSubmit() : location.reload();
    } else showToast(customerApiRes?.message, "warning");
    if (customerApiRes?.error) showToast(customerApiRes?.error, "error");
  };

  if (loading) {
    return (
      <Backdrop
        open={loading}
        sx={{
          color: "#000", // Set text color to black
          zIndex: 9999,
          backgroundColor:
            "var(--mui-palette-secondary-lightOpacity) !important", // Light white overlay
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }
 
  
  const handleSubmit = (values,action) => {   
    // Call API or handle form submission    
    handlesubmit(values, action);
  }; 
  console.log("link_namelink_namelink_name",link_name);
  
  const contactFields: FieldConfigNew[] = [
    { name: "first_name", label: "First Name ", type: "text", placeholder: "Enter First Name", validate: true, section: "Contact Details" },
    { name: "last_name", label: "Last Name", type: "text", placeholder: "Enter Full Name", validate: false, section: "Contact Details" },
    { name: "email_id", label: "Email", type: "email", placeholder: "Enter Email", validate: true, section: "Contact Details" },
    { name: "phone", label: "Phone Number", type: "number", placeholder: "Enter Phone Number",  validate: true, section: "Contact Details" },
    // { name: "mobile_no", label: "Mobile No", type: "number", placeholder: "Enter Mobile Number",  validate: false, section: "Contact Details" },
    { name: "is_primary_contact", label: "Is Primary Contact", type: "checkbox", placeholder: "Select",  validate: false, section: "Contact Details" },
    { name: "company_name", label: "Account", type: "custom", component: SelectCustomerField,componentProps: { onCustomerSelect: (customer: any) => {console.log("Selected Customer qqqq:", customer)},}, placeholder: "Select Customer", validate: false, section: "Contact Details" ,hideInEdit:true,value:link_name},
  ];
  
  const addressFields: FieldConfigNew[] = [
    { name: "address_title", label: "Address Title", type: "text", placeholder: "Enter Address Title", validate: true, section: "Address Details" },
    { name: "address_type", label: "Address Type", type: "select", options: addresstypes, validate: false, section: "Address Details"     },
    { name: "address_line1", label: "Address Line 1", type: "textarea", placeholder: "Enter Address Line 1", validate: true, section: "Address Details" },
    { name: "address_line2", label: "Address Line 2", type: "textarea", placeholder: "Enter Address Line 2", validate: false, section: "Address Details" },  
    // Address-dependent fields (conditionally required)    
    { name: "country", label: "Country", type: "autocomplete",options:countries, placeholder: "Select Country", validate: true, section: "Address Details" },
    { name: "state", label: "State", type: "autocomplete",dependsOn: "country", placeholder: "Select State", validate: true, section: "Address Details" },
    { name: "city", label: "City", type: "autocomplete",dependsOn: "state", placeholder: "Select City", validate: true, section: "Address Details" },
    { name: "pincode", label: "Pincode", type: "autocomplete",dependsOn: "city", placeholder: "Select Pincode", validate: true, section: "Address Details" },
    { name: "territory", label: "Territory",type: "autocomplete",options:territories, placeholder: "Select Territory", validate: true, section: "Address Details" },
  ];  
  
  // Combine both contact & address fields
  const combinedFields = [...contactFields, ...addressFields];
  console.log("countries",countries);

  const actInitialValues = combinedFields.reduce((acc, field) => {
    acc[field.name] = "";
    return acc;
  }, {});   

  return (
  <DrawerComponent open={open} onClose={onClose} title={`${operation} Contact`}>
    <CustomForm fields={combinedFields} initialValues={actInitialValues} onSubmit={handleSubmit} onClose={onClose} editValues={initialValues} mode={operation} /> 
  </DrawerComponent>
  );
}
