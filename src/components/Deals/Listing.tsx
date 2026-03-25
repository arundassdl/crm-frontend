import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCommonListingGet, fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "../ToastNotificationNew";
import { deleteClient } from "@/services/api/common-erpnext-api/create-edit-api";
import { columnsConfig } from "@/components/Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";
import AddEditLeadDrawer from "./CreateEdit";
import { Box, Button, ButtonGroup, Stack } from "@mui/material";
import DealsKanbanBoard from "./DealsKanbanBoard";
import { GridFilterModel, GridSortModel } from "@mui/x-data-grid";
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ReorderIcon from '@mui/icons-material/Reorder';
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import KanbanBoard from "../Common/KanbanBoard";

interface DealProps {
  link_name?: string;
}
const DealsListing: React.FC<DealProps> = ({ link_name }) => {
  const module = "CRM Deal";
  const module_name = "Deals";
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

  const colFields = [
    { doctype: module, field: "name", hidden: "True" },
    { doctype: module, field: "organization", headerName: "Account", hidden: "False" },
    // { doctype: module, field: "account", hidden: "False" },
    // { doctype: module, field: "website", hidden: "False" },
    { doctype: module, field: "territory", hidden: "False" },
    // { doctype: module, field: "image", hidden: "True" },
    { doctype: module, field: "mobile_no", hidden: "False" },
    { doctype: module, field: "email", hidden: "False" },
    { doctype: module, field: "status", hidden: "False" },
    { doctype: module, field: "close_date", hidden: "False" },
    { doctype: module, field: "creation", hidden: "False" },
    { doctype: module, field: "modified", hidden: "False" },
  ];
  const relatedDocs = ["Dynamic Link", "Contact"];
  const include_contact = "True";
  // const include_address = "True";

  const fetchDataWrapper = (fetchFunction, params, token) => {
    // return fetchFunction(params, token, colFields, module, relatedDocs, include_contact); // Ensure relatedDocs is passed
    return fetchFunction(params, token, colFields, module, relatedDocs,include_contact,'','','','',userToken?.role_profile,userToken?.username); // Ensure relatedDocs is passed
    // return fetchFunction(params, token, colFields, module); // Ensure relatedDocs is passed
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

  return (
    <div>
      <Box> 
        {view_mode === "list" ? (
          <RawDynamicDataGrid
            module={module}
            heading={"Deals"}
            onAddNew={handleAddNew}
            handleRowDetail={handleRowDetail}
            handleRowDelete={handleDelete}
            colFields={colFields}
            columnDefinitions={columnsConfig.deals}
            relatedDocs={relatedDocs}
            fetchDataFunction={(p, t, q) =>
              fetchDataWrapper(fetchRawDataGridListing, p, t)
            }
            refreshKey={refreshKey}
            multipleViews={true}
          />
         ) : (
          <KanbanBoard stages={stages} listfields={listfields} module={module} title={"Deals"} fieldname={"status"} onAddNew={handleAddNew} refreshKey={refreshKey}/>
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
