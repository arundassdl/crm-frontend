import React, { useState } from "react";
import { Box } from "@mui/material";
import { GridColDef, DataGridProps } from "@mui/x-data-grid";
import StyledDataGrid from "@/@core/theme/overrides/datagrid";
import CustomToolbar from "@/@core/theme/overrides/datagridcustomtoolbar";

/**
 * Resolve a stable row id.
 *
 * The datagrid listing endpoint (`get_datagrid_list`) qualifies column names
 * when the query JOINs other tables (e.g. Leads joining Address tables), so the
 * primary key arrives as `"<Doctype>.name"` / `"tab<Doctype>.name"` instead of a
 * plain `name`. A bare `row.name` lookup then returns `undefined` for every row,
 * which makes MUI drop all rows and show "No records found" even though the API
 * returned data. This mirrors the column valueGetter, which already resolves the
 * qualified keys, and unlike a `Math.random()` fallback it stays stable across
 * re-renders (important for server-side pagination/selection).
 */
const resolveRowId = (row: any): any => {
  if (row == null) return row;
  if (row.name !== undefined && row.name !== null && row.name !== "") {
    return row.name;
  }
  // A qualified "<table>.name" key produced by a JOINed listing query.
  const qualifiedNameKey = Object.keys(row).find(
    (key) => key === "name" || key.endsWith(".name")
  );
  if (qualifiedNameKey) return row[qualifiedNameKey];
  // Last-resort fallbacks so the grid still renders rather than throwing.
  return row.id ?? row.rowId;
};

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
  rowHeight?: number;
  columnHeaderHeight?: number;
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
  rowHeight = 44,
  columnHeaderHeight = 40,
}) => {

  return (
    <Box
      sx={{
        height: gridHeight ? gridHeight : '77vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#EBF3FE',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        // boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        '& .MuiDataGrid-root': { bgcolor: '#EBF3FE', border: 'none' }
      }}
    >
      <Box sx={{ flexGrow: 1, overflow: 'auto', marginTop: customToolbar ? 0 : -5, bgcolor: 'var(--bg-page)' }}>
        <StyledDataGrid
          getRowId={resolveRowId}
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          paginationMode="server"
          paginationModel={paginationModel ? { ...paginationModel, pageSize: Math.min(paginationModel.pageSize, 100) } : undefined}
          onPaginationModelChange={onPaginationModelChange}
          sortingMode={sortingMode}
          onSortModelChange={onSortModelChange}
          filterMode={filterMode}
          filterModel={filterModel}
          onFilterModelChange={onFilterModelChange}
          pageSizeOptions={pageSizeOptions}
          checkboxSelection={checkboxSelection}
          disableRowSelectionOnClick={disableRowSelectionOnClick}
          rowHeight={rowHeight}
          columnHeaderHeight={columnHeaderHeight}
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
