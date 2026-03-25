"use client"; // Required for Next.js App Router

import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";

// Import tab components
import  { StyledTabOne, StyledTabsOne } from "@/@core/theme/overrides/tabStyleOne";
import StyledContainer from "@/@core/theme/overrides/container";
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import NoteIcon from '@mui/icons-material/Note';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InfoIcon from '@mui/icons-material/Info';
import RoleOverview from "./Overview";

const RoleDetailTabs = ({customerData}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0); // Manage active tab
   console.log("customerData herrrre",customerData);

const handleBackClick: any = async (name: any) => {
    const hrefval = `/user/roles`
    router.replace(hrefval);
  }

   

const tabsData = [
  { label: "Overview", icon: <InfoIcon />, Component: <RoleOverview detail={customerData} /> },
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
            <StyledTabOne key={index}  icon={tab.icon} label={tab.label} iconPosition="start" sx={{ minWidth: "120px", minHeight: "60px", height: "60px" }} />
          ))}
        </StyledTabsOne>
         <Box
            sx={{
              position: "absolute",
              top: 10,     
              right: 16,     
              display: "flex",
              gap: 1,
            }}
          >
              <Button
                variant="outlined"
                onClick={handleBackClick}
                startIcon={<i className="ri-arrow-go-back-line" />}
                size="medium"
                sx={{
                  backgroundColor: "transparent",
                  '&:hover': { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                }}
              >
                Back
              </Button>
          </Box>
      </Box>

      {/* Tab Content */}
      <Box sx={{ p: 3 }}>{tabsData[activeTab].Component}</Box>
    </StyledContainer>
  );
};

export default RoleDetailTabs;
