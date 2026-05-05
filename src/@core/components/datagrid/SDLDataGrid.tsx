import React, { useState } from "react";
import { Box } from "@mui/material";
import { GridColDef, DataGridProps } from "@mui/x-data-grid";
import StyledDataGrid from "@/@core/theme/overrides/datagrid";
import CustomToolbar from "@/@core/theme/overrides/datagridcustomtoolbar";

interface StyledDataGridProps extends Partial<DataGridProps> {
  rows: any[];
  columns: GridColDef[];
  rowCount: number;
  paginationModel: { page: number; pageSize: number };
  onPaginationModelChange?: (newPaginationModel: { page: number; pageSize: number }) => void;
  sortingMode?: "server" | "client";
  onSortModelChange?: (newSortModel: any) => void;
  filterMode?: "server" | "client";
  filterModel?: any;
  onFilterModelChange?: (newFilterModel: any) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
  toolbarProps?: Record<string, any>;
  /** When provided, used as the grid toolbar instead of the default CustomToolbar */
  customToolbar?: React.ComponentType<any>;
  gridHeight?: string;
  columnVisibilityModel?: any;
  onColumnVisibilityModelChange?: (newModel: any) => void;
}

const SDLDataGrid: React.FC<StyledDataGridProps> = ({
  rows,
  columns,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  sortingMode = "server",
  onSortModelChange,
  filterMode = "server",
  filterModel,
  onFilterModelChange,
  pageSizeOptions = [10, 25, 50],
  loading = false,
  checkboxSelection = true,
  disableRowSelectionOnClick = true,
  toolbarProps = {},
  customToolbar,
  gridHeight,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
}) => {

  return (
    <Box
      sx={{
        height: gridHeight ? gridHeight : '77vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        '& .MuiDataGrid-root': { bgcolor: 'background.paper' }
      }}
    >
      <Box sx={{ flexGrow: 1, overflow: 'auto', marginTop: -5, bgcolor: 'background.paper' }}>
        <StyledDataGrid
          getRowId={(row) => row.name}
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          sortingMode={sortingMode}
          onSortModelChange={onSortModelChange}
          filterMode={filterMode}
          filterModel={filterModel}
          onFilterModelChange={onFilterModelChange}
          pageSizeOptions={pageSizeOptions}
          checkboxSelection={checkboxSelection}
          disableRowSelectionOnClick={disableRowSelectionOnClick}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          loading={loading}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: pageSizeOptions[0] },
            },
            filter: {
              filterModel: {
                items: [],
                quickFilterValues: [],
              },
            },
          }}
          slots={{ toolbar: customToolbar || CustomToolbar }}
          slotProps={{ toolbar: toolbarProps }}
          localeText={{ noRowsLabel: 'No Records found' }}
        />
      </Box>
    </Box>
  );
};

export default SDLDataGrid;
