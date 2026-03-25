import React, { useEffect, useState } from "react";
import {
  Formik,
  Form as FormikForm,
  Field,
  ErrorMessage,
  useFormik,
} from "formik";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
} from "@mui/material";
import { GridCloseIcon } from "@mui/x-data-grid";
import { showToast } from "../ToastNotificationNew";
import { AddEditAddresses } from "@/services/api/my-company/manage-address-api";
import { FetchCitiesForAddressForm, FetchPostalCodeByStateCity, FetchStateForAddressForm, get_arealist } from "@/services/api/general_apis/customer-form-data-api";
import { useSelector } from "react-redux";
import { get_access_token } from "@/store/slices/auth/token-login-slice";
import { CustomerFormValidation } from "@/validation/customerFormValidation";
import { AddEditCustomer } from "@/services/api/contact-api/manage-customer-api";
import { Option } from "@/types/customer";


interface CustomerDetail {
  customer_name: string
  customer_type: string
  contact_emailid: string
  contact_phonenumber: string
  address: string
  address_line1: string
  address_line2: string
  country: string
  state: string
  city: string
  pincode: string
}


interface AddEditCustomerPopupProps {
  open: boolean;
  onClose: () => void;
  // detailData: CustomerDetail;
  onCustomerSelect: (customer: Option | null) => void;
  onSubmitForm: (newCustomer: Option) => void; 
}

