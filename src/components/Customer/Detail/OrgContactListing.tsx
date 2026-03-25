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
import { GridColDef } from "@mui/x-data-grid";
import { CONSTANTS } from "@/services/config/app-config"; // Adjust the import based on your project structure
import { fetchCommonListingGet, fetchRawDataGridListing, getDetailData } from "@/services/api/common-erpnext-api/listing-api-get";
import Link from "@/components/Link";
import CustomToolbar from "@/@core/theme/overrides/datagridcustomtoolbar";
// import { fetchRecordsWithLinks } from "@/services/api/common-erpnext-api/create-update-custom-api";
import { deleteClient, deleteResource, fetchDetailData } from "@/services/api/common-erpnext-api/create-edit-api";
import { showToast } from "@/components/ToastNotificationNew";
import AddEditAddressDrawer from "@/components/Customer/Detail/Createaddress";
// import { fetchListingWithLinkedData } from "@/services/api/common-erpnext-api/common-listing-api";

interface ExtendedGridToolbarProps extends GridToolbarProps {
  title?: string;
  total?: number;
  module?: string;
  onAddNew?: () => void;
}
interface OrgContactListingProps {
  // contact_list: any;
  link_name: string;
}

const OrgContactListing: React.FC<OrgContactListingProps> = ({ link_name }) => {
  const module = "Address";
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

  useEffect(() => {
    if (link_name) {
      setFilterModel({
        items: [
          { field: 'Contact.company_name', operator: 'equals', value: link_name }
        ],
        quickFilterValues: []
      });
    }
  }, [link_name]);

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
    router.push(`deals/detail/${name}`);
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
    let deleteRecord = await deleteClient("Contact", id, userToken?.access_token);
    console.log("deleteRecord?.data", deleteRecord);

    if (deleteRecord?.success == true) {
      showToast("Deleted successfully", "success");
      fetchData();
    } else {
      showToast(deleteRecord?.message, "error");
    }
  }
  const handleEditRow = async (rowData: any) => {

    let getRecords = await fetchDetailData("Contact", rowData?.name, userToken?.access_token);
    console.log("getRecords", getRecords);

    const baseData = getRecords?.record;
    const data = { ...baseData, phone: getRecords?.primary_mobile || getRecords?.record?.phone, email_id: getRecords?.primary_email || getRecords?.record?.email_id || "" };
    console.log("baseData 1111", baseData);
    console.log("data 1111", data);
    console.log("getRecords 1111", getRecords);

    const addresses = (getRecords?.related_address?.length > 0) ? getRecords?.related_address[0][0] : []
    // const { contact, addresses } = (await fetchContactWithContact(rowData?.name, userToken?.access_token)) || {};

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
    // setFilterModel(filterModel);
    if (filterModel?.items?.length > 0) {
      setFilterModel(filterModel);
    }

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

  const colFields = [
    { doctype: "Contact", field: "name", hidden: "True" },
    { doctype: "Contact", field: "full_name", hidden: "False" },
    { doctype: "Contact", field: "email_id", hidden: "False" },
    { doctype: "Contact", field: "phone", hidden: "False" },
    { doctype: "Contact", field: "company_name", hidden: "False" },
    { doctype: "Contact", field: "creation", hidden: "False" },
    { doctype: "Contact", field: "modified", hidden: "False" },
  ];
  
  const fetchData = async () => {
    setLoading(true);
    if (link_name != "" && link_name != undefined) {
      const fetchParams = {
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        filters: filterModel,
        sort: sortModel,
      };
      console.log("fetchParams", fetchParams);
      const relatedDocs = [];
      const whereconditon =" AND `tabContact`.`company_name` = '"+link_name+"'";
      const data = await fetchRawDataGridListing(
        fetchParams,
        userToken?.access_token,
        colFields as any,
        "Contact",
        relatedDocs,
        "", "" ,[], "", whereconditon

      );
      console.log("Contact data", data);

      setContacts(data.data);
      setContactCount(data.totalCount);
    }
    setLoading(false);
    console.log("hereeee data");

  };
  useEffect(() => { }, []);

  useEffect(() => {
    fetchData();
  }, [link_name, paginationModel, filterModel, sortModel]);

  const columns: GridColDef[] = [
    {
      field: "full_name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    color: 'primary.main', // Change to primary color on hover
                  },
                }}
                className="gap-2"
              >
      
                <Link
                  href={`/contacts/detail/${params.row.name}`}
                  color="inherit"
                  rel="noopener noreferrer"
                >
                  {params.row.full_name}
                </Link>
              </Box>
            ),
    },
    {
      field: "email_id",
      headerName: "Email",
      width: 200,
      type: "string",
    },
   
 {
      field: "phone",
      headerName: "Phone",
      width: 120,
      type: "string",
    }, 
    {
      field: "company_name",
      headerName: "Account",
      width: 180,
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
    // {
    //   field: "action",
    //   headerName: "Actions",
    //   sortable: false,
    //   filterable: false,
    //   width: 80,
    //   disableExport: true,
    //   headerClassName: "",
    //   type: "actions",
    //   getActions: (params) => {
    //     // console.log("getActionsparams",params?.row);

    //     const actionData = [
    //       // <GridActionsCellItem
    //       //   icon={
    //       //     <i className={classnames("ri-eye-line", "", "text-[18px]")} />
    //       //   }
    //       //   label="View"
    //       //   onClick={(event) => {
    //       //       handleDetails(params?.row?.full_name);
    //       //   }}
    //       //   showInMenu
    //       //   className="gap-2"
    //       // />,
    //       // <GridActionsCellItem
    //       //   icon={
    //       //     <i
    //       //       className={classnames("ri-edit-box-line", "", "text-[18px]")}
    //       //     />
    //       //   }
    //       //   label="Edit"
    //       //   onClick={() => handleEditRow(params.row)}
    //       //   showInMenu={false}
    //       //   className="gap-2"
    //       // />,

    //       // <GridActionsCellItem
    //       //   icon={
    //       //     <i
    //       //       className={classnames(
    //       //         "ri-delete-bin-7-line",
    //       //         "",
    //       //         "text-[18px]"
    //       //       )}
    //       //     />
    //       //   }
    //       //   label="Delete"
    //       //   // onClick={(event) => {
    //       //   //     handleDelete(params?.row);
    //       //   // }}
    //       //   onClick={handleDeleteRow(params?.row?.name)}
    //       //   showInMenu
    //       //   className="gap-2"
    //       // />,
    //     ];
    //     return actionData;
    //   },
    // },
  ];

  return (
    <>
      <Box sx={{ height: "50vh", display: "flex", flexDirection: "column" }}>
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>

          {/* <ConfirmDialog
            open={dialogOpen}
            title="Delete Item"
            message="Are you sure you want to delete this item? This action cannot be undone."
            onClose={() => setDialogOpen(false)}
            onConfirm={handleDeleteClick(selectedRowId)}
          /> */}
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
                title: selectedMultiLangData?.deal_list || "Contact",
                total: Number(contactCount),
                module: "Contact",
                // onAddNew: handleAddNew,
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
             <AddEditAddressDrawer initialValues={selectedRow} link_doctype={"Contact"} link_name={link_name} open={open}  onClose={CloseDialog} operation={operation} loadData={fetchData} /> 
            )}


    </>
  );
};

export default OrgContactListing;
