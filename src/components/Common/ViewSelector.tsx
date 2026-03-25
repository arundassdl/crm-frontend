import { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ViewList,
  ViewKanban,
  ViewModule,
  Add,
  ArrowDropDown,
} from '@mui/icons-material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

const options = [
  { value: 'list', label: 'List', icon: <ViewListIcon fontSize="small" /> },
  { value: 'grid', label: 'Grid', icon: <ViewModuleIcon fontSize="small" /> },
  { value: 'kanban', label: 'Kanban', icon: <ViewKanbanIcon fontSize="small" /> },
  //   { value: 'group_by', label: 'Group By', icon: <ViewAgendaIcon fontSize="small" /> },
  // { value: 'create', label: 'Create View', icon: <AddIcon fontSize="small" /> },
];

export default function ViewSelector({
  view,
  setView,
}: {
  view: string;
  setView: (val: string) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);



  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (value?: string) => {
    if (value && value !== 'create') {
      setView(value);
    }
    setAnchorEl(null);
  };

  const selectedLabel = options.find((opt) => opt.value === view)?.label || 'View';
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

      {/* <Box
              onClick={handleClick}
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
      
              <ArrowDropDownIcon fontSize="small" />
            </Box> */}


      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 180,
          },
        }}
      >
        {options.map((opt) => (
          <MenuItem
            key={opt.value}
            onClick={() => handleClose(opt.value)}
            selected={opt.value === view}
          >
            <ListItemIcon sx={{pr:1}}>{opt.icon}</ListItemIcon>
            <ListItemText>{opt.label}</ListItemText>
            {opt.value === view && (
              <CheckIcon fontSize="small" sx={{ ml: 'auto' }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
