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
    multipleViews,
    isAddPermission,
    multiviewList,
    showTotal = true,
    showSearch = true,
    showAddNew = true,
    showFilter = true,
    titleVariant = "h5",
    showExport = true,
    showColumns = true,
    showTitleCount = false,
    btnnewtitle = '',
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
        zIndex: 1100,
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: theme => (theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.35)' : '0px 1px 2px rgba(0, 0, 0, 0.1)'),
        borderBottom: "1px solid",
        borderColor: 'divider',
        paddingBottom: 2,
      }}
      className='px-5 pb-5'
    >
      <div className="flex flex-col gap-3">

        {title != null && title !== '' && (
          <div className="flex items-center gap-1">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant={titleVariant as any}>
                {showTitleCount && total !== undefined ? `(${total}) ${title}` : title}
              </Typography>
              {multipleViews && (
                <ViewSelectorCommon multiviewList={multiviewList} />
              )}
            </Box>
          </div>
        )}


        {showTotal && total !== undefined && (
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

      {showSearch && (
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
      )}
      {/* <GridToolbarColumnsButton
        slotProps={{
          button: {
            variant: "outlined",
            size: "medium",
            sx: { marginRight: 2 },
          },
        }}
      /> */}
      {showFilter && (
        <GridToolbarFilterButton
          slotProps={{
            button: { variant: "outlined", size: "medium", sx: { marginRight: 2 } },
          }}
        />
      )}
      {/* <GridToolbarExport
        slotProps={{
          tooltip: { title: "Export data" },
          button: { variant: "outlined",size:"medium" },
        }}        
        csvOptions={exportCsvOptions}
        printOptions={exportPrintOptions}
      /> */}
      {showAddNew && onAddNew && (
        <Tooltip title={`New ${btnnewtitle || title}`}>
          <Button
            variant="contained"
            size='medium'
            startIcon={<GridAddIcon fontSize="small" />}
            onClick={handleAddNew}
          >
            {`New ${btnnewtitle || title}`}
          </Button>
        </Tooltip>
      )}
      {/* Dropdown Menu Button */}
      <IconButton onClick={handleMenuOpen} sx={{ marginLeft: 2 }}>
        <MoreVert />
      </IconButton>

      {/* Dropdown Menu */}
      {(showColumns || showExport) && (
        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
          {showColumns && (
            <MenuItem onClick={handleMenuClose}>
              <GridToolbarColumnsButton />
            </MenuItem>
          )}
          {showExport && (
            <MenuItem onClick={handleMenuClose}>
              <GridToolbarExport csvOptions={exportCsvOptions} printOptions={exportPrintOptions} />
            </MenuItem>
          )}
        </Menu>
      )}
    </GridToolbarContainer>
  );
};

export default CustomToolbar;
