'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const statusOptions = [
  { value: 'Backlog', label: 'Backlog' },
  { value: 'Todo', label: 'Todo' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
  { value: 'Canceled', label: 'Canceled' },
];

export default function CreateTaskDialog({ open, onClose, onCreate }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Backlog');
  const [assignee, setAssignee] = useState('Administrator');
  const [dueDate, setDueDate] = useState<Dayjs | null>(dayjs());

  const handleSubmit = () => {
    if (!title) return alert('Title is required');
    const payload = {
      title,
      description,
      status,
      assignee,
      dueDate: dueDate?.format(),
    };
    onCreate(payload);
    // Optionally reset form
    setTitle('');
    setDescription('');
    setStatus('Backlog');
    setDueDate(dayjs());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Task</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            fullWidth
          />
         <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePicker
          label="Due Date"
          value={dueDate} // can be Dayjs | null
          onChange={(newValue) => setDueDate(newValue)}
        />
      </LocalizationProvider>

        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
