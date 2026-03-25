"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useFormik } from "formik";
import { Card, CardContent, CardHeader, useTheme } from "@mui/material";

import { Grid } from "@mui/material";
import { SelectedFilterLangDataFromStore } from "../../../store/slices/general_slices/selected-multilanguage-slice";
import { useDispatch, useSelector } from "react-redux";
import Typography from "@mui/material/Typography";

import EmailListNew from "./EmailListNEW";
import PhoneList from "./PhoneList";
import Notes from "@/components/Customer/Detail/Notes";
import AddressListing from "@/components/Customer/Detail/AddressListing";
import DealsListing from "@/components/Deals/Listing";
import DealListing from "./DealListing";
import ContactAddressListing from "./AddressListing";

const ContactOverview: any = (slug) => {
  const router = useRouter();
  const params: any = useParams();
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);

  // const[opencustdialog,setCustomerOpenDialog]=useState(false)
  // const[openbankdialog,setBankOpenDialog]=useState(false)

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const handleFormSubmit = () => {
    setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to force DataGrid reload
  };

  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

  const [err, setErr] = useState<boolean>(false);

  const srq_name = slug?.name;
  console.log("slug=========", slug);

  let [customerData, setCustomerData] = useState<any>({});
  let [linkData, setLinkData] = useState<any>({});
  let [addressData, setAddressData] = useState<any>({});

  const [activeTab, setActiveTab] = useState("servicerequests");

  const handleTabChange = (value) => {
    setActiveTab(value);
  };
  // const [contactAssociations, setContactAssociations] = useState([
  //   {value:'customer',label:'Customer'},
  //   {value:'bank',label:'Bank'},
  //   {value:'manufacturer',label:'Manufacturer'}
  // ]);
  // const [customerchkboxvalue,setCustomerChkboxValue]=useState(false)
  // const [bankchkboxvalue,setBankChkboxValue]=useState(false)
  // const [manufactchkboxvalue,setManufactchkboxValue]=useState(false)
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

  // type customer={
  //   customer_name:customerData["customer"].customer.customer_name,
  //   email_id:string,
  //   mobile_no:string
  // }
  const formik = useFormik({
    initialValues: { assoOrdisasso: "" },
    enableReinitialize: true,
    isInitialValid: true,
    onSubmit: async (values, action) => {
      // alert(JSON.stringify(values, null, 2));
      const requestParams = {
        value: { ...values },
        token: userToken?.access_token,
      };
    },
  });

  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
    console.log("installation list");
  }, [SelectedLangDataFromStore]);

  useEffect(() => {
    setCustomerData(slug?.detail?.record);
    let addresses = slug?.detail?.primary_address
      ? slug?.detail?.primary_address
      : [];

    // let addresses = (slug?.detail?.onLoadData?.addr_list?.length>0)?slug?.detail?.onLoadData?.addr_list:[]
    let link_data = slug?.detail?.record?.links[0];
    setLinkData(link_data);

    setAddressData(addresses);
    console.log("linkData", linkData);
  }, [slug]);

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={24} sm={12}>
          <Grid container spacing={6}>
            {addressData?.address_line1 && (
              <Grid item xs={24} sm={12}>
                <Card sx={{ boxShadow: "none" }} className="border px-8">
                  <CardContent>
                    <Typography variant="h5">Address Information</Typography>
                    <Grid container spacing={6}>
                      <Grid item xs={24} sm={12}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1">
                            <Typography></Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1">
                            {/* <Person /> */}
                            <Typography className="font-medium text-1xl">
                              {selectedMultiLangData?.lbl_address_line1
                                ? selectedMultiLangData?.lbl_address_line1
                                : "Address Line 1 "}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1">
                            <Typography>
                              {addressData?.address_line1}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1">
                            {/* <Email /> */}
                            <Typography className="font-medium text-1xl">
                              {selectedMultiLangData?.lbl_email
                                ? selectedMultiLangData?.lbl_email
                                : "Address Line 2"}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1">
                            <Typography>
                              {addressData?.address_line2}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1">
                            {/* <MobileFriendly /> */}
                            <Typography className="font-medium text-1xl">
                              {selectedMultiLangData?.lbl_city
                                ? selectedMultiLangData?.lbl_city
                                : "District"}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Typography>{addressData?.city}</Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1">
                            {/* <AccountBalanceOutlinedIcon />  */}
                            <Typography className="font-medium text-1xl">
                              {selectedMultiLangData?.lbl_state
                                ? selectedMultiLangData?.lbl_state
                                : "State"}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Typography>{addressData?.state}</Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1">
                            {/* <PostAddIcon />  */}
                            <Typography className="font-medium text-1xl">
                              {selectedMultiLangData?.lbl_country
                                ? selectedMultiLangData?.lbl_country
                                : "Country"}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Typography>{addressData?.country}</Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-1">
                            {/* <PostAddIcon /> */}
                            <Typography className="font-medium text-1xl">
                              {selectedMultiLangData?.lbl_postal_code
                                ? selectedMultiLangData?.lbl_postal_code
                                : "Pincode"}
                            </Typography>
                          </div>
                        </div>
                      </Grid>
                      <Grid item xs={6} md={3} lg={3}>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Typography>{addressData?.pincode}</Typography>
                          </div>
                        </div>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {customerData?.name ? (
              <Grid item xs={24} sm={12}>
                <Card sx={{ boxShadow: "none" }} className="border">
                  <CardContent sx={{ paddingLeft: 0, paddingRight: 0 , marginTop: 5 }}>
                    {/*<Typography>{customerData?.name}</Typography>*/}
                    <ContactAddressListing doc_name={customerData?.name} doc_type="Contact" onSubmit={handleFormSubmit} />
                    {/* <ContactAddressListing  link_name={customerData?.name} address={customerData?.address} /> */}
                  </CardContent>
                </Card>
              </Grid>
            ) : (null)}
            {customerData?.name ? (
              <Grid item xs={24} sm={12}>
                <Card sx={{ boxShadow: "none" }} className="border">
                   {/*<CardHeader title={"Deals"} /> */}
                  <CardContent>
                    <Grid item spacing={6}>

                      <DealListing link_name={customerData?.name} />
                      {/* <DealsListing link_name={customerData?.name} /> */}
                      {/* <Notes link_name={customerData?.name} doc_type="Contact" /> */}

                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ) : (null)}
            {/* <Grid item xs={24} sm={12}>
              <Card sx={{ boxShadow: "none" }} className="border">
                <CardHeader title={"Notes"} />
                <CardContent>
                  <Grid item spacing={6}>
                    <Notes link_name={customerData?.name} doc_type="Contact" />

                  </Grid>
                </CardContent>
              </Card>
            </Grid> */}
          </Grid>
        </Grid>
        <Grid item xs={24} sm={12}>
          <Grid container spacing={6}>
            {/* <Grid item xs={24} sm={12}>               
                <EmailListNew contactname={customerData?.name} emailids={customerData?.['email_ids']} />               
            </Grid>
            <Grid item xs={24} sm={12}>
                <PhoneList contactname={customerData?.name} phonenos={customerData?.['phone_nos']} />
            </Grid> */}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default ContactOverview;
