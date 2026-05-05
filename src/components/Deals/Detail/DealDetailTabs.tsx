"use client"; // Required for Next.js App Router

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";

// Import tab components
import Tasks from "./Tabs/Tasks";
import  { StyledTabOne, StyledTabsOne } from "@/@core/theme/overrides/tabStyleOne";
import StyledContainer from "@/@core/theme/overrides/container";
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import NoteIcon from '@mui/icons-material/Note';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InfoIcon from '@mui/icons-material/Info';
import Notes from "./Tabs/Notes";
import Attachments from "./Tabs/Attachments";
import Emails from "./Tabs/Emails";
import DealOverview from "./Overview";
import DealAttachment from "./Tabs/Attachments";
import TaskListWithCreate from "./TaskListWithCreate";

const DealDetailTabs = ({customerData}) => {
  const [activeTab, setActiveTab] = useState(0); // Manage active tab
   console.log("customerData herrrre",customerData);
   

const tabsData = [
  { label: "Overview", icon: <InfoIcon />, Component: <DealOverview detail={customerData} /> },
  { label: "Tasks", icon: <TaskAltIcon />, Component: <TaskListWithCreate link_name={customerData?.record?.name} doc_type="CRM Deal"  /> },
  // { label: "Notes", icon: <NoteIcon />, Component: <Notes /> },
  { label: "Attachments", icon: <AttachFileIcon />, Component: <DealAttachment slug={customerData} /> },
  { label: "Emails", icon: <MailOutlineIcon />, Component: <Emails /> },
];
  return (
    <StyledContainer maxWidth={false} sx={{ 
     
      backgroundColor: "var(--mui-palette-background-paper)", 
    }}>
      {customerData?.name}
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
      </Box>

      {/* Tab Content */}
      <Box sx={{ p: 3 }}>{tabsData[activeTab].Component}</Box>
    </StyledContainer>
  );
};

export default DealDetailTabs;
