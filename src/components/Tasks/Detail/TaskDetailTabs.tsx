"use client"; // Required for Next.js App Router

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";

// Import tab components
import  { StyledTabOne, StyledTabsOne } from "@/@core/theme/overrides/tabStyleOne";
import StyledContainer from "@/@core/theme/overrides/container";
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import NoteIcon from '@mui/icons-material/Note';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InfoIcon from '@mui/icons-material/Info';
import Attachments from "./Tabs/Attachments";
import Emails from "./Tabs/Emails";
import TaskOverview from "./Overview";
import TaskAttachment from "./Tabs/Attachments";

const TaskDetailTabs = ({taskData}) => {
  const [activeTab, setActiveTab] = useState(0); // Manage active tab
   console.log("taskData herrrre",taskData);
   

const tabsData = [
  { label: "Overview", icon: <InfoIcon />, Component: <TaskOverview detail={taskData} /> },
  { label: "Attachments", icon: <AttachFileIcon />, Component: <TaskAttachment slug={taskData} /> },
  { label: "Emails", icon: <MailOutlineIcon />, Component: <Emails /> },
];
  return (
    <StyledContainer maxWidth={false} sx={{ 
     
      backgroundColor: "var(--mui-palette-background-paper)", 
    }}>
      {taskData?.name}
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

export default TaskDetailTabs;
