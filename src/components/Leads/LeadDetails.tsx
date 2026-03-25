"use client";
import React, { useState, useEffect } from "react";
import {  Grid } from "@mui/material";
// import { fetchRecordsWithLinks } from "@/services/api/common-erpnext-api/create-update-custom-api";
// import CustomerDetailTabs from "@/components/Customer/Detail/CustomerDetailTabs";
import LeadDetailTabs from "./Detail/LeadDetailTabs";
import { fetchDetailData } from "@/services/api/common-erpnext-api/create-edit-api";

const LeadDetails: any = (slug) => {

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
      if (customer_name == undefined) return;
      // alert(role_name)
      try {
        setLoading(true);
        let customername = decodeURIComponent(customer_name);
        let getRecords = await fetchDetailData(
          "CRM Lead",
          customername,
          userToken?.access_token,
          customername
        );
        console.log("getRecords", getRecords);
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
        style={{ padding: "0px" }}
      >
         <LeadDetailTabs customerData={customerData} />       
      </Grid>
    </>
  );
};

export default LeadDetails;
