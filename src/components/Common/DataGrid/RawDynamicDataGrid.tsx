import { readAccessTokenDataRaw } from '@/utils/accessTokenDataStorage'
import React, { useEffect, useState } from "react";
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridSortModel,
  GridFilterModel,
  GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import classnames from "classnames";
import SDLDataGrid from "@/@core/components/datagrid/SDLDataGrid";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { debounce } from "@mui/material";
// import { fetchCommonListingGet } from "@/services/api/common-erpnext-api/listing-api-get";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { GridRowId } from "@mui/x-data-grid";

// Utility function to format header names dynamically
const formatHeaderName = (field: string) => {
  if (field != undefined) {
    return field
      .replace(/_/g, " ") // Replace underscores with spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
  }
  return ""
};

// Define props for the component
interface DynamicDataGridColField {
  doctype: string;
  field: string;
  hidden: string;
  headerName?: string;
  /** Optional logical alias key for API response (e.g. billing_address_country) */
  subFieldAlias?: string;
}

interface DynamicDataGridProps {
  heading?: string;
  module: string;
  colFields: DynamicDataGridColField[];
  listfields?: string[];
  columnDefinitions: Record<string, Partial<GridColDef>>;
  pageSize?: number;
  defaultSort?: string;
  onAddNew?: () => void;
  handleRowDetail?: (customerName: string) => void;
  handleRowEdit?: (row: any) => void;
  handleRowDelete?: (rowId: string) => void;
  handleRowRename?: (row: any) => void;
  handleRowClone?: (row: any) => void;
  handleRowLayoutPermission?: (row: any) => void;
  //   fetchDataFunction?: (params: any, token?: string, queryString?: string) => Promise<{ data: any[]; total: number }>;
  relatedDocs?: string[];
  fetchDataFunction?: (
    ...args: any[]
  ) => Promise<{ data: any[]; totalCount: number }>;
  onSubmit?: () => void;
  refreshKey?: number;
  gridHeight?: string;
  multipleViews?: boolean;
  module_name?: string;
  multiviewList?: string;
  /** When true, toolbar title (heading) is not shown */
  hideToolbarTitle?: boolean;
  /** Optional custom toolbar component (e.g. for modules page) */
  customToolbar?: React.ComponentType<any>;
  /** When false, hides the row selection checkbox column (default: true in SDLDataGrid) */
  checkboxSelection?: boolean;
  /** Optional custom title for the "New" button */
  btnnewtitle?: string;
}

