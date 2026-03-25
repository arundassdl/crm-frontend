import React, { useEffect, useState } from "react";
  import { Formik, Form, Field, ErrorMessage, useFormik } from "formik";
import { ProfileValidation } from "../../validation/profileFormValidation";
import { useDispatch, useSelector } from "react-redux";
// import { fetchBillingAddress } from "../../store/slices/checkoutPage-slice/customer-billing-address-slice";
// import { fetchShippingAddress } from "../../store/slices/checkoutPage-slice/customer-shipping-address-slice";
// import { storeCustomerAddresses } from "../../store/slices/checkoutPage-slice/store-customer-address-slice";
import { fetchprofileDataThunk } from "../../store/slices/general_slices/profile-page-slice";
import { get_access_token } from "../../store/slices/auth/token-login-slice";
import storeProfileData from "../../services/api/general_apis/ProfilePageApi/store-profile-api";
import { ProfileDataFetch } from "../../services/api/general_apis/ProfilePageApi/profile-page-api";
import { Button, FormControl, Grid, TextField } from "@mui/material";
import { Box, Chip, FormHelperText, IconButton, InputAdornment, OutlinedInput, Typography } from "@mui/material";


const EditProfileForm = ({
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
  const [formData, setFormData] = useState<any>([])


  console.log("address_type", address_type);

  const [initialValues, setInitialValues] = useState({
    customer_id:"",
    customer_name: "",
    email: "",
    company_name: "",
    contact_no: "",
    associated_to: "",
  });
  
  console.log('detail profile Data ', detailData);
  const updateLocalProfile: any = async (profiledata: any) => {

    if (typeof window !== 'undefined') {
      let userData: any;
      if (localStorage.getItem('userProfileData') != 'undefined') {
        // alert(localStorage.getItem('userData'))
        userData = JSON.parse(localStorage.getItem('userProfileData') || '[]')
        const profiledata = await ProfileDataFetch(TokenFromStore?.token);

        localStorage.setItem('userProfileData', JSON.stringify(profiledata?.data?.message?.data?.profile_details));

      }
    }
  }

  const handlesubmit: any = async (values: any) => {

    let storeProfileUpdateApiRes: any = await storeProfileData(values);

    console.log(storeProfileUpdateApiRes, 'storeProfileUpdateApiRes');

    await updateLocalProfile()


    // if (InstallationApiRes?.msg === "success") {
    //     showToast(InstallationApiRes?.data.msg, "success");
    //     router.push("/installation");
    // } else {
    //     showToast(InstallationApiRes?.error, "error");
    // }



    // alert(JSON.stringify(InstallationApiRes, null, 2));
  };
  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validationSchema: ProfileValidation,
    onSubmit: async (values: any, action: any) => {
      const requestParams = {
        value: { ...values },
        token: TokenFromStore?.token,
      };
      handlesubmit(requestParams);
      setTimeout(() => {
        dispatch(fetchprofileDataThunk(TokenFromStore?.token));
      }, 1000);
      action.resetForm();
    },

  });
  return (
    <>

      <form onSubmit={formik.handleSubmit} className='flex flex-col gap-5'>
        <TextField
          id="customer_id"
          name="customer_id"
          value={formik.values.customer_id}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          sx={{ display: 'none' }}
        />
        <Grid container spacing={5}>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              id="customer_name"
              name="customer_name"
              label="Full Name"
              placeholder={`Enter Full Name`}
              value={formik.values.customer_name}
              defaultValue={detailData?.customer_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.customer_name && Boolean(formik.errors.customer_name)}
              helperText={formik.touched.customer_name && formik.errors.customer_name}
            />
          </Grid>
          <Grid item xs={12} sm={6}>

            <TextField
              fullWidth
              label="Email"
              placeholder={`Enter Email Address`}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled
            />
          </Grid>
        
          {detailData.userType == "Dealer" || detailData.userType == "Sub Dealer" || detailData.userType == "Customer" || detailData.userType == "Surveyor" ?
            (
              <Grid item xs={12} sm={6}>

                <TextField
                  fullWidth
                  id="associated_to"
                  name="associated_to"
                  label={detailData.userType == "Dealer" ? ("Distributor name ") : detailData.userType == "Sub Dealer" || detailData.userType == "Customer" || detailData.userType == "Surveyor" ? ("Dealer name ") : ("")}
                  placeholder={detailData.userType == "Dealer" ? ("Distributor name ") : detailData.userType == "Sub Dealer" || detailData.userType == "Customer" || detailData.userType == "Surveyor" ? ("Dealer name ") : ("")}
                  value={formik.values.associated_to}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.associated_to && Boolean(formik.errors.associated_to)}
                  helperText={formik.touched.associated_to && formik.errors.associated_to}
                />
              </Grid>
            ) : ("")}

        <Grid item xs={12} className='flex gap-4 flex-wrap'>
              <Button variant='contained' type='submit'>
                Save Changes
              </Button>
              <Button variant='outlined' type='reset' color='secondary' onClick={() => setFormData(initialValues)}>
                Reset
              </Button>
            </Grid>

        </Grid>
      </form>

      <Formik
        initialValues={detailData || initialValues}
        validationSchema={ProfileValidation}
        onSubmit={(values: any, action: any) => {
          console.log("form   form values", values);
          const requestParams = {
            value: { ...values },
            token: TokenFromStore?.token,
          };
          // alert('here')
          // dispatch(storeCustomerAddresses(requestParams));
          handlesubmit(requestParams);
          setTimeout(() => {
            // dispatch(fetchShippingAddress(TokenFromStore?.token));
            // dispatch(fetchBillingAddress(TokenFromStore?.token));
            dispatch(fetchprofileDataThunk(TokenFromStore?.token));
          }, 1000);
          action.resetForm();
          toHide();
          // handleChangeSameAsShipping(!billingCheckbox);
        }}
        enableReinitialize
      >
        {({ handleChange, isSubmitting, handleBlur }) => (
          <Form>
            <div className="container mb-3 ">
              <div className="billing-form form-wrap  border-dark  p-lg-2 p-md-3 p-2 ">
                <div className="flex-lg-row row">
                  <div className="mt-3 mt-lg-0 col-lg-12 mt-3">
                    <Field
                      type="hidden"
                      className="form-control rounded-0"
                      id="customer_id"
                      name="customer_id"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="off"
                      value={detailData.customer_id}
                    />

                    <div className="fields-group-md mb-4 fs-6">
                      <div className="form-group">
                        <label className="form-Form.Label fs-6 text-dark">
                          {selectedMultiLangData?.name}{" "}
                          <span className="red">*</span>
                        </label>
                        <Field
                          type="text"
                          className="form-control rounded-0"
                          id="customer_name"
                          name="customer_name"
                          onChange={handleChange}
                          onBlur={handleBlur}
                          autoComplete="off"
                        />

                        <span className="error_message text-danger fs-5">
                          <ErrorMessage name="customer_name" />
                        </span>
                      </div>
                      {detailData.userType == "Dealer" || detailData.userType == "Sub Dealer" || detailData.userType == "Customer" || detailData.userType == "Surveyor" ?
                        (
                          <div className="form-group pt-3">
                            <label className="form-Form.Label fs-6 text-dark">
                              {detailData.userType == "Dealer" && ("Distributor name ")}
                              {detailData.userType == "Sub Dealer" || detailData.userType == "Customer" || detailData.userType == "Surveyor" ? ("Dealer name ") : ("")}
                              <span className="red">*</span>
                            </label>
                            <Field
                              type="text"
                              className="form-control rounded-0"
                              id="associated_to"
                              name="associated_to"
                              onChange={handleChange}
                              onBlur={handleBlur}
                              autoComplete="off"
                            />

                            <span className="error_message text-danger fs-5">
                              <ErrorMessage name="assosiated_to" />
                            </span>
                          </div>
                        ) : ("")}

                    </div>

                    <div className="text-center ">
                      <button
                        type="submit"
                        className="btn mt-3 px-2 py-3 text-uppercase rounded-0 button_color"
                        disabled={isSubmitting}
                      >
                        {selectedMultiLangData?.submit}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default EditProfileForm;
