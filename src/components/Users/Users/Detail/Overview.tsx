"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
 
  useTheme,
} from "@mui/material";
import { FormControl, Grid, TextField, Checkbox } from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import { SelectedFilterLangDataFromStore } from "../../../../store/slices/general_slices/selected-multilanguage-slice";
import { useDispatch, useSelector } from "react-redux";
import { get_access_token } from "../../../../store/slices/auth/token-login-slice";

import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";


// Next Imports
import dynamic from "next/dynamic";
import type { SyntheticEvent, ReactElement } from "react";




const ContactOverview: any = (slug) => {
  const router = useRouter();
  const params: any = useParams();
  const dispatch = useDispatch();
  const TokenFromStore: any = useSelector(get_access_token);

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

  const srq_name = slug?.name;
  console.log("slug=========", slug);

  let [servicerequestdata, setServicerequestdata] = useState<any>([]);

  const [activeTab, setActiveTab] = useState("notes");

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

  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
    console.log("installation list");
  }, [SelectedLangDataFromStore]);

  useEffect(() => {
    setServicerequestdata(slug?.detail);
    console.log("servicerequestdata",servicerequestdata);
    
  }, [slug]);

  return (
    <>
      <Grid
        container
        spacing={5}
        className="px-5"
        style={{ paddingLeft: "0px" }}
      >
        <Grid item xs={24} sm={12}>
          <Grid container spacing={6}>    
            <Grid item xs={24} sm={12}>
              <Card sx={{ boxShadow: "none" }} className="border">
                <CardHeader title={"Basic Info"} />
                <CardContent>
                  <Grid container spacing={6}>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_firstname
                              ? selectedMultiLangData?.lbl_firstname
                              : "First Name"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>{servicerequestdata?.firstname}</Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lastname
                              ? selectedMultiLangData?.lastname
                              : "Last Name"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>{servicerequestdata?.lastname}</Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_email
                              ? selectedMultiLangData?.lbl_email
                              : "Email"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>
                            {servicerequestdata?.useremailid}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_phone
                              ? selectedMultiLangData?.lbl_phone
                              : "Phone number"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>
                            {servicerequestdata?.userphonenumber}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_employeenumber
                              ? selectedMultiLangData?.lbl_employeenumber
                              : "Employee number"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>
                            {servicerequestdata?.employeenumber}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={24} sm={12}>
          <Grid container spacing={6}>
            <Grid item xs={24} sm={12}>
              <Card sx={{ boxShadow: "none" }} className="border">
                <CardContent>
                <Grid container spacing={6}>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_role
                              ? selectedMultiLangData?.lbl_role
                              : "Role"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>{servicerequestdata?.role_profile_name}</Typography>
                        </div>
                      </div>
                    </Grid>
                    
                  </Grid>
                    
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={24} sm={12}>
          <Grid container spacing={6}>
            <Grid item xs={24} sm={12}>
              <Card sx={{ boxShadow: "none" }} className="border">
              <CardHeader title={"More Information"} />
                <CardContent>
                <Grid container spacing={6}>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_gender
                              ? selectedMultiLangData?.lbl_gender
                              : "Gender"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>{servicerequestdata?.gender}</Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_dateofbirth
                              ? selectedMultiLangData?.lbl_dateofbirth
                              : "Date of birth"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>{servicerequestdata?.dateofbirth}</Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_dateofjoining
                              ? selectedMultiLangData?.lbl_dateofjoining
                              : "Date of joining"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>{servicerequestdata?.dateofjoining}</Typography>
                        </div>
                      </div>
                    </Grid>
                  </Grid>
                    
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={24} sm={12}>
          <Grid container spacing={6}>
            <Grid item xs={24} sm={12}>
              <Card sx={{ boxShadow: "none" }} className="border">
              <CardHeader title={"Company Details"} />
                <CardContent>
                <Grid container spacing={6}>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_designation
                              ? selectedMultiLangData?.lbl_designation
                              : "Designation"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>{servicerequestdata?.designation}</Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_department
                              ? selectedMultiLangData?.lbl_department
                              : "Department"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>{servicerequestdata?.department}</Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography className="font-bold text-1xl">
                            {selectedMultiLangData?.lbl_branch
                              ? selectedMultiLangData?.lbl_branch
                              : "Branch"}
                          </Typography>
                        </div>
                      </div>
                    </Grid>
                    <Grid item xs={6} md={3} lg={3}>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-1">
                          <Typography>{servicerequestdata?.branch}</Typography>
                        </div>
                      </div>
                    </Grid>
                  </Grid>
                    
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={24} sm={12}>
          <Grid container spacing={6}>
            <Grid item xs={24} sm={12}>
              <Card sx={{ boxShadow: "none" }} className="border">
                <CardHeader title={"Address"} />
                <CardContent>
                    <Grid container spacing={6}>
                        <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1">
                            <Typography className="font-bold text-1xl">
                                {selectedMultiLangData?.lbl_useraddress
                                ? selectedMultiLangData?.lbl_useraddress
                                : "Address"}
                            </Typography>
                            </div>
                        </div>
                        </Grid>
                        <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1">
                            <Typography>{servicerequestdata?.useraddress}</Typography>
                            </div>
                        </div>
                        </Grid>
                        <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1">
                            <Typography className="font-bold text-1xl">
                                {selectedMultiLangData?.lbl_state
                                ? selectedMultiLangData?.lbl_state
                                : "State"}
                            </Typography>
                            </div>
                        </div>
                        </Grid>
                        <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1">
                            <Typography>{servicerequestdata?.state}</Typography>
                            </div>
                        </div>
                        </Grid>
                        <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1">
                            <Typography className="font-bold text-1xl">
                                {selectedMultiLangData?.lbl_district
                                ? selectedMultiLangData?.lbl_district
                                : "District"}
                            </Typography>
                            </div>
                        </div>
                        </Grid>
                        <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1">
                            <Typography>{servicerequestdata?.city}</Typography>
                            </div>
                        </div>
                        </Grid>
                        <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1">
                            <Typography className="font-bold text-1xl">
                                {selectedMultiLangData?.lbl_postalcode
                                ? selectedMultiLangData?.lbl_postalcode
                                : "Zip/Postal Code"}
                            </Typography>
                            </div>
                        </div>
                        </Grid>
                        <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1">
                            <Typography>{servicerequestdata?.userpincode}</Typography>
                            </div>
                        </div>
                        </Grid>
                    </Grid>
                    
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

     
        
      </Grid>
    </>
  );
};

export default ContactOverview;
