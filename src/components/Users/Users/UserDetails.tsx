"use client";
import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SelectedFilterLangDataFromStore } from "../../../store/slices/general_slices/selected-multilanguage-slice";
import { useSelector } from "react-redux";
import { get_userby_name } from "@/services/api/users/users-api";
import UserDetailTabs from "@/components/Users/Users/Detail/UserDetailTabs";
import UserSkeleton from "@/components/Common/Skeletons/UserSkeleton";

import { Grid } from "@mui/material";

import "react-tooltip/dist/react-tooltip.css";

export type UserDetailsProps = {
  /** User identifier (email/name); falls back to `/user/users/detail/[slug]` */
  name?: string;
};

const ContactDetails = ({ name }: UserDetailsProps) => {
  const params = useParams() as { slug?: string };

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });

  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();

  const [err, setErr] = useState<boolean>(false);

  let [userdetails, setUserdetails] = useState<any>([]);
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
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
    console.log("installation list");
  }, [SelectedLangDataFromStore]);

  // Depend on stable route key only — `params` from useParams() changes identity each render and was re-triggering fetch + loading (felt like a full page refresh).
  const userSlug = name ?? params?.slug

  useEffect(() => {
    if (userSlug == null || String(userSlug).trim() === '') {
      setLoading(false)
      return
    }

    let cancelled = false

    const getuserdata = async () => {
      setLoading(true)
      const getuserData: any = await get_userby_name(
        { name: decodeURIComponent(String(userSlug)) },
        userToken?.access_token
      )
      if (cancelled) return
      console.log('######getuserData', getuserData)
      if (getuserData != undefined) {
        setUserdetails(getuserData)
        console.log(getuserData, '===getuserData')
        setLoading(false)
      } else {
        setErr(!err)
        setLoading(false)
        console.log(!err)
      }
    }

    void getuserdata()
    return () => {
      cancelled = true
    }
  }, [userSlug, userToken?.access_token])

  return (
    <>
      <Grid
        container
        spacing={5}
        // className="px-5"
        style={{ padding: "0px" }}
      >
        {loading ? (
          <UserSkeleton />
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
