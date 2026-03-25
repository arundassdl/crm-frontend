import { ErrorMessage, Form as FormikForm, Field, Formik, useFormik } from "formik";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ForgotValidation } from "../validation/forgotValidation";
import ResetPasswordLink from "../services/api/auth/reset-password-link-api";
import { useDispatch, useSelector } from "react-redux";
import { SelectedFilterLangDataFromStore } from "../store/slices/general_slices/selected-multilanguage-slice";
import { showToast } from "./ToastNotificationNew";
import { Button, TextField, Typography } from "@mui/material";
import Form from '@components/Form'
import DirectionalIcon from "./DirectionalIcon";

interface FormValues {
  email: any;
}

const ForgotPassword = (multi_lang: any) => {
  const dispatch = useDispatch();

  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  useEffect(() => {
    if (
      multi_lang?.multi_lang?.multiLingualValues && Object.keys(multi_lang?.multi_lang?.multiLingualValues[0]?.value)?.length > 0
    ) {
      setSelectedMultiLangData(multi_lang?.multi_lang?.multiLingualValues[0]?.value);
    }
  });
  const initialValues: FormValues = {
    email: "",
  };
  const [message, setMessage] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  useEffect(() => {
    if (message === "success" || message === "error") {
      setIsAlertVisible(true);
    }
  }, [message]);

  const HandleSubmit = async (values: any) => {
    const hostName = window?.location?.host;
    console.log("hostname in tsx", hostName);

    let resetApi = await ResetPasswordLink(values, hostName);
    console.log("forgot pswd api res", resetApi);
    if (resetApi?.data?.message?.msg === "success") {
      showToast("Reset link send", "success");
    } else {
      showToast("User With this email Does Not Exists", "error");
    }
  };

  const formik = useFormik({
    initialValues: initialValues,
    enableReinitialize: true,
    validationSchema: ForgotValidation,
    onSubmit: async (values, actions) => {
      HandleSubmit(values);
    },
  });

  return (
    <>
      <Form onSubmit={formik.handleSubmit} autoComplete='off' className='flex flex-col gap-5'>
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && typeof formik.errors.email === 'string' ? formik.errors.email : ' '}
          />
        <Button fullWidth variant='contained' type='submit'>
          Send reset link
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

export default ForgotPassword;
