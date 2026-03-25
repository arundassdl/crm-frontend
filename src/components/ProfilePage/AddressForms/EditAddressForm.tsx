'use client'
import React, { useEffect, useState } from "react";
import { Formik, Form as FormikForm, Field, ErrorMessage, useFormik } from "formik";
import { ShippingValidation } from "../../../validation/addressFormValidation";
import { useDispatch, useSelector } from "react-redux";
import { fetchBillingAddress } from "../../../store/slices/checkoutPage-slice/customer-billing-address-slice";
import { fetchShippingAddress } from "../../../store/slices/checkoutPage-slice/customer-shipping-address-slice";
import { storeCustomerAddresses } from "../../../store/slices/checkoutPage-slice/store-customer-address-slice";
import { fetchprofileDataThunk } from "../../../store/slices/general_slices/profile-page-slice";
import { get_access_token } from "../../../store/slices/auth/token-login-slice";
import { FetchCitiesForAddressForm, FetchPostalCodeByStateCity, FetchStateForAddressForm } from "../../../services/api/general_apis/customer-form-data-api";
import editCustomerAddress from "../../../services/api/general_apis/ProfilePageApi/edit-customer-address-api";
import { Button, Typography, TextField, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem, FormHelperText } from "@mui/material";
import { showToast } from "@/components/ToastNotificationNew";

