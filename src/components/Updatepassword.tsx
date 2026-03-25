import { ErrorMessage, Form as FormikForm, Field, Formik, useFormik } from "formik";
import {FormikErrors} from 'formik';
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { UpdatepasswordValidation } from "../validation/updatepasswordFormValidation";
import ResetPasswordLink from "../services/api/auth/reset-password-link-api";
import { useDispatch, useSelector } from "react-redux";
import { SelectedFilterLangDataFromStore } from "../store/slices/general_slices/selected-multilanguage-slice";
import { showToast } from "./ToastNotificationNew";
import { Button, TextField, Typography } from "@mui/material";
import Form from '@components/Form'
import DirectionalIcon from "./DirectionalIcon";
import { Box, Chip, FormHelperText, IconButton, InputAdornment, OutlinedInput } from "@mui/material";
import { usePathname, useSearchParams } from 'next/navigation'
import { update_password } from "@/services/api/users/users-api";
import { useRouter } from "next/navigation";

interface FormValues {
    password: any,
    confirm_password: any,
    key: any,
}

const UpdatePassword = (multi_lang: any) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams()
  const keyvalue = (searchParams.get('key')) ? searchParams.get('key') : ""
  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  useEffect(() => {
    if (
      multi_lang?.multi_lang?.multiLingualValues && Object.keys(multi_lang?.multi_lang?.multiLingualValues[0]?.value)?.length > 0
    ) {
      setSelectedMultiLangData(multi_lang?.multi_lang?.multiLingualValues[0]?.value);
    }
  });
  const initialValues: FormValues = {
    password: "",
    confirm_password: "",
    key: keyvalue
  };
  const [message, setMessage] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  useEffect(() => {
    if (message === "success" || message === "error") {
      setIsAlertVisible(true);
    }
  }, [message]);

  const HandleSubmit = async (values: any) => {
    const hostName = window?.location?.origin;
    console.log("hostname in tsx", hostName);
    console.log(values);

    let resetApi = await update_password(values);
    console.log("forgot pswd api res", resetApi);
    if (resetApi?.data?.message?.msg === "success") {
      showToast("Password Updated", "success");
      router.replace(hostName);
    } else {
      showToast("The reset password link has either been used before or is invalid", "error");
    }
  };

  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validationSchema: UpdatepasswordValidation,
    onSubmit: async (values, actions) => {
      HandleSubmit(values);
    },
  });

  return (
    <>
      <Form onSubmit={formik.handleSubmit} autoComplete='off' className='flex flex-col gap-5'>
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
              helperText={formik.touched.password && typeof formik.errors.password === 'string' ? formik.errors.password : ' '}
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
              helperText={formik.touched.confirm_password && typeof formik.errors.confirm_password === 'string' ? formik.errors.confirm_password : ' '}
            />
        <Button fullWidth variant='contained' type='submit'>
          Confirm
        </Button>
        {isAlertVisible && (
          <div
            className={`alert ${message === "success"
                ? "alert-success"
                : "alert-danger"
              } `}
            // ${styles?.otp_alertbox}
            role="alert"
          >
            {message === "success"
              ? "Link is send sucessfully on registered email"
              : "Please enter valid or registered email"}
          </div>
        )}
        <Typography className='flex justify-center items-center' color='primary'>
          <Link href='/login' className='flex items-center'>
            <DirectionalIcon ltrIconClass='ri-arrow-left-s-line' rtlIconClass='ri-arrow-right-s-line' />
            <span>Back to Login</span>
          </Link>
        </Typography>
      </Form>
    </>
  );
};

export default UpdatePassword;
