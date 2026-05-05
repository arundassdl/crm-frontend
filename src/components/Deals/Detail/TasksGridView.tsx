import { Grid, Card, CardContent, Stack, Typography, Tooltip, IconButton, Box } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
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

interface TasksGridViewProps {
  tasks: Task[];
  userData: any;
  openEditModal: (index: any) => void;
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

export default function TasksGridView({ tasks, userData, openEditModal, handleDeleteRow }: TasksGridViewProps) {
  return (
    <Grid container spacing={2}>
      {tasks.map((task, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card variant="outlined" sx={{ minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {task.title}
                </Typography>

                {task.due_date && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonthIcon fontSize="small" />
                    <Tooltip title={`Due Date : ${format(new Date(task.due_date), 'EEE, MMM dd, yyyy | hh:mm a')}`}>
                      <Typography variant="body1" color="text.secondary">
                        {format(new Date(task.due_date), ' MMM dd, hh:mm a')}
                      </Typography>
                    </Tooltip>
                  </Stack>
                )}

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body1">{task.assigned_to}</Typography>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priorityColors[task.priority] }} />
                  <Typography variant="body1">{task.priority}</Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  {statusOptions.find(opt => opt.value === task.status)?.icon}
                  <Typography variant="body1">{task.status}</Typography>
                </Stack>

                {task.owner === userData?.email && (
                  <Stack direction="row" justifyContent="flex-end">
                    <IconButton onClick={() => openEditModal(task.name)} size="small">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteRow(task.name)} size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}