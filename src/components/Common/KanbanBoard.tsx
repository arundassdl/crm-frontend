// components/KanbanBoard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Tooltip } from '@mui/material';

import { GridFilterModel, GridSortModel } from '@mui/x-data-grid';
import { fetchCommonListingGet, fetchRawDataGridListing } from '@/services/api/common-erpnext-api/listing-api-get';
import DealsKanbanBoard from '../Deals/DealsKanbanBoard';
import ViewSelectorCommon from './ViewSelectorCommon';
import { GridAddIcon } from '@mui/x-data-grid';
import TasksKanbanBorad from './TasksKanbanBorad';

interface KanbanProps {
  title: string;
  module: string;
  fieldname: string;
  listfields?: any;
  pageSize?: number;
  stages?: any;
  onAddNew?: () => void;
  refreshKey?: number; 
}
const KanbanBoard: React.FC<KanbanProps> = ({
  module,
  listfields,
  pageSize = 20,
  fieldname,
  stages,
  onAddNew,
  title,
  refreshKey
}) => {
  const [dealRows, setDealRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [userData, setuserData] = useState<any>(() => {
    const initialValue = (localStorage.getItem('userProfileData') != 'undefined') ? JSON.parse(localStorage.getItem('userProfileData') || '{}') : '{}';
    return initialValue || "";
  });
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]); // Type the state as GridSortModel
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });

  const fetchDeals = async () => {

    try {
      const fetchParams = {
        page: paginationModel.page,
        pageSize: 100000,
        filters: filterModel,
        sort: sortModel,
      };
      console.log("data.listfields", listfields);

      const data = await fetchRawDataGridListing(
                      fetchParams,
                      userToken?.access_token,
                      listfields as any,
                      module,
                      [],                     
              
                    );
      // const data = await fetchCommonListingGet(
      //   fetchParams,
      //   userToken?.access_token,
      //   listfields as any,
      //   module,
      // );
      // const dataAry = await fetchDataWrapper(fetchRawDataGridListing, [{page:0, pageSize:10, filters:[], sort:'name ASC'}], userToken?.access_token);

      setDealRows(data.data);
      console.log("data.data", data.data);
      setTotalRows(data.data?.length)
    } catch (error) {
      console.error("Error fetching deals:", error);
    }
  };
  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
    }
  };
  useEffect(() => {
    if (userToken?.access_token) {
      fetchDeals();
    }
  }, [refreshKey]);
  return (
    <>
      <Box
        sx={{
          // position: "sticky",
          top: 0,
          zIndex: 1100,
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid var(--DataGrid-rowBorderColor)",
          paddingBottom: 2,
          px: 5,
          pb: 5,
          backgroundColor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Left Side: Title + View Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5">{title}</Typography>
            <ViewSelectorCommon />
          </Box>

          {/* Right Side: Button */}
          <Tooltip title={`New ${title}`}>
            <Button
              variant="contained"
              size="medium"
              startIcon={<GridAddIcon fontSize="small" />}
              onClick={handleAddNew}
            >
              {`New ${title}`}
            </Button>
          </Tooltip>
        </Box>
      </Box>
      {module === 'CRM Task' ? (
        <TasksKanbanBorad tasks={dealRows}
          statusOptions={stages}
          userData={userData}
          doctype="CRM Task"
          fieldname="status" />
      ) : (
        <DealsKanbanBoard deals={dealRows} stages={stages} doctype={module} fieldname={fieldname} />
      )}

    </>

  );
}

export default KanbanBoard;