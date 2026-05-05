import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    fetchRawDataGridListing,
} from "@/services/api/common-erpnext-api/listing-api-get";
import AddTerritoryDrawer from "@/components/territory/AddTerritoryDrawer";
import { showToast } from "@/components/ToastNotificationNew";
import { columnsConfig } from "../Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import TreeviewBoard from "@/components/Common/TreeViewBoard";
import { delete_territory } from "@/services/api/territory/territory-api";
import { getFormFields } from "@/services/api/general_apis/layout-api";
import { Box, Link, CircularProgress } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const TerritoryListing: React.FC = () => {
    const module = "CRM Territory"; // Verify with backend doctype name
    const module_name = "Territories";
    const router = useRouter();
    const [userToken, setUserToken] = useState<any>(() => {
        const initialValue = JSON.parse(
            readAccessTokenDataRaw()
        );
        return initialValue || "";
    });
    const [operation, setOperation] = useState("");
    const [open, setOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const [colFields, setColFields] = useState<any[]>([
        { doctype: module, field: "name", hidden: "True" },
        // { doctype: module, field: "territory_name", headerName: "Territory Name", hidden: "False" },
        // { doctype: module, field: "parent_crm_territory", headerName: "Parent Territory", hidden: "False" },
        // { doctype: module, field: "territory_manager", headerName: "Territory Manager", hidden: "False" },
        // { doctype: module, field: "creation", hidden: "False" },
        // { doctype: module, field: "modified", hidden: "False" },
    ]);

    const [columnDefs, setColumnDefs] = useState<any>(columnsConfig.territories);
    const [isFieldsLoaded, setIsFieldsLoaded] = useState(false);
    const [relatedDocs, setRelatedDocs] = useState<string[]>([]);
    const [joinQuery, setJoinQuery] = useState("");

    useEffect(() => {
        if (Object.keys(selectedRow).length > 0) {
            OpenDialog();
        }
    }, [selectedRow]);

    useEffect(() => {
        console.log("TerritoryListing: colFields state updated:", colFields);
    }, [colFields]);

    useEffect(() => {
        const fetchFields = async () => {
            if (userToken?.access_token) {
                try {
                    const response: any = await getFormFields(
                        module_name,
                        userToken?.access_token,
                        userToken.role_profile,
                        ""
                    );

                    // Support current shape: { fields: [...], layout_name, name }
                    // and fall back to older shapes if needed.
                    const fieldList: any[] = Array.isArray(response?.fields)
                        ? response.fields
                        : Array.isArray(response)
                        ? response
                        : [];


                    if (fieldList.length > 0) {
                        if (fieldList[0]?.in_list_view) {
                            console.log(
                                "TerritoryListing: First field keys:",
                                Object.keys(fieldList[0].in_list_view)
                            );
                        }
                        const parsedColFields = fieldList
                            .filter((field: any) => {
                                if (field.hide) return false;
                                const isAddress = String(field.type || field.fieldtype || "").toLowerCase() === "address";
                                if (isAddress) return false;
                                return true;
                            })
                            .map((field: any) => ({
                                doctype: module,
                                field: field.fieldname || field.name,
                                headerName: field.label,
                                hidden: field.in_list_view ? "False" : "True"
                            }));

                        // Include address sub-fields (for joined Address data) when type is 'address'
                        // Use a unique alias per address field so the same table can be joined multiple times (e.g. billing_addr, shipping_addr)
                        const addressSubColFields: any[] = [];
                        const relatedDoctypes = new Set<string>();
                        const joinParts: string[] = [];
                        fieldList.forEach((field: any) => {
                            if (
                                String(field.type || field.fieldtype || "").toLowerCase() ===
                                    "address" &&
                                Array.isArray(field.sub_fields)
                            ) {
                                const mainFieldName = field.fieldname || field.name;
                                const subDoctype = field.sub_fields[0]?.doctype || "Address";
                                relatedDoctypes.add(subDoctype);
                                const alias =
                                    mainFieldName.replace(/_address$/i, "_addr") ||
                                    mainFieldName + "_alias";
                                // Backend builds select fields as `tab${doctype}.${field}`.
                                // So the SQL alias must also be prefixed with `tab` to match (e.g. `tabbilling_addr`).
                                const tableAlias = `tab${alias}`;
                                joinParts.push(
                                    `LEFT JOIN \`tab${subDoctype}\` AS \`${tableAlias}\` ON \`tab${module}\`.\`${mainFieldName}\` = \`${tableAlias}\`.\`name\``
                                );
                                const mainFieldLabel = field.label || field.fieldname || field.name || "";
                                const subHidden = field.in_list_view ? "False" : "True";
                                // const subHidden = "False";
                                field.sub_fields.forEach((sub: any) => {
                                    const subFieldName = sub.fieldname || sub.name;
                                    const subFieldAlias = `${mainFieldName}_${subFieldName}`;
                                    const subLabel = sub.label || subFieldName;
                                    const headerName = mainFieldLabel
                                        ? `${mainFieldLabel} - ${subLabel}`
                                        : subLabel;
                                    // Use subFieldAlias for the logical field key so backend
                                    // can alias: `tabbilling_addr`.`country` AS `billing_address_country`
                                    addressSubColFields.push({
                                        doctype: alias,
                                        field: subFieldName,
                                        headerName,
                                        hidden: subHidden,
                                        subFieldAlias: subFieldAlias,
                                    });
                                });
                            }
                        });
                        setJoinQuery(joinParts.length > 0 ? joinParts.join(" ") : "");

                        setColFields((prev) => {
                            const currentKeys = new Set(
                                prev.map(f => `${f.doctype || module}:${f.field}`)
                            );
                            const combined = [...parsedColFields, ...addressSubColFields];
                            const newFields = combined.filter((f: any) => {
                                const key = `${f.doctype || module}:${f.field}`;
                                if (currentKeys.has(key)) {
                                    return false;
                                }
                                currentKeys.add(key);
                                return true;
                            });
                            
                            // Add creation and modified fields
                            const additionalFields = [
                                { doctype: module, field: "creation", hidden: "False", width: 200, type: "date" },
                                { doctype: module, field: "modified", hidden: "False", width: 200, type: "date" }
                            ].filter(f => !currentKeys.has(`${f.doctype}:${f.field}`));
                            
                            return [...prev, ...newFields, ...additionalFields];
                        });

                        const newColumnDefs: any = {};
                        
                        // Add name column (hidden but needed for links)
                        newColumnDefs["name"] = {
                            headerName: "Name",
                            width: 150,
                            type: "string",
                            valueGetter: (params: any, row: any) => row["name"]
                        };
                        
                        fieldList.forEach((field: any) => {
                            // Special handling for territory_name to add link
                            if (field.name === "territory_name") {
                                newColumnDefs[field.name] = {
                                    headerName: field.label,
                                    width: 150,
                                    type: "string",
                                    valueGetter: (params: any, row: any) => row[field.name],
                                    renderCell: (params: any) => {
                                        const territoryId = params.row?.name || params.id;
                                        console.log("Territory Row Data:", params.row, "ID:", territoryId);
                                        
                                        return (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    "&:hover": {
                                                        color: "primary.main",
                                                    },
                                                }}
                                                className="gap-2"
                                            >
                                                {territoryId ? (
                                                    <Link
                                                        href={`/setup/territories/detail/${territoryId}`}
                                                        color="inherit"
                                                        underline="none"
                                                        rel="noopener noreferrer"
                                                    >
                                                        {params.row.territory_name}
                                                    </Link>
                                                ) : (
                                                    <span>{params.row.territory_name}</span>
                                                )}
                                            </Box>
                                        );
                                    },
                                };
                            } else if (field.type === "checkbox") {
                                // Special handling for checkbox fields to show icons
                                newColumnDefs[field.name] = {
                                    headerName: field.label,
                                    width: 120,
                                    type: "singleSelect",
                                    valueOptions: [
                                        { value: true, label: "Yes" },
                                        { value: false, label: "No" }
                                    ],
                                    valueGetter: (params: any, row: any) => row[field.name],
                                    renderCell: (params: any) => {
                                        return params?.row?.[field.name] ? (
                                            <CheckCircleIcon
                                                sx={{ color: "green", fontSize: 20 }}
                                                titleAccess="Yes"
                                            />
                                        ) : (
                                            <CancelIcon 
                                                color="error" 
                                                sx={{ fontSize: 20 }} 
                                                titleAccess="No" 
                                            />
                                        );
                                    },
                                };
                            } else if (field.type === "date") {
                                newColumnDefs[field.name] = {
                                    headerName: field.label,
                                    width: 150,
                                    type: "date",
                                    valueGetter: (params: any, row: any) => new Date(row[field.name])
                                };
                            } else if (field.type === "datetime") {
                                newColumnDefs[field.name] = {
                                    headerName: field.label,
                                    width: 200,
                                    type: "datetime",
                                    valueGetter: (params: any, row: any) => new Date(row[field.name])
                                };
                            } else {
                                newColumnDefs[field.name] = {
                                    headerName: field.label,
                                    width: 150,
                                    type: "string",
                                    valueGetter: (params: any, row: any) => row[field.name]
                                };
                            }
                        });

                        // Add creation and modified columns using shared columnsConfig formatting
                        newColumnDefs["creation"] = columnsConfig.territories.creation;
                        newColumnDefs["modified"] = columnsConfig.territories.modified;

                        setColumnDefs((prev: any) => ({
                            ...prev,
                            ...newColumnDefs
                        }));

                        
                    }
                } catch (error) {
                    console.error("Error fetching form fields:", error);
                } finally {
                    console.log("TerritoryListing: colFields state updated finally:", colFields);
                    setTimeout(() => {
                        setIsFieldsLoaded(true);
                    }, 1000);
                }
            } else {
                setIsFieldsLoaded(true);
            }
        };
        fetchFields();
    }, [userToken, module]);

    //   const handleRowEdit = async (rowData: any) => {   
    //     setSelectedRow(rowData);
    //     setOperation("Edit");
    //     return false;
    //   };

    const OpenDialog = () => {
        setOpen(true);
    };

    const CloseDialog = () => {
        setSelectedRow([]);
        setOpen(false);
    };
    const handleAddNew = () => {
        setSelectedRow([]);
        setOperation("New");
        setOpen(true);
    };
    const handleFormSubmit = () => {
        setRefreshKey((prevKey) => prevKey + 1);
        CloseDialog();
    };

    const handleDelete = async (id: any) => {
        try {
            const request = {
                name: id,
            };

            const deleteResponse = await delete_territory(request, userToken?.access_token);

            if (deleteResponse?.msg === "success") {
                showToast("Territory deleted successfully", "success");
                setRefreshKey(prev => prev + 1);
            } else {
                showToast(deleteResponse?.error || "Failed to delete territory", "error");
            }
        } catch (error) {
            console.error("Error deleting territory:", error);
            showToast("An error occurred while deleting the territory", "error");
        }
    };

    const fetchDataWrapper = (fetchFunction, params, token) => {
        return fetchFunction(params, token, colFields, module, relatedDocs, '', '', '', joinQuery, '', userToken?.role_profile, userToken?.username);
    };

    const listfields = [];

    const view_mode = useSelector((state: RootState) => state.viewMode.viewMode);



    if (!isFieldsLoaded) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '400px' 
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div>

            {view_mode === "list" ? (
                    <RawDynamicDataGrid
                    module={module}
                    heading={"Territories"}
                    onAddNew={handleAddNew}
                    handleRowDelete={handleDelete}
                    colFields={colFields}
                    columnDefinitions={columnDefs}
                    fetchDataFunction={(p, t, q) =>
                        fetchDataWrapper(fetchRawDataGridListing, p, t)
                    }
                    refreshKey={refreshKey}
                    multipleViews={true}
                    multiviewList={"Tree"}
                    module_name={module_name}
                />
                
            ) : (
                <TreeviewBoard listfields={listfields} module={module} title={"Territories"} fieldname={"territory_name"} onAddNew={handleAddNew} refreshKey={refreshKey} module_name={module_name} multiviewList={"Tree"} />
            )}


            {open && (
                <AddTerritoryDrawer
                    initialValues={selectedRow}
                    open={open}
                    onClose={CloseDialog}
                    operation={operation}
                    onSubmit={handleFormSubmit}
                />
            )}
        </div>
    );
};

export default TerritoryListing;

