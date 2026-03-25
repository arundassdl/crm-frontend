"use client";

import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Grid,
  Button,
  Switch,
  Box,
  IconButton,
  Stack,
  List,
  ListItem,
  Chip,
  Divider,
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BuildIcon from "@mui/icons-material/Build";
import { useEffect, useState } from "react";
import CustomAvatar from "@/@core/components/mui/Avatar";
import { CONSTANTS } from "@/services/config/app-config";
import Link from "@/components/Link";
// import EmailFields from "./EmailFields";
import FormatDate from "@/libs/FormatDate";
// import PhoneFields from "./PhoneFields";
import EditableField from "@/components/Common/EditableField";
import { updateResource } from "@/services/api/common-erpnext-api/create-edit-api";
import SelectCustomerField from "@/components/Customer/SelectCustomerField";
import SelectCustomer from "@/components/Customer/SelectCustomer";
import { getAddressTypes, getCountries, getIndustry, getNoOfEmployees, getTerritories, getRole } from "@/components/Common/Form/fetchCommonData";
import {
  FetchCitiesForAddressForm,
  FetchPostalCodeByStateCity,
  FetchStateForCountry,
} from "@/services/api/general_apis/customer-form-data-api";

import { submit_adduser, submit_edituser } from "@/services/api/users/users-api";

