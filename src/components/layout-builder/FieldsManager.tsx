import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import FieldsListTab from './FieldsListTab';
import FieldPermissionTab from './FieldPermissionTab';

interface FieldsManagerProps {
    module: string;
    layoutRows?: { name: string; layout_name?: string }[];
}

const FieldsManager: React.FC<FieldsManagerProps> = ({ module, layoutRows }) => {
    const [activeTab, setActiveTab] = React.useState('list');

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ width: '100%', p:3 }}>
            <Box sx={{ mb: 2, border: 1, borderColor: "divider", borderRadius: 2, width: "fit-content" }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="fields-manager-tabs"
                    sx={{
                        minHeight: 40,
                        "& .MuiTabs-flexContainer": { gap: 1 },
                        "& .MuiTabs-indicator": { display: "none" },
                        "& .MuiTab-root": {
                            textTransform: "none",
                            minHeight: 40,
                            minWidth: "auto",
                            px: 2.5,
                            py: 1.25,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "background.paper",
                            color: "#666666",
                            fontWeight: 400,
                        },
                        "& .MuiTab-root.Mui-selected": {
                            backgroundColor: "#E8E4F4",
                            borderColor: "#C4BCE0",
                            color: "#333333",
                            fontWeight: 600,
                        },
                        "& .MuiTab-root:hover": {
                            backgroundColor: "action.hover",
                        },
                        "& .MuiTab-root.Mui-selected:hover": {
                            backgroundColor: "#E8E4F4",
                        },
                    }}
                >
                    <Tab label="Field Listing" value="list" />
                    <Tab label="Field Permissions" value="permissions" />
                </Tabs>
            </Box>

            {activeTab === 'list' && (
                <FieldsListTab module={module} layoutRows={layoutRows} />
            )}

            {activeTab === 'permissions' && (
                <FieldPermissionTab module={module} layoutRows={layoutRows} />
            )}
        </Box>
    );
};

export default FieldsManager;
