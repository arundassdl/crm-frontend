import React, { useState } from 'react';
import {
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from '@mui/x-data-grid';
import { Typography, Box, Button, Tooltip, Menu, MenuItem, IconButton } from '@mui/material';
import GridAddIcon from '@mui/icons-material/Add';
import { MoreVert } from "@mui/icons-material";
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import ViewSelectorCommon from '@/components/Common/ViewSelectorCommon';

const CustomToolbar = (props) => {
  const {
    title,
    total,
    module,
    onAddNew,
    quickFilterPlaceholder = "Search ",
    exportCsvOptions = { allColumns: true },
    exportPrintOptions = { hideFooter: true, hideToolbar: true },
    multipleViews
  } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
    }
  };
  const view = useSelector((state: RootState) => state.viewMode.viewMode);

  return (
    <GridToolbarContainer
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100, // Ensures it stays above other elements
        // backgroundColor: "white", // Prevents content from showing through
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)", // Optional shadow
        borderBottom: "1px solid var(--DataGrid-rowBorderColor)",
        paddingBottom: 2,
        // pt:5
      }}
      className='px-5 pb-5'
    >
      <div className="flex flex-col gap-3">
        
        <div className="flex items-center gap-1">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5">{title}</Typography>
            {multipleViews && (
            <ViewSelectorCommon />
            )}
          </Box>
        </div>
        

        {total !== undefined && (
          <div className="flex items-center gap-1">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1">
                <Typography
                  variant="body1"
                  className=""
                  sx={{
                    paddingLeft: 1,
                  }}
                >
                  Total Records:
                </Typography>
                <Typography variant="body1" className="font-bold" sx={{}}>
                  {total}
                </Typography>
              </div>
            </div>
          </div>
        )}
      </div>
      <Box sx={{ flexGrow: 1 }} />

      <GridToolbarQuickFilter
        sx={{
          paddingRight: 2,
          width: 450,
        }}
        InputProps={{
          placeholder: quickFilterPlaceholder,
        }}
        variant="outlined"
        size="small"
      />
      {/* <GridToolbarColumnsButton
        slotProps={{
          button: {
            variant: "outlined",
            size: "medium",
            sx: { marginRight: 2 },
          },
        }}
      /> */}
      <GridToolbarFilterButton
        slotProps={{
          button: { variant: "outlined", size: "medium", sx: { marginRight: 2 } },
        }}
      />
      {/* <GridToolbarExport
        slotProps={{
          tooltip: { title: "Export data" },
          button: { variant: "outlined",size:"medium" },
        }}        
        csvOptions={exportCsvOptions}
        printOptions={exportPrintOptions}
      /> */}
      {title && onAddNew && (
        <Tooltip title={`New ${title}`}>
          <Button
            variant="contained"
            size='medium'
            startIcon={<GridAddIcon fontSize="small" />}
            onClick={handleAddNew}
          >
            {`New ${title}`}
          </Button>
        </Tooltip>
      )}
      {/* Dropdown Menu Button */}
      <IconButton onClick={handleMenuOpen} sx={{ marginLeft: 2 }}>
        <MoreVert />
      </IconButton>

      {/* Dropdown Menu */}
      <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        <MenuItem onClick={handleMenuClose}>
          <GridToolbarColumnsButton />
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <GridToolbarExport csvOptions={exportCsvOptions} printOptions={exportPrintOptions} />
        </MenuItem>
      </Menu>
    </GridToolbarContainer>
  );
};

export default CustomToolbar;
