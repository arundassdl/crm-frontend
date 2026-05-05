"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Switch,
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Select,
    MenuItem,
    Stack,
    Divider,
} from "@mui/material";
import { LocalizationProvider, DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parse } from "date-fns";

interface ReminderFieldProps {
    fieldName?: string;
    label?: string;
    placeholder?: string;
    value?: string; // Expecting a JSON string or null
    onChange: (value: string | null) => void;
    disabled?: boolean;
    error?: boolean;
    helperText?: string;
    filters?: any;
    searchFields?: string[];
    displayFields?: string[];
    doctype?: string;
    referenceDoctype?: string;
}

const ReminderField: React.FC<ReminderFieldProps> = ({
    value,
    onChange,
    disabled,
    label,
}) => {
    const [enabled, setEnabled] = useState(false);
    const [open, setOpen] = useState(false);
    const [reminderData, setReminderData] = useState({
        date: new Date(),
        time: new Date(),
        notifyBy: "Email",
    });

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Parse value on mount or change
    useEffect(() => {
        if (value) {
            try {
                const parsed = JSON.parse(value);
                if (parsed && parsed.date) {
                    setReminderData({
                        date: new Date(parsed.date),
                        time: new Date(parsed.time || parsed.date),
                        notifyBy: parsed.notifyBy || "Email",
                    });
                    setEnabled(true);
                }
            } catch (e) {
                console.error("Failed to parse reminder value:", e);
                setEnabled(false);
            }
        } else {
            setEnabled(false);
        }
    }, [value]);

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            setOpen(true);
            setErrorMsg(null);
        } else {
            setEnabled(false);
            onChange(null);
        }
    };

    const handleDone = () => {
        const selectedDate = new Date(reminderData.date);
        const selectedTime = new Date(reminderData.time);

        // Combine date and time
        const combined = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            selectedTime.getHours(),
            selectedTime.getMinutes(),
            selectedTime.getSeconds()
        );

        if (combined < new Date()) {
            setErrorMsg("Reminder time should be greater than current time");
            return;
        }

        const finalData = {
            date: combined.toISOString(),
            time: combined.toISOString(),
            notifyBy: reminderData.notifyBy,
        };
        onChange(JSON.stringify(finalData));
        setEnabled(true);
        setOpen(false);
        setErrorMsg(null);
    };

    const handleCancel = () => {
        setOpen(false);
        setErrorMsg(null);
        // If we were turning it on for the first time and cancelled, revert toggle
        if (!value) {
            setEnabled(false);
        }
    };

    const formattedReminder = () => {
        if (!value) return "";
        try {
            const data = JSON.parse(value);
            const dateStr = format(new Date(data.date), "MMM d, yyyy");
            const timeStr = format(new Date(data.time), "hh:mm aa");
            return `On ${dateStr} at ${timeStr} by ${data.notifyBy}`;
        } catch (e) {
            return "";
        }
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
            {label && (
                <Typography variant="body1" sx={{ minWidth: 100 }}>
                    {label}
                </Typography>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 20 }}>
                <Switch
                    checked={enabled}
                    onChange={handleToggle}
                    disabled={disabled}
                    color="success"
                />
                {enabled && value && (
                    <Typography variant="body2" sx={{ color: "primary.main", fontWeight: 500 }}>
                        {formattedReminder()}
                    </Typography>
                )}
            </Box>

            <Dialog open={open} onClose={handleCancel} maxWidth="xs" fullWidth>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" color="textSecondary">
                                    On
                                </Typography>
                                <DatePicker
                                    value={reminderData.date}
                                    onChange={(val) =>
                                        val && setReminderData({ ...reminderData, date: val })
                                    }
                                    slotProps={{
                                        textField: { size: "small", sx: { width: 150 } },
                                    }}
                                />
                                <Typography variant="body2" color="textSecondary">
                                    at
                                </Typography>
                                <TimePicker
                                    value={reminderData.time}
                                    onChange={(val) =>
                                        val && setReminderData({ ...reminderData, time: val })
                                    }
                                    slotProps={{
                                        textField: { size: "small", sx: { width: 150 } },
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Typography variant="body1">Notify</Typography>
                                <Select
                                    value={reminderData.notifyBy}
                                    onChange={(e) =>
                                        setReminderData({ ...reminderData, notifyBy: e.target.value })
                                    }
                                    size="small"
                                    variant="standard"
                                    sx={{ minWidth: 100 }}
                                >
                                    <MenuItem value="Email">Email</MenuItem>
                                    <MenuItem value="Popup">Popup</MenuItem>
                                    <MenuItem value="Both">Both</MenuItem>
                                </Select>
                            </Box>
                            {errorMsg && (
                                <Typography variant="caption" color="error">
                                    {errorMsg}
                                </Typography>
                            )}
                            <Divider />
                        </Stack>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCancel} variant="outlined" color="inherit" size="small">
                        Cancel
                    </Button>
                    <Button onClick={handleDone} variant="contained" color="primary" size="small">
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReminderField;

