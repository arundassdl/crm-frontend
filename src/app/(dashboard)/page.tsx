'use client'

import Box from '@mui/material/Box'

import DashboardPage from '@/components/Dashboard/DashboardPage'

const DashboardAnalytics = () => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
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
    </Box>
  )
}

export default DashboardAnalytics
