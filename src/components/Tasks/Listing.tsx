import { useEffect, useState } from "react";
import { useCrmSession } from "@/components/CrmSessionContext";
import { useRouter } from "next/navigation";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "../ToastNotificationNew";
import { deleteClient } from "@/services/api/common-erpnext-api/create-edit-api";
import { columnsConfig } from "@/components/Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";
import TaskGridView from "@/components/Tasks/TaskGridView";
import TaskKanbanView from "@/components/Tasks/TaskKanbanView";
import { getTaskStatusToken } from "@/components/Tasks/taskTokens";
import { Box, CircularProgress, Link } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import { HourglassBottom, CheckCircle, Cancel } from "@mui/icons-material";
import AddEditTaskDrawer from "./CreateEdit";
import { getFormFields } from "@/services/api/general_apis/layout-api";
import { GridFilterModel, GridSortModel } from "@mui/x-data-grid";

interface DealProps {
  link_name?: string;
}
const TasksListing: React.FC<DealProps> = ({ link_name }) => {
  const module = "CRM Task";
  const module_name = "Tasks";
  const router = useRouter();
  const session = useCrmSession();
  const [operation, setOperation] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>([]);
  const [refreshKey, setRefreshKey] = useState(0);

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
    let deleteRecord = await deleteClient(module, id, "");

    if (deleteRecord?.success == true) {
      showToast("Deleted successfully", "success");
    } else {
      showToast(deleteRecord?.message, "error");
    }
  };

  const handleRowDetail: any = async (name: any) => {
    router.push(`/tasks/detail/${name}`);
  };

  const [colFields, setColFields] = useState<any[]>([
    { doctype: module, field: "name", hidden: "True" },
  ]);
  const [columnDefs, setColumnDefs] = useState<any>(columnsConfig.tasks);
  const [isFieldsLoaded, setIsFieldsLoaded] = useState(false);
  const relatedDocs: string[] = [];
  const include_contact = "True";
  const [joinQuery, setJoinQuery] = useState("");

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
      "",
      ""
    );
  };

  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [perPage, setPerPage] = useState<number>(Number(100));

  const listfields = [
    "name",
    "title",
    "description",
    "due_date",
    "assigned_to",
    "priority",
    "status",
    "owner",
    "creation",
    "modified"
  ];


  const statusOptions = [
    { value: "Backlog", index: 0, icon: <DonutLargeIcon fontSize="small" /> },
    {
      value: "Todo",
      index: 1,
      icon: <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "orange" }} />,
    },
    {
      value: "In Progress",
      index: 2,
      icon: <HourglassBottom fontSize="small" sx={{ color: "#f6c4bc" }} />,
    },
    { value: "Done", index: 3, icon: <CheckCircle fontSize="small" sx={{ color: "green" }} /> },
    { value: "Canceled", index: 4, icon: <Cancel fontSize="small" sx={{ color: "red" }} /> },
  ];
  const view_mode = useSelector((state: RootState) => state.viewMode.viewMode);

  /** Status tabs + Kanban columns, coloured with the shared task tokens. */
  const taskStages = statusOptions.map((o, index) => ({
    label: o.value,
    index,
    bgColor: getTaskStatusToken(o.value).dot,
    color: "var(--mui-palette-grey-700)",
  }));

  /**
   * Per-status record counts for the filter tabs. Without these,
   * RawDynamicDataGrid falls back to `active ? rowCount : 0`, which renders every
   * inactive tab as 0. One count query per status (pageSize 1 — we only read
   * totalCount), mirroring the Deals/Leads listings.
   */
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchAllCounts = async () => {
      if (!session || !isFieldsLoaded || colFields.length <= 1) return;

      const statuses = ["All", ...statusOptions.map((o) => o.value)];
      const countsObj: Record<string, number> = {};

      try {
        // Filter on the status column as it exists in colFields, so the key is
        // qualified the same way the backend expects (e.g. "CRM Task.status").
        const statusCol = colFields.find(
          (f: any) => String(f.field).toLowerCase() === "status"
        );
        const statusKey = `${statusCol?.doctype || module}.status`;

        await Promise.all(
          statuses.map(async (statusVal) => {
            const params = {
              page: 0,
              pageSize: 1,
              filters: {
                items:
                  statusVal === "All"
                    ? []
                    : [{ field: statusKey, operator: "equals", value: statusVal }],
                quickFilterValues: [],
              },
              sort: [],
            };
            const res = await fetchDataWrapper(
              fetchRawDataGridListing,
              params,
              ""
            );
            countsObj[statusVal] = res?.totalCount || 0;
          })
        );

        setStatusCounts(countsObj);
      } catch (err) {
        console.error("Error fetching task status counts:", err);
      }
    };

    fetchAllCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, colFields, isFieldsLoaded, refreshKey]);

  useEffect(() => {
    const fetchFields = async () => {
      if (session) {
        try {
          const response: any = await getFormFields(
            module_name,
            "",
            "",
            ""
          );

          const fieldList: any[] = Array.isArray(response?.fields)
            ? response.fields
            : Array.isArray(response)
              ? response
              : [];

          const parsedColFields = fieldList
            .filter((field: any) => !field?.hide)
            .map((field: any) => ({
              doctype: module,
              field: field.fieldname || field.name,
              headerName: field.label,
              hidden: field.in_list_view ? "False" : "True",
            }));

          setJoinQuery("");

          setColFields((prev: any) => {
            const currentKeys = new Set(prev.map((f: any) => `${f.doctype || module}:${f.field}`));
            const newFields = parsedColFields.filter((f: any) => {
              const key = `${f.doctype || module}:${f.field}`;
              if (currentKeys.has(key)) return false;
              currentKeys.add(key);
              return true;
            });

            const baseFields = [...prev, ...newFields];
            // Ensure creation and modified are visible
            const updatedFields = baseFields.map(f => {
              if (f.field === "creation" || f.field === "modified") {
                return { ...f, hidden: "False" };
              }
              return f;
            });

            const finalKeys = new Set(updatedFields.map(f => f.field));
            const additionalFields = [
              { doctype: module, field: "creation", hidden: "False", flex: 1, minWidth: 200, type: "date" },
              { doctype: module, field: "modified", hidden: "False", flex: 1, minWidth: 200, type: "date" },
              // Fields the Grid/Kanban cards render. The SELECT is driven by colFields,
              // so if the layout omits these the rows come back without them (blank
              // cards). Fetched hidden — they add no columns to the List view.
              { doctype: module, field: "title", hidden: "True" },
              { doctype: module, field: "status", hidden: "True" },
              { doctype: module, field: "priority", hidden: "True" },
              { doctype: module, field: "due_date", hidden: "True" },
              { doctype: module, field: "description", hidden: "True" },
              { doctype: module, field: "assigned_to", hidden: "True" },
            ].filter((f) => !finalKeys.has(f.field));

            return [...updatedFields, ...additionalFields];
          });

          const newColumnDefs: any = {
            name: {
              headerName: "Name",
              flex: 1,
              minWidth: 150,
              type: "string",
              valueGetter: (_params: any, row: any) => row.name,
            },
          };

          fieldList.forEach((field: any) => {
            const fieldName = field.fieldname || field.name;
            const fieldType = String(field?.type || field?.fieldtype || "").toLowerCase();

            if (fieldName === "title") {
              newColumnDefs[fieldName] = {
                headerName: field.label,
                flex: 1,
                minWidth: 250,
                type: "string",
                valueGetter: (_params: any, row: any) => row[fieldName],
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

            if (fieldType === "date") {
              newColumnDefs[fieldName] = {
                headerName: field.label,
                flex: 1,
                minWidth: 150,
                type: "date",
                valueGetter: (_params: any, row: any) =>
                  row[fieldName] ? new Date(row[fieldName]) : null,
              };
              return;
            }

            if (fieldType === "datetime") {
              newColumnDefs[fieldName] = {
                headerName: field.label,
                flex: 1,
                minWidth: 200,
                type: "datetime",
                valueGetter: (_params: any, row: any) =>
                  row[fieldName] ? new Date(row[fieldName]) : null,
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

          newColumnDefs.creation = columnsConfig.tasks.creation;
          newColumnDefs.modified = columnsConfig.tasks.modified;

          setColumnDefs((prev: any) => ({
            ...prev,
            ...newColumnDefs,
          }));
        } catch (error) {
          console.error("Tasks Listing: Error fetching form fields:", error);
          setColFields([{ doctype: module, field: "name", hidden: "True" }]);
          setColumnDefs(columnsConfig.tasks);
        } finally {
          setTimeout(() => setIsFieldsLoaded(true), 500);
        }
      } else {
        setIsFieldsLoaded(true);
      }
    };

    fetchFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, module]);

  return (
    <div>
      <Box>
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
          /* RawDynamicDataGrid owns all three views (List / Grid / Kanban). */
          <RawDynamicDataGrid
            module={module}
            heading={"Tasks"}
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
            availableViews={["list", "grid", "kanban"]}
            gridViewComponent={TaskGridView}
            kanbanViewComponent={TaskKanbanView}
            stages={taskStages}
            statusCounts={statusCounts}
            statusField="status"
            module_name={module_name}
            btnnewtitle={"Task"}
          />
        )}

        {open && (
          <AddEditTaskDrawer
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
};

export default TasksListing;
