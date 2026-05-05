"use client"; // Required for Next.js App Router

import React, { useState, useRef } from "react";
import { Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";

// Import tab components
import { StyledTabOne, StyledTabsOne } from "@/@core/theme/overrides/tabStyleOne";
import StyledContainer from "@/@core/theme/overrides/container";
import InfoIcon from '@mui/icons-material/Info';
import TerritoryOverview, { ChildRefType } from "./TerritoryOverview";

const TerritoryDetailTabs = ({ territoryData, territoryNameFromUrl }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);
    const [editable, setEditable] = useState<boolean>(false);
    console.log("territoryData", territoryData);

    const handleBackClick: any = async () => {
        const hrefval = `/setup/territories`
        router.replace(hrefval);
    }

    const territoryoverview = useRef<ChildRefType>(null);

    const handleSubmit = () => {
        if (territoryoverview.current) {
            territoryoverview.current.submitEditable();
            setEditable(true)
        }
    };

    const handleClose = () => {
        if (territoryoverview.current) {
            territoryoverview.current.handleCloseClick();
            setEditable(false)
        }
    };

    const handleSave = () => {
        if (territoryoverview.current) {
            territoryoverview.current.handleCloseClick();
            setEditable(false)
        }
    };


    const tabsData = [
        { label: "Overview", icon: <InfoIcon />, Component: <TerritoryOverview slug={territoryData?.territory_name ?? territoryNameFromUrl} ref={territoryoverview} /> },
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
                    zIndex: 1200,
                    borderBottom: 1,
                    borderColor: "divider",
                    width: "100%",
                    borderRadius: "0px !important"
                }}
            >
                <StyledTabsOne
                    value={activeTab}
                    onChange={(event, newValue) => setActiveTab(newValue)}
                    sx={{ minHeight: "60px", height: "60px" }}
                >
                    {tabsData.map((tab, index) => (
                        <StyledTabOne key={index} icon={tab.icon} label={tab.label} iconPosition="start" sx={{ minWidth: "120px", minHeight: "60px", height: "60px" }} />
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

export default TerritoryDetailTabs;
