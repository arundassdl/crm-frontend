import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCommonListingGet, fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "../ToastNotificationNew";
import { deleteClient } from "@/services/api/common-erpnext-api/create-edit-api";
import { columnsConfig } from "@/components/Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";
import AddEditLeadDrawer from "./CreateEdit";
import { Box, Link, Button, ButtonGroup, Stack, CircularProgress } from "@mui/material";
import DealsKanbanBoard from "./DealsKanbanBoard";
import { GridFilterModel, GridSortModel } from "@mui/x-data-grid";
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ReorderIcon from '@mui/icons-material/Reorder';
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import KanbanBoard from "../Common/KanbanBoard";
import { getFormFields } from "@/services/api/general_apis/layout-api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

interface DealProps {
  link_name?: string;
}
const DealsListing: React.FC<DealProps> = ({ link_name }) => {
  const module = "CRM Deal";
  const module_name = "Deals";
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
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list"); // NEW

  // Open dialog only when selectedRow is updated
  useEffect(() => {
    if (Object.keys(selectedRow).length > 0) {
      setOpen(true);
    }
  }, [selectedRow]);

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
    setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to force DataGrid reload
    CloseDialog();
  };
  const handleDelete = async (id: any) => {
    let deleteRecord = await deleteClient(module, id, userToken?.access_token);

    if (deleteRecord?.success == true) {
      showToast("Deleted successfully", "success");
    } else {
      showToast(deleteRecord?.message, "error");
    }
  };

  const handleRowDetail: any = async (name: any) => {
    router.push(`deals/detail/${name}`);
  };

  const [colFields, setColFields] = useState<any[]>([
    { doctype: module, field: "name", hidden: "True" },
  ]);
  const [columnDefs, setColumnDefs] = useState<any>(columnsConfig.deals);
  const [isFieldsLoaded, setIsFieldsLoaded] = useState(false);
  const include_contact = "True";
  const relatedDocs: string[] = [];
  const [joinQuery, setJoinQuery] = useState("");
  // const include_address = "True";

  const fetchDataWrapper = (fetchFunction: any, params: any, token: any) => {
    return fetchFunction(
      params,
      token,
      colFields,
      module,
      relatedDocs,
      include_contact,
      "True",
      "",
      joinQuery,
      "",
      userToken?.role_profile,
      userToken?.username
    );
  };

  const [dealRows, setDealRows] = useState<any[]>([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  const [pageOffset, setpageOffset] = useState<any>(0);
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  const [sortModel, setSortModel] = useState<GridSortModel>([]); // Type the state as GridSortModel
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [perPage, setPerPage] = useState<number>(Number(100));
  const listfields = [
    "name",
    "organization",
    "territory",
    "mobile_no",
    "email",
    "status",
    "close_date",
    "owner",
    "annual_revenue",
    "creation",
    "modified"
  ];

  const stages = [
    { label: "Qualification", index: 0, bgColor: "#525252", color: "var(--mui-palette-grey-700)" },
    { label: "Demo/Making", index: 1, bgColor: "rgb(212 90 8 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
    { label: "Proposal/Quotation", index: 2, bgColor: "rgb(0 123 224 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
    { label: "Negotiation", index: 3, bgColor: "rgb(209 147 13 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
    { label: "Ready to Close", index: 4, bgColor: "rgb(134 66 194 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
    { label: "Won", index: 5, bgColor: "rgb(19 121 73 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
    { label: "Lost", index: 6, bgColor: "rgb(204 41 41 / var(--tw-text-opacity, 1))", color: "var(--mui-palette-grey-700)" },
  ];
  const view_mode = useSelector((state: RootState) => state.viewMode.viewMode);

  useEffect(() => {
    const fetchFields = async () => {
      if (userToken?.access_token) {
        try {
          const response: any = await getFormFields(
            module_name,
            userToken.access_token,
            userToken.role_profile,
            ""
          );

          const fieldList: any[] = Array.isArray(response?.fields)
            ? response.fields
            : Array.isArray(response)
              ? response
              : [];

          const parsedColFields = fieldList
            .filter((field: any) => {
              if (field?.hide) return false;
              const isAddress =
                String(field?.type || field?.fieldtype || "")
                  .toLowerCase()
                  .trim() === "address";
              if (isAddress) return false;
              return true;
            })
            .map((field: any) => ({
              doctype: module,
              field: field.fieldname || field.name,
              headerName: field.label,
              hidden: field.in_list_view ? "False" : "True",
            }));

          const addressSubColFields: any[] = [];
          const joinParts: string[] = [];

          fieldList.forEach((field: any) => {
            if (
              String(field?.type || field?.fieldtype || "")
                .toLowerCase()
                .trim() === "address" &&
              Array.isArray(field.sub_fields)
            ) {
              const mainFieldName = field.fieldname || field.name;
              const subDoctype = field.sub_fields[0]?.doctype || "Address";
              const alias =
                mainFieldName.replace(/_address$/i, "_addr") ||
                mainFieldName + "_alias";
              const tableAlias = `tab${alias}`;

              joinParts.push(
                `LEFT JOIN \`tab${subDoctype}\` AS \`${tableAlias}\` ON \`tab${module}\`.\`${mainFieldName}\` = \`${tableAlias}\`.\`name\``
              );

              const mainFieldLabel =
                field.label || field.fieldname || field.name || "";
              const subHidden = field.in_list_view ? "False" : "True";

              field.sub_fields.forEach((sub: any) => {
                const subFieldName = sub.fieldname || sub.name;
                const subFieldAlias = `${mainFieldName}_${subFieldName}`;
                const subLabel = sub.label || subFieldName;
                const headerName = mainFieldLabel
                  ? `${mainFieldLabel} - ${subLabel}`
                  : subLabel;

                addressSubColFields.push({
                  doctype: alias,
                  field: subFieldName,
                  headerName,
                  hidden: subHidden,
                  subFieldAlias,
                });
              });
            }
          });

          setJoinQuery(joinParts.length > 0 ? joinParts.join(" ") : "");

          setColFields((prev: any) => {
            const currentKeys = new Set(
              prev.map((f: any) => `${f.doctype || module}:${f.field}`)
            );
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
              { doctype: module, field: "modified", hidden: "False", flex: 1, minWidth: 200, type: "date" },
            ].filter((f) => !finalKeys.has(f.field));

            return [...updatedFields, ...additionalFields];
          });

          const newColumnDefs: any = {};

          newColumnDefs["name"] = {
            headerName: "Name",
            flex: 1,
            minWidth: 150,
            type: "string",
            valueGetter: (_params: any, row: any) => row["name"],
          };

          fieldList.forEach((field: any) => {
            const fieldName = field.fieldname || field.name;
            const fieldType = String(field?.type || field?.fieldtype || "").toLowerCase();

            if (fieldName === "status") {
              newColumnDefs[fieldName] = columnsConfig.deals.status;
              return;
            }

            if (fieldName === "organization") {
              newColumnDefs[fieldName] = columnsConfig.deals.organization;
              return;
            }

            if (fieldName === "deal_name") {
              newColumnDefs[fieldName] = {
                headerName: field.label,
                flex: 1,
                minWidth: 150,
                type: "string",
                valueGetter: (params: any, row: any) => row[fieldName],
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
                          href={`/deals/detail/${id}`}
                          color="inherit"
                          underline="none"
                          rel="noopener noreferrer"
                        >
                          {params.row[fieldName]}
                        </Link>
                      ) : (
                        <span>{params.row[fieldName]}</span>
                      )}
                    </Box>
                  );
                },
              };
              return;
            }

            if (fieldType === "checkbox") {
              newColumnDefs[fieldName] = {
                headerName: field.label,
                flex: 1,
                minWidth: 120,
                type: "singleSelect",
                valueOptions: [
                  { value: true, label: "Yes" },
                  { value: false, label: "No" },
                ],
                valueGetter: (_params: any, row: any) => row[fieldName],
                renderCell: (params: any) => {
                  return params?.row?.[fieldName] ? (
                    <CheckCircleIcon sx={{ color: "green", fontSize: 20 }} titleAccess="Yes" />
                  ) : (
                    <CancelIcon color="error" sx={{ fontSize: 20 }} titleAccess="No" />
                  );
                },
              };
              return;
            }

            if (fieldType === "date") {
              newColumnDefs[fieldName] = {
                headerName: field.label,
                flex: 1,
                minWidth: 150,
                type: "date",
                valueGetter: (_params: any, row: any) => new Date(row[fieldName]),
              };
              return;
            }

            if (fieldType === "datetime") {
              newColumnDefs[fieldName] = {
                headerName: field.label,
                flex: 1,
                minWidth: 200,
                type: "datetime",
                valueGetter: (_params: any, row: any) => new Date(row[fieldName]),
              };
              return;
            }

            newColumnDefs[fieldName] = {
              headerName: field.label,
              flex: 1,
              minWidth: 150,
              type: "string",
              valueGetter: (_params: any, row: any) => row[fieldName],
            };
          });

          newColumnDefs["creation"] = columnsConfig.deals.creation;
          newColumnDefs["modified"] = columnsConfig.deals.modified;

          setColumnDefs((prev: any) => ({
            ...prev,
            ...newColumnDefs,
          }));
        } catch (error) {
          console.error("Deals Listing: Error fetching form fields:", error);
          setColFields([{ doctype: module, field: "name", hidden: "True" }]);
          setColumnDefs(columnsConfig.deals);
        } finally {
          setTimeout(() => setIsFieldsLoaded(true), 500);
        }
      } else {
        setIsFieldsLoaded(true);
      }
    };

    fetchFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken, module]);

  return (
    <div>
      <Box>
        {view_mode === "list" ? (
          !isFieldsLoaded ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <RawDynamicDataGrid
              module={module}
              heading={"Deals"}
              onAddNew={handleAddNew}
              handleRowDetail={handleRowDetail}
              handleRowDelete={handleDelete}
              colFields={colFields}
              columnDefinitions={columnDefs}
              relatedDocs={relatedDocs}
              fetchDataFunction={(p, t, q) =>
                fetchDataWrapper(fetchRawDataGridListing, p, t)
              }
              refreshKey={refreshKey}
              multipleViews={true}
              multiviewList={"Kanban"}
              module_name={module_name}
              btnnewtitle={"Deal"}
            />
          )
        ) : (
          <KanbanBoard stages={stages} listfields={listfields} module={module} title={"Deals"} fieldname={"status"} onAddNew={handleAddNew} refreshKey={refreshKey} multiviewList={"Kanban"} />
        )}

        {open && (
          <AddEditLeadDrawer
            initialValues={selectedRow}
            open={open}
            onClose={CloseDialog}
            operation={operation}
            onSubmit={handleFormSubmit}
          />
        )}
      </Box>
    </div>
  );

  // return (
  //   <>
  //     <DynamicDataGrid
  //       module={module}
  //       onAddNew={handleAddNew}
  //       handleRowDetail={handleRowDetail}
  //       handleRowEdit={handleRowEdit}
  //       handleRowDelete={handleDelete}
  //       colFields={colFields}
  //       listfields={listfields}
  //       columnDefinitions={columnsConfig.customers}
  //       fetchDataFunction={(p, t, q) =>
  //         fetchDataWrapper(fetchCommonListingGet, p, t, q)
  //       }
  //       refreshKey={refreshKey}
  //     />
  //     {open && (
  //       <AddEditCustomerDrawer
  //         initialValues={selectedRow}
  //         open={open}
  //         onClose={CloseDialog}
  //         operation={operation}
  //         onSubmit={handleFormSubmit}
  //       />
  //     )}
  //   </>
  // );
};

export default DealsListing;