const RawDynamicDataGrid: React.FC<DynamicDataGridProps> = ({
  heading,
  module,
  colFields,
  listfields,
  columnDefinitions,
  pageSize = 20,
  defaultSort = "creation",
  onAddNew,
  fetchDataFunction,
  handleRowDetail,
  handleRowEdit,
  handleRowDelete,
  handleRowRename,
  handleRowClone,
  handleRowLayoutPermission,
  onSubmit,
  refreshKey,
  relatedDocs,
  gridHeight,
  multipleViews,
  module_name,
  multiviewList,
  hideToolbarTitle,
  customToolbar,
  checkboxSelection,
  btnnewtitle,
}) => {
  const router = useRouter();
  const safeSearchParams = useSearchParams() ?? new URLSearchParams();
  // Extract query params
  const pathname = usePathname();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: pageSize,
  });
  const [selectedMultiLangData, setSelectedMultiLangData] = useState<any>();
  const [sortModel, setSortModel] = useState<GridSortModel>([]); // Type the state as GridSortModel
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({});
  const [pageSizeOptions, setPageSizeOptions] = useState<number[]>([
    20, 50, 100,
  ]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<any | null>(null);
  const moduleHeading = (heading && heading != "") ? heading : module
  const [isAddPermission, setIsAddPermission] = useState(0);
  const [isEditPermission, setIsEditPermission] = useState(0);
  const [isDeletePermission, setIsDeletePermission] = useState(0);

  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      readAccessTokenDataRaw()
    );
    return initialValue || "";
  });

  const [userPermission, setUserPermission] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("userpermission") || "[]"
    );
    // Ensure initialValue is an array before calling .find()
    const permissionArray = Array.isArray(initialValue) ? initialValue : [];
    console.log(permissionArray, 'userpermission.create 108', module_name);
    return permissionArray.find(m => m.frontend_module === module_name) || "";
  });

  useEffect(() => {
    setPageSizeOptions((prev) =>
      Array.from(new Set([...[pageSize], ...prev])).sort((a, b) => a - b)
    );
  }, [pageSize]); // Only updates when `pageSize` changes

  useEffect(() => {
    if (userPermission.hasOwnProperty('create')) {

      console.log(userPermission, 'userpermission.create', userPermission.create);
      setIsAddPermission(userPermission.create);
      setIsEditPermission(userPermission.edit);
      setIsDeletePermission(userPermission.delete);
    }
    // console.log(userPermission, 'userPermission===>50 line');
  }, [userPermission]);

  useEffect(() => {
    const newModel: GridColumnVisibilityModel = {};
    colFields.forEach((field) => {
      if (field.hidden?.toLowerCase() === "true") {
        const fieldName = `${field.doctype}.${field.field}`;
        newModel[fieldName] = false;
      }
    });
    console.log("newModel000->", newModel, "colFields000->", colFields);
    setColumnVisibilityModel(newModel);
  }, [colFields]);

  const dataParams = {
    doctype: module,
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    filters: filterModel,
    sort: sortModel,
  };

  // Fetch Data
  const fetchData = async () => {
    if (!fetchDataFunction) return;

    setLoading(true);
    try {
      const dataParams = {
        doctype: module,
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        filters: filterModel,
        sort: sortModel,
      };

      //   const result = await fetchDataFunction(
      //     dataParams,
      //     userToken?.access_token,
      //     listfields,
      //     module
      //   );
      let result;

      if (fetchDataFunction.length === 2) {

        // If function expects 2 parameters (example: `datagrid_listing`)
        result = await fetchDataFunction(
          dataParams,
          userToken?.access_token,
          safeSearchParams.toString()
        );
      } else if (fetchDataFunction.length === 3) {
        // If function expects 3 parameters
        result = await fetchDataFunction(
          dataParams,
          userToken?.access_token,
          [],
          module,
        );
      } else if (fetchDataFunction.length === 4) {
        console.log("filtersObj k here");

        // If function expects 4 parameters ()
        result = await fetchDataFunction(
          dataParams,
          userToken?.access_token,
          [],
          module,
          [],
          relatedDocs,
        );
      } else {
        console.error("fetchDataFunction does not match expected parameters.");
        return;
      }

      setData(result.data || []);
      setRowCount(result.totalCount || 0);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // Fetch when pagination, sorting, or filters change
  useEffect(() => {
    fetchData();
  }, [paginationModel, sortModel, filterModel, onSubmit, refreshKey]);

  const handleSortModelChange = (sortModel) => {
    const params = new URLSearchParams(safeSearchParams);
    if (sortModel?.length > 0) {
      const { field, sort } = sortModel[0]; // MUI provides an array
      params.set("sort", field);
      params.set("order", sort);
    } else {
      params.delete("sort");
      params.delete("order");
    }
    router.replace(`${pathname ?? ''}?${params.toString()}`);
    setSortModel(sortModel);
  };

  const handleFilterModelChange = debounce((filterModel) => {
    const params = new URLSearchParams(safeSearchParams);
    filterModel.items.forEach((filter) => {
      if (filter.value) {
        params.set(filter.field, filter.value);
      } else {
        params.delete(filter.field);
      }
    });
    router.replace(`${pathname ?? ''}?${params.toString()}`);
    setFilterModel(filterModel);
  }, 1000);

  const handlePaginationChange = (newPaginationModel) => {
    const params = new URLSearchParams(safeSearchParams);
    params.set("page", (newPaginationModel.page + 1).toString()); // MUI pages are 0-indexed
    params.set("limit", newPaginationModel.pageSize.toString());
    router.replace(`${pathname ?? ''}?${params.toString()}`);
    setPaginationModel(newPaginationModel);
  };
  const handleDeletePopup = (id: any) => {
    setSelectedRowId(id);
    setDialogOpen(true);
  };
  const handleDeleteClick = () => {
    if (selectedRowId) {
      handleRowDelete?.(selectedRowId);
    }
    setDialogOpen(false);
    fetchData()
    setTimeout(() => {
      fetchData();
    }, 1500);
  };

  // Generate columns dynamically
  // const columns: GridColDef[] = colFields.map((field) => ({
  //   field,
  //   headerName: formatHeaderName(field),
  //   width: 130,
  //   type: "string",
  //   ...(columnDefinitions[field] || {}),
  // }));

  // const columns: GridColDef[] = colFields
  // .filter(({ field }) => field !== "name") // Exclude 'name' field
  // .map(({ doctype, field }) => ({
  //   field: `${field}`, // Combine doctype & field for uniqueness
  //   headerName: formatHeaderName(field), // Format header
  //   width: 130,
  //   type: "string",
  //   ...(columnDefinitions[field] || {}), // Apply extra properties if needed
  // }));
  const columns: GridColDef[] = colFields
    .map(({ doctype, field, headerName, subFieldAlias }) => {
      const fieldKey = `${doctype}.${field}`;
      const tabFieldKey = `tab${doctype}.${field}`;
      const displayHeader =
        headerName && headerName !== "" ? headerName : formatHeaderName(field);
      // subFieldAlias is the logical alias/key used in the API response
      // (e.g. "billing_address_country"). If not provided, fall back to `field`.
      const aliasKey = subFieldAlias || field;

      const baseDef = columnDefinitions[field] || {};
      const hasCustomValueGetter = typeof baseDef.valueGetter === "function";

      return {
        field: fieldKey,
        fieldvalue: `${field}`,
        headerName: displayHeader,
        width: 130,
        type: "string",
        ...baseDef,
        // Only inject our generic valueGetter when columnDefinitions
        // has NOT already provided one (e.g. for date columns).
        ...(hasCustomValueGetter
          ? {}
          : {
            valueGetter: (_value, row) => {
              const r = row ?? {};
              const direct =
                r[aliasKey] ??
                r[fieldKey] ??
                r[tabFieldKey] ??
                r[field] ??
                (displayHeader ? r[displayHeader] : undefined);
              if (direct !== undefined && direct !== null && direct !== "") {
                return direct;
              }
              const nested = r[doctype]?.[field] ?? r[`tab${doctype}`]?.[field];
              return nested !== undefined && nested !== null
                ? String(nested)
                : "";
            },
          }),
      };
    });
  console.log("columns", columns);

  // Add Actions column (only if at least one handler is provided)
  if (handleRowDetail || handleRowEdit || handleRowRename || handleRowDelete || handleRowClone || handleRowLayoutPermission) {
    columns.push({
      field: "action",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      width: 80,
      type: "actions",
      getActions: (params) => {
        const actions: React.ReactElement[] = [];
        // Conditionally show "View" button
        if (handleRowDetail) {
          actions.push(
            <GridActionsCellItem
              icon={<i className={classnames("ri-eye-line", "text-[18px]")} />}
              label="View"
              onClick={() => handleRowDetail?.(params?.row?.name)}
              showInMenu
              className="gap-2"
            />
          );
        }

        // Conditionally show "Edit" button (used as "Edit Layout" in layout listing)
        if (handleRowEdit && isEditPermission) {
          actions.push(
            <GridActionsCellItem
              icon={
                <i className={classnames("ri-edit-box-line", "text-[18px]")} />
              }
              label="Edit Layout"
              onClick={() => handleRowEdit(params?.row)}
              showInMenu={false}
              className="gap-2"
            />
          );
        }

        // Conditionally show "Rename" button
        if (handleRowRename) {
          actions.push(
            <GridActionsCellItem
              icon={
                <i
                  className={classnames("ri-edit-2-line", "text-[18px]")}
                />
              }
              label="Rename"
              onClick={() => handleRowRename(params?.row)}
              showInMenu
              className="gap-2"
            />
          );
        }

        // Conditionally show "Clone Layout" button
        if (handleRowClone) {
          actions.push(
            <GridActionsCellItem
              icon={
                <i
                  className={classnames("ri-file-copy-line", "text-[18px]")}
                />
              }
              label="Clone Layout"
              onClick={() => handleRowClone(params?.row)}
              showInMenu
              className="gap-2"
            />
          );
        }

        // Conditionally show "Layout Permission" button
        if (handleRowLayoutPermission) {
          actions.push(
            <GridActionsCellItem
              icon={
                <i
                  className={classnames("ri-shield-user-line", "text-[18px]")}
                />
              }
              label="Layout Permission"
              onClick={() => handleRowLayoutPermission(params?.row)}
              showInMenu
              className="gap-2"
            />
          );
        }

        // Conditionally show "Delete" button (hide for core layouts)
        const isCore = params?.row?.is_core ?? params?.row?.["SDL Layout.is_core"];
        if (handleRowDelete && isDeletePermission && !isCore) {
          actions.push(
            <GridActionsCellItem
              icon={
                <i
                  className={classnames("ri-delete-bin-7-line", "text-[18px]")}
                />
              }
              label="Delete"
              onClick={() => handleDeletePopup?.(params?.row?.name)}
              showInMenu
              className="gap-2"
            />
          );
        }
        return actions;
      },
    });
  }

  return (
    <>
      {multipleViews}
      <ConfirmDialog
        open={dialogOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onClose={() => setDialogOpen(false)}
        onConfirm={handleDeleteClick}
      />
      <SDLDataGrid
        rows={data}
        columns={columns}
        rowCount={Number(rowCount)}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationChange}
        sortingMode="server"
        onSortModelChange={handleSortModelChange}
        filterMode="server"
        filterModel={filterModel}
        onFilterModelChange={handleFilterModelChange}
        pageSizeOptions={pageSizeOptions}
        loading={loading}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
        customToolbar={customToolbar}
        checkboxSelection={checkboxSelection}
        toolbarProps={{
          title: hideToolbarTitle ? undefined : moduleHeading,
          total: Number(rowCount),
          module,
          onAddNew,
          multipleViews,
          isAddPermission,
          multiviewList,
          btnnewtitle,
        }}
        gridHeight={gridHeight}
      />
    </>
  );
};

export default RawDynamicDataGrid;
