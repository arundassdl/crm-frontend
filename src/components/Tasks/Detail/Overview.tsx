"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
} from "@mui/material";

import { Grid } from "@mui/material";
import { SelectedFilterLangDataFromStore } from "../../../store/slices/general_slices/selected-multilanguage-slice";
import { useSelector } from "react-redux";

import OverviewSection from "./OverviewSection";
import DealSkeleton from "@/components/Common/Skeletons/DealSkeleton";
import Notes from "@/components/Customer/Detail/Notes";

const TaskOverview: any = (slug) => {
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
  console.log("slug=========222 task", slug);

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
    console.log("slug?.detail?.record task overiew", slug?.detail?.record);

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

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={24} sm={12}>

          {loading ? (
            <DealSkeleton />
          ) : (
            <>

              <OverviewSection slug={slug?.detail} doctype="CRM Task" />

            </>
          )}
          <Grid
            container
            spacing={12}
            sx={{ boxShadow: "none", pt: 8, pl: 8, pr: 8 }}
          >

            <Grid item xs={24} sm={12}>
              <Grid item xs={12} sx={{ mt: 4, ml: 6 }}>
                <Typography variant="h6" sx={{ mb: 4 }}>
                  Notes
                </Typography>
                <Divider sx={{ borderBottomWidth: "2px" }} />
              </Grid>

              <Grid item spacing={6}>
                <Notes link_name={customerData?.name} doc_type="CRM Task" />
              </Grid>

            </Grid>
          </Grid>
          {/* <Grid
            container
            spacing={12}
            sx={{ boxShadow: "none", pt: 8,   pr: 8 }}
          >

            <Grid item xs={24} sm={12}>             

              <Grid item spacing={6} sx={{pl:8}}>
                <TaskListWithCreate link_name={customerData?.name} doc_type="CRM Deal" />
              </Grid>

            </Grid>
          </Grid> */}

        </Grid>
      </Grid>
    </>
  );
};

export default TaskOverview;
