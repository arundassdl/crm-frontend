"use client";
import { readAccessTokenDataParsed } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useState, useCallback } from "react";
import { Box, Typography, Link, CircularProgress } from "@mui/material";
import { GridColDef, GridSortModel, GridFilterModel, GridToolbarProps, GridColumnVisibilityModel } from "@mui/x-data-grid";
import StyledDataGrid_relatedlist from "@/@core/theme/overrides/datagrid_relatedlist";
import CustomToolbar from "@/@core/theme/overrides/datagridcustomtoolbar";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "@/components/ToastNotificationNew";
import AddEditTaskDrawer from "@/components/Tasks/CreateEdit";
import { getFormFields } from "@/services/api/general_apis/layout-api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

interface TaskRelatedListProps {
    parent_module: string;
    parent_doctype: string;
    link_name: string; // parent record ID
    config: any; // related list config from get_relatedlist API
    onRefresh?: () => void;
    refreshTrigger?: number;
}

const TaskRelatedList: React.FC<TaskRelatedListProps> = ({
    parent_module,
    parent_doctype,
    link_name,
    config,
    onRefresh,
    refreshTrigger
}) => {
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [columns, setColumns] = useState<GridColDef[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [sortModel, setSortModel] = useState<GridSortModel>([]);
    const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [], quickFilterValues: [] });
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [colFields, setColFields] = useState<any[]>([]);
    const [columnDefs, setColumnDefs] = useState<any>({});
    const [isFieldsLoaded, setIsFieldsLoaded] = useState(false);
    const [joinQuery, setJoinQuery] = useState("");
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});

    const [userToken] = useState<any>(() => {
        try {
            return readAccessTokenDataParsed() || {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const fetchFields = async () => {
            if (userToken?.access_token && config?.main_doctype_name) {
                try {
                    const moduleName = config.child_module || "Tasks";
                    const response: any = await getFormFields(
                        moduleName,
                        userToken?.access_token,
                        userToken.role_profile,
                        ""
                    );

                    const fieldList: any[] = Array.isArray(response?.fields)
                        ? response.fields
                        : Array.isArray(response)
                            ? response
                            : [];

                    if (fieldList.length > 0) {
                        const newColumnDefs: any = {};
                        const parsedColFields = fieldList
                            .filter((field: any) => {
                                if (field.hide) return false;
                                const isAddress = String(field.type || field.fieldtype || "").toLowerCase() === "address";
                                if (isAddress) return false;
                                return true;
                            })
                            .map((field: any) => ({
                                doctype: config.main_doctype_name,
                                field: field.fieldname || field.name,
                                headerName: field.label,
                                hidden: field.in_list_view ? "False" : "True"
                            }));

                        const addressSubColFields: any[] = [];
                        const joinParts: string[] = [];
                        fieldList.forEach((field: any) => {
                            if (
                                String(field.type || field.fieldtype || "").toLowerCase() === "address" &&
                                Array.isArray(field.sub_fields)
                            ) {
                                const mainFieldName = field.fieldname || field.name;
                                const subDoctype = field.sub_fields[0]?.doctype || "Address";
                                const alias =
                                    mainFieldName.replace(/_address$/i, "_addr") || mainFieldName + "_alias";
                                const tableAlias = `tab${alias}`;
                                joinParts.push(
                                    `LEFT JOIN \`tab${subDoctype}\` AS \`${tableAlias}\` ON \`tab${config.main_doctype_name}\`.\`${mainFieldName}\` = \`${tableAlias}\`.\`name\``
                                );
                                const mainFieldLabel = field.label || field.fieldname || field.name || "";
                                const subHidden = field.in_list_view ? "False" : "True";
                                field.sub_fields.forEach((sub: any) => {
                                    const subFieldName = sub.fieldname || sub.name;
                                    const subFieldAlias = `${mainFieldName}_${subFieldName}`;
                                    const subKey = `${alias}.${subFieldName}`;
                                    const subLabel = sub.label || subFieldName;
                                    const headerName = mainFieldLabel ? `${mainFieldLabel} - ${subLabel}` : subLabel;

                                    addressSubColFields.push({
                                        doctype: alias,
                                        field: subFieldName,
                                        headerName,
                                        hidden: subHidden,
                                        subFieldAlias: subFieldAlias,
                                        sortable: false,
                                    });

                                    newColumnDefs[subKey] = {
                                        headerName: headerName,
                                        width: 150,
                                        valueGetter: (_value: any, row: any) => {
                                            const r = row ?? {};
                                            return r[subFieldAlias] ?? r[subKey] ?? r[`tab${subKey}`] ?? r[subFieldName] ?? "";
                                        }
                                    };
                                });
                            }
                        });
                        setJoinQuery(joinParts.length > 0 ? joinParts.join(" ") : "");

                        setColFields(() => {
                            const initial = [{ doctype: config.main_doctype_name, field: "name", hidden: "True" }];
                            const currentKeys = new Set(initial.map(f => `${f.doctype}:${f.field}`));
                            const combined = [...parsedColFields, ...addressSubColFields];
                            const newFields = combined.filter((f: any) => {
                                const key = `${f.doctype}:${f.field}`;
                                if (currentKeys.has(key)) return false;
                                currentKeys.add(key);
                                return true;
                            });
                            return [...initial, ...newFields];
                        });

                        newColumnDefs["name"] = {
                            headerName: "Name",
                            width: 150,
                            type: "string",
                            valueGetter: (_value: any, row: any) => row?.name || ""
                        };

                        fieldList.forEach((field: any) => {
                            const fieldKey = field.fieldname || field.name;
                            if (fieldKey === "title") {
                                newColumnDefs[fieldKey] = {
                                    headerName: field.label,
                                    width: 250,
                                    type: "string",
                                    valueGetter: (_value: any, row: any) => row[fieldKey],
                                    renderCell: (params: any) => {
                                        const id = params.row?.name || params.id;
                                        return (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    "&:hover": { color: "primary.main" },
                                                }}
                                                className="gap-2"
                                            >
                                                {id ? (
                                                    <Link
                                                        href={`/tasks/detail/${id}`}
                                                        color="inherit"
                                                        underline="none"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {params.row[fieldKey]}
                                                    </Link>
                                                ) : (
                                                    <span>{params.row[fieldKey]}</span>
                                                )}
                                            </Box>
                                        );
                                    },
                                };
                            } else if (field.type === "checkbox") {
                                newColumnDefs[fieldKey] = {
                                    headerName: field.label,
                                    width: 120,
                                    type: "singleSelect",
                                    valueOptions: [
                                        { value: true, label: "Yes" },
                                        { value: false, label: "No" }
                                    ],
                                    valueGetter: (_value: any, row: any) => {
                                        const val = row?.[fieldKey] ?? row?.[`tab${config.main_doctype_name}.${fieldKey}`];
                                        return val === 1 || val === true;
                                    },
                                    renderCell: (params: any) => {
                                        return params?.value ? (
                                            <CheckCircleIcon sx={{ color: "green", fontSize: 20 }} titleAccess="Yes" />
                                        ) : (
                                            <CancelIcon color="error" sx={{ fontSize: 20 }} titleAccess="No" />
                                        );
                                    },
                                };
                            } else if (field.type === "date") {
                                newColumnDefs[fieldKey] = {
                                    headerName: field.label,
                                    width: 150,
                                    type: "date",
                                    valueGetter: (_value: any, row: any) => {
                                        const val = row?.[fieldKey] || row?.[`tab${config.main_doctype_name}.${fieldKey}`];
                                        return val ? new Date(val) : null;
                                    }
                                };
                            } else if (field.type === "datetime") {
                                newColumnDefs[fieldKey] = {
                                    headerName: field.label,
                                    width: 200,
                                    type: "datetime",
                                    valueGetter: (_value: any, row: any) => {
                                        const val = row?.[fieldKey] || row?.[`tab${config.main_doctype_name}.${fieldKey}`];
                                        return val ? new Date(val) : null;
                                    }
                                };
                            } else {
                                newColumnDefs[fieldKey] = {
                                    headerName: field.label,
                                    width: 150,
                                    type: "string",
                                    valueGetter: (value: any, row: any) => {
                                        if (!row) return "";
                                        return row[fieldKey] !== undefined ? row[fieldKey] :
                                            row[`tab${config.main_doctype_name}.${fieldKey}`] !== undefined ? row[`tab${config.main_doctype_name}.${fieldKey}`] :
                                                "";
                                    }
                                };
                            }
                        });

                        setColumnDefs(newColumnDefs);
                    }
                } catch (error) {
                    console.error("Error fetching form fields:", error);
                } finally {
                    setIsFieldsLoaded(true);
                }
            } else {
                setIsFieldsLoaded(true);
            }
        };
        fetchFields();
    }, [userToken?.access_token, config, userToken?.role_profile]);

    useEffect(() => {
        const newModel: GridColumnVisibilityModel = {};
        const relatedCols = config?.related_column || [];
        const visibleFields = new Set(
            relatedCols
                .filter((rc: any) => rc.in_list_view)
                .map((rc: any) => rc.field_name)
        );

        colFields.forEach((field) => {
            const fieldKey = field.doctype === config.main_doctype_name ? field.field : `${field.doctype}.${field.field}`;
            if (visibleFields.has(field.field) || visibleFields.has(fieldKey)) {
                newModel[fieldKey] = true;
            } else {
                newModel[fieldKey] = false;
            }
        });
        setColumnVisibilityModel(newModel);
    }, [colFields, config?.related_column]);

    const buildColumns = useCallback(() => {
        if (!isFieldsLoaded || colFields.length === 0) return;

        const relatedCols = config?.related_column || [];
        const orderMap = new Map<string, number>(relatedCols.map((rc: any) => [rc.field_name, Number(rc.order ?? 1000)]));

        const cols: GridColDef[] = colFields
            .map(f => {
                const isMain = f.doctype === config.main_doctype_name;
                const fieldKey = isMain ? f.field : `${f.doctype}.${f.field}`;
                const baseDef = columnDefs[fieldKey] || columnDefs[f.field] || {};

                return {
                    field: fieldKey,
                    headerName: f.headerName || f.field,
                    flex: 1,
                    minWidth: 150,
                    ...baseDef
                };
            });

        cols.sort((a, b) => {
            const orderA = Number(orderMap.get(a.field) ?? 1000);
            const orderB = Number(orderMap.get(b.field) ?? 1000);
            return orderA - orderB;
        });

        setColumns(cols);
    }, [colFields, columnDefs, isFieldsLoaded, config?.related_column]);

    const fetchData = useCallback(async () => {
        if (!config || !userToken?.access_token || !link_name || !isFieldsLoaded) return;

        setDataLoading(true);
        try {
            const fetchParams = {
                page: paginationModel.page,
                pageSize: paginationModel.pageSize,
                filters: filterModel,
                sort: sortModel.map((s) => ({
                    ...s,
                    field: s.field.includes(".") ? s.field : `${config.main_doctype_name}.${s.field}`,
                })),
            };

            let whereconditon = "";
            if (parent_module === "Contacts") {
                whereconditon = ` AND \`tab${config.main_doctype_name}\`.\`contact_name\` = '${link_name}'`;
            } else {
                let refDoctype = "";
                if (parent_module === "Accounts") refDoctype = "CRM Organization";
                else if (parent_module === "Leads") refDoctype = "CRM Leads";
                else if (parent_module === "Deals") refDoctype = "CRM Deals";

                if (refDoctype) {
                    whereconditon = ` AND \`tab${config.main_doctype_name}\`.\`reference_docname\` = '${link_name}' AND \`tab${config.main_doctype_name}\`.\`reference_doctype\` = '${refDoctype}'`;
                } else {
                    whereconditon = ` AND \`tab${config.main_doctype_name}\`.\`${config.link_field_name}\` = '${link_name}'`;
                }
            }

            const result = await fetchRawDataGridListing(
                fetchParams,
                userToken.access_token,
                colFields as any,
                config.main_doctype_name,
                [],
                "",
                "",
                [],
                joinQuery,
                whereconditon,
                "",
                "",
                `${config.main_doctype_name}.modified desc`,
                "True"
            );

            setRows(result.data || []);
            setTotalCount(result.totalCount || 0);
        } catch (error) {
            console.error("Error fetching task related list data:", error);
            showToast("Failed to load task data", "error");
        } finally {
            setDataLoading(false);
        }
    }, [config, paginationModel, sortModel, filterModel, userToken?.access_token, link_name, colFields, isFieldsLoaded, joinQuery, parent_module]);

    useEffect(() => {
        buildColumns();
    }, [buildColumns]);

    useEffect(() => {
        if (config) {
            fetchData();
        }
    }, [config, link_name, refreshTrigger, fetchData]);

    const handlePaginationChange = (model: any) => {
        setPaginationModel(model);
    };

    const handleSortModelChange = (model: GridSortModel) => {
        setSortModel(model);
    };

    const handleFilterModelChange = (model: GridFilterModel) => {
        setFilterModel(model);
    };

    const handleAddNew = () => {
        setDrawerOpen(true);
    };

    const handleFormSubmit = () => {
        fetchData();
        setDrawerOpen(false);
        if (onRefresh) onRefresh();
    };

    const getInitialValues = () => {
        const values: any = {};
        if (parent_module === "Contacts") {
            values.contact_name = link_name;
        } else {
            let refDoctype = "";
            if (parent_module === "Accounts") refDoctype = "CRM Organization";
            else if (parent_module === "Leads") refDoctype = "CRM Leads";
            else if (parent_module === "Deals") refDoctype = "CRM Deals";

            if (refDoctype) {
                values.reference_docname = link_name;
                values.reference_doctype = refDoctype;
            } else {
                values[config.link_field_name] = link_name;
            }
        }
        return values;
    };

    if (loading || !isFieldsLoaded) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (!config) return null;

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
                    columnVisibilityModel={columnVisibilityModel}
                    onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
                    pageSizeOptions={[10, 20, 50]}
                    disableRowSelectionOnClick
                    hideFooterPagination={totalCount < 10}
                    rowHeight={40}
                    columnHeaderHeight={40}
                    slots={{ toolbar: CustomToolbar }}
                    slotProps={{
                        toolbar: {
                            title: config.label || "Tasks",
                            total: totalCount,
                            module: config.main_doctype_name,
                            onAddNew: handleAddNew,
                            showTotal: false,
                            showSearch: false,
                            showAddNew: true,
                            showFilter: false,
                            showExport: false,
                            showColumns: true,
                            titleVariant: "h6",
                            showTitleCount: false,
                            btnnewtitle: "Task",
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

            {drawerOpen && (
                <AddEditTaskDrawer
                    initialValues={getInitialValues()}
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    operation="New"
                    onSubmit={handleFormSubmit}
                />
            )}
        </Box>
    );
};

export default TaskRelatedList;
