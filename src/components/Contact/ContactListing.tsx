import { useEffect, useState } from "react";
import {  useRouter } from "next/navigation";
import {
  fetchRawDataGridListing,
} from "@/services/api/common-erpnext-api/listing-api-get";
import AddEditConctactDrawer from "@/components/Customer/Detail/Createcontact";
import {
  deleteClient,
} from "@/services/api/common-erpnext-api/create-edit-api";
import { showToast } from "@/components/ToastNotificationNew";
import { columnsConfig } from "../Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";

interface ContactListingProps {
  // contact_list: any;
  link_name?: string;
}
const ContactListingMain: React.FC<ContactListingProps> = ({ link_name }) => {
  const module = "Contact";
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
    setDialogOpen(false);
    let deleteRecord = await deleteClient(
      "Contact",
      id,
      userToken?.access_token
    );

    if (deleteRecord?.success == true) {
      showToast("Deleted successfully", "success");
      // fetchData();
    } else {
      showToast(deleteRecord?.message, "error");
    }
  };
  const handleRowDetail: any = async (name: any) => {
    router.push(`contacts/detail/${name}`);
  };
  const colFields = [
    { doctype: "Contact", field: "name", hidden: "True" },
    { doctype: "Contact", field: "full_name", hidden: "False" },
    { doctype: "Contact", field: "email_id", hidden: "False" },
    { doctype: "Contact", field: "phone", hidden: "False" },
    { doctype: "Contact", field: "image", hidden: "True" },
    { doctype: "Contact", field: "creation", hidden: "False" },
    { doctype: "Contact", field: "modified", hidden: "False" },
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
        onAddNew={handleAddNew}
        handleRowDetail={handleRowDetail}
        handleRowDelete={handleDelete}
        colFields={colFields}
        columnDefinitions={columnsConfig.contacts}
        fetchDataFunction={(p, t, q) =>
          fetchDataWrapper(fetchRawDataGridListing, p, t)
        }
        refreshKey={refreshKey}
      />
      {open && (
        <AddEditConctactDrawer
          initialValues={selectedRow}
          link_name=""
          open={open}
          onClose={CloseDialog}
          operation={operation}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );

  // return (
  //   <>  
  //     <DynamicDataGrid
  //       module={module}
  //       onAddNew={handleAddNew}
  //       handleRowDetail={handleRowDetail}
  //       handleRowEdit={handleEditRow}
  //       handleRowDelete={handleDelete}
  //       colFields={colFields}
  //       listfields={listfields}
  //       columnDefinitions={columnsConfig.contacts}
  //       fetchDataFunction={fetchData}
  //       refreshKey={refreshKey}
  //     />

  //     {open && (
  //       <AddEditConctactDrawer
  //         initialValues={selectedRow}
  //         link_name={""}
  //         open={open}
  //         onClose={CloseDialog}
  //         operation={operation}
  //         onSubmit={handleFormSubmit}
  //       />
  //     )}
  //   </>
  // );
};

export default ContactListingMain;
