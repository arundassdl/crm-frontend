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

const StyledDataGrid_relatedlist = styled(DataGrid)(({ theme }) => ({
    '& .MuiDataGrid-cell:hover': {
        color: 'primary.main',
    },
    border: 0,
    '& .MuiDataGrid-columnsContainer': {
        backgroundColor: 'var(--border-color, currentColor)',
    },
    "& .MuiDataGrid-columnHeaderRow": {
        backgroundColor: 'var(--border-color, currentColor)',
        color: "white",
    },
    '& .MuiDataGrid-columnHeader, .MuiDataGrid-filler': {
        borderTop: `1px solid var(--border-color, currentColor)`,
        color: 'var(--mui-palette-text-primary)',
        backgroundColor: 'var(--mui-palette-background-paper)'
    },
    '& .MuiDataGrid-columnHeaderTitle': {
        color: 'var(--mui-palette-text-primary)',
        fontWeight: theme.typography.fontWeightBold,
        fontSize: "14px"
    },
    "& .MuiDataGrid-footerContainer": {
        position: "sticky",
        bottom: 0,
        zIndex: 1100,
        boxShadow: "0px -1px 2px rgba(0, 0, 0, 0.1)", // Optional shadow
    },
    '& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell': {
        // border: `1px solid var(--border-color, currentColor)`,
    },
    '& .MuiDataGrid-filler': {
        color: 'var(--mui-palette-text-primary)',
    },
    '& .MuiDataGrid-root .MuiDataGrid-columnHeader': {
        BorderTop: '1px solid var(--DataGrid-rowBorderColor)',
    },
    '& .MuiDataGrid-root .MuiDataGrid-row--borderBottom .MuiDataGrid-columnHeader': {
        BorderTop: '1px solid var(--DataGrid-rowBorderColor)',
    },
}));

export default StyledDataGrid_relatedlist;
