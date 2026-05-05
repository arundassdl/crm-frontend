import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, useFormik, Form as FormikForm, Field, ErrorMessage, useField } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegistrationValidation } from "../../validation/registrationValidation";
import Image from "next/image";
import { register_details } from "../dataSets/registrationDataset";
import {
  getRegistrationData,
  registration_state,
} from "../../store/slices/auth/registration_slice";
import {
  FetchCitiesForAddressForm,
  FetchPostalCodeByStateCity,
  FetchStateForAddressForm,
} from "../../services/api/general_apis/customer-form-data-api";
import { SelectedFilterLangDataFromStore } from "../../store/slices/general_slices/selected-multilanguage-slice";
import { get_access_token } from "../../store/slices/auth/token-login-slice";
import RegistrationApi from "../../services/api/auth/registration_api";
import useMultilangHook from "../../hooks/LanguageHook/Multilanguages-hook";
import { showToast } from "../ToastNotificationNew";
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { Box, Chip, FormHelperText, IconButton, InputAdornment, OutlinedInput, Typography } from "@mui/material";

const Register = (multi_lang: any) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const TokenFromStore: any = useSelector(get_access_token);

  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

  const RegistrationDataFromStore: any = useSelector(registration_state);
  useEffect(() => {
    setSelectedMultiLangData(multi_lang?.multi_lang[0]?.value);
  });
  let [selectedCity, setSelectedCity] = useState<any>("");
  let [selectedStates, setSelectedStates] = useState<any>("");
  let [selectedPincode, setSelectedPincode] = useState<any>("");
  let [selectedusertype, setSelectedUsertype] = useState<string>("");
  let [user_type, setUsertype] = useState<any>(["Select a usertype", "Distributor", "Dealer", "Sub Dealer", "Customer", "Surveyor", "Employee"]);
  let [user_types, setUsertypes] = useState<any>([{ "value": "Distributor", "label": "Distributor" }, { "value": "Dealer", "label": "Dealer" }, { "value": "Sub Dealer", "label": "Sub Dealer" }, { "value": "Customer", "label": "Customer" }, { "value": "Surveyor", "label": "Surveyor" }, { "value": "Employee", "label": "Employee" }]);

  let [city, setCity] = useState<any>([]);
  let [pincode, setPincode] = useState<any>([]);
  const [err, setErr] = useState<boolean>(false);
  let [stateArray, setStateArray] = useState<any>([]);

  useEffect(() => {
    const getStateData: any = async () => {
      const stateData: any = await FetchStateForAddressForm(
        TokenFromStore?.token
      );
      if (stateData?.length > 0) {
        let stateValues: any = stateData
          .map((item: any) => item?.name)
          .filter((item: any) => item !== null);
        const stateArrys = [{ value: "", label: "" }]
        stateData
          .map((item: any) => {
            stateArrys.push({ "value": item.name, label: item.name })
          })

        setStateArray(stateArrys);
      } else {
        setErr(!err);
      }
    };
    getStateData();
  }, []);

  const initialValues = {
    name: "",
    email: "",
    contact: "",
    address_1: "",
    address_2: "",
    gst_number: "",
    city: "",
    state: "",
    postal_code: "",
    password: "",
    confirm_password: "",
    user_type: "",
    associated_to: ""
  };

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

      const cityArrys = [{ value: "", label: "" }]
      getCitiesFromState
        .map((item: any) => {
          cityArrys.push({ "value": item.name, label: item.name })
        })

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

      const pinArrys = [{ value: "", label: "" }]
      getPincodesFromStateCity
        .map((item: any) => {
          pinArrys.push({ "value": item.label, label: item.label })
        })

      setPincode(pinArrys);
    }
  };

  const handlesubmit: any = async (values: any, action: any) => {

    let RegistrationApiRes: any = await RegistrationApi(values);

    if (RegistrationApiRes?.data?.message?.msg === "success") {
      showToast("Registerd sucessfully", "success");
      router.push("/login");
    } else {
      showToast(RegistrationApiRes?.data?.message?.error, "error");
    }
    // action.resetForm();
  };

  const Capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  const checkUserType = (user_type) => {
    let asso_data = "";
    if (user_type === "Dealer") {
      asso_data = "distributor name";
    } else if (user_type === "Sub Dealer" || user_type === "Customer" || user_type === "Surveyor") {
      asso_data = "dealer name";
    };
    return asso_data;
  };


  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: RegistrationValidation,
    onSubmit: async (values, action) => {
      // alert(JSON.stringify(values, null, 2));
      handlesubmit(values, action);
    },
  });

  const [isPasswordShown, setIsPasswordShown] = useState(false)

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  return (
    <>

      <div className="registration_form">
        <div className="flex flex-col gap-5">
          <form onSubmit={formik.handleSubmit} className='flex flex-col gap-5'>
            <TextField
              fullWidth
              id="name"
              name="name"
              label="Full Name"
              placeholder={`Enter Full Name`}
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />

            <TextField
              fullWidth
              id="email"
              name="email"
              label="Email"
              placeholder={`Enter Email Address`}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              fullWidth
              id="contact"
              name="contact"
              label="Mobile Number"
              placeholder={`Enter Mobile Number`}
              value={formik.values.contact}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.contact && Boolean(formik.errors.contact)}
              helperText={formik.touched.contact && formik.errors.contact}
            />

            <TextField
              multiline
              rows={2}
              fullWidth
              id="address_1"
              name="address_1"
              label="Address"
              placeholder={`Enter Address`}
              value={formik.values.address_1}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address_1 && Boolean(formik.errors.address_1)}
              helperText={formik.touched.address_1 && formik.errors.address_1}
            />
            <TextField
              fullWidth
              id="password"
              name="password"
              label="Password"
              type={isPasswordShown ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      size='small'
                      edge='end'
                      onClick={handleClickShowPassword}
                      onMouseDown={e => e.preventDefault()}
                    >
                      <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              placeholder={`Enter Password`}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
            <TextField
              fullWidth
              id="confirm_password"
              name="confirm_password"
              label="Confirm Password"
              type={'password'}
              placeholder={`Enter Confirm Password`}
              value={formik.values.confirm_password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirm_password && Boolean(formik.errors.confirm_password)}
              helperText={formik.touched.confirm_password && formik.errors.confirm_password}
            />
            <FormControl fullWidth error={formik.touched.state && Boolean(formik.errors.state)}>
              <InputLabel id="state">State</InputLabel>
              <Select
                label="State"
                id="state"
                name="state"
                placeholder={`Select State`}
                value={formik.values.state || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  formik.setFieldValue('state', value);
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
                <FormHelperText>{formik.errors.state}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={formik.touched.city && Boolean(formik.errors.city)}>
              <InputLabel id="city">District</InputLabel>
              <Select
                label="District"
                id="city"
                name="city"
                value={formik.values.city || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  formik.setFieldValue('city', value);
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
                <FormHelperText>{formik.errors.city}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={formik.touched.postal_code && Boolean(formik.errors.postal_code)}>
              <InputLabel id="postal_code">Zip/Postal Code</InputLabel>
              <Select
                label="Zip/Postal Code"
                id="postal_code"
                name="postal_code"
                value={formik.values.postal_code || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  formik.setFieldValue('postal_code', value);
                  setSelectedPincode(value);
                }}
              >
                {pincode.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.postal_code && formik.errors.postal_code && (
                <FormHelperText>{formik.errors.postal_code}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth error={formik.touched.user_type && Boolean(formik.errors.user_type)}>
              <InputLabel id="user_type">User Type</InputLabel>
              <Select
                label="User Type"
                id="user_type"
                name="user_type"
                value={formik.values.user_type || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  formik.setFieldValue('user_type', value);
                  setSelectedUsertype(value);
                }}
              >
                {user_types.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {formik.touched.user_type && formik.errors.user_type && (
                <FormHelperText>{formik.errors.user_type}</FormHelperText>
              )}
            </FormControl>
            {selectedusertype === 'Dealer' || selectedusertype === 'Sub Dealer' || selectedusertype === 'Customer' ||
              selectedusertype === 'Surveyor' ? (

              <TextField
                fullWidth
                id="associated_to"
                name="associated_to"
                label={Capitalize(checkUserType(selectedusertype))}
                placeholder={`Enter ${checkUserType(selectedusertype)}`}
                value={formik.values.associated_to}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.associated_to && Boolean(formik.errors.associated_to)}
                helperText={formik.touched.associated_to && formik.errors.associated_to}
              />

            ) : ("")}

            <Button fullWidth variant='contained' type='submit' >
              {(selectedMultiLangData?.submit) ? selectedMultiLangData?.submit : "Submit"}
            </Button>
          </form>
          <div className='flex justify-center items-center flex-wrap gap-2'>
            <Typography>{(selectedMultiLangData?.already_have_account) ? selectedMultiLangData?.already_have_account : "You already have an account ?"}</Typography>
            <Typography component={Link} href='/login' color='primary'>
            {(selectedMultiLangData?.sign_in) ? selectedMultiLangData?.sign_in : "Sign in"}
            </Typography>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
