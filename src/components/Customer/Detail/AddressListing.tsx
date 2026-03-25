import { useEffect, useState } from "react";
import {
  GridActionsCellItem,
  GridRowId,
  GridToolbarProps,
} from "@mui/x-data-grid";
import { GridSortModel, GridFilterModel } from "@mui/x-data-grid";
import {
  Box,
  debounce,  
} from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StyledDataGrid from "@/@core/theme/overrides/datagrid";
import CustomAvatar from "@/@core/components/mui/Avatar";
import classnames from "classnames";
import { GridColDef } from "@mui/x-data-grid";
import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import { fetchCommonListingGet, getDetailData } from "@/services/api/common-erpnext-api/listing-api-get";
import Link from "@/components/Link";
import CustomToolbar from "@/@core/theme/overrides/datagridcustomtoolbar";
// import { fetchRecordsWithLinks } from "@/services/api/common-erpnext-api/create-update-custom-api";
import AddEditAddressDrawer from "./Createaddress";
import { showToast } from "@/components/ToastNotificationNew";
import { deleteResource, fetchDetailData } from "@/services/api/common-erpnext-api/create-edit-api";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
// import { fetchListingWithLinkedData } from "@/services/api/common-erpnext-api/common-listing-api";

interface ExtendedGridToolbarProps extends GridToolbarProps {
  title?: string;
  total?: number;
  module?: string;
  onAddNew?: () => void;
}
interface AddressListingProps {
  doctype: string;
  link_name: string;
}

