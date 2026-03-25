import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { SelectedFilterLangDataFromStore } from "../../../store/slices/general_slices/selected-multilanguage-slice";
import { useSelector } from "react-redux";
import { get_access_token } from "../../../store/slices/auth/token-login-slice";
import { usePathname, useSearchParams } from 'next/navigation'
import { showToast } from "../../ToastNotificationNew";
import { getUsersListDatagrid, activate_user } from "../../../services/api/users/users-api";
import { datagrid_listing } from '@/services/api/common-erpnext-api/datagrid-listing-api'
import Switch from '@mui/material/Switch';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import ReactTimeAgo from 'react-time-ago'
import {
  DataGrid, GridColDef, GridToolbar, GridPaginationMeta, useGridApiRef, GridActionsCellItem, GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridFilterModel,
  GridToolbarProps,
} from '@mui/x-data-grid';

import {
  Card,
  CardHeader,
  CardContent,
  Typography,
} from '@mui/material';
import { IconButton, Fade, Popper } from "@mui/material";
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import tableStyles from '@core/styles/table.module.css'
import StyledDataGrid from "@/@core/theme/overrides/datagrid";
import classnames from 'classnames'
import Avatar from '@mui/material/Avatar';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

import TimeAgo from 'javascript-time-ago'

import en from 'javascript-time-ago/locale/en'
import ru from 'javascript-time-ago/locale/ru'
import DataGridCustomToolbar from "@/@core/theme/overrides/datagridtoolbar";
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { TooltipProps } from '@mui/material/Tooltip';
import { BorderAll } from "@mui/icons-material";
import typography from "@/@core/theme/typography";


TimeAgo.addDefaultLocale(en)
TimeAgo.addLocale(ru)

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));
type GridFilterItem2 = {
  field: string;
  operator: string;
  value: string;
};
type SortFilter = {
  field: string | null | undefined
  sort: string | null | undefined
}

const useStyles = ((theme) => ({
  quickFilterInput: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: '200px', // Example width, adjust as needed
    backgroundColor: '#f0f0f0', // Example background color
    padding: theme.spacing(1),
    borderRadius: '4px', // Example border radius
  },
}));

const HtmlTooltip = styled(({ className, ...props }: TooltipProps & { className?: string }) => (
  <Tooltip {...props} classes={{ tooltip: className }} arrow />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));

