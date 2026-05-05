import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCommonListingGet, fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "../ToastNotificationNew";
import { deleteClient, deleteCustomDocument } from "@/services/api/common-erpnext-api/create-edit-api";
import { columnsConfig } from "@/components/Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";
import AddEditLeadDrawer from "./CreateEdit";
import { GridSortModel } from "@mui/x-data-grid";
import { GridFilterModel } from "@mui/x-data-grid";
import CommonKanbanBoard from "../Common/CommonKanbanBoard";
import { Box, Button, ButtonGroup, Stack, CircularProgress } from "@mui/material";
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ReorderIcon from '@mui/icons-material/Reorder';
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import KanbanBoard from "../Common/KanbanBoard";
import { getFormFields } from "@/services/api/general_apis/layout-api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const LeadsListing = () => {
  const module = "CRM Lead";
  const module_name = "Leads";
  const router = useRouter();
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });
  const [userPermission, setUserPermission] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("userpermission") || "[]"
    );
    // Ensure initialValue is an array before calling .find()
    const permissionArray = Array.isArray(initialValue) ? initialValue : [];
    // initialValue.filter(module => module.frontend_module === module_name);
    // console.log(initialValue.filter(module => module.frontend_module === module_name), 'userPermission');
    return permissionArray.find(module => module.frontend_module === module_name) || "";
  });
  const [operation, setOperation] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddPermission, setIsAddPermission] = useState(0);
  const [isEditPermission, setIsEditPermission] = useState(0);
  const [isDeletePermission, setIsDeletePermission] = useState(0);

  // Open dialog only when selectedRow is updated
  useEffect(() => {
    if (Object.keys(selectedRow).length > 0) {
      setOpen(true);
    }
  }, [selectedRow]);

  useEffect(() => {
    if (userPermission.hasOwnProperty('create')) {
      setIsAddPermission(userPermission.create);
      setIsEditPermission(userPermission.edit);
      setIsDeletePermission(userPermission.delete);
    }
    // console.log(userPermission, 'userPermission===>50 line');
  }, [userPermission]);

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
    // let deleteRecord = await deleteClient(module, id, userToken?.access_token);
    let deleteRecord = await deleteCustomDocument(module, id, userToken?.access_token);

    if (deleteRecord?.success == true) {
      showToast(deleteRecord?.message || "Deleted successfully", "success");
    } else {
      showToast(deleteRecord?.message, "error");
    }
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleRowDetail: any = async (name: any) => {
    router.push(`leads/detail/${name}`);
  };

  const defaultColFields = [
    { doctype: module, field: "name", hidden: "True" },
    { doctype: module, field: "lead_name", hidden: "False" },
  ];

  const [isFieldsLoaded, setIsFieldsLoaded] = useState(false);
  const [joinQuery, setJoinQuery] = useState("");
  const [colFields, setColFields] = useState<any[]>(defaultColFields);
  const [columnDefs, setColumnDefs] = useState<any>(columnsConfig.leads);
  const [relatedDocs] = useState<string[]>([]);
  const include_contact = "True";
  const include_address = "True";

  /** List / Kanban: only leads not yet converted (matches `converted` on CRM Lead). */
  const leadsNotConvertedWhere = " AND `tabCRM Lead`.`converted` = 0";

  useEffect(() => {
    const fetchFields = async () => {
      if (!userToken?.access_token) return;

      setIsFieldsLoaded(false);
      try {
        const response: any = await getFormFields(
          module_name,
          userToken?.access_token,
          userToken?.role_profile,
          ""
        );

        const fieldList: any[] = Array.isArray(response?.fields)
          ? response.fields
          : Array.isArray(response)
            ? response
            : Array.isArray(response?.data?.fields)
              ? response.data.fields
              : Array.isArray(response?.data)
                ? response.data
                : [];

        const parsedColFields: any[] = fieldList
          .filter((field: any) => {
            if (field?.hide) return false;
            const ft = String(field?.type || field?.fieldtype || "").toLowerCase();
            return ft !== "address";
          })
          .map((field: any) => ({
            doctype: module,
            field: field.fieldname || field.name,
            headerName: field.label,
            hidden: field.in_list_view ? "False" : "True",
          }));

        const joinParts: string[] = [];
        const addressSubColFields: any[] = [];

        fieldList.forEach((field: any) => {
          const ft = String(field?.type || field?.fieldtype || "").toLowerCase();
          if (ft !== "address") return;
          if (!Array.isArray(field?.sub_fields)) return;

          const mainFieldName = field.fieldname || field.name;
          if (!mainFieldName) return;

          const subDoctype = field.sub_fields[0]?.doctype || "Address";
          const alias =
            mainFieldName.replace(/_address$/i, "_addr") || `${mainFieldName}_alias`;
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
        });

        const merged = [...defaultColFields, ...parsedColFields, ...addressSubColFields];
        const seen = new Set<string>();
        const deduped = merged.filter((f: any) => {
          const key = `${f.doctype}:${f.field}`;
          if (!f.field) return false;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const updatedFields = deduped.map((f: any) => {
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

        setJoinQuery(joinParts.length ? joinParts.join(" ") : "");
        setColFields([...updatedFields, ...additionalFields]);

        const newColumnDefs: any = { ...(columnsConfig.leads || {}) };
        for (const f of parsedColFields) {
          const key = f.field;
          if (!key || newColumnDefs[key]) continue;

          const fieldMeta = fieldList.find(
            (x: any) => (x.fieldname || x.name) === key
          );
          const ft = String(fieldMeta?.type || fieldMeta?.fieldtype || "").toLowerCase();

          if (ft === "checkbox") {
            newColumnDefs[key] = {
              flex: 1,
              minWidth: 150,
              type: "singleSelect",
              valueOptions: [
                { value: 1, label: "Yes" },
                { value: 0, label: "No" },
              ],
              valueGetter: (_params: any, row: any) => row?.[key],
              renderCell: (params: any) =>
                params?.row?.[key] ? (
                  <CheckCircleIcon sx={{ color: "green", fontSize: 20 }} />
                ) : (
                  <CancelIcon color="error" sx={{ fontSize: 20 }} />
                ),
            };
          } else if (ft === "date") {
            newColumnDefs[key] = {
              flex: 1,
              minWidth: 150,
              type: "date",
              valueGetter: (_: any, row: any) => new Date(row?.[key]),
            };
          } else if (ft === "datetime") {
            newColumnDefs[key] = {
              flex: 1,
              minWidth: 200,
              type: "dateTime",
              valueGetter: (_: any, row: any) => new Date(row?.[key]),
            };
          } else {
            newColumnDefs[key] = {
              flex: 1,
              minWidth: 150,
              type: "string",
              valueGetter: (_: any, row: any) => row?.[key],
            };
          }
        }

        newColumnDefs.creation = columnsConfig.leads.creation;
        newColumnDefs.modified = columnsConfig.leads.modified;

        setColumnDefs(newColumnDefs);
      } catch (e) {
        console.error("LeadsListing fetchFields error:", e);
        setColFields(defaultColFields);
        setJoinQuery("");
        setColumnDefs(columnsConfig.leads);
      } finally {
        setIsFieldsLoaded(true);
      }
    };

    fetchFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken?.access_token, userToken?.role_profile]);

  const fetchDataWrapper = (fetchFunction, params, token) => {
    return fetchFunction(
      params,
      token,
      colFields,
      module,
      relatedDocs,
      include_contact,
      include_address,
      "",
      joinQuery,
      leadsNotConvertedWhere,
      userToken?.role_profile,
      userToken?.username
    );
  };

  const [viewMode, setViewMode] = useState<"list" | "kanban">("list"); // NEW
  const [leadRows, setLeadRows] = useState<any[]>([]);
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
    "lead_name",
    "organization",
    "territory",
    "mobile_no",
    "email",
    "status",
    "owner",
    "creation",
    "modified"
  ];

  const stages = [
    { label: "New", index: 0, bgColor: "#525252", color: "var(--mui-palette-grey-700)" },
    { label: "Contacted", index: 1, bgColor: "#e06c39", color: "var(--mui-palette-grey-700)" },
    { label: "Nurture", index: 2, bgColor: "#007adb", color: "var(--mui-palette-grey-700)" },
    { label: "Qualified", index: 3, bgColor: "#00794c", color: "var(--mui-palette-grey-700)" },
    { label: "Unqualified", index: 4, bgColor: "#d62a30", color: "var(--mui-palette-grey-700)" },
    { label: "Junk", index: 5, bgColor: "#8a40be", color: "var(--mui-palette-grey-700)" },
  ];
  const view_mode = useSelector((state: RootState) => state.viewMode.viewMode);
  const handleRowEdit = async (rowData: any) => {

    // rowData.due_date = formatCalDate(rowData.due_date);
    console.log('Row Data--->', rowData)
    setSelectedRow(rowData);
    // OpenDialog();
    setOperation("Edit");
    return false;
  };
  return (
    <div>
      {!isFieldsLoaded ? (
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
        <Box>
          {/* Conditionally render the views */}
          {view_mode === "list" ? (
            <RawDynamicDataGrid
              module={module}
              heading={"Leads"}
              onAddNew={handleAddNew}
              // handleRowEdit={handleRowEdit }
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
              btnnewtitle={"Lead"}
            />
          ) : (
            // <CommonKanbanBoard deals={leadRows} stages={stages} doctype="CRM Lead" fieldname="status" />
            <KanbanBoard
              stages={stages}
              listfields={listfields}
              module={module}
              title={"Leads"}
              fieldname={"status"}
              onAddNew={handleAddNew}
              refreshKey={refreshKey}
              module_name={module_name}
              multiviewList={"Kanban"}
              whereCondition={leadsNotConvertedWhere}
            />
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
      )}
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

export default LeadsListing;
