"use client"; // Required for Next.js App Router

import React, { useRef, useState } from "react";
import { Box, Tab, Tabs } from "@mui/material";

import StyledContainer from "@/@core/theme/overrides/container";
import RoleOverview, { ChildRefType } from "./Overview";
import RoleDetailTimeline from "./RoleDetailTimeline";

const RoleDetailTabs = ({ customerData }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const roleoverview = useRef<ChildRefType>(null);

  /** Frappe `Comment.reference_name` for SDL Role */
  const sdlRoleDocName = customerData?.name ?? customerData?.role_name;

  const tabsData = [
    {
      label: "Overview",
      Component: (
        <RoleOverview slug={customerData?.role_name} ref={roleoverview} />
      ),
    },
    {
      label: "Timeline",
      Component: (
        <RoleDetailTimeline recordName={sdlRoleDocName} active={activeTab === 1} />
      ),
    },
  ];

  return (
    <StyledContainer
      maxWidth={false}
      sx={{
        backgroundColor: "var(--mui-palette-background-paper)",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 160px)",
        p: 0,
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1200,
          width: "100%",
          bgcolor: "var(--mui-palette-background-paper)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 0.5,
            pr: 8,
          }}
        >
          <Box
            sx={{
              borderColor: "divider",
              width: "fit-content",
              alignItems: "center",
              border: "2px solid var(--mui-palette-grey-100)",
              borderRadius: 5,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_event, newValue) => setActiveTab(newValue)}
              aria-label="role-detail-tabs"
              sx={{
                minHeight: 40,
                "& .MuiTabs-flexContainer": { gap: 1 },
                "& .MuiTabs-indicator": { display: "none" },
                "& .MuiTab-root": {
                  textTransform: "none",
                  minHeight: 40,
                  minWidth: 150,
                  px: 2.5,
                  py: 1.25,
                  borderRadius: 5,
                  backgroundColor: "background.paper",
                  color: "#666666",
                  fontWeight: 400,
                  fontSize: 13,
                },
                "& .MuiTab-root.Mui-selected": {
                  backgroundColor: "#E8E4F4",
                  borderColor: "#C4BCE0",
                  color: "#333333",
                  fontWeight: 600,
                },
                "& .MuiTab-root:hover": {
                  backgroundColor: "action.hover",
                  borderRadius: 5,
                },
                "& .MuiTab-root.Mui-selected:hover": {
                  backgroundColor: "#E8E4F4",
                  borderRadius: 5,
                },
              }}
            >
              {tabsData.map((tab, index) => (
                <Tab key={index} label={tab.label} />
              ))}
            </Tabs>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          pt: 3,
          pr: 3,
          pb: 3,
          pl: 0,
          flex: 1,
          overflowY: "auto",
        }}
      >
        {tabsData[activeTab]?.Component}
      </Box>
    </StyledContainer>
  );
};

export default RoleDetailTabs;