export default function AddEditCustomerPopup({ open, onClose,onCustomerSelect,onSubmitForm }: AddEditCustomerPopupProps) {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_type: "",
    firstName: "",
    lastName: "",
    password: "",
  });
  const [companyData, setCompanyData] = useState<any>([]);
  const [userData, setuserData] = useState<any>([]);
  const [initialValues, setInitialValues] = useState({
    customer_name: "",
    contact_emailid: "",
    customer_type: "",
    contact_phonenumber: "",
    address: "",
    address_line1: "",
    address_line2: "",
    country: "",
    state: "",
    city: "",
    pincode: "",  
    owner:userData?.email,
    customerarea:"",
  });
   const [userToken, setUserToken] = useState<any>(() => {
      const initialValue = JSON.parse(
        localStorage.getItem("AccessTokenData") || "{}"
      );
      return initialValue || "";
    });
  
      const TokenFromStore: any = useSelector(get_access_token);
    
      let [selectedCity, setSelectedCity] = useState<any>("");
      let [selectedStates, setSelectedStates] = useState<any>("");
      let [city, setCity] = useState<any>([]);
      let [state, setState] = useState<any>([]);
      let [selectedPincode, setSelectedPincode] = useState<any>("");
      let [pincode, setPincode] = useState<any>([]);
      const [err, setErr] = useState<boolean>(false);
      let [stateArray, setStateArray] = useState<any>([]);
      let [area, setArea] = useState<any>([]);
      
     
 
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSave = () => {
    console.log("New User Data:", formData);
    // Add your API call here to save the user
    onClose(); // Close the popup after saving
  };
 useEffect(() => {
        if (typeof window !== 'undefined') {
            if (localStorage.getItem('userProfileData') != 'undefined') {
                console.log("userdata 1", JSON.parse(localStorage.getItem('userProfileData') || '[]'));

                // alert(localStorage.getItem('userData'))
                setuserData(JSON.parse(localStorage.getItem('userProfileData') || '[]'))
            }
        }
    }, []);
  useEffect(() => {     
      const getStateData: any = async () => {
        const stateData: any = await FetchStateForAddressForm(
          TokenFromStore?.token
        );
        console.log(stateData, "stateData", stateData?.length);
        if (stateData?.length > 0) {
          let stateValues: any = stateData
            .map((item: any) => item?.name)
            .filter((item: any) => item !== null);
  
          const stateArrys = [{ value: "", label: "" }];
          stateData.map((item: any) => {
            stateArrys.push({ value: item.name, label: item.name });
          });
  
          setStateArray(stateArrys);
          setState(stateValues);
        } else {
          setErr(!err);
        }
      };
       
    }, []);
  
    useEffect(() => {
      const getStateData: any = async () => {
        const stateData: any = await FetchStateForAddressForm(
          TokenFromStore?.token
        );
        if (stateData?.length > 0) {
          let stateValues: any = stateData
            .map((item: any) => item?.name)
            .filter((item: any) => item !== null);
          const stateArrys = [{ value: "", label: "" }];
          stateData.map((item: any) => {
            stateArrys.push({ value: item.name, label: item.name });
          });
  
          setStateArray(stateArrys);
        } else {
          setErr(!err);
        }
      };
      const getAreaData: any = async () => {
                  const areaData: any = await get_arealist(
                      userToken?.access_token
                  );
                  console.log(areaData, 'areaData', areaData?.length);
                  if (areaData?.length > 0) {
                      let areaValues: any = areaData
                          .map((item: any) => item?.name)
                          .filter((item: any) => item !== null);
      
                      const areaArrys = [{ value: "", label: "" }]
                      areaData
                          .map((item: any) => {
                              areaArrys.push({ value: item.name, label: item.name })
                          })
      
                      setArea(areaArrys);
                  } else {
                      setErr(!err);
                  }
              };

      getAreaData();
      getStateData();
    }, []);
  
    const handleSelectedState: any = async (stateValue: string) => {
      setSelectedCity("");
      setCity([]);
      setPincode([]);
      const getCitiesFromState: any = await FetchCitiesForAddressForm(
        stateValue,
        TokenFromStore?.token
      );
      if (getCitiesFromState?.length > 0) {
        let citiesValues: any = getCitiesFromState
          .map((item: any) => item.name)
          .filter((item: any) => item !== null);
  
        const cityArrys = [{ value: "", label: "" }];
        getCitiesFromState.map((item: any) => {
          cityArrys.push({ value: item.name, label: item.name });
        });
  
        setCity(cityArrys);
      }
      setSelectedStates(stateValue);
    };
  
    const handleSelectedPincode: any = async (cityValue: string) => {
      setPincode([]);
      const getPincodesFromStateCity: any = await FetchPostalCodeByStateCity(
        selectedStates,
        cityValue,
        TokenFromStore?.token
      );
      if (getPincodesFromStateCity?.length > 0) {
        let pincodesValues: any = getPincodesFromStateCity
          .map((item: any) => item.label)
          .filter((item: any) => item !== null);
  
        const pinArrys = [{ value: "", label: "" }];
        getPincodesFromStateCity.map((item: any) => {
          pinArrys.push({ value: item.label, label: item.label });
        });
  
        setPincode(pinArrys);
      }
    };

  const formik = useFormik({
      initialValues:  initialValues,
      enableReinitialize: true,
      validationSchema: CustomerFormValidation,
      onSubmit: async (values, { resetForm, setSubmitting }) => {
          
        // values.company_name = companyData?.name;
        // values.is_your_company_address = true;
        const requestParams = {
          value: { ...values },
          token: userToken?.access_token,
        };
        console.log("requestParams", requestParams);
        let update_cus = await AddEditCustomer(requestParams);
        console.log("update_cus", update_cus);
        if (update_cus?.msg === "success") {
          console.log("update_cus?.data", update_cus?.data);
          console.log("update_cus?.data?.name", update_cus?.data?.customer?.name);
          const appendedObject = {
            id: update_cus?.data?.customer?.id,
            name: update_cus?.data?.customer?.name,
            email: update_cus?.data?.customer?.email_id,
            phone: update_cus?.data?.customer?.mobile_no,
            addresses: {address_id: update_cus?.data?.address?.address_id,address_line1: update_cus?.data?.address?.address_line1,address_type: update_cus?.data?.address?.address_type, city: update_cus?.data?.address?.city,customerType: update_cus?.data?.address?.customer_type,email: update_cus?.data?.address?.email_id,phone: update_cus?.data?.address?.phone,pincode:update_cus?.data?.address?.pincode,state: update_cus?.data?.address?.state},
        };
          onCustomerSelect(appendedObject); 
          onSubmitForm(appendedObject);
          resetForm();
          onClose();
          setSubmitting(false); 
          showToast(update_cus?.data?.msg, "success");
        } else {
          setSubmitting(false); 
          showToast(update_cus?.error, "error");
        }
        setTimeout(() => {
          // dispatch(fetchBillingAddress(userToken?.access_token));
          // dispatch(fetchprofileDataThunk(userToken?.access_token));
        }, 1000);
      },
    });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
       <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col gap-5 mbe-5"
      >          
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} >
          <Typography variant="h4">Create New Customer</Typography>
          {/* Close button */}
          <IconButton onClick={onClose} aria-label="close">
            <GridCloseIcon
             />
          </IconButton>
        </DialogTitle>
          <DialogContent>
          <Grid container spacing={5} mt={2}>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="customer_name"
              name="customer_name"
              label="Customer Name "
              value={formik.values.customer_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.customer_name &&
                Boolean(formik.errors.customer_name)
              }
              helperText={
                formik.touched.customer_name &&
                typeof formik.errors.customer_name == "string"
                  ? formik.errors.customer_name
                  : " "
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="contact_emailid"
              name="contact_emailid"
              label="Email "
              value={formik.values.contact_emailid}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.contact_emailid &&
                Boolean(formik.errors.contact_emailid)
              }
              helperText={
                formik.touched.contact_emailid &&
                typeof formik.errors.contact_emailid == "string"
                  ? formik.errors.contact_emailid
                  : " "
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="contact_phonenumber"
              name="contact_phonenumber"
              label="Mobile"
              value={formik.values.contact_phonenumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.contact_phonenumber &&
                Boolean(formik.errors.contact_phonenumber)
              }
              helperText={
                formik.touched.contact_phonenumber &&
                typeof formik.errors.contact_phonenumber == "string"
                  ? formik.errors.contact_phonenumber
                  : " "
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined"  error={formik.touched.customer_type && Boolean(formik.errors.customer_type)}>
              <InputLabel id="address-type-label">Customer Type</InputLabel>
              <Select
                labelId="address-type-label"
                id="customer_type"
                name="customer_type"
                value={formik.values.customer_type || ""}
                // onChange={formik.handleChange}
                onChange={(e) => {
                  const value = e.target.value;
                  formik.setFieldValue("customer_type", value);
                 }}
                label="Customer Type"
              >
                <MenuItem value="Individual">Individual</MenuItem>
                <MenuItem value="Company">Company</MenuItem>
                <MenuItem value="Partnership">Partnership</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
                
              </Select>
              {formik.touched.customer_type && formik.errors.customer_type && (
                          <FormHelperText>
                            {typeof formik.errors.customer_type === "string"
                              ? formik.errors.customer_type
                              : " "}
                          </FormHelperText>
                        )}
                      </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              multiline
              rows={3}
              fullWidth
              id="address"
              name="address"
              label="Address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.address &&
                Boolean(formik.errors.address)
              }
              helperText={
                formik.touched.address &&
                typeof formik.errors.address == "string"
                  ? formik.errors.address
                  : " "
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
                      <FormControl
                        fullWidth
                        error={formik.touched.state && Boolean(formik.errors.state)}
                      >
                        <InputLabel id="state">State</InputLabel>
                        <Select
                          label="State"
                          id="state"
                          name="state"
                          placeholder={`Select State`}
                          value={formik.values.state || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            formik.setFieldValue("state", value);
                            setSelectedStates(value);
                            handleSelectedState(value);
                          }}
                        >
                          {stateArray.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {formik.touched.state && formik.errors.state && (
                          <FormHelperText>
                            {typeof formik.errors.state === "string"
                              ? formik.errors.state
                              : " "}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl
                        fullWidth
                        error={formik.touched.city && Boolean(formik.errors.city)}
                      >
                        <InputLabel id="city">District</InputLabel>
                        <Select
                          label="District"
                          id="city"
                          name="city"
                          value={formik.values.city}
                          onChange={(e) => {
                            const value = e.target.value;
                            formik.setFieldValue("city", value);
                            setSelectedCity(value);
                            handleSelectedPincode(value);
                          }}
                        >
                          {city.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {formik.touched.city && formik.errors.city && (
                          <FormHelperText>
                            {typeof formik.errors.city === "string"
                              ? formik.errors.city
                              : " "}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl
                        fullWidth
                        error={formik.touched.pincode && Boolean(formik.errors.pincode)}
                      >
                        <InputLabel id="pincode">Zip/Postal Code</InputLabel>
                        <Select
                          label="Zip/Postal Code"
                          id="pincode"
                          name="pincode"
                          value={formik.values.pincode || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            formik.setFieldValue("pincode", value);
                            setSelectedPincode(value);                  
                          }}
                        >
                          {pincode.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {formik.touched.pincode && formik.errors.pincode && (
                          <FormHelperText>
                            {typeof formik.errors.pincode === "string"
                              ? formik.errors.pincode
                              : " "}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    {/* <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={formik.touched.customerarea && Boolean(formik.errors.customerarea)}>
                          <InputLabel id="area">{"Area"}</InputLabel>
                          <Select
                              label={"Area"}
                              id="area"
                              name="area"
                              placeholder={`Select Area`}
                              value={formik?.values?.customerarea || ''}
                              onChange={(e) => {
                                  const value = e?.target?.value;
                                  formik.setFieldValue('customerarea', value);
                                  formik.handleChange;
                              }}
                          >
                              {area.map((option) => (
                                  <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                  </MenuItem>
                              ))}
                          </Select>
                          {formik.touched.customerarea && formik.errors.customerarea && (
                              <FormHelperText>{formik.errors.customerarea}</FormHelperText>
                          )}
                      </FormControl>
                  </Grid> */}

          <Grid item xs={12} className="flex gap-4 flex-wrap" sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
         
            </Box>
          </Grid>
        </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="secondary">
              Cancel
            </Button>
            <Button color="primary" type="submit"  variant="contained" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? 'Submitting...' : 'Save'}
            </Button>
          </DialogActions>
          </form>
    </Dialog>
  );
}
