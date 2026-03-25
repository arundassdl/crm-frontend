import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddEditCustomerDrawer from "@/components/Customer/Createcustomer";
import { fetchRawDataGridListing } from "@/services/api/common-erpnext-api/listing-api-get";
import { showToast } from "@/components/ToastNotificationNew";
import { deleteClient } from "@/services/api/common-erpnext-api/create-edit-api";
import { fetchDetailData } from "@/services/api/common-erpnext-api/create-edit-api";
import { columnsConfig } from "@/components/Common/DataGrid/columnsConfig";
import RawDynamicDataGrid from "@/components/Common/DataGrid/RawDynamicDataGrid";
import AddEditAddressDrawer from "@/components/Customer/Detail/Createaddress";


interface addresslistProps {
  doc_name: string;
  doc_type: string;
  onSubmit?: () => void;
}

const CustomerAddresssListing: React.FC<addresslistProps> = ({doc_name, doc_type, onSubmit}) => {
  const module = "Address";
  const module_name = "Address";
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

  const handleEditRow = async (rowData: any) => {

    let getRecords = await fetchDetailData("Address", rowData?.name, userToken?.access_token);
    console.log("getRecords", getRecords);

    const baseData = getRecords?.record;
    const data = { ...baseData, phone: getRecords?.primary_mobile || getRecords?.record?.phone, email_id: getRecords?.primary_email || getRecords?.record?.email_id || "" };
    console.log("baseData 1111", baseData);
    console.log("data 1111", data);
    console.log("getRecords 1111", getRecords);

    const addresses = (getRecords?.related_address?.length > 0) ? getRecords?.related_address[0][0] : []
    // const { contact, addresses } = (await fetchContactWithAddress(rowData?.name, userToken?.access_token)) || {};

    rowData = data;
    if (Object.keys(addresses).length > 0) {
      // console.log("detail dataaddresses" , getRecords?.related_address[0][0]);
      rowData['address_name'] = addresses?.name;
      rowData['address_title'] = addresses?.address_title;
      rowData['address_line1'] = addresses?.address_line1;
      rowData['address_line2'] = addresses?.address_line2;
      rowData['address_type'] = addresses?.address_type;
      rowData['city'] = addresses?.city;
      rowData['state'] = addresses?.state;
      rowData['country'] = addresses?.country;
      rowData['pincode'] = addresses?.pincode;
      rowData['territory'] = addresses?.territory;
    }
    rowData['first_name'] = (data['first_name'] != null) ? data['first_name'] : data['full_name']
    console.log("detail data", rowData);
    // rowData["addresses"]
    setSelectedRow(rowData);

    // OpenDialog();
    setOperation("Edit");

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
    { doctype: module, field: "address_line1", hidden: "False" },
    { doctype: module, field: "address_line2", hidden: "False" },
    { doctype: module, field: "city", hidden: "False" },
    { doctype: module, field: "state", hidden: "False" },
    { doctype: module, field: "country", hidden: "False" },
    { doctype: module, field: "pincode", hidden: "False" },
    { doctype: module, field: "creation", hidden: "False" },
    { doctype: module, field: "modified", hidden: "False" },
  ];
  const relatedDocs = [];
  const Joinquery = " LEFT JOIN `tabDynamic Link` ON `tabAddress`.name = `tabDynamic Link`.parent and `tabDynamic Link`.parenttype = 'Address'";
  const whereconditon = " AND `tabDynamic Link`.link_doctype = '" + doc_type + "' AND `tabDynamic Link`.link_name = '" + doc_name + "'";
  // const whereconditon = ""
  const include_contact = "False";
  const include_address = "False";
  
  const fetchDataWrapper = (fetchFunction, params, token) => {
    // return fetchFunction(params, token, colFields, module, relatedDocs,include_contact); // Ensure relatedDocs is passed
    return fetchFunction(params, token, colFields, module, relatedDocs,include_contact,'','',Joinquery,whereconditon,userToken?.role_profile,userToken?.username); // Ensure relatedDocs is passed
  };

  return (
    <div>
      <RawDynamicDataGrid
        module={module}
        heading={"Address"}
        onAddNew={handleAddNew}
        handleRowDelete={handleDelete}
        handleRowEdit={handleEditRow}
        colFields={colFields}
        columnDefinitions={columnsConfig.customersaddress}
        relatedDocs={relatedDocs}
        fetchDataFunction={(p, t, q) =>
          fetchDataWrapper(fetchRawDataGridListing, p, t)
        }
        refreshKey={refreshKey}
        gridHeight="50vh"
      />
      {open && (
        <AddEditAddressDrawer initialValues={selectedRow} link_doctype={doc_type || "Address"} link_name={doc_name} open={open}  onClose={CloseDialog} operation={operation}  onSubmit={handleFormSubmit} /> 
      )}
    </div>
  );
};

export default CustomerAddresssListing;

