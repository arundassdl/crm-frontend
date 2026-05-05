import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import { ErrorMessage, Form as FormikForm, Field, Formik, useFormik } from "formik";
import {FormikErrors} from 'formik';
// import Link from "next/link";
import NextLink from 'next/link';
import { Link } from '@mui/material';

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
import { fetchLoginUser } from '@/store/slices/auth/login_slice'
import LogoutList from '@/services/api/auth/logout_api'



const Alreadyloginalert = (multi_lang: any) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams()
  const keyvalue = searchParams?.get('key') ?? ''
  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [LoggedIn, setLoggedIn] = useState<boolean>(false);
  useEffect(() => {
    if (
      multi_lang?.multi_lang?.multiLingualValues && Object.keys(multi_lang?.multi_lang?.multiLingualValues[0]?.value)?.length > 0
    ) {
      setSelectedMultiLangData(multi_lang?.multi_lang?.multiLingualValues[0]?.value);
    }
  });

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });

  
  const handleClick = async () => {
    let obj = {
      Logouts: true,
    };

    function deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
      dispatch(fetchLoginUser(obj));
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('isDealer');
      localStorage.removeItem('isSuperAdmin');
      document.cookie = "isLoggedIn=false;";
      localStorage.removeItem('userCompanyData');
      localStorage.removeItem('menuListData');
      deleteCookie("menuListData");
      deleteCookie("userCompanyData");
      deleteCookie("userProfileData");
      deleteCookie("companyData");
      deleteCookie("userAddress");
      deleteCookie("isLoggedIn");
      deleteCookie("role_profile");
      deleteCookie("AccessTokenData");
      setLoggedIn(false);
      localStorage.clear();
      router.push('/login');

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
  };
  
   const handleBeforeUnload = async () => {
    const logoutAPI = await LogoutList();
  };
  
  
  return (

    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="20vh"
      textAlign="center"
    >
       <Typography variant="body1" sx={{ mb: 1 }}>
        We see that you have signed-in as{' '}
        <Box component="span" fontWeight="bold">
          { userToken?.email }
        </Box>.
      </Typography>

      <Typography variant="body1">
        Please{' '}
        <Link href="#" underline="always" onClick={handleClick}>
          signout
        </Link>{' '}
        and try again.
      </Typography>
    </Box>
    
     

  );
};

export default Alreadyloginalert;
