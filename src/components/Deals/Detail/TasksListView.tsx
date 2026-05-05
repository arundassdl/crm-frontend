import { Box, Stack, Typography, Tooltip, IconButton, Menu, MenuItem } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { format } from 'date-fns';
import { Task } from '@/services/api/common-erpnext-api/create-update-custom-api';
import CircleIcon from '@mui/icons-material/Circle';
import DonutLargeIcon from '@mui/icons-material/DonutLarge'; //Backlog
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {
    Refresh,
    HourglassBottom,
    CheckCircle,
    Cancel,
    Edit,
    Delete,
} from '@mui/icons-material';

interface TasksListViewProps {
  tasks: Task[];
  userData: any;
  openEditModal: (index: any) => void;
  handleMenuOpen: (event: React.MouseEvent<HTMLElement>, index: number) => void;
  anchorEl: HTMLElement | null;
  menuIndex: number | null;
  handleMenuClose: () => void;
  handleDeleteRow: (id: string) => void;
}

const priorityOptions = [
    { value: 'Low', icon: <CircleIcon fontSize="small" sx={{ color: 'gray' }} /> },
    { value: 'Medium', icon: <CircleIcon fontSize="small" sx={{ color: 'orange' }} /> },
    { value: 'High', icon: <CircleIcon fontSize="small" sx={{ color: 'red' }} /> },
];
const priorityColors = {
    Low: 'gray',
    Medium: 'orange',
    High: 'red',
};

const statusOptions = [
    { value: 'Backlog', icon: <DonutLargeIcon fontSize="small" /> },
    { value: 'Todo', icon: <RadioButtonUncheckedIcon fontSize="small" /> },
    { value: 'In Progress', icon: <HourglassBottom fontSize="small" /> },
    { value: 'Done', icon: <CheckCircle fontSize="small" /> },
    { value: 'Canceled', icon: <Cancel fontSize="small" /> },
];
export default function TasksListView({
  tasks,
  userData,
  openEditModal,
  handleMenuOpen,
  anchorEl,
  menuIndex,
  handleMenuClose,
  handleDeleteRow,
}: TasksListViewProps) {
  return (
    <>
      {tasks.map((task, index) => (
        <Box
          key={index}
          sx={{
            borderBottom: '1px solid #eee',
            py: 5,
            pl: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack spacing={2}>
            <Typography
              fontWeight="bold"
              sx={{ cursor: 'pointer' }}
              onClick={() => openEditModal(task?.name)}
            >
              {task.title}
            </Typography>
            {task.due_date && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarMonthIcon fontSize="small" />
                <Tooltip
                  title={`Due Date : ${format(
                    new Date(task.due_date),
                    'EEE, MMM dd, yyyy | hh:mm a'
                  )}`}
                >
                  <Typography variant="body1" color="text.secondary">
                    {format(new Date(task.due_date), ' MMM dd, hh:mm a')}
                  </Typography>
                </Tooltip>
              </Stack>
            )}

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body1" color="text.secondary">
                {task.assigned_to}
              </Typography>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: priorityColors[task.priority],
                }}
              />
              <Typography variant="body1" color="text.secondary">
                {task.priority}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {statusOptions.map(
              (option) =>
                option.value === task.status && (
                  <Tooltip key={option.value} title={task.status}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {option.icon}
                    </Stack>
                  </Tooltip>
                )
            )}

            {task.owner === userData?.email && (
              <>
                <IconButton size="small" onClick={(e) => handleMenuOpen(e, index)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && menuIndex === index}
                  onClose={handleMenuClose}
                >
                  <MenuItem
                    onClick={() => {
                      openEditModal(index);
                      handleMenuClose();
                    }}
                  >
                    <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
                  </MenuItem>

                  <MenuItem onClick={() => handleDeleteRow(task.name)}>
                    <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>
        </Box>
      ))}
    </>
  );
}