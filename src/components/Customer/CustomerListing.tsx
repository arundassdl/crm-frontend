import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddEditCustomerDrawer from "@/components/Customer/Createcustomer";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "../ToastNotificationNew";
import { deleteClient } from "@/services/api/common-erpnext-api/create-edit-api";
import { columnsConfig } from "@/components/Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "../Common/DataGrid/RawDynamicDataGrid";

const CustomersListing = () => {
  const module = "CRM Organization";
  const module_name = "Accounts";
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
 
  const handleRowDetail: any = async (name: any) => {
    router.push(`customers/detail/${name}`);
  };

  const colFields = [
    { doctype: module, field: "name", hidden: "True" },
    { doctype: module, field: "organization_name", hidden: "False" },
    { doctype: module, field: "website", hidden: "False" },
    { doctype: module, field: "territory", hidden: "False" },
    // { doctype: module, field: "image", hidden: "True" },
    { doctype: module, field: "no_of_employees", hidden: "False" },
    // { doctype: module, field: "address", hidden: "False" },
    { doctype: module, field: "creation", hidden: "False" },
    { doctype: module, field: "modified", hidden: "False" },
  ];
  const relatedDocs = ["Dynamic Link", "Address"];
  const include_contact = "True";
  const include_address = "True";
  
  const fetchDataWrapper = (fetchFunction, params, token) => {
    // return fetchFunction(params, token, colFields, module, relatedDocs,include_contact); // Ensure relatedDocs is passed
    return fetchFunction(params, token, colFields, module, relatedDocs,include_contact,'','','','',userToken?.role_profile,userToken?.username); // Ensure relatedDocs is passed
  };

  return (
    <div>
      <RawDynamicDataGrid
        module={module}
        heading={"Accounts"}
        onAddNew={handleAddNew}
        handleRowDetail={handleRowDetail}
        handleRowDelete={handleDelete}
        colFields={colFields}
        columnDefinitions={columnsConfig.customers}
        relatedDocs={relatedDocs}
        fetchDataFunction={(p, t, q) =>
          fetchDataWrapper(fetchRawDataGridListing, p, t)
        }
        refreshKey={refreshKey}
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

export default CustomersListing;
