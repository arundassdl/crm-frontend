"use client"; // Required for Next.js App Router

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";

// Import tab components
import  { StyledTabOne, StyledTabsOne } from "@/@core/theme/overrides/tabStyleOne";
import StyledContainer from "@/@core/theme/overrides/container";
import UserOverview from "./UserOverview";

const UserDetailTabs = ({userdetails}) => {
  const [activeTab, setActiveTab] = useState(0); // Manage active tab
   console.log("userData herrrre ==> 13",userdetails);
   
// Define tab data dynamically
const tabsData = [
  { label: "Overview", Component: <UserOverview detail={userdetails} /> },
  // { label: "Deals", Component: <OrgDeals /> },
  // { label: "Contacts", Component: <ContactListing link_name={customerData?.record?.name} /> },
];
  return (
    <StyledContainer maxWidth={false} sx={{ 
      backgroundColor: "var(--mui-palette-background-paper)", 
    }}>
      {/* Tabs */}
      <Box 
        sx={{ 
          position: "sticky", 
          top: "-20px !important", 
          // backgroundColor: "white", 
          zIndex: 1200, 
          borderBottom: 1, 
          borderColor: "divider" ,
          width:"100%",
          borderRadius: "0px !important"
        }}
      >
        <StyledTabsOne
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          sx={{ minHeight: "60px", height: "60px" }} 
        >
          {tabsData.map((tab, index) => (
            <StyledTabOne key={index} label={tab.label} sx={{ minWidth: "120px", minHeight: "60px", height: "60px" }} />
          ))}
        </StyledTabsOne>
      </Box>

      {/* Tab Content */}
      <Box sx={{ p: 3 }}>{tabsData[activeTab].Component}</Box>
    </StyledContainer>
  );
};

export default UserDetailTabs;