const UserOverview = (slug) => {
  let [customerData, setCustomerData] = useState<any>([]);
  let [linkData, setLinkData] = useState<any>([]);
  let [addressData, setAddressData] = useState<any>({});
  let [cusTypeOptions, setCusTypeOptions] = useState<any>([
    "Individual",
    "Company",
    "Partnership",
  ]);

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const [operation, setOperation] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>([]);
  const [profile, setProfile] = useState<any>([]);
  const [doctype, setDoctype] = useState<any>("");

  const [addresstypes, setAddressTypes] = useState<any>([]);
  const [countries, setCountries] = useState<any>([]);
  const [territories, setTerritories] = useState<any>([]);
  const [departmentOptions, setDepartmentOptions] = useState<any>([]);
  const [designationOptions, setDesignationOptions] = useState<any>([]);
  const [branchOptions, setBranchOptions] = useState<any>([]);
  const [roleOptions, setRoleOptions] = useState<any>([]);
  const [genderOptions, setGenderOptions] = useState<any>([]);
  const [states, setStates] = useState<any>([]);
  const [cities, setCities] = useState<any>([]);
  const [pincodes, setPincodes] = useState<any>([]);


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

    const fetchRole = async () => {
      const data = await getRole("", "SDL Role");
      setRoleOptions(data);
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



    getCountryData();
    getTerritoryData();
    getAddressTypeData();
    fetchRole();
    fetchGender();
    fetchDeparment();
    fetchDesignation();
    fetchBranch();

  }, [])


  const fetchStates = async (country: string) => {
    const result = await FetchStateForCountry(country, userToken?.access_token);
    if (result?.length > 0) {
      const data = result.map((item: any) => ({
        value: item.name,
        label: item.name,
      }));
      setStates(data);
    } else {
      setStates([]);
    }
  };

  const fetchCities = async (state: string) => {
    const result = await FetchCitiesForAddressForm(
      state,
      userToken?.access_token
    );
    if (result?.length > 0) {
      const data = result.map((item: any) => ({
        value: item.name,
        label: item.name,
      }));
      setCities(data);
    } else {
      setCities([]);
    }
  };

  const fetchPincodes = async (state: string, city: string) => {
    if (!state || !city) setPincodes([]); // Prevent API call if state/city is empty
    try {
      const result = await FetchPostalCodeByStateCity(
        state,
        city,
        userToken?.access_token
      );
      if (result?.length > 0) {
        const data = result?.map((item: any) => ({
          value: item.label,
          label: item.label,
        }))
        setPincodes(data);
      } else {
        setPincodes([]);
      }
    } catch (error) {
      console.error("Error fetching pincodes:", error);
      setPincodes([]);
    }
  };

  console.log("slug?.record 54", slug?.detail);

  useEffect(() => {
    setCustomerData(slug?.detail);
    
    console.log("slug?.record", slug?.detail);
    console.log("customerData", customerData.first_name);
    fetchStates(slug?.detail?.country)
    fetchCities(slug?.detail?.state)
    fetchPincodes(slug?.detail?.state,slug?.detail?.city)

    setProfile({
      first_name: slug?.detail?.first_name,
      last_name: slug?.detail?.last_name,
      email: slug?.detail?.email,
      mobile_no : slug?.detail?.mobile_no,
      address_line1 :  slug?.detail?.address_line1,
      address_line2 : slug?.detail?.address_line2,
      address_title : slug?.detail?.address_title,
      address_type : slug?.detail?.address_type,
      addressid : slug?.detail?.addressid,
      birth_date : slug?.detail?.birth_date,
      branch : slug?.detail?.branch,
      city : slug?.detail?.city,
      country : slug?.detail?.country,
      creation : slug?.detail?.creation,
      date_of_joining : slug?.detail?.date_of_joining,
      department : slug?.detail?.department,
      designation : slug?.detail?.designation,

      employee_number : slug?.detail?.employee_number,
      employeeid : slug?.detail?.employeeid,
      gender : slug?.detail?.gender,
      modified : slug?.detail?.modified,
      parent :  slug?.detail?.parent,
      pincode : slug?.detail?.pincode,
      role_profile_name : slug?.detail?.role_profile_name,
      role_name:slug?.detail?.role_name,
      state : slug?.detail?.state,
      status : slug?.detail?.status,
      territory : slug?.detail?.territory,

    });

  }, [slug]);

  const CloseDialog = () => {
    setSelectedRow([]);
    setOpen(false);
  };

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'longOffset'
  });

  const handleSave = async (field, value) => {
    const updatedData = {
      [field]: value,
    };
    customerData[field] = value
    console.log(customerData)

    const formData = new FormData();
    // console.log("values===>",values);
    // return false
    
    Object.keys(customerData).forEach(function (key) {
      console.log(key, "============", customerData[key]);
      if (key == "birth_date" || key == "date_of_joining") {
        let input = customerData[key]; // MM/DD/YYYY format
        let date = new Date(input + " 00:00:00"); // Local time is used
        console.log(date.toString());
        // console.log(formatter.format(date));
        formData.append(key, date.toString());
      } else {
        formData.append(key, customerData[key]);  
      }
      
    });

    console.log(formData, 'date.toString()');

    let customerApiRes: any = await submit_edituser(
      formData,
      userToken?.access_token
    );

    console.log("customerApiRes",customerApiRes);
    // if (!customerApiRes || !customerApiRes?.success) {
    //   throw new Error("Failed to update contact details.")
    // } 

    console.log("saved succesfully");
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAddress = async (field:any, value:any,name:any) => {
    const updatedData = {
      [field]: value,
      name: name,
      // addressid: profile?.addressid, // Assuming you want to keep the address ID
    };
    const updatedContact = await updateResource(
      "Address",
      name,
      updatedData,
      userToken?.access_token
    );

    if (!updatedContact || !updatedContact.success) {
      throw new Error("Failed to update contact details.");
    }
    console.log("saved succesfully");
    setProfile((prev) => ({ ...prev, [field]: value }));
 
  };

  return (
    <Box sx={{}}>
      <Card sx={{ boxShadow: "none", p: 8 }} className="border">
        <Grid container spacing={12}>
          {/* Profile Card */}
          <Grid item xs={12} sm={3} md={3}>
            <Card
              sx={{
                textAlign: "center",
                padding: "50px 10px",
                border: "2px solid var(--mui-palette-primary-main)",
                width:"100%"
              }}
            >
               <CustomAvatar
                alt={customerData?.name}
                src={`${CONSTANTS.API_BASE_URL}${customerData?.image}`}
                size={120}
                variant="circular"
                sx={{
                  width: 120,
                  height: 120,
                  margin: "auto",
                  //   backgroundColor: "#E0F2F1",
                }}
              />
              <Typography variant="h6" mt={3}>

                {customerData?.first_name}
              </Typography>
            </Card>
            
          </Grid>
          {/* Details Section */}
          <Grid item spacing={2} xs={12} sm={6} md={9}>
            <Grid container spacing={2} direction="row" rowSpacing={2}>
                  <Grid item xs={12} sm={12}>
                    <Typography variant="h6" sx={{ mb: 4 }}>
                      Basic information
                    </Typography>
                    <Divider sx={{borderBottomWidth:"2px", mb: 4}} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="First Name"
                      field="first_name"
                      value={profile?.first_name}
                      onSave={handleSave}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Last Name"
                      field="last_name"
                      value={profile?.last_name}
                      onSave={handleSave}
                    />
                  </Grid>
                   <Grid item xs={12} sm={6}>
                    <Box
                      display="flex"
                      alignItems="flex-start"
                      gap={5}
                      flexDirection="row"
                      sx={{ mb: 4 }}
                    >
                      <Typography
                        className="font-normal text-1xl"
                        color={"GrayText"}
                      >
                        Email:
                      </Typography>
                      <Typography color={"var(--mui-palette-secondary-dark)"} sx={{ pl: 8 }}>{profile?.email}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Mobile No"
                      field="mobile_no"
                      value={profile?.mobile_no}
                      onSave={handleSave}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Employee Number"
                      field="employee_number"
                      value={profile?.employee_number}
                      onSave={handleSave}
                    />
                  </Grid>
            </Grid>
            <Grid container spacing={2} direction="row" rowSpacing={2}>
                <Grid item xs={12} sm={12}>
                    <Typography variant="h6" sx={{ mb: 4 }}>
                      Role information
                    </Typography>
                    <Divider sx={{borderBottomWidth:"2px", mb: 4}} />
                  </Grid>
                <Grid item xs={12} sm={6}>
                <Box
                  display="flex"
                  alignItems="flex-start"
                  gap={5}
                  flexDirection="row"
                  sx={{ mb: 4 }}
                >
                  <Typography
                    className="font-normal text-1xl"
                    color={"GrayText"}
                  >
                    Role:
                  </Typography>
                  <Typography color={"var(--mui-palette-secondary-dark)"} sx={{ pl: 8 }}>{profile?.role_name}</Typography>
                </Box>
                </Grid>
                 {/*<Grid item xs={12} sm={6}>
                    <EditableField
                      label="Role"
                      field="role_profile_name"
                      type="select"
                      options={roleOptions}
                      value={profile?.role_name}
                      onSave={handleSave}
                    />
                  </Grid>*/}
            </Grid>
            <Grid item xs={12} sm={6} md={12}>
              <Typography variant="h6" sx={{ mb: 4 }}>
                More Information
              </Typography>
              <Divider sx={{borderBottomWidth:"2px", mb: 12}} />
            </Grid>
            <Grid container spacing={2} direction="row" rowSpacing={2}>
                 <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Gender"
                      field="gender"
                      type="select"
                      options={genderOptions}
                      value={profile?.gender}
                      onSave={handleSave}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Date Of Birth"
                      field="birth_date"
                      type="date"
                      value={profile?.birth_date}
                      onSave={handleSave}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Date Of Joining"
                      field="date_of_joining"
                      type="date"
                      value={profile?.date_of_joining}
                      onSave={handleSave}
                    />
                  </Grid>
            </Grid>
            <Grid item xs={12} sm={6} md={12}>
              <Typography variant="h6" sx={{ mb: 4 }}>
                Company Details
              </Typography>
              <Divider sx={{borderBottomWidth:"2px", mb: 12}} />
            </Grid>
            <Grid container spacing={2} direction="row" rowSpacing={2}>
                 <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Designation"
                      field="designation"
                      type="select"
                      options={designationOptions}
                      value={profile?.designation}
                      onSave={handleSave}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Department"
                      field="department"
                      type="select"
                      options={departmentOptions}
                      value={profile?.department}
                      onSave={handleSave}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Branch"
                      field="branch"
                      type="select"
                      options={branchOptions}
                      value={profile?.branh}
                      onSave={handleSave}
                    />
                  </Grid>
            </Grid>
            <Grid item xs={12} sm={6} md={12}>
              <Typography variant="h6" sx={{ mb: 4 }}>
                Address Details
              </Typography>
              <Divider sx={{borderBottomWidth:"1px", mb: 12}} />
            </Grid>
            <Grid container spacing={2} direction="row" rowSpacing={2}>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Address Title"
                      field="address_title"
                      value={profile.address_title}
                      name={profile?.addressid}
                      onSave={handleSaveAddress}
                    />
                  </Grid> 
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Address Type"
                      field="address_type"
                      type="select"
                      options={addresstypes}
                      value={profile?.address_type}
                      name={profile?.addressid}
                      onSave={handleSaveAddress}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Address Line1"
                      field="address_line1"
                      type= "textarea"
                      value={profile?.address_line1}
                      name={profile?.addressid}
                      onSave={handleSaveAddress}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Address Line2"
                      field="address_line2"
                      type= "textarea"
                      value={profile?.address_line2}
                      name={profile?.addressid}
                      onSave={handleSaveAddress}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Country"
                      field="country"
                      type="select"
                      options={countries}
                      value={profile?.country}
                      name={profile?.addressid}
                      onSave={handleSaveAddress}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="state"
                      field="state"
                      type="select"
                      options={states}
                      value={profile?.state}
                      name={profile?.addressid}
                      onSave={handleSaveAddress}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <EditableField
                      label="City"
                      field="city"
                      type="select"
                      options={cities}
                      value={profile?.city}
                      name={profile?.addressid}
                      onSave={handleSaveAddress}
                    />
                  </Grid>

                   <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Pin Code"
                      field="pincode"
                      type="select"
                      options={pincodes}
                      value={profile?.pincode}
                      name={profile?.addressid}
                      onSave={handleSaveAddress}
                    />
                  </Grid>

                   <Grid item xs={12} sm={6}>
                    <EditableField
                      label="Territory"
                      field="territory"
                      type="select"
                      options={territories}
                      value={profile?.territory}
                      name={profile?.addressid}
                      onSave={handleSaveAddress}
                    />
                  </Grid>



                    


            </Grid>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default UserOverview;

