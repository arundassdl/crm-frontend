'use client';

import React, { useEffect } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
} from '@mui/material';
import {
  ViewList,
  ViewKanban,
  ViewModule,
  Add,
  ArrowDropDown,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setViewMode } from '@/store/slices/viewmode/viewModeSlice';
import { useSearchParams, useRouter } from 'next/navigation';
import CheckIcon from '@mui/icons-material/Check';

const options = [
  { value: 'list', label: 'List', icon: <ViewList fontSize="small" /> },
  { value: 'kanban', label: 'Kanban', icon: <ViewKanban fontSize="small" /> },
  // { value: 'grid', label: 'Grid', icon: <ViewModule fontSize="small" /> },
  // { value: 'create', label: 'Create View', icon: <Add fontSize="small" /> },
];

const ViewSelectorCommon = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = useSelector((state: RootState) => state.viewMode.viewMode);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // ✅ Read from URL on mount
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && viewParam !== view) {
      dispatch(setViewMode(viewParam as any));
    }
  }, [searchParams, dispatch]);

  // ✅ When user selects a view
  const handleClose = (value?: string) => {
    if (value && value !== 'create') {
      dispatch(setViewMode(value as any));
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', value);
      router.replace(`?${params.toString()}`); // update URL without reload
    }
    setAnchorEl(null);
  };

  const selected = options.find((opt) => opt.value === view);

  return (
    <>
    / 
      <Box
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <Box
          component="span"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {selected?.icon}
        </Box>

        <ArrowDropDown fontSize="small" />
      </Box>


      <Menu anchorEl={anchorEl} open={open} onClose={() => handleClose()}>
        {options.map((option) => (
          <MenuItem key={option.value} onClick={() => handleClose(option.value)}  selected={option.value === view} >
            <ListItemIcon sx={{pr:1}}>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
             {option.value === view && (
                  <CheckIcon fontSize="small" sx={{ ml: 'auto' }} />
                )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ViewSelectorCommon;
