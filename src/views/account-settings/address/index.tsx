// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'

// Component Imports
import Link from '@components/Link'
import Form from '@components/Form'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import EditAddressForm from '@/components/ProfilePage/AddressForms/EditAddressForm'
import { useEffect, useState } from 'react'

type TableDataType = {
  type: string
  app: boolean
  email: boolean
  browser: boolean
}

// Vars
const tableData: TableDataType[] = [
  {
    app: true,
    email: true,
    browser: true,
    type: 'New for you'
  },
  {
    app: true,
    email: true,
    browser: true,
    type: 'Account activity'
  },
  {
    app: false,
    email: true,
    browser: true,
    type: 'A new browser used to sign in'
  },
  {
    app: false,
    email: true,
    browser: false,
    type: 'A new device is linked'
  }
]

const Address = ({
  profileList,
}: any) => {
  const [userData, setuserData] = useState<any>([]);


  useEffect(() => {


    if (typeof window !== 'undefined') {
      if (localStorage.getItem('userProfileData') != 'undefined') {
        // alert(localStorage.getItem('userData'))
        setuserData(JSON.parse(localStorage.getItem('userProfileData') || '[]'))
      }
    }
  }, []);

  console.log("userData======>",userData);
  const address_id= {email:profileList?.profile_details?.customer_id,address_id:""}
  
  console.log("address_id===profileList======>",profileList?.billing_address); 
  return (
    
      <EditAddressForm detailData={profileList?.billing_address} />
          
  )
}

export default Address
