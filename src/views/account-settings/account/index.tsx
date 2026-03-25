'use client'
// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
// import AccountDetailsCopy from './AccountDetailscopy'
import AccountDetails from './AccountDetails'
import { useEffect, useState } from 'react';
// import AccountDelete from './AccountDelete'

const Account = ({
  profileList,
}: any) => {

  console.log("Account profileList",profileList);
  const [profileData, setProfileData] = useState<any>(profileList);



  useEffect(() => {
    // Fetch user data on component mount

    // useProfilePage();
    if (profileList) {
      setProfileData(profileList);
    }
    
      console.log("profileList1 account",profileData);
      
  }, [profileList]);

  
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <AccountDetails allProfileData={profileData} />
        {/* <AccountDetailsCopy /> */}
      </Grid>
      <Grid item xs={12}>
        {/* <AccountDelete /> */}
      </Grid>
    </Grid>
  )
}

export default Account
