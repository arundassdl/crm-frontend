'use client'

// React Imports
import { useEffect, useState } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import PropTypes from 'prop-types';

// const SPSettings = ({ tabContentList }: { tabContentList: { [key: string]: ReactElement } }) => {
const UserDetailPage = ({ tabContentList, tab, onTabChange }) => {
  // States
  const [activeTab, setActiveTab] = useState(tab || 'overview');

  useEffect(() => {
    setActiveTab(tab)
  }, [tab]);
  
  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
    onTabChange(value); 
  }
  console.log("tabContentList detail", tab);


  return (
    <TabContext value={activeTab}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <TabList onChange={handleChange} variant='scrollable'>
            <Tab label='Overview' iconPosition='start' value='overview' />
          </TabList>
        </Grid>
        <Grid item xs={12} md={12} lg={12}>
          <TabPanel value={activeTab} className='p-0'>
            {tabContentList[activeTab]}
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  )
}

UserDetailPage.propTypes = {
  tab: PropTypes.string.isRequired,
};
export default UserDetailPage
