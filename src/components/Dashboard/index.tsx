import React, { useState, useEffect } from "react";
// import HomeInstallation from "./installation"
import Grid from '@mui/material/Grid'
// import HomeSurvey from "./survey";
// import HomeRewards from "./rewards";
// import HomeSalesPartner from "./sales_partner";
// import QuickMenu from "@/components/Leftmenu/QuickMenu";

const DashboardComponent = () => {

  const [userData, setuserData] = useState<any>(()=>{
    const initialValue = (localStorage.getItem('userProfileData') != 'undefined')?JSON.parse(localStorage.getItem('userProfileData') || '{}'):'{}';
    return initialValue || "";
  });

  useEffect(() => {
    // if (typeof window !== 'undefined') {

    //   if (localStorage.getItem('userProfileData') != 'undefined') {
    //     // alert(localStorage.getItem('userData'))
    //     setuserData(JSON.parse(localStorage.getItem('userProfileData') || '[]'))
    //   }
    // }
  }, []);

  return (
    <>
    {/* <QuickMenu /> */}
      <Grid container>
        <div><span>hi</span></div>
      {/* {userData?.userType == "Dealer" || userData?.userType == "Sub Dealer" ? (
        <Grid xs={12} md={4} py={1} mb={2} pr={2} pl={2}>
          <HomeRewards userData={userData} />
        </Grid>
      ):("")}
        <Grid xs={12} md={userData?.userType == "Dealer" || userData?.userType == "Sub Dealer" ?4:4} py={1} mb={2} pr={2} pl={2}>
          <HomeInstallation />
        </Grid>
        {userData?.userType == "Administrator" || userData?.userType == "Nuetech Admin" ? (
          <>
         <Grid xs={12} md={4} py={1} mb={2} pr={2} pl={2}>
         <HomeSalesPartner />
       </Grid>
       </>
      ):("")}
        <Grid xs={12} md={3} py={1} mb={2} pr={2} pl={2}>
          <HomeSurvey />
        </Grid>
        {userData?.userType == "Administrator" || userData?.userType == "Nuetech Admin" ? (
          <>
        <Grid xs={12} md={9} py={1} mb={2} pr={2} pl={2}>
          <HomeRewards userData={userData}  />
        </Grid>
       </>
      ):("")} */}
      </Grid>
    </>
  );
};

export default DashboardComponent;
