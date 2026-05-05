"use client";
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography, Divider, CircularProgress, Drawer, IconButton, Tooltip, Stack, Button } from "@mui/material";
import { GridColDef, GridSortModel, GridFilterModel, GridToolbarProps } from "@mui/x-data-grid";
import StyledDataGrid_relatedlist from "@/@core/theme/overrides/datagrid_relatedlist";
import CustomToolbar from "@/@core/theme/overrides/datagridcustomtoolbar";
import { getRelatedList, getFormFields } from "@/services/api/general_apis/layout-api";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "@/components/ToastNotificationNew";
import CustomForm from "@/components/Common/Form/Drawer/CustomForm";
import CloseIcon from "@mui/icons-material/Close";
import { createCustomDocument } from "@/services/api/common-erpnext-api/create-edit-api";

interface StageHistoryProps {
    module: string;
    module_name: string;
    layout_name: string;
    link_name: string; // This is the record_id
    onRefresh?: () => void;
    refreshTrigger?: number;
}

const StageHistory: React.FC<StageHistoryProps> = ({ module, module_name, layout_name, link_name, onRefresh, refreshTrigger }) => {
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [sortModel, setSortModel] = useState<GridSortModel>([]);
    const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], quickFilterValues: [] });

    // Drawer state for CustomForm
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [formFields, setFormFields] = useState<any[]>([]);
    const [formLoading, setFormLoading] = useState(false);

    const [userToken] = useState<any>(() => {
        try {
            return readAccessTokenDataParsed() || {};
        } catch {
            return {};
        }
    });

    const fetchConfig = useCallback(async () => {
        if (!userToken?.access_token || !module || !layout_name) return;

        setLoading(true);
        try {
            const res = await getRelatedList(module, layout_name, userToken.access_token);
            const stageHistoryConfig = res.find((rl: any) => rl.link_field_name === "stage_history");

            if (stageHistoryConfig) {
                setConfig(stageHistoryConfig);

                // Build columns from related_column
                const cols: GridColDef[] = (stageHistoryConfig.related_column || [])
                    .filter((col: any) => col.in_list_view)
                    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    .map((col: any) => ({
                        field: col.field_name,
                        headerName: col.label,
                        flex: 1,
                        type: col.type || "string",
                        valueGetter: (value, row) => {
                            if (col.type === "date" || col.type === "datetime") {
                                return row[col.field_name] ? new Date(row[col.field_name]) : null;
                            }
                            return row[col.field_name];
                        }
                    }));

                // Add name as hidden field for row id
                setColumns(cols);
            }
        } catch (error) {
            console.error("Error fetching stage history config:", error);
            showToast("Failed to load stage history configuration", "error");
        } finally {
            setLoading(false);
        }
    }, [module, layout_name, userToken?.access_token]);

    const fetchData = useCallback(async () => {
        if (!config || !userToken?.access_token || !link_name) return;

        setDataLoading(true);
        try {
            const fetchParams = {
                page: paginationModel.page,
                pageSize: paginationModel.pageSize,
                filters: filterModel,
                sort: sortModel,
            };

            const colFields = (config.related_column || []).map((col: any) => ({
                doctype: config.main_doctype_name,
                field: col.field_name,
                hidden: col.in_list_view ? "False" : "True"
            }));

            // Add name and idx fields if not present
            if (!colFields.some(f => f.field === "name")) {
                colFields.push({ doctype: config.main_doctype_name, field: "name", hidden: "True" });
            }
            if (!colFields.some(f => f.field === "idx")) {
                colFields.push({ doctype: config.main_doctype_name, field: "idx", hidden: "True" });
            }

            const whereconditon = ` AND parent = '${link_name}'`;

            const result = await fetchRawDataGridListing(
                fetchParams,
                userToken.access_token,
                colFields as any,
                config.main_doctype_name,
                [],
                "",
                "",
                [],
                "",
                whereconditon,
                "",
                "",
                "Stage Probability History.idx DESC",
                "True"
            );

            setRows(result.data || []);
            setTotalCount(result.totalCount || 0);
        } catch (error) {
            console.error("Error fetching stage history data:", error);
            showToast("Failed to load stage history data", "error");
        } finally {
            setDataLoading(false);
        }
    }, [config, paginationModel, sortModel, filterModel, userToken?.access_token, link_name]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    useEffect(() => {
        if (config) {
            fetchData();
        }
    }, [config, link_name, refreshTrigger]);

    const handlePaginationChange = (model: any) => {
        setPaginationModel(model);
    };

    const handleSortModelChange = (model: GridSortModel) => {
        setSortModel(model);
    };

    const handleFilterModelChange = (model: GridFilterModel) => {
        setFilterModel(model);
    };

    const handleAddNew = async () => {
        if (!config?.main_doctype_name || !userToken?.access_token) return;

        setDrawerOpen(true);
        setFormLoading(true);
        try {
            // Fetch form fields for the main doctype
            // We use module_name as the identifier for getFormFields usually 
            // but for related lists it might be different. 
            // In most cases, main_doctype_name works if it has a default layout.
            const res = await getFormFields(config.main_doctype_name, userToken.access_token, userToken.role_profile, "");
            const fields = Array.isArray(res?.fields) ? res.fields : Array.isArray(res) ? res : [];
            setFormFields(fields);
        } catch (error) {
            console.error("Error fetching form fields:", error);
            showToast("Failed to load form fields", "error");
        } finally {
            setFormLoading(false);
        }
    };

    const handleFormSubmit = async (values: any) => {
        if (!config?.main_doctype_name || !userToken?.access_token) return;

        setFormLoading(true);
        try {
            // Add parent to values
            const dataToSave = { ...values, parent: link_name, parenttype: module };
            const res = await createCustomDocument(config.main_doctype_name, dataToSave, userToken.access_token);

            if (res?.success) {
                showToast("Added successfully", "success");
                await fetchData();
                setDrawerOpen(false);
                if (onRefresh) onRefresh();
            } else {
                showToast(res?.message || "Failed to add record", "error");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            showToast("An error occurred while saving", "error");
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (!config) {
        return null;
    }

    return (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flexGrow: 1 }}>
                <StyledDataGrid_relatedlist
                    getRowId={(row) => row.name || Math.random().toString()}
                    rows={rows}
                    columns={columns}
                    rowCount={totalCount}
                    loading={dataLoading}
                    paginationMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={handlePaginationChange}
                    sortingMode="server"
                    onSortModelChange={handleSortModelChange}
                    filterMode="server"
                    onFilterModelChange={handleFilterModelChange}
                    pageSizeOptions={[10, 20, 50]}
                    disableRowSelectionOnClick
                    hideFooterPagination={totalCount < 10}
                    rowHeight={40}
                    columnHeaderHeight={40}
                    slots={{ toolbar: CustomToolbar }}
                    slotProps={{
                        toolbar: {
                            title: config.label || "Stage History",
                            total: totalCount,
                            module: config.main_doctype_name,
                            onAddNew: handleAddNew,
                            isAddPermission: 1, // Assuming 1 for now or fetch from permissions
                            showTotal: false,
                            showSearch: false,
                            showAddNew: false,
                            showFilter: false,
                            titleVariant: "h6",
                            showExport: false,
                            showTitleCount: false,
                        } as unknown as Partial<GridToolbarProps>,
                    }}
                    sx={{
                        height: totalCount > 0 ? "auto" : 200,
                        "& .MuiDataGrid-footerContainer": {
                            display: totalCount < 10 ? "none" : "flex"
                        }
                    }}
                />
            </Box>

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: { xs: "100%", sm: 500 } } }}
            >
                <Box sx={{ p: 4, height: "100%", display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                        <Typography variant="h6">Add {config.label || "Stage History"}</Typography>
                        <IconButton onClick={() => setDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Divider sx={{ mb: 4 }} />
                    <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
                        {formLoading && !formFields.length ? (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <CustomForm
                                fields={formFields}
                                initialValues={{}}
                                onClose={() => setDrawerOpen(false)}
                                onSubmit={handleFormSubmit}
                                loading={formLoading}
                                moduleName={config.main_doctype_name}
                            />
                        )}
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};

export default StageHistory;
