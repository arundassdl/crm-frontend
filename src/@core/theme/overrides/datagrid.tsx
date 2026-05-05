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

const StyledDataGrid  = styled(DataGrid)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  '& .MuiDataGrid-main': {
    backgroundColor: theme.palette.background.paper
  },
  '& .MuiDataGrid-virtualScroller': {
    backgroundColor: theme.palette.background.paper
  },
  '& .MuiDataGrid-virtualScrollerContent': {
    backgroundColor: theme.palette.background.paper
  },
  '& .MuiDataGrid-cell:hover': {
    color: 'primary.main',
  },
  border: 0,
  '& .MuiDataGrid-columnsContainer': {
    backgroundColor: theme.palette.background.paper
  },
  '& .MuiDataGrid-columnHeaderRow': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary
  },
  '& .MuiDataGrid-columnHeader, .MuiDataGrid-filler': {
    borderTop: `1px solid var(--border-color, currentColor)`,
    color: 'var(--mui-palette-text-primary)',
    backgroundColor:'var(--mui-palette-background-paper)'

  },
  '& .MuiDataGrid-columnHeaderTitle':{
    // textTransform:"uppercase",
    color: 'var(--mui-palette-text-primary)',
    fontWeight:theme.typography.fontWeightBold,
    // fontSize:theme.typography.fontSize
    fontSize:"14px"
  },
  '& .MuiDataGrid-footerContainer': {
    position: 'sticky',
    bottom: 0,
    zIndex: 1100,
    backgroundColor: theme.palette.background.paper,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0px -1px 2px rgba(0, 0, 0, 0.35)'
        : '0px -1px 2px rgba(0, 0, 0, 0.1)'
  },

  '& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell': {
    // border: `1px solid var(--border-color, currentColor)`,
  },
  '& .MuiDataGrid-filler': {
    color: 'var(--mui-palette-text-primary)',
    // border:  `1px solid var(--border-color, currentColor)`,
  },
  '& .MuiDataGrid-root .MuiDataGrid-columnHeader': {
    BorderTop: '1px solid var(--DataGrid-rowBorderColor)',
  },
  '&  .MuiDataGrid-root .MuiDataGrid-row--borderBottom .MuiDataGrid-columnHeader': {
    BorderTop: '1px solid var(--DataGrid-rowBorderColor)',
  },
  
}));

export default StyledDataGrid