const LightTooltip = styled(({ className, ...props }: TooltipProps & { className?: string }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'var(--mui-palette-text-secondary) !important',
    boxShadow: theme.shadows[1],
    border: "1px solid " + theme.palette.primary.main,
    fontSize: theme.typography.caption.fontSize,
  },
}));
interface ExtendedGridToolbarProps extends GridToolbarProps {
  userData?: any;
  module?: string;
  title?: string;
  total?: number;
}
export default function UsersList(props) {

  const router = useRouter();
  const { query }: any = useRouter();
  const searchParams = useSearchParams()
  const limit = (searchParams.get('limit')) ? searchParams.get('limit') : 20
  const [loading, setLoading] = React.useState(false);

  const TokenFromStore: any = useSelector(get_access_token);
  const SelectedLangDataFromStore: any = useSelector(
    SelectedFilterLangDataFromStore
  );
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  console.log("selectedMultiLangData", selectedMultiLangData);

  let [usersList, setUsersList] = useState<any>([]);
  let [usersCount, setUsersCount] = useState<Number>(0);

  const [err, setErr] = useState<boolean>(false);
  props = {
    meta: usersList?.meta
  }
  // const { setPerPage } = props
  const pathname = usePathname()
  const [perPage, setPerPage] = useState<number>(Number(limit));
  const [pageSizeOptions, setPageSizeOptions] = useState<any>([20, 50, 100]);
  const [userData, setuserData] = useState<any>([]);
  const [controller, setController] = useState({
    page: 0,
    rowsPerPage: Number(limit)
  });
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({ items: [], quickFilterValues: [] });
  const [sortModel, setSortModel] = React.useState<SortFilter[]>([]);

  type instStatusIcn = {
    inst_status_icn: React.JSX.Element
  }


  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('userProfileData') != 'undefined') {
        // alert(localStorage.getItem('userData'))
        setuserData(JSON.parse(localStorage.getItem('userProfileData') || '[]'))
      }
    }
  }, []);

  useEffect(() => {
    if (
      Object.keys(SelectedLangDataFromStore?.selectedLanguageData)?.length > 0
    ) {
      setSelectedMultiLangData(SelectedLangDataFromStore?.selectedLanguageData);
    }
  }, [SelectedLangDataFromStore]);


  const handleDetailPageClick: any = async (name: any) => {
    console.log('details')
    const hrefval = `/user/users/detail/${name}`

    // //location.href = hrefval
    router.replace(hrefval);
  }
  const handleEdit: any = async (name: any) => {
    console.log('Edit')
    const hrefval = `/user/users/edit/${name}`
    // // location.href = hrefval
    router.push(hrefval);
  }
  const handleActivate: any = async (user: any) => {
    const request = {}
    request['id'] = user?.id
    request['enabled'] = (user?.status == 'Active') ? 0 : 1
    // user["status"] = request['enabled'];
    console.log(usersList, 'usersList');
    const ActivateUser: any = await activate_user(
      request, TokenFromStore?.token
    );
    if (ActivateUser?.msg === "success") {
      user["status"] = (user?.status == 'Active') ? 'Deactive' : 'Active';
      showToast(ActivateUser?.data.msg, "success");
    } else {
      showToast(ActivateUser?.error, "error");
    }

  }
  const columns: GridColDef[] = [
    { field: 'employee_name', headerName: "User Name", width: 200, type: 'string' },
    { field: 'user_id', headerName: "Email", width: 200, type: 'string' },
    { field: 'designation', headerName: "Designation", width: 200, type: 'string' },
    { field: 'role_name', headerName: "Role Name", width: 200, type: 'string' },
    {
        field: 'status', headerName: "Active", width: 100, type: 'singleSelect', valueOptions: [0, 1], headerClassName: "sdl-tbl--header"
        , renderCell: (params) => {
          let inst_status_colr = 'inherit'
            const inst_statusIcn: instStatusIcn[] = []
            if (params?.row?.status == 'Active') {
              inst_status_colr = "success"
              inst_statusIcn["inst_status_icn"] = <Tooltip title="Active" placement="top" style={{ fontSize: "28px" }}><CheckCircleOutlineRoundedIcon color="success" /></Tooltip>
            } else if (params?.row?.status !== 'Active') {
              inst_status_colr = "error"
              inst_statusIcn["inst_status_icn"] = <Tooltip title="Disabled" placement="top" style={{ fontSize: "28px" }}><ErrorOutlineOutlinedIcon color="error" /></Tooltip>
            }
            return <div className="flex items-center gap-2"><Avatar color={inst_status_colr} style={{ background: "transparent" }} alt="Warning" >{inst_statusIcn["inst_status_icn"]}</Avatar></div>
        }
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
      field: 'action', headerName: "Actions", sortable: false, filterable: false, width: 120, disableExport: true, type: 'actions',

      getActions: (params) => {

        const actionData = [
          <GridActionsCellItem
            icon={<i className="ri-eye-line" />}
            label="View"
            onClick={(event) => {
              handleDetailPageClick(params?.row?.id);
            }}
            showInMenu
            className="gap-4"
          />,];
          // if (params?.row?.is_admin == 0) {
            actionData.push(<GridActionsCellItem
              icon={<i className={classnames("ri-edit-box-line", "", 'text-[22px]')} />}
              label="Edit"
              onClick={(event) => {
                handleEdit(params?.row?.id)
              }}
              showInMenu
              className="gap-4"
            />,)
          // }
          // if (params?.row?.is_admin == 0) {
            actionData.push(
              <GridActionsCellItem
                icon={<Switch aria-label="Activate" defaultChecked={(params?.row?.status == 'Active') ? true : false} size="medium" color="success" className="gap-2" sx={{ marginLeft: "-5px" }} />}
                label={(params?.row?.status == 'Active') ? "Activate" : "Deactivate"}
                onClick={(event) => {
                  handleActivate(params?.row)
                }}
                showInMenu
              />,)
          // }

        return actionData;
      },

    },
  ];

  const rows = (usersList?.list?.length > 0) ? usersList?.list : [];


  useEffect(() => {
    const filterAry: GridFilterItem2[] = [];
    const sortParamsAry: SortFilter[] = [];
    // Extract filter values
    const field = searchParams.get("field");
    const operator = searchParams.get("operator");
    const value = searchParams.get("value");

    // Only add to filterAry if all parts are present and field is not null or empty
    if (field && field !== '' && operator && value) {
      filterAry.push({
        field,
        operator,
        value,
      });
    }
    // Handle sort parameters
    const sortParam = searchParams.get("sort");
    if (sortParam && sortParam !== '') {
      const sortValues = sortParam.trim().match(/\[(.*?)\]/)?.[1]?.split("=");

      if (sortValues && sortValues.length === 2) {
        sortParamsAry.push({
          field: sortValues[0],
          sort: sortValues[1],
        });
        setSortModel(sortParamsAry);
      }
    }
    // Handle quick filter values
    let qParams: string[] = [];
    const queryParam = searchParams.get("q");
    if (queryParam && queryParam !== '') {
      qParams.push(queryParam); // TypeScript now knows queryParam is a string
    }

    // Update the filter model
    setFilterModel({ items: filterAry, quickFilterValues: qParams });

    // getData();
  }, [controller]);

  React.useEffect(() => {
    setLoading(true);
    filterModel
    // setTimeout(() => {
      fetchFilteredData(controller.page, controller.rowsPerPage, sortModel, filterModel);
    // }, 1000);
  }, [controller.page, controller.rowsPerPage, sortModel, filterModel]);


  const fetchFilteredData = async (page, rowsPerPage, sortModel, filterModel) => {
    setLoading(true);
    const url = new URL(window.location.href)
    const searchParams = new URLSearchParams(url.search)

    if (filterModel?.quickFilterValues?.length > 0 && filterModel?.quickFilterValues?.[0] && filterModel?.quickFilterValues?.[0] != '') {
      filterModel.q = filterModel?.quickFilterValues?.[0]
    } else {
      filterModel.q = ''
    }

    filterModel.page = page
    filterModel.rowsPerPage = rowsPerPage
    const sort = (searchParams.get('sort')) ? searchParams.get('sort') : []
    filterModel.sortModel = (sortModel) ? sortModel : sort

    let sortParams = ''
    if (sortModel?.length > 0) {
      const sortQuery = filterModel.sortModel.map(item => `${item.field}=${item.sort}`)
        .join('&');
      if (sortQuery != '') {
        sortParams = `[${sortQuery}]`
      }
    }
    const filterQuery = filterModel.items
      .map(item => `${item.field}=${item.value}&operator=${item.operator}`)
      .join('&');
    console.log("filterQuery==>", filterQuery.split("&")[0].split("=")[0]);

    // router.push({
    //   query: { ...query,page:filterModel.page,limit:filterModel.rowsPerPage},
    // });
    
    if (sortParams != '') {
      searchParams.set("sort", sortParams);
    } else {
      searchParams.delete("sort");
    }
    searchParams.set("page", filterModel.page);
    searchParams.set("limit", filterModel.rowsPerPage);
    (filterModel.q != '') ? searchParams.set("q", filterModel.q) : searchParams.delete("q");;

    if (filterModel.items?.length > 0) {
      searchParams.set("field", filterQuery.split("&")[0].split("=")[0]);
      searchParams.set("operator", filterQuery.split("&")[1].split("=")[1]);
      searchParams.set("value", filterQuery.split("&")[0].split("=")[1]);
      // searchParams.set('newparameter', '10')
    } else {
      searchParams.delete("field");
      searchParams.delete("operator");
      searchParams.delete("value");
    }
    url.search = searchParams.toString()
    router.push(url.search)
    filterModel.query= "SELECT `tabEmployee`.`employee_name`,`tabEmployee`.`user_id`,`tabEmployee`.`designation`,`tabEmployee`.`status`,`tabSDL Role`.`role_name`,`tabEmployee`.`creation`,`tabEmployee`.`modified`,`tabEmployee`.`name` `id` FROM `tabSDL Role` JOIN `tabUser` ON `tabSDL Role`.`role_profile`=`tabUser`.`role_profile_name` JOIN `tabEmployee` ON `tabUser`.`name`=`tabEmployee`.`user_id` WHERE `tabSDL Role`.`app_name`='FSM'";
    filterModel.qfield = "`tabEmployee`.`employee_name`";
    try {
      console.log('inside try before get userslistdatagrid')
      // const UsersListss: any = await getUsersListDatagrid(filterModel, TokenFromStore?.token);
      const UsersListss: any = await datagrid_listing(filterModel, TokenFromStore?.token, searchParams.toString());
      console.log('UsersListss>>>>', UsersListss?.data?.list)
      setUsersList(UsersListss?.data?.list || []);
      setUsersCount(UsersListss?.data?.count || 0);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterModelChange = (filterModel) => {
    setTimeout(() => {
      setFilterModel(filterModel)
    }, 2000, filterModel);
  };
  const handleSortModelChange = (sortModel) => {
    const url = new URL(window.location.href)
    const searchParams = new URLSearchParams(url.search)
    let sortParams = ''
    if (sortModel?.length > 0) {
      const sortQuery = sortModel.map(item => `${item.field}=${item.sort}`)
        .join('&');
      if (sortQuery != '') {
        sortParams = `[${sortQuery}]`
      }
    }
    if (sortParams != '') {
      searchParams.set("sort", sortParams);
    } else {
      searchParams.delete("sort");
    }
    url.search = searchParams.toString()
    router.push(url.search)
    setSortModel(sortModel);
  }
  const handlePaginationChange = (newPaginationModel) => {
    const { page, pageSize } = newPaginationModel;
    // Update URL with new pagination state
    router.replace(
      pathname,
      {
        ...query,
        page: page,
        limit: pageSize,
      },
    );
    setController({
      page: (pageSize !== perPage) ? 0 : page,
      rowsPerPage: pageSize
    });
    setPerPage(pageSize);
  };

  return (
    <>
      {/* <Card>
        <CardContent>*/}
          <Box
            sx={{
              height: 650,
              width: '100%',

            }}
            className={tableStyles.table}
          > 
            <StyledDataGrid
              getRowId={(row) => row.id}
              rows={usersList}
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
              rowCount={Number(usersCount)}
              paginationMode="server"
              paginationModel={{ page: controller.page, pageSize: controller.rowsPerPage }}
              onPaginationModelChange={handlePaginationChange}
              sortingMode="server"
              onSortModelChange={handleSortModelChange}
              filterMode="server"
              filterModel={filterModel}
              // onFilterModelChange={(newFilterModel) => setFilterModel(newFilterModel)}
              // onFilterModelChange={handleFilterModelChange}
              onFilterModelChange={handleFilterModelChange}
              pageSizeOptions={pageSizeOptions}
              checkboxSelection
              disableRowSelectionOnClick
              slots={{ toolbar: DataGridCustomToolbar }}
              slotProps={{ toolbar: { userData: userData, module: "User", title:(selectedMultiLangData?.menu_users) ? selectedMultiLangData?.menu_users : "Users", total:Number(usersCount)  } as ExtendedGridToolbarProps }}
              loading={loading}
            />
          </Box>
        {/*</CardContent>
      </Card> */}
    </>
  );

}
