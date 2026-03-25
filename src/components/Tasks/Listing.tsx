import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "../ToastNotificationNew";
import { deleteClient } from "@/services/api/common-erpnext-api/create-edit-api";
import { columnsConfig } from "@/components/Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import KanbanBoard from "../Common/KanbanBoard";
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import DonutLargeIcon from '@mui/icons-material/DonutLarge'; //Backlog
import {HourglassBottom,CheckCircle,Cancel} from '@mui/icons-material';
import AddEditTaskDrawer from "./CreateEdit";

interface DealProps {
  link_name?: string;
}
const TasksListing: React.FC<DealProps> = ({ link_name }) => {
  const module = "CRM Task";
  const module_name = "Tasks";
  const router = useRouter();
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
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
    let deleteRecord = await deleteClient(module, id, userToken?.access_token);

    if (deleteRecord?.success == true) {
      showToast("Deleted successfully", "success");
    } else {
      showToast(deleteRecord?.message, "error");
    }
  };

  const colFields = [
    { doctype: module, field: "name", hidden: "True" },
    { doctype: module, field: "title", headerName: "Title", hidden: "False" },    
    { doctype: module, field: "description", hidden: "True" },
    { doctype: module, field: "priority", hidden: "False" },
    { doctype: module, field: "status", hidden: "False" },
    { doctype: module, field: "due_date", hidden: "False" },
    { doctype: module, field: "assigned_to", hidden: "False" },
    { doctype: module, field: "owner", hidden: "False" },
    { doctype: module, field: "creation", hidden: "False" },
    { doctype: module, field: "modified", hidden: "False" },
  ];
  const relatedDocs = [];
  const include_contact = "True";
  // const include_address = "True";

  const fetchDataWrapper = (fetchFunction, params, token) => {
    // return fetchFunction(params, token, colFields, module, relatedDocs, include_contact); // Ensure relatedDocs is passed
    return fetchFunction(params, token, colFields, module, relatedDocs,include_contact,'','','','',userToken?.role_profile,userToken?.username); // Ensure relatedDocs is passed
    // return fetchFunction(params, token, colFields, module); // Ensure relatedDocs is passed
  };

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
    { value: 'Backlog', index: 0, icon: <DonutLargeIcon fontSize="small" /> },
    { value: 'Todo', index: 1, icon: <RadioButtonUncheckedIcon fontSize="small"  sx={{ color: 'orange' }} /> },
    { value: 'In Progress', index: 2, icon: <HourglassBottom fontSize="small"  sx={{ color: '#f6c4bc' }} /> },
    { value: 'Done', index: 3, icon: <CheckCircle fontSize="small"  sx={{ color: 'green' }} /> },
    { value: 'Canceled', index: 4, icon: <Cancel fontSize="small"  sx={{ color: 'red' }} /> },
];
const view_mode = useSelector((state: RootState) => state.viewMode.viewMode);
const handleRowEdit = async (rowData: any) => {   
    
    // rowData.due_date = formatCalDate(rowData.due_date);
    console.log('Row Data--->',rowData)
    setSelectedRow(rowData);
    // OpenDialog();
    setOperation("Edit");
    return false;
  };
  
  return (
    <div>
      <Box> 
        {view_mode === "list" ? (
          <RawDynamicDataGrid
            module={module}
            heading={"Tasks"}
            onAddNew={handleAddNew}
            handleRowEdit={handleRowEdit}
            // handleRowDetail={handleRowDetail}
            handleRowDelete={handleDelete}
            colFields={colFields}
            columnDefinitions={columnsConfig.tasks}
            relatedDocs={relatedDocs}
            fetchDataFunction={(p, t, q) =>
              fetchDataWrapper(fetchRawDataGridListing, p, t)
            }
            refreshKey={refreshKey}
            multipleViews={true}
          />
         ) : (
          <KanbanBoard stages={statusOptions} listfields={listfields} module={module} title={"Tasks"} fieldname={"status"} onAddNew={handleAddNew} refreshKey={refreshKey}/>
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
