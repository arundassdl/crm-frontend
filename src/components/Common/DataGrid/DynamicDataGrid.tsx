import React, { useEffect, useState } from "react";
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridSortModel,
  GridFilterModel,
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
  return field
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
};
// Define props for the component
interface DynamicDataGridProps {
  module: string;
  colFields: string[];
  listfields: string[];
  columnDefinitions: Record<string, Partial<GridColDef>>;
  pageSize?: number;
  defaultSort?: string;
  onAddNew?: () => void;
  handleRowDetail?: (customerName: string) => void;
  handleRowEdit?: (row: any) => void;
  handleRowDelete?: (rowId: string) => void;
  //   fetchDataFunction?: (params: any, token?: string, queryString?: string) => Promise<{ data: any[]; total: number }>;
  fetchDataFunction?: (
    ...args: any[]
  ) => Promise<{ data: any[]; totalCount: number }>;
  onSubmit?: () => void;
  refreshKey?: number; 
}
const DynamicDataGrid: React.FC<DynamicDataGridProps> = ({
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
  onSubmit,
  refreshKey,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [pageSizeOptions, setPageSizeOptions] = useState<number[]>([
    20, 50, 100,
  ]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<any | null>(null);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  useEffect(() => {
    setPageSizeOptions((prev) =>
      Array.from(new Set([...[pageSize], ...prev])).sort((a, b) => a - b)
    );
  }, [pageSize]); // Only updates when `pageSize` changes
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
          searchParams.toString()
        );
      } else if (fetchDataFunction.length === 3) {
        // If function expects 3 parameters
        result = await fetchDataFunction(
          dataParams,
          userToken?.access_token,
          listfields,
          module
        );
      } else if (fetchDataFunction.length === 4) {
        // If function expects 4 parameters ()
        result = await fetchDataFunction(
          dataParams,
          userToken?.access_token,
          listfields,
          module
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
  }, [paginationModel, sortModel, filterModel, onSubmit,refreshKey]);
  const handleSortModelChange = (sortModel) => {
    const params = new URLSearchParams(searchParams);
    if (sortModel?.length > 0) {
      const { field, sort } = sortModel[0]; // MUI provides an array
      params.set("sort", field);
      params.set("order", sort);
    } else {
      params.delete("sort");
      params.delete("order");
    }
    router.replace(`${pathname}?${params.toString()}`);
    setSortModel(sortModel);
  };
  const handleFilterModelChange = debounce((filterModel) => {
    const params = new URLSearchParams(searchParams);
    filterModel.items.forEach((filter) => {
      if (filter.value) {
        params.set(filter.field, filter.value);
      } else {
        params.delete(filter.field);
      }
    });
    router.replace(`${pathname}?${params.toString()}`);
    setFilterModel(filterModel);
  }, 1000);
  const handlePaginationChange = (newPaginationModel) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", (newPaginationModel.page + 1).toString()); // MUI pages are 0-indexed
    params.set("limit", newPaginationModel.pageSize.toString());
    router.replace(`${pathname}?${params.toString()}`);
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
    // fetchData()
    setTimeout(() => {
      
      fetchData();
    }, 1500);
  };
  // Generate columns dynamically
  const columns: GridColDef[] = colFields.map((field) => ({
    field,
    headerName: formatHeaderName(field),
    width: 130,
    type: "string",
    ...(columnDefinitions[field] || {}),
  }));
  // Add Actions column
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
      // Conditionally show "Edit" button
      // if (handleRowEdit) {
      //   actions.push(
      //     <GridActionsCellItem
      //       icon={
      //         <i className={classnames("ri-edit-box-line", "text-[18px]")} />
      //       }
      //       label="Edit"
      //       onClick={() => handleRowEdit(params?.row)}
      //       showInMenu={false} // Hide from menu but still visible
      //       className="gap-2"
      //     />
      //   );
      // }
      // Conditionally show "Delete" button
      if (handleRowDelete) {
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
  return (
    <>
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
        toolbarProps={{
          title: selectedMultiLangData?.contact_list || module,
          total: Number(rowCount),
          module,
          onAddNew,
        }}
      />
    </>
  );
};
export default DynamicDataGrid;