const AddressListing: React.FC<AddressListingProps> = ({ doctype,link_name }) => {
  const [contacts, setContacts] = useState<any>([]);
  const [contactCount, setContactCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { query }: any = router;
  const limit = searchParams.get("limit") ? searchParams.get("limit") : 20;
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
  const [perPage, setPerPage] = useState<number>(Number(limit));
  const [pageSizeOptions, setPageSizeOptions] = useState<any>([20, 50, 100]);
  const params = new URLSearchParams(searchParams);
  const [controller, setController] = useState({
    page: pageOffset,
    rowsPerPage: Number(perPage),
  });
  const [listFields, setListFields] = useState<any>([]);
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
  const [selectedRowId, setSelectedRowId] = useState<any | null>(null);
  const [err, setErr] = useState<boolean>(false);

   // Open dialog only when selectedRow is updated
   useEffect(() => {
    console.log("rowData ==============edit selectedRow", selectedRow);

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
  const handleAddNew = (e) => {
    setSelectedRow([]);
    setOperation("New");
    setOpen(true);
  };
  const handleDetails: any = async (name: any, type: any) => {
    router.push(`customers/detail/${name}`);
  };
   const handleDeleteRow = (id: GridRowId) => () => {   
      setSelectedRowId(id);
      setDialogOpen(true);
      
    };
    const handleDeleteClick = (id: GridRowId) => () => {
  
      if (id != undefined) {
        handleDelete(id);
      } else {      
        setDialogOpen(false);
      }
    };
    const handleDelete = async (id: any) => { 
      setDialogOpen(false);
      let deleteRecord = await deleteResource("Address",id,userToken?.access_token);
      console.log("deleteRecord?.data",deleteRecord?.data);
      
      if(deleteRecord?.data == "ok"){
        showToast("Deleted successfully", "success");
        fetchData();
      }else{
        showToast(deleteRecord?.error, "error");
      }
    }
  const handleEditRow = async (rowData: any) => { 
    
    let getRecords = await fetchDetailData("Address",rowData?.name,userToken?.access_token);
    console.log("getRecords",getRecords);
    
    const contact = getRecords?.record
    const addresses = (getRecords?.related_address?.length>0)?getRecords?.related_address[0]:[]
    // const { contact, addresses } = (await fetchContactWithAddress(rowData?.name, userToken?.access_token)) || {};
    
    rowData = contact;
    console.log("detail dataaddresses" , getRecords?.related_address);
    if(Object.keys(addresses).length>0){
      rowData['address_line1'] = addresses?.address_line1;
      rowData['address_line2'] = addresses?.address_line2;
      rowData['address_type'] = addresses?.address_type;
      rowData['city'] = addresses?.city;
      rowData['state'] = addresses?.state;
      rowData['country'] = addresses?.country;
      rowData['pincode'] = addresses?.pincode;
    }
    console.log("detail data", rowData);
    // rowData["addresses"]
    setSelectedRow(rowData);
   
    // OpenDialog();
    setOperation("Edit");

  };
  const handleSortModelChange = (sortModel) => {
    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams(url.search);
    let sortParams = "";
    if (sortModel?.length > 0) {
      const sortQuery = sortModel
        .map((item) => `${item.field}=${item.sort}`)
        .join("&");
      if (sortQuery != "") {
        sortParams = `[${sortQuery}]`;
      }
    }
    if (sortParams != "") {
      searchParams.set("sort", sortParams);
    } else {
      searchParams.delete("sort");
    }
    url.search = searchParams.toString();
    router.push(url.search);
    setSortModel(sortModel);
  };
  const handleFilterModelChange = debounce((filterModel) => {
    setFilterModel(filterModel);
  }, 1000);
  const handlePaginationChange = (newPaginationModel) => {
    const { page, pageSize } = newPaginationModel;
    // Update URL with new pagination state
    router.replace(pathname, {
      ...query,
      page: page,
      limit: pageSize,
    });
    setController({
      page: pageSize !== perPage ? 0 : page,
      rowsPerPage: pageSize,
    });
    setPerPage(pageSize);
    setPaginationModel({ page: page, pageSize: pageSize });
  };
  const fetchParams = {
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    filters: filterModel,
    sort: sortModel,      
  };

  const listfields = [
    "name",
    "address_title",     
    "address_type",
    "address_line1",
    "address_line2",
    "city",
    "country",
    "state",
    "pincode",
    "is_primary_address",
    "territory",
    "creation",
    "modified",
  ];
 
  
  const fetchData = async () => {
    setLoading(true);
    // const customerData = await fetchListingWithLinkedData(
    //   params,
    //   userToken?.access_token,
    //   ['*'],
    //   "Customer",
    //   [
    //     { name: "Contact", linkField: "link_name",  },
    //     { name: "Address", linkField: "link_name" },
    //   ]
    // );

    if(link_name!="" && link_name!=undefined){
      const data = await fetchCommonListingGet(
        fetchParams,
        userToken?.access_token,
        listfields as any,
        "Address",
        [
          { field: "Dynamic Link", key: "link_doctype", operator: "=", value: (doctype)?doctype:"CRM Organization" },
          { field: "Dynamic Link", key: "link_name", operator: "=", value: link_name }
        ]
      );
      console.log("custoemr_Address_list data", data);

      setContacts(data.data);
      setContactCount(data.totalCount);
    }
    setLoading(false);
    console.log("hereeee data");
    
  };
  useEffect(() => {}, []);

  useEffect(() => {
    setListFields(listfields);  
    
     

    fetchData();
  }, [link_name,paginationModel, filterModel, sortModel]);

  //   const columns2 = [
  //     { field: "full_name", headerName: "Customer Name", width: 200 },
  //     {
  //       field: "contacts",
  //       headerName: "Contacts",
  //       width: 300,
  //       renderCell: (params) => <pre>{JSON.stringify(params.row.contacts)}</pre>,
  //     },
  //     {
  //       field: "addresses",
  //       headerName: "Addresses",
  //       width: 300,
  //       renderCell: (params) => <pre>{JSON.stringify(params.row.addresses)}</pre>,
  //     },
  //   ];
  const columns: GridColDef[] = [
    {
      field: "address_title",
      headerName: "Address title",
      width: 200,
    },
    {
      field: "address_type",
      headerName: "Address Type",
      width: 120,
      type: "string",
    },
    {
      field: "is_primary_address",
      headerName: "Primary",
      width: 100, 
      renderCell: (params) => (
        <Box
        sx={{
          display: 'flex',
          alignItems: 'center',          
        }}
      >
        {params.row.is_primary_address==1?(
          <span>Yes</span>
        ):(
          <span>No</span>
        )} 
        
      </Box>      
      ),
    }, 
    {
      field: "address_line1",
      headerName: "Address Line 1",
      width: 120,
      type: "string",
    }, 
    {
      field: "address_line2",
      headerName: "Address Line 2",
      width: 120,
      type: "string",
    }, 
    {
      field: "city",
      headerName: "District",
      width: 120,
      type: "string",
    }, 
    {
      field: "state",
      headerName: "State",
      width: 120,
      type: "string",
    }, 
    {
      field: "country",
      headerName: "Country",
      width: 120,
      type: "string",
    }, 
    {
      field: "pincode",
      headerName: "Pincode",
      width: 120,
      type: "string",
    }, 
    {
      field: "territory",
      headerName: "Territory",
      width: 120,
      type: "string",
    }, 
    {
      field: "creation",
      headerName: "Created On",
      width: 100,
      type: "date",
      valueGetter: (value, row) => {
        return new Date(row.creation);
      },
    },
    
    {
      field: "modified",
      headerName: "Modified On",
      width: 100,
      type: "date",
      valueGetter: (value, row) => {
        return new Date(row.modified);
      },
    },
    {
      field: "action",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 80,
      disableExport: true,
      headerClassName: "",
      type: "actions",
      getActions: (params) => {
        // console.log("getActionsparams",params?.row);
        
        const actionData = [
          // <GridActionsCellItem
          //   icon={
          //     <i className={classnames("ri-eye-line", "", "text-[18px]")} />
          //   }
          //   label="View"
          //   onClick={(event) => {
          //       handleDetails(params?.row?.full_name);
          //   }}
          //   showInMenu
          //   className="gap-2"
          // />,
          <GridActionsCellItem
            icon={
              <i
                className={classnames("ri-edit-box-line", "", "text-[18px]")}
              />
            }
            label="Edit"
            onClick={() => handleEditRow(params.row)}            
            showInMenu={false}
            className="gap-2"
          />,

          <GridActionsCellItem
            icon={
              <i
                className={classnames(
                  "ri-delete-bin-7-line",
                  "",
                  "text-[18px]"
                )}
              />
            }
            label="Delete"
            onClick={handleDeleteRow(params?.row?.name)}
            showInMenu
            className="gap-2"
          />,
        ];
        return actionData;
      },
    },
  ];

  return (
    <>
    <Box sx={{ height: "50vh", display: "flex", flexDirection: "column" }}>
    <Box sx={{ flexGrow: 1, overflow: "auto"}}>

    <ConfirmDialog
              open={dialogOpen}
              title="Delete Item"
              message="Are you sure you want to delete this item? This action cannot be undone."
              onClose={() => setDialogOpen(false)}
              onConfirm={handleDeleteClick(selectedRowId)}
            />
        <StyledDataGrid
          getRowId={(row) => row.name}
          rows={contacts}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: perPage },
            },
            filter: {
              filterModel: {
                items: [],
                quickFilterValues: [],
              },
            },
          }}
          rowCount={Number(contactCount)}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationChange}
          sortingMode="server"
          onSortModelChange={handleSortModelChange}
          filterMode="server"
          filterModel={filterModel}
          onFilterModelChange={handleFilterModelChange}
          pageSizeOptions={pageSizeOptions}
          checkboxSelection
          disableRowSelectionOnClick
          // slots={{ toolbar: DataGridCustomToolbar }}
          slots={{ toolbar: CustomToolbar }}
          slotProps={{
            toolbar: {
              title: selectedMultiLangData?.contact_list || `Address`,
              total: Number(contactCount),
              module: "Address",
              onAddNew: handleAddNew,
            } as unknown as Partial<GridToolbarProps>, 
          }}
          sx={{
            "& .MuiDataGrid-footerContainer": {
              position: "sticky",
              bottom: 0,
              zIndex: 1100,
              // backgroundColor: "white",
              boxShadow: "0px -2px 4px rgba(0, 0, 0, 0.1)", // Optional shadow
            },
          }}
          loading={loading}
          localeText={{ noRowsLabel: 'No Records found' }}
        />
      </Box>
      </Box>
      {(open) &&(
       <AddEditAddressDrawer initialValues={selectedRow} link_doctype={doctype || "CRM Organization"} link_name={link_name} open={open}  onClose={CloseDialog} operation={operation} loadData={fetchData} /> 
      )}
      
     
    </>
  );
};

export default AddressListing;
