"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Formik,
  Form as FormikForm,
  Field,
  ErrorMessage,
  useFormik,
} from "formik";
import {
  Card,
  CardContent,
  CardHeader,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  MobileStepper,
  Paper,
  Select,
  Tooltip,
  useTheme,
} from "@mui/material";
import { FormControl, Grid, TextField, Checkbox } from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import { SelectedFilterLangDataFromStore } from "../../../store/slices/general_slices/selected-multilanguage-slice";
import { useDispatch, useSelector } from "react-redux";
import { get_access_token } from "../../../store/slices/auth/token-login-slice";
import { get_userby_name } from "@/services/api/users/users-api";
import UserDetailTabs from "@/components/Users/Users/Detail/UserDetailTabs";
import CustomerSkeleton from "@/components/Common/Skeletons/CustomerSkeleton";


import { showToast } from "../../ToastNotificationNew";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import "react-tooltip/dist/react-tooltip.css";
import Button from "@mui/material/Button";
import SaveIcon from "@mui/icons-material/Save";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {
  ArrowBack,
  ArrowBackIosNewOutlined,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Label,
} from "@mui/icons-material";
import { string } from "yup";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import tableStyles from "@core/styles/table.module.css";
import Collapse from "@mui/material/Collapse";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Next Imports
import dynamic from "next/dynamic";
import type { SyntheticEvent, ReactElement } from "react";

// MUI Imports
import OverviewTab from "@/components/Users/Users/Detail/Overview";
import UserDetailPage from "@/components/Users/Users/Detail/tabindex";
import CustomAvatar from "@/@core/components/mui/Avatar";
import ReactTimeAgo from "react-time-ago";
import TimeAgo from "javascript-time-ago";

import en from "javascript-time-ago/locale/en";
import ru from "javascript-time-ago/locale/ru";

TimeAgo.addDefaultLocale(en);
TimeAgo.addLocale(ru);
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import QueryBuilderIcon from "@mui/icons-material/QueryBuilder";
import BuildIcon from "@mui/icons-material/Build";
import FormatDate from "@/libs/FormatDate";

const tabContentList = (
  servicerequestdata
): { [key: string]: ReactElement } => ({
  overview: <OverviewTab detail={servicerequestdata} />,  
});

const ContactDetails: any = (slug) => {
  const router = useRouter();
  const params: any = useParams();
  const dispatch = useDispatch();
  const TokenFromStore: any = useSelector(get_access_token);

  const [joinedDate, setJoinedDate] = useState<any>();

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

  const [err, setErr] = useState<boolean>(false);

  const userid = slug?.name;
  console.log('116', slug)

  let [userdata, setUserdata] = useState<any>([]);
  let [userdetails, setUserdetails] = useState<any>([]);
   const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState("overview");

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  const theme = useTheme();
  const [activeStep, setActiveStep] = React.useState(0);

  let userData: any;
  let userAddress: any;
  if (typeof window !== "undefined") {
    if (localStorage.getItem("userProfileData") != "undefined") {
      // alert(localStorage.getItem('userData'))
      userData = JSON.parse(localStorage.getItem("userProfileData") || "[]");
    }
  }
  console.log("userData", userData);

  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
    console.log("installation list");
  }, [SelectedLangDataFromStore]);

  useEffect(() => {

    const getuserdata: any = async () => {
      const { search } = window.location;
      setLoading(true);
      if (userid == undefined) return;
      const getuserData: any = await get_userby_name(
        { name: userid },
        userToken?.access_token
      );
      console.log("######getuserData", getuserData);
      if (getuserData != undefined) {
        setUserdetails(getuserData);
        console.log(getuserData, "===getuserData");
        setLoading(false);
      } else {
        setErr(!err);
        setLoading(false);
        console.log(!err);
        // location.href='/roles'
      }
    };

    getuserdata();
  }, [params]);

  return (
    <>
      <Grid
        container
        spacing={5}
        // className="px-5"
        style={{ padding: "0px" }}
      >
        {loading ? (
          <Box sx={{}}>
            <Card sx={{ boxShadow: "none", p: 8 }} className="border">
              <CustomerSkeleton />
            </Card>
          </Box>
        ) : (
          <>
            <UserDetailTabs userdetails={userdetails} /> 
          </>
        )}
         
      </Grid>
    </>
  );
};

export default ContactDetails;
