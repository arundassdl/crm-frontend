import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCommonListingGet, fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "@/components/ToastNotificationNew";
import { deleteClient, deleteCustomDocument } from "@/services/api/common-erpnext-api/create-edit-api";
import { get_userby_name } from "@/services/api/users/users-api";
import { columnsConfig } from "@/components/Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../../Common/DataGrid/RawDynamicDataGrid";
import AddEditUserDrawer from "./CreateEdit";
import { GridSortModel } from "@mui/x-data-grid";
import { GridFilterModel } from "@mui/x-data-grid";
import CommonKanbanBoard from "../../Common/CommonKanbanBoard";
import { Box, Button, ButtonGroup, Stack } from "@mui/material";
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ReorderIcon from '@mui/icons-material/Reorder';
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import KanbanBoard from "../../Common/KanbanBoard";

const UsersListing = () => {
  const module = "User";
  const module_name = "Users";
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

  const colFields = [
    { doctype: module, field: "name", hidden: "True" },
    { doctype: module, field: "username", hidden: "False" },    
    { doctype: module, field: "email", hidden: "False" },    
    { doctype: module, field: "mobile_no", hidden: "False" },
    { doctype: module, field: "enabled", hidden: "False" },
    { doctype: 'SDL Role', field: "role_name", hidden: "False" },
    { doctype: module, field: "creation", hidden: "False" },
    { doctype: module, field: "modified", hidden: "False" },
    { doctype: module, field: "user_image", hidden: "True" },
  ];
  const relatedDocs = ["SDL Role"];
  const include_contact = "False";
  const Joinquery = "INNER JOIN `tabSDL Role` ON `tabUser`.role_profile_name = `tabSDL Role`.role_profile";
  // const include_address = "True";
  
  const fetchDataWrapper = (fetchFunction, params, token) => {
    return fetchFunction(params, token, colFields, module, relatedDocs,include_contact,'','',Joinquery,'',userToken?.role_profile,userToken?.username); // Ensure relatedDocs is passed
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
    
    let getRecords = await get_userby_name(rowData,userToken?.access_token);
    console.log("getRecords",getRecords);
    
    // rowData.due_date = get_userby_name(rowData.due_date);
    console.log('Row Data--->',rowData)
    setSelectedRow(getRecords);
    // // OpenDialog();
    setOperation("Edit");
    return false;
  };
  return (
    <div>
      <Box>    
        {/* Conditionally render the views */}
       {view_mode === "list" ? (
      <RawDynamicDataGrid
        module={module}
        heading={"Users"}
        onAddNew={handleAddNew}
        handleRowEdit={handleRowEdit}
        // handleRowDetail={handleRowDetail}
        // handleRowDelete={handleDelete}
        colFields={colFields}
        columnDefinitions={columnsConfig.users}
        relatedDocs={relatedDocs}
        fetchDataFunction={(p, t, q) =>
          fetchDataWrapper(fetchRawDataGridListing, p, t)
        }
        refreshKey={refreshKey}
        multipleViews={false}
      />
       ) : (
          // <CommonKanbanBoard deals={leadRows} stages={stages} doctype="CRM Lead" fieldname="status" />
          <KanbanBoard stages={stages} listfields={listfields} module={module} title={"Leads"} fieldname={"status"} onAddNew={handleAddNew} refreshKey={refreshKey} />
        )}
      {open && (
        <AddEditUserDrawer
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

export default UsersListing;
