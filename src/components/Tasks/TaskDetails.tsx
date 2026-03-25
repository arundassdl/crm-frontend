"use client";
import React, { useState, useEffect } from "react";
import {  Grid } from "@mui/material";
// import { fetchRecordsWithLinks } from "@/services/api/common-erpnext-api/create-update-custom-api";
import TaskDetailTabs from "./Detail/TaskDetailTabs";
import { fetchDetailData } from "@/services/api/common-erpnext-api/create-edit-api";

const TaskDetails: any = (slug) => {

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const [err, setErr] = useState<boolean>(false);

  const Task_id = slug?.name;

  let [taskData, setTaskData] = useState<any>([]);
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
    const gettaskData: any = async () => {
      if (Task_id == undefined) return;
      // alert(role_name)
      try {
        setLoading(true);
        let taskname = decodeURIComponent(Task_id);
        let getRecords = await fetchDetailData(
          "CRM Task",
          taskname,
          userToken?.access_token,
          taskname
        );
        console.log("getRecords", getRecords);
        if (getRecords) {
          setTaskData(getRecords);
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

    gettaskData();
  }, [Task_id]);

  return (
    <>
      <Grid
        container
        spacing={5}
        // className="px-5"
        style={{ padding: "0px" }}
      >
         <TaskDetailTabs taskData={taskData} />       
      </Grid>
    </>
  );
};

export default TaskDetails;
