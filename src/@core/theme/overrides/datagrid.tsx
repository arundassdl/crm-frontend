// MUI Imports
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { Skin } from '@core/types'
import { styled } from '@mui/material/styles';
import {
  DataGrid, GridColDef, GridToolbar, GridPaginationMeta, useGridApiRef, GridActionsCellItem, GridRowModes, GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
  GridAddIcon,
  GridFilterModel,
} from '@mui/x-data-grid';

// export function DataGridCustomToolbar() {

//   return (

//     <GridToolbarContainer>
//       <GridToolbarColumnsButton />
//       <GridToolbarFilterButton />
//       <GridToolbarDensitySelector />
//       <GridToolbarExport variant="outlined"/>
//   </GridToolbarContainer>
//   )
// }

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 'none',
  backgroundColor: 'var(--bg-card) !important',
  fontFamily: 'inherit',
  '& .MuiDataGrid-main': {
    backgroundColor: 'var(--bg-card)'
  },
  '& .MuiDataGrid-virtualScroller': {
    backgroundColor: 'var(--bg-card)'
  },
  '& .MuiDataGrid-virtualScrollerContent': {
    backgroundColor: 'var(--bg-card)'
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: 'var(--bg-topbar) !important',
    borderBottom: '1px solid var(--border)',
  },
  // Canonical DataGrid column-header typography — shared across the app.
  '& .MuiDataGrid-columnHeader': {
    outline: 'none !important',
    color: 'var(--text-header)',
  },
  '& .MuiDataGrid-columnHeaderTitleContainer': {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '18px',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '18px',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    color: 'var(--text-header)',
  },
  '& .MuiDataGrid-columnSeparator': { display: 'none' },
  '& .MuiDataGrid-cell': {
    borderBottom: 'none !important',
    outline: 'none !important',
    display: 'flex',
    alignItems: 'center',
    // Canonical DataGrid cell typography — consistent body text across all cells;
    // individual renderers (status badges, email links, avatars) override as needed.
    color: 'var(--text-body)',
    fontSize: '15px',
    lineHeight: '20px',
  },
  '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
    outline: 'none !important',
  },
  '& .MuiDataGrid-row': {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(96, 165, 250, 0.04) !important',
    },
    '&.Mui-selected': {
      backgroundColor: 'var(--border-soft) !important',
      '&:hover': { backgroundColor: 'var(--border-soft) !important' },
    },
     '--rowBorderColor': 'none',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid var(--border-soft)',
    backgroundColor: 'var(--bg-card)',
  },
  '& .MuiDataGrid-selectedRowCount': {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  '& .MuiTablePagination-root': {
    fontSize: '11px',
    color: 'var(--text-body)',
  },
  '& .MuiCheckbox-root': {
    color: '#E2E8F0',
  },
  '& .MuiCheckbox-root.Mui-checked, & .MuiCheckbox-root.MuiCheckbox-indeterminate': {
    color: '#1D4ED8',
  },
  '& .MuiDataGrid-overlay': {
    backgroundColor: 'transparent',
  },
}));

export default StyledDataGrid