const EditAddressForm = ({
  show,
  toHide,
  address_type,
  detailData,
  billingCheckbox,
  handleChangeSameAsShipping, 
  selectedMultiLangData,
}: any) => {
  const dispatch = useDispatch();
  const TokenFromStore: any = useSelector(get_access_token);

  console.log("address_type", detailData);
  const [initialValues, setInitialValues] = useState({
    address_title: "",
    address_line1: "",
    address_line2: "",
    country: "",
    state:  "",
    city: "",
    pincode: "",
    email: "",
    contact: "",
    set_as_default: true,
    address_id: detailData?.email_id,
    address_type: address_type,
  });

console.log('detailData=>1',detailData);

  let [selectedCity, setSelectedCity] = useState<any>("");
  let [selectedStates, setSelectedStates] = useState<any>(detailData?.state);
  let [city, setCity] = useState<any>([]);
  let [state, setState] = useState<any>([]);
  let [selectedPincode, setSelectedPincode] = useState<any>("");
  let [pincode, setPincode] = useState<any>([]);
  const [err, setErr] = useState<boolean>(false);
  let [stateArray, setStateArray] = useState<any>([]);

  const [userToken, setUserToken] = useState<any>(()=>{
    const initialValue = JSON.parse(localStorage.getItem('AccessTokenData') || '{}');
    return initialValue || "";
  });
  useEffect(() => {
  
    const getStateData: any = async () => {
        const stateData: any = await FetchStateForAddressForm(
            TokenFromStore?.token
        );
        console.log(stateData, 'stateData', stateData?.length);
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
            setState(stateValues);
        } else {
            setErr(!err);
        }
    };

    const getCityData: any = async () => {
      const getCitiesFromState: any = await FetchCitiesForAddressForm(
        detailData?.state,
        TokenFromStore?.token
    );
    console.log("cities values", getCitiesFromState);
    if (getCitiesFromState?.length > 0) {
        // let citiesValues: any = getCitiesFromState
        //     .map((item: any) => item.name)
        //     .filter((item: any) => item !== null);

        // console.log("cities values new", citiesValues);
        const cityArrys = [{ value: "", label: "" }]
    getCitiesFromState
      .map((item: any) => {
        cityArrys.push({ value: item.name, label: item.name })
      })

        setCity(cityArrys);
        setSelectedCity(detailData.city);
    }
  };

  const getPincodeData: any = async () => {
    const getPincodesFromStateCity: any = await FetchPostalCodeByStateCity(
      detailData?.state,
      detailData?.city,
      TokenFromStore?.token
    );
    console.log("pincodes values", getPincodesFromStateCity);
    if (getPincodesFromStateCity?.length > 0) {
      let pincodesValues: any = getPincodesFromStateCity
        .map((item: any) => item.label)
        .filter((item: any) => item !== null);

        const pinArrys = [{ value: "", label: "" }]
        getPincodesFromStateCity
          .map((item: any) => {
            pinArrys.push({ "value": item.label, label: item.label })
          })

      console.log("pincodes values new", pincodesValues);
      setPincode(pinArrys);
      setSelectedPincode(detailData?.pincode)
    }
};


    getStateData();
    getCityData();
    getPincodeData();
 
    // Fetch user data on component mount

    // useProfilePage();
    if (detailData ) {
       setInitialValues(detailData)
     } 
       
    console.log("$$$$$$$$userToken", userToken?.access_token);
  }, [detailData]);


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
        cityArrys.push({ value: item.name, label: item.name })
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

  const formik = useFormik({
    initialValues: detailData || initialValues,
    enableReinitialize: true,
    validationSchema: ShippingValidation,
    onSubmit: async (values, actions) => {
      
      const requestParams = {
        value: { ...values },
        token: userToken?.access_token,
      };
      console.log("requestParams",requestParams)
      let update_cus = await editCustomerAddress(requestParams);  
      console.log("update_cus",update_cus)
      if (update_cus?.msg === "success") {
        showToast(update_cus?.data.msg, "success");       
      } else {
        showToast(update_cus?.data.msg, "error");
      }
      setTimeout(() => {
        // dispatch(fetchShippingAddress(TokenFromStore?.token));
        dispatch(fetchBillingAddress(userToken?.access_token));
        dispatch(fetchprofileDataThunk(userToken?.access_token));
      }, 1000);
    },
  });

  return (
    <>     
    <Card>
    <CardContent>
    <form onSubmit={formik.handleSubmit} className='flex flex-col gap-5 mbe-5'>
          
          <Grid container spacing={5}>
          <TextField
            id="email"
            name="email"
            value={formik.values.email_id}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            sx={{ display: 'none' }}
          />
            <Grid item xs={12} sm={6}>
              <TextField
                multiline
                rows={3}
                fullWidth
                id="address_line1"
                name="address_line1"
                label="Address"
                value={formik.values.address_line1}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address_line1 && Boolean(formik.errors.address_line1)}
                helperText={formik.touched.address_line1 && typeof formik.errors.address_line1=='string' ? formik.errors.address_line1:' '}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
                <FormHelperText>{typeof formik.errors.state === 'string' ? formik.errors.state : ' '}</FormHelperText>
              )}
            </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={formik.touched.city && Boolean(formik.errors.city)}>
              <InputLabel id="city">District</InputLabel>
              <Select
                label="District"
                id="city"
                name="city"
                value={formik.values.city}
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
                <FormHelperText>{typeof formik.errors.city === 'string' ? formik.errors.city : ' '}</FormHelperText>
              )}
            </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>

            <FormControl fullWidth error={formik.touched.pincode && Boolean(formik.errors.pincode)}>
              <InputLabel id="pincode">Zip/Postal Code</InputLabel>
              <Select
                label="Zip/Postal Code"
                id="pincode"
                name="pincode"
                value={formik.values.pincode || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  formik.setFieldValue('pincode', value);
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
                <FormHelperText>{typeof formik.errors.pincode === 'string' ? formik.errors.pincode : ' '}</FormHelperText>
              )}
            </FormControl>
            </Grid>
           

            <Grid item xs={12} className='flex gap-4 flex-wrap'>
              <Button variant='contained' type='submit'>
                Save Changes
              </Button>
              <Button variant='outlined' type='reset' color='secondary' onClick={() => setInitialValues(detailData)}>
                Reset
              </Button>
            </Grid>
          </Grid>
        </form>

