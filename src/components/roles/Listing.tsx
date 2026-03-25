import { useEffect, useState } from "react";
import {  useRouter } from "next/navigation";
import {
  fetchRawDataGridListing,
} from "@/services/api/common-erpnext-api/listing-api-get";
import AddEditConctactDrawer from "@/components/Customer/Detail/Createcontact";
import AddEditRoleDrawer from "@/components/roles/createrole";
import {
  deleteClient,
} from "@/services/api/common-erpnext-api/create-edit-api";
import { showToast } from "@/components/ToastNotificationNew";
import { columnsConfig } from "../Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";

interface RoleListingProps {
  // contact_list: any;
  link_name?: string;
}
const RoleListing: React.FC<RoleListingProps> = ({ link_name }) => {
  const module = "SDL Role";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Open dialog only when selectedRow is updated
  useEffect(() => {
    if (Object.keys(selectedRow).length > 0) {
      OpenDialog();
    }
  }, [selectedRow]);

  const handleRowEdit = async (rowData: any) => {   
    
    // rowData.due_date = formatCalDate(rowData.due_date);
    console.log('Row Data--->',rowData)
    setSelectedRow(rowData);
    // OpenDialog();
    setOperation("Edit");
    return false;
  };

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
    setRefreshKey((prevKey) => prevKey + 1); // Increment refreshKey to force DataGrid reload
    CloseDialog();
  };
 
  const handleDelete = async (id: any) => {
    // setDialogOpen(false);
    // let deleteRecord = await deleteClient(
    //   module,
    //   id,
    //   userToken?.access_token
    // );

    // if (deleteRecord?.success == true) {
    //   showToast("Deleted successfully", "success");
    //   // fetchData();
    // } else {
    //   showToast(deleteRecord?.message, "error");
    // }
  };
  const handleRowDetail: any = async (rowData: any) => {
    console.log(rowData, 'details');
    // router.push(`user/roles/detail/${role_name}`);
  };
  const colFields = [
    { doctype: module, field: "name", hidden: "True" },
    { doctype: module, field: "role_name", hidden: "False" },
    { doctype: module, field: "role_description", hidden: "True" },
    { doctype: module, field: "disabled", hidden: "False" },
    { doctype: module, field: "is_admin", hidden: "False" },
    { doctype: module, field: "creation", hidden: "False" },
    { doctype: module, field: "modified", hidden: "False" },
  ];
  // const relatedDocs = ["Dynamic Link", "Contact", "Address"];
  // const include_contact = "True";
  // const include_address = "True";
  
  const fetchDataWrapper = (fetchFunction, params, token) => {
    // return fetchFunction(params, token, colFields, module, []); // Ensure relatedDocs is passed
    return fetchFunction(params, token, colFields, module, [],'','','','','',userToken?.role_profile,userToken?.username); // Ensure relatedDocs is passed
  };


  return (
    <div>
      <RawDynamicDataGrid
        module={module}
        heading={"Roles"}
        onAddNew={handleAddNew}
        handleRowEdit={handleRowEdit}
        // handleRowDetail={handleRowDetail}
        handleRowDelete={handleDelete}
        colFields={colFields}
        columnDefinitions={columnsConfig.roles}
        fetchDataFunction={(p, t, q) =>
          fetchDataWrapper(fetchRawDataGridListing, p, t)
        }
        refreshKey={refreshKey}
      />
      {open && (
        <AddEditRoleDrawer
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

export default RoleListing;
