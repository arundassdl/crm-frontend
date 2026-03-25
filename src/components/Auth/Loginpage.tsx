'use client'
import React from "react";
import { useEffect, useState } from "react";
import { LoginValidation } from "@/validation/loginValidation";
import {
  Formik,
  Form as FormikForm,
  ErrorMessage,
  useFormikContext,
} from "formik";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  fetchLoginUser,
  login_state,
} from "@/store/slices/auth/login_slice";
import { getAccessToken } from "@/store/slices/auth/token-login-slice";
// import { SelectedFilterLangDataFromStore } from "@/store/slices/general_slices/selected-multilanguage-slice";
import getOtpFetchApi from "@/services/api/auth/get-otp-api";
// import useMultilangHook from "@/hooks/LanguageHook/Multilanguages-hook";
import { usePathname } from "next/navigation";
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Logo from "../layout/shared/Logo";
import { FormHelperText, Typography } from "@mui/material";
import themeConfig from '@configs/themeConfig'
// import type { FormEvent } from 'react'
// // Hook Imports
// import { useImageVariant } from '@core/hooks/useImageVariant'
import { failmsg, hideToast, successmsg } from "@/store/slices/general_slices/toast_notification_slice";
import { showToast } from "../ToastNotificationNew";


const loginPage = (multi_lang: any) => {
  const dispatch = useDispatch();
  const loginSucess: any = useSelector(login_state);
  const [newState, setNewState] = useState<any>([]);
  const [loginStatus, setLoginStatus] = useState<any>("");
  const [newValues, setnewValue] = useState<any>("");
  const [ShowAlertMsg, setShowAlertMsg] = useState<boolean>(false);
  const [messageState, setMessageState] = useState<any>("");
  const [isOtpLoginState, setIsOtpLoginState] = useState<boolean>(false);

  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  const pattern = new RegExp(/^\d{1,10}$/);
  const [mobile, setmobile] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPasswordShown, setIsPasswordShown] = useState(false)

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  useEffect(() => {
    console.log("multi_lang?.multi_lang", multi_lang );
    setSelectedMultiLangData(multi_lang?.multi_lang[0]?.value);

  });

  const location = usePathname();
  let isLoggedIn: any;
  let guestLogin: any;
  const router = useRouter();
  let obj = {
    isGoogleLogin: false,
    visitor: false,
    isOtpLogin: false,
  };
  if (typeof window !== "undefined") {
    guestLogin = localStorage.getItem("guest");
    isLoggedIn = localStorage.getItem("isLoggedIn");
  }


  const handlesubmit = (values: any,actions:any) => {
    const val = Object.assign(obj, values);

    const user_params = {
      values: values,
      guest: guestLogin,
      isOtpLogin: isOtpLoginState === true ? true : false,
    };
    console.log("userparams", user_params);
    console.log(loginStatus, "loginStatus");

    dispatch(getAccessToken(user_params));

    setTimeout(() => {
      const loginStatusFromStorage: any = localStorage.getItem("isLoggedIn");
      if(loginStatusFromStorage===null){
        actions.setSubmitting(false);  
      }
      setLoginStatus(loginStatusFromStorage);
      setIsOtpLoginState(false);
      actions.setSubmitting(false); 
    }, 2000);
  };

  useEffect(() => {

    if (isLoggedIn) {

      if (location == "/login") {
        // window.location.href = "/";
      }

    }
    if (loginStatus === "true") {
      dispatch(successmsg("logged in sucessfully"));
      setTimeout(() => {
        dispatch(hideToast());
      }, 800);
      router.push("/");
      localStorage.removeItem("guest");
      localStorage.removeItem("guestToken");
    }
    else {
      dispatch(failmsg("Invalid Credential"));
      setTimeout(() => {
        dispatch(hideToast());
      }, 800);
    }
  }, [handlesubmit]);

  console.log(loginStatus, "loginStatus");

  console.log(isLoggedIn, "newState");
  const FormObserver: React.FC = () => {
    const { values }: any = useFormikContext();
    useEffect(() => {
      setnewValue(values);

    }, [values]);
    return null;
  };

  const HandleGetOtp = async (e: any) => {
    let newObj = {
      email: newValues?.email,
    };
    e.preventDefault();
    let GetOtpApiRes: any = await getOtpFetchApi(newObj);

    if (GetOtpApiRes?.data?.message?.msg === "success") {
      setShowAlertMsg(true);
      setMessageState(GetOtpApiRes?.data?.message?.msg);
      showToast(GetOtpApiRes?.data?.message?.msg, "success")
      setIsOtpLoginState(true);
      setTimeout(() => {
        setShowAlertMsg(false);
        setMessageState("");
      }, 1000);
    } else {
      setShowAlertMsg(true);
      setMessageState(GetOtpApiRes?.data?.message?.msg);
      showToast(GetOtpApiRes?.data?.message?.error, "error")
      setTimeout(() => {
        setShowAlertMsg(false);
        setMessageState("");
      }, 1500);
    }
  };


  return (    
    
    <>
      <div className="pt-0">

        <Link href='/' className='flex justify-center items-center mbe-6'>
          <Logo from="login" />
        </Link>

        <div className='flex flex-col gap-5'>
          <div>
            <Typography variant='h4'>{(selectedMultiLangData?.login_heading) ? selectedMultiLangData?.login_heading : ` Please login`}</Typography>
            {/* <Typography className='mbs-1' variant='h6'>Please login. </Typography> */}
          </div>
          <Formik
            initialValues={{
              email: "",
              password: "",
            }}
            validationSchema={LoginValidation}
            onSubmit={(values, actions) => {
              handlesubmit(values,actions);              
              

            }}            
          >
            {({ isSubmitting, handleChange, handleBlur }) => (
              <div className="auth-form-wrapper login-wrapper flex flex-col gap-5">
                <FormikForm>
                  <div className='flex flex-col gap-2'>
                    <TextField autoFocus fullWidth label='Email or mobile number' onChange={handleChange}
                      onKeyUp={(e) => {
                      }}
                      onBlur={handleBlur}
                      type="text"
                      name="email"
                      placeholder={(selectedMultiLangData?.email_or_mobile) ? selectedMultiLangData?.email_or_mobile : "Email or mobile number"} />

                    <FormHelperText error><ErrorMessage name="email" /></FormHelperText>

                    {ShowAlertMsg && (
                      <div className="pt-1">
                        {messageState === "success"
                          ? "OTP send sucessfully on registered email"
                          : "Please enter valid mobile number or registered email"}
                      </div>
                    )}
                    <TextField
                      fullWidth
                      label='Password'
                      id='password'
                      type={isPasswordShown ? 'text' : 'password'}
                      autoComplete="off"
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
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name="password"
                      placeholder={(selectedMultiLangData?.password) ? selectedMultiLangData?.password : "Password"}
                    />
                    <FormHelperText error><ErrorMessage name="password" /></FormHelperText>


                    <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
                      <FormControlLabel control={<Checkbox />} label='Remember me' />
                      <Typography className='text-end' color='primary'>
                        <Link href='/forgot-password' rel="noopener noreferrer">
                          {(selectedMultiLangData?.forgot_password) ? selectedMultiLangData?.forgot_password : "Forgot password"} ?
                        </Link>
                      </Typography>
                    </div>
                    <Button fullWidth variant='contained' type='submit' disabled={isSubmitting}>
                      {(selectedMultiLangData?.sign_in) ? selectedMultiLangData?.sign_in : "Sign in"}
                    </Button>
                    <div className='flex justify-center items-center flex-wrap gap-2'>
                      <Typography>
                      {(selectedMultiLangData?.new_member_desc)?selectedMultiLangData?.new_member_desc:"Create a New member? Register here and start the journey with us"}</Typography>
                      <Typography component={Link} href='/register' color='primary'>
                      {(selectedMultiLangData?.create_account)?selectedMultiLangData?.create_account:"Create an account"}
                      </Typography>
                    </div>
                    {!isError ? (
                      <div className="flex flex-col gap-5">
                        <Divider className='gap-3'>or</Divider>
                        <div className='flex justify-center items-center gap-2'>
                          <Button variant="outlined" onClick={(e) => HandleGetOtp(e)}>{(selectedMultiLangData?.get_otp) ? selectedMultiLangData?.get_otp : "Get OTP"}</Button>{' '}
                        </div>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>

                  <FormObserver />
                </FormikForm>
              </div>
            )}
          </Formik>
        </div>
        <hr></hr>
      </div>
    </>
  );
};

export default loginPage;
