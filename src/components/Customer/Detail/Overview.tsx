"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
} from "@mui/material";

import { Grid } from "@mui/material";
import { SelectedFilterLangDataFromStore } from "../../../store/slices/general_slices/selected-multilanguage-slice";
import { useSelector } from "react-redux";


import Notes from "./Notes";
import CustomerSkeleton from "@/components/Common/Skeletons/CustomerSkeleton";
import IndividualDetail from "@/components/Customer/Detail/IndividualDetail";
import CompanyDetail from "@/components/Customer/Detail/CompanyDetail";
import OrgDealListing from "./OrgDealListing";
import ContactAddressListing from "@/components/Contact/Detail/AddressListing";
import OrgContactListing from "./OrgContactListing";
import Typography from "@mui/material/Typography";

const CustomerOverview: any = (slug) => {
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

  const [refreshKey, setRefreshKey] = useState(0);

  const srq_name = slug?.name;
  console.log("slug=========222", slug);

  let [customerData, setCustomerData] = useState<any>({});
  let [contactData, setContactData] = useState<any>({});
  let [addressData, setAddressData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
    console.log("installation list");
  }, [SelectedLangDataFromStore]);

  useEffect(() => {
    setLoading(true);
    console.log("slug?.detail?.record", slug?.detail?.record);

    setCustomerData(slug?.detail?.record);
    let addresses = slug?.detail?.primary_address
      ? slug?.detail?.primary_address[0]
      : [];

    // let addresses = (slug?.detail?.onLoadData?.addr_list?.length>0)?slug?.detail?.onLoadData?.addr_list:[]
    let contact_list =
      slug?.detail?.onLoadData?.contact_list?.length > 0
        ? slug?.detail?.onLoadData?.contact_list
        : [];
    setContactData(contact_list);
    setAddressData(addresses);
    console.log("addressData", addresses);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [slug]);

  const handleFormSubmit = () => {
    setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to force DataGrid reload
  };

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={24} sm={12}>

          {loading ? (
            <CustomerSkeleton />
          ) : (
            <>
              {customerData?.customer_type === "Individual" ? (
                <IndividualDetail slug={slug?.detail} doctype="CRM Organization" />
              ) : (
                <CompanyDetail slug={slug?.detail} doctype="CRM Organization" />
              )}
            </>
          )}
          {customerData ? (
            <>
              <Grid item xs={24} sm={12}>
                <Box sx={{ flexGrow: 1, overflow: "auto"}}>
                  <Card
                    sx={{
                      boxShadow: "none",
                    }}
                    className="border"
                  >
                    <CardContent sx={{ marginTop: 5 }}>
                      <ContactAddressListing
                        doc_name={customerData?.name}
                        doc_type="CRM Organization" onSubmit={handleFormSubmit}
                      />
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
              <Grid item xs={24} sm={12}>
                <Card sx={{ boxShadow: "none" }} className="border">
                  {/* <CardHeader title={"Deals"} /> */}
                  <CardContent>
                    <Grid item spacing={6}>
                      <OrgDealListing link_name={customerData?.name} />
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={24} sm={12}>
                <Card
                  sx={{
                    boxShadow: "none",
                    borderTop: "1px solid #ccc",
                    borderRadius: 0,
                    width: "100%",
                  }}
                >
                  <CardContent>
                    <OrgContactListing link_name={customerData?.name} />
                  </CardContent>
                </Card>
              </Grid>
            </>
          ): (null)}
        </Grid>
      </Grid>
    </>
  );
};

export default CustomerOverview;
