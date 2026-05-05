'use client'
// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports
import React, { useEffect, useState } from "react";
import { redirect, usePathname } from 'next/navigation'

import DashboardPage from '@/components/Dashboard/DashboardPage'

const DashboardAnalytics = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const pathname = usePathname();

  const [userData, setuserData] = useState<any>(() => {    
    const initialValue = (localStorage.getItem('userProfileData') != 'undefined')?JSON.parse(localStorage.getItem('userProfileData') || '{}'):'{}';
    return initialValue || "";
  });

  return (
    <Grid container spacing={6} p={7}>
      <DashboardPage />
      {/* {userData?.userType == "Dealer" || userData?.userType == "Sub Dealer" ? (
        <Grid item xs={12} md={7}>
          <HomeRewards userData={userData} />
        </Grid>
      ) : ("")} */}
      {/* <Grid item xs={12} md={5} lg={5}>
        
        <HomeInstallation userData={userData} />
      </Grid> */}

      {/* {userData?.userType == "Administrator" || userData?.userType == "Nuetech Admin" ? (
        <>
          <Grid item xs={12} md={7}>
            <HomeSalesPartner userData={userData} />
          </Grid>
          <Grid item xs={12} md={8}>
            <HomeAdminRewards userData={userData} />
          </Grid>
        </>
      ) : ("")} */}

      {/* <Grid item xs={12} md={6} lg={4}>
        <HomeSurvey />
      </Grid> */}
      {/* <Grid item xs={12} md={6} lg={4}>
        <TotalEarning />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6}>
            <LineChart />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CardStatVertical
              title='Total Profit'
              stats='$25.6k'
              avatarIcon='ri-pie-chart-2-line'
              avatarColor='secondary'
              subtitle='Weekly Profit'
              trendNumber='42%'
              trend='positive'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <CardStatVertical
              stats='862'
              trend='negative'
              trendNumber='18%'
              title='New Project'
              subtitle='Yearly Project'
              avatarColor='primary'
              avatarIcon='ri-file-word-2-line'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DistributedColumnChart />
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <SalesByCountries />
      </Grid>
      <Grid item xs={12} lg={8}>
        <DepositWithdraw />
      </Grid>
      <Grid item xs={12}>
        <Table />
      </Grid> */}
    </Grid>
  )
}

export default DashboardAnalytics
