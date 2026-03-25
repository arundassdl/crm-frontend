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
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import Tooltip from '@mui/material/Tooltip';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

function DataGridCustomToolbar(props) {
  const pathname = usePathname()
  const [userData, setuserData] = useState<any>((props?.userData) ? props?.userData : []);

  const [titleHead, setTitleHead] = useState<any>((props?.title) ? props?.title : "");
  const [totalRecords, setTotalRecords] = useState<any>((props?.total) ? props?.total : 0);
  const [titleAdd, setTitleAdd] = useState<any>("");
  // console.log("props herer", pathname.startsWith('/installation'));
  // console.log("props herer fff2222", props?.title);

  useEffect(() => {
    setuserData(props?.userData || '[]')
    setTitleHead(props?.title || '')
    setTotalRecords(props?.total || 0)
    if (props?.title == 'Installation List') {
      setTitleAdd('Installation');
    } else {
      setTitleAdd(props?.title || '')
    }
    
  }, [props]);


  return (
    <GridToolbarContainer sx={{ paddingBottom: 5, alignItems: "center" }} className='px-5'>
      {/* <GridToolbarFilterButton slotProps={{ button: { color: 'inherit' },}} /> */}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <Typography variant="h5" sx={{
            paddingLeft: 1,
            paddingRight: 10,
          }}>{titleHead}</Typography>
        </div>
        {(props?.total!=undefined) &&(
        <div className="flex items-center gap-1">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <Typography variant="body1" className='' sx={{
                paddingLeft: 1,
              }}>Total Records:</Typography>
              <Typography variant="body1" className='font-bold' sx={{

              }}>{totalRecords}</Typography>
            </div>
          </div>
        </div>
        )}
      </div>
      <Box sx={{ flexGrow: 1 }} />

      <GridToolbarQuickFilter
        sx={{
          paddingRight: 2,
          width:450
        }}
        InputProps={{
          placeholder: 'Search',
          // startAdornment: (
          //   <SearchOutlined fontSize="small" />
          // ),
        }}
        variant="outlined"
        size="small"
        
        
      />
      <GridToolbarColumnsButton slotProps={{ button: { variant: 'outlined', size: "medium", sx: { marginRight: 2 } }, }} />
      <GridToolbarFilterButton slotProps={{ button: { variant: 'outlined', sx: { marginRight: 2 } }, }} />
      
      {/* <GridToolbarDensitySelector
        slotProps={{ tooltip: { title: 'Density' }, button: { variant: 'outlined', size: "medium", sx: { marginRight: 2 } } }}
      /> */}
      {/* {(userData?.userType == "Administrator") ? ( */}
        <GridToolbarExport
          slotProps={{
            tooltip: { title: 'Export data' },
            button: { variant: 'outlined' },
          }}
          csvOptions={{ allColumns: true }}
          printOptions={{
            hideFooter: true,
            hideToolbar: true,
          }}
          
        />
      {/* ) : ("")} */}

      {/* {userData?.userType != "Customer" && userData?.userType != "Surveyor" ? ( */}
        <>
          {(props?.module != "") ? (
            <Tooltip title={`New ${titleAdd}`}>
              <Button variant='contained' startIcon={<GridAddIcon fontSize="small" />} href={`${pathname}/add/`}>
                {`New ${titleAdd}`}
              </Button>
            </Tooltip>

          ) : (null)}
        </>
      {/* ) : ("")} */}
       {/* <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          // value={age}
          label="Age"
          // onChange={handleChange}
        >
          <MenuItem value={10}><GridToolbarFilterButton slotProps={{ button: { variant: 'outlined', sx: { marginRight: 2 } }, }} /></MenuItem>
          <MenuItem value={20}><GridToolbarColumnsButton slotProps={{ button: { variant: 'outlined', size: "medium", sx: { marginRight: 2 } }, }} /></MenuItem>
          <MenuItem value={30}><GridToolbarColumnsButton slotProps={{ button: { variant: 'outlined', size: "medium", sx: { marginRight: 2 } }, }} /></MenuItem>
        </Select> */}
    </GridToolbarContainer>
  )
}

export default DataGridCustomToolbar
