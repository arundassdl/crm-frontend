"use client";
import React, { useState, useEffect } from "react";
import { Box, Card, CardContent, Skeleton } from "@mui/material";
import { Grid } from "@mui/material";

import ContactOverview from "@/components/Contact/Detail/ContactOverview";
// import { fetchRecordsWithLinks } from "@/services/api/common-erpnext-api/create-update-custom-api";
import Basicinfo from "./Detail/Basicinfo";
import CustomerSkeleton from "../Common/Skeletons/CustomerSkeleton";
import { fetchDetailData } from "@/services/api/common-erpnext-api/create-edit-api";

const CustomerDetails: any = (slug) => {
  const [joinedDate, setJoinedDate] = useState<any>();

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const [err, setErr] = useState<boolean>(false);

  const customer_name = slug?.name;

  let [customerData, setCustomerData] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
    const getcustomerData: any = async () => {
      const { search } = window.location;

      if (customer_name == undefined) return;
      // alert(role_name)
      try {
        setLoading(true);
        let customername = decodeURIComponent(customer_name);
        let getRecords = await fetchDetailData(
          "Contact",
          customername,
          userToken?.access_token,
          customername
        );
        console.log("getRecords", getRecords);

        const data = getRecords;
        const addresses =
          getRecords?.all_addresses?.length > 0
            ? getRecords?.all_addresses[0]
            : [];

        if (getRecords) {
          setCustomerData(getRecords);
        } else {
          setErr(true);
        }
      } catch (error) {
        console.error("Error fetching customer data", error);
        setErr(true);
      } finally {
        setLoading(false);
      }
    };

    getcustomerData();
  }, [customer_name]);

  return (
    <>
      <Grid
        container
        spacing={5}
        // className="px-5"
        sx={{ paddingLeft: "0px" }}
      >
        <Grid item xs={24} sm={12} sx={{ paddingTop: "0px !important" }}>
        {loading ? (
                <Box sx={{}}>
                  <Card sx={{ boxShadow: "none", p: 8 }} className="border">
                    <CustomerSkeleton />
                  </Card>
                </Box>
              ) : (
                <>
                  <Basicinfo slug={customerData} doctype="Contact" />
                </>
              )}
          <Grid container spacing={6}>
            <Grid item xs={24} sm={12}>
           
            </Grid>
            <Grid item xs={12} md={12} lg={12}>
              <ContactOverview detail={customerData} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default CustomerDetails;