</CardContent>
</Card>
          {/* <Formik
            initialValues={detailData || initialValues}
            validationSchema={ShippingValidation}
            onSubmit={async (values: any, action: any) => {
              // values.address_id = detailData.address_id
              console.log("form shipping/billing address form values", values);
              const requestParams = {
                value: { ...values },
                token: TokenFromStore?.token,
              }; 
              console.log("requestParams",requestParams);
              
              let update_cus = await editCustomerAddress(requestParams);              
              setTimeout(() => {
                // dispatch(fetchShippingAddress(TokenFromStore?.token));
                dispatch(fetchBillingAddress(TokenFromStore?.token));
                dispatch(fetchprofileDataThunk(TokenFromStore?.token));
              }, 1000);
              action.resetForm();
              toHide();
              // handleChangeSameAsShipping(!billingCheckbox);
            }}
            enableReinitialize
          >
            {({ handleChange, isSubmitting, handleBlur }) => (
              <FormikForm>
                <div className="container mb-3 ">
                  <div className="billing-form form-wrap  border-dark  p-lg-2 p-md-3 p-2 ">
                    <div className="flex-lg-row row">                      
                    
                      <div className="mt-0 mt-lg-0 col-lg-12 ">
                        

                        <div>
                          <div className="form-group mt-3 fs-6">
                            <label className="form-Form.Label fs-6 text-dark">
                              {selectedMultiLangData?.address}
                              <span className="red">*</span>
                            </label>
                            <Field
                              as="textarea"
                              className="form-control rounded-0"
                              id="address_line1"
                              name="address_line1"
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />

                            <span className="error_message text-danger fs-5">
                              <ErrorMessage name="address_line1" />
                            </span>
                          </div>
                        </div>

                        
                        <div>
                          
                            <Field
                              type="hidden"
                              className="form-control rounded-0"
                              id="email"
                              name="email"
                              onChange={handleChange}
                              onBlur={handleBlur}
                              autoComplete="off"
                            />  
                           
                        </div>

                        

                        <div>
                          <div className="form-group mt-3 fs-6">
                            <label className="form-Form.Label fs-6 text-dark">
                              {selectedMultiLangData?.state}{" "}
                              <span className="red">*</span>
                            </label>
                            <Form.Select
                              className="form-control rounded-0"
                              id="state"
                              name="state"
                              value={selectedStates}
                              onBlur={handleBlur}
                              onChange={(e: any) => {
                                console.log("selected state", e?.target?.value);
                                setSelectedStates(e?.target?.value);
                                handleSelectedState(e?.target?.value);
                              }}
                              onClick={handleChange}
                            >
                              <option>
                                {selectedMultiLangData?.please_select_a_state}
                              </option>
                              {state?.length > 0 && (
                                <>
                                  {state?.map((data: any, index: any) => {
                                    return (
                                      <>
                                        <option value={data} key={index}>
                                          {data}
                                        </option>
                                      </>
                                    );
                                  })}
                                </>
                              )}
                            </Form.Select>

                            <span className="error_message text-danger fs-5">
                              <ErrorMessage name="state" />
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="form-group mt-3 fs-6">
                            <label className="form-Form.Label fs-6 text-dark">
                              {selectedMultiLangData?.district}
                              <span className="red">*</span>
                            </label>
                            <Form.Select
                              className="form-control rounded-0"
                              id="city"
                              name="city"
                              value={selectedCity}
                              defaultValue=""
                              onChange={(e: any) => {
                                setSelectedCity(e.target.value);
                                handleChange;
                                handleSelectedPincode(e?.target?.value);
                              }}
                              onClick={handleChange}
                              onBlur={handleBlur}
                            >
                              <option>
                                {" "}
                                {selectedMultiLangData?.please_select_district}
                              </option>
                              {city?.length > 0 && (
                                <>
                                  {city.map((data: any, index: any) => (
                                    <option value={data} key={index}>
                                      {data}
                                    </option>
                                  ))}
                                </>
                              )}
                            </Form.Select>

                            <span className="error_message text-danger fs-5">
                              <ErrorMessage name="city" />
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="form-group mt-3 fs-6">
                            <label className="form-Form.Label fs-6 text-dark">
                              {selectedMultiLangData?.postal_code}{" "}
                              <span className="red">*</span>
                            </label>
                            <Field
                              component="select"
                              className="form-control rounded-0"
                              id="pincode"
                              name="pincode"
                              value={selectedPincode}
                              defaultValue=""
                              onChange={(e: any) => {
                                  setSelectedPincode(e.target.value);
                                  handleChange;
                              }}
                              onClick={handleChange}
                              onBlur={handleBlur}
                              >
                              <option>
                                  {
                                  selectedMultiLangData?.please_select_pincode
                                  }
                              </option>
                              {pincode?.length > 0 && (
                                  <>
                                  {pincode.map((data: any, index: any) => (
                                      <option value={data} key={index}>
                                      {data}
                                      </option>
                                  ))}
                                  </>
                              )}
                              </Field>

                            <span className="error_message text-danger fs-5">
                              <ErrorMessage name="pincode" />
                            </span>
                          </div>
                        </div>

                        <div className="text-center ">
                          <button
                            type="submit"
                            className="btn mt-3 px-2 py-3 text-uppercase rounded-0 button_color"
                            disabled={isSubmitting}
                          >
                            {selectedMultiLangData?.save_address}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FormikForm> 
            )}
          </Formik>*/}
    </>
  );
};

export default EditAddressForm;
