import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    fetchRawDataGridListing,
} from "@/services/api/common-erpnext-api/listing-api-get";
import AddEditCustomerDrawer from "@/components/Customer/Createcustomer";
import { showToast } from "@/components/ToastNotificationNew";
import { deleteClient } from "@/services/api/common-erpnext-api/create-edit-api";
import { columnsConfig } from "@/components/Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "@/components/Common/DataGrid/RawDynamicDataGrid";
import AccountGridView from "@/components/Customer/AccountGridView";
import { getFormFields } from "@/services/api/general_apis/layout-api";
import { getVibrantAvatarColor } from "@/@core/utils/avatarColor";
import { Box, Link, CircularProgress } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const CustomerListing: React.FC = () => {
    const module = "CRM Organization";
    const module_name = "Accounts";
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
    ]);
    const [columnDefs, setColumnDefs] = useState<any>(columnsConfig.customers);
    const [isFieldsLoaded, setIsFieldsLoaded] = useState(false);
    const [relatedDocs] = useState<string[]>([]);
    const [joinQuery, setJoinQuery] = useState("");

    useEffect(() => {
        if (Object.keys(selectedRow).length > 0) {
            setOpen(true);
        }
    }, [selectedRow]);

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

                    const fieldList: any[] = Array.isArray(response?.fields)
                        ? response.fields
                        : Array.isArray(response)
                            ? response
                            : [];

                    if (fieldList.length > 0) {
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
                                    `LEFT JOIN \`tab${subDoctype}\` AS \`${tableAlias}\` ON \`tab${module}\`.\`${mainFieldName}\` = \`${tableAlias}\`.\`name\``
                                );
                                const mainFieldLabel = field.label || field.fieldname || field.name || "";
                                const subHidden = field.in_list_view ? "False" : "True";
                                field.sub_fields.forEach((sub: any) => {
                                    const subFieldName = sub.fieldname || sub.name;
                                    const subFieldAlias = `${mainFieldName}_${subFieldName}`;
                                    const subLabel = sub.label || subFieldName;
                                    const headerName = mainFieldLabel ? `${mainFieldLabel} - ${subLabel}` : subLabel;
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
                            const currentKeys = new Set(prev.map(f => `${f.doctype || module}:${f.field}`));
                            const combined = [...parsedColFields, ...addressSubColFields];
                            const newFields = combined.filter((f: any) => {
                                const key = `${f.doctype || module}:${f.field}`;
                                if (currentKeys.has(key)) return false;
                                currentKeys.add(key);
                                return true;
                            });
                            const baseFields = [...prev, ...newFields];
                            const updatedFields = baseFields.map((f: any) => {
                                if (f.field === "creation" || f.field === "modified") {
                                    return { ...f, hidden: "False" };
                                }
                                return f;
                            });
                            const finalKeys = new Set(updatedFields.map((f: any) => f.field));
                            const additionalFields = [
                                { doctype: module, field: "creation", hidden: "False", flex: 1, minWidth: 200, type: "date" },
                                { doctype: module, field: "modified", hidden: "False", flex: 1, minWidth: 200, type: "date" }
                            ].filter((f) => !finalKeys.has(f.field));
                            return [...updatedFields, ...additionalFields];
                        });

                        const newColumnDefs: any = {};
                        newColumnDefs["name"] = {
                            headerName: "Name",
                            flex: 1,
                            minWidth: 150,
                            type: "string",
                            valueGetter: (params: any, row: any) => row ? row["name"] : ""
                        };

                        fieldList.forEach((field: any) => {
                            const fieldKey = field.fieldname || field.name;
                            if (fieldKey === "organization_name") {
                                newColumnDefs[fieldKey] = {
                                    headerName: field.label,
                                    flex: 1,
                                    minWidth: 150,
                                    type: "string",
                                    valueGetter: (params: any, row: any) => row ? row[fieldKey] : "",
                                    renderCell: (params: any) => {
                                        const id = params.row?.name || params.id;
                                        const accName = String(params.row?.[fieldKey] || params.row?.name || "");
                                        const tileColor = getVibrantAvatarColor(accName);
                                        const tileInitials = accName.trim().substring(0, 2).toUpperCase();
                                        return (
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    "&:hover": { color: "primary.main" },
                                                }}
                                                className="gap-2.5"
                                            >
                                                <Box
                                                    sx={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: "8px",
                                                        backgroundColor: tileColor,
                                                        color: "#fff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "11px",
                                                        fontWeight: 800,
                                                        flexShrink: 0,
                                                        boxShadow: "0 1px 4px rgba(12,36,114,0.15)",
                                                    }}
                                                >
                                                    {tileInitials}
                                                </Box>
                                                {id ? (
                                                    <Link
                                                        href={`/accounts/detail/${id}`}
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
                                    flex: 1,
                                    minWidth: 120,
                                    type: "singleSelect",
                                    valueOptions: [
                                        { value: true, label: "Yes" },
                                        { value: false, label: "No" }
                                    ],
                                    valueGetter: (params: any, row: any) => row ? row[fieldKey] : false,
                                    renderCell: (params: any) => {
                                        return params?.row?.[fieldKey] ? (
                                            <CheckCircleIcon sx={{ color: "green", fontSize: 20 }} titleAccess="Yes" />
                                        ) : (
                                            <CancelIcon color="error" sx={{ fontSize: 20 }} titleAccess="No" />
                                        );
                                    },
                                };
                            } else if (field.type === "date") {
                                newColumnDefs[fieldKey] = {
                                    headerName: field.label,
                                    flex: 1,
                                    minWidth: 150,
                                    type: "date",
                                    valueGetter: (params: any, row: any) => row ? new Date(row[fieldKey]) : null
                                };
                            } else if (field.type === "datetime") {
                                newColumnDefs[fieldKey] = {
                                    headerName: field.label,
                                    flex: 1,
                                    minWidth: 200,
                                    type: "datetime",
                                    valueGetter: (params: any, row: any) => row ? new Date(row[fieldKey]) : null
                                };
                            } else {
                                newColumnDefs[fieldKey] = {
                                    headerName: field.label,
                                    flex: 1,
                                    minWidth: 150,
                                    type: "string",
                                    valueGetter: (params: any, row: any) => {
                                        if (!row) return "";
                                        return row[fieldKey] !== undefined ? row[fieldKey] :
                                            row[`tab${module}.${fieldKey}`] !== undefined ? row[`tab${module}.${fieldKey}`] :
                                                row[`${module}.${fieldKey}`] !== undefined ? row[`${module}.${fieldKey}`] :
                                                    "";
                                    }
                                };
                            }
                        });

                        newColumnDefs["creation"] = columnsConfig.customers.creation;
                        newColumnDefs["modified"] = columnsConfig.customers.modified;

                        setColumnDefs((prev: any) => ({
                            ...prev,
                            ...newColumnDefs
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching form fields:", error);
                } finally {
                    setTimeout(() => setIsFieldsLoaded(true), 500);
                }
            } else {
                setIsFieldsLoaded(true);
            }
        };
        fetchFields();
    }, [userToken, module]);

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
            const deleteRecord = await deleteClient(module, id, userToken?.access_token);
            if (deleteRecord?.success === true) {
                showToast("Deleted successfully", "success");
                setRefreshKey(prev => prev + 1);
            } else {
                showToast(deleteRecord?.message || "Delete failed", "error");
            }
        } catch (error) {
            console.error("Error deleting customer:", error);
            showToast("An error occurred while deleting", "error");
        }
    };

    const handleRowDetail = (name: any) => {
        router.push(`/accounts/detail/${encodeURIComponent(name)}`);
    };

    const fetchDataWrapper = (fetchFunction: any, params: any, token: any) => {
        return fetchFunction(
            params,
            token,
            colFields,
            module,
            relatedDocs,
            "True",
            "True",
            "",
            joinQuery,
            "",
            userToken?.role_profile,
            userToken?.username
        );
    };

    if (!isFieldsLoaded) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px"
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div>
            <RawDynamicDataGrid
                module={module}
                heading={"Accounts"}
                onAddNew={handleAddNew}
                handleRowDetail={handleRowDetail}
                handleRowDelete={handleDelete}
                colFields={colFields}
                columnDefinitions={columnDefs}
                fetchDataFunction={(p, t, q) => fetchDataWrapper(fetchRawDataGridListing, p, t)}
                refreshKey={refreshKey}
                module_name={module_name}
                btnnewtitle="Account"
                multipleViews={true}
                availableViews={["list", "grid"]}
                gridViewComponent={AccountGridView}
            />
            {open && (
                <AddEditCustomerDrawer
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

export default CustomerListing;
