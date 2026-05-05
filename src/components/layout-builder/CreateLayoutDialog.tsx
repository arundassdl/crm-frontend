"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { moduleSettingsLayoutCreatePath } from "@/app/settings/utils/moduleSettingsRoutes";

function getRowVal(row: any, field: string) {
    if (!row) return undefined;
    return row[field] ?? row[`SDL Layout.${field}`];
}

export interface CreateLayoutDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmitSuccess?: () => void;
    /** SDL Module Map name - required for navigation */
    selectedModule: string | null;
    /** Layout rows for the selected module (for clone dropdown) */
    layoutRows: any[];
    embedInSettings?: boolean;
}

const CreateLayoutDialog = ({
    open,
    onClose,
    onSubmitSuccess,
    selectedModule,
    layoutRows,
    embedInSettings = false,
}: CreateLayoutDialogProps) => {
    const router = useRouter();
    const [cloneFrom, setCloneFrom] = useState<string>("");

    useEffect(() => {
        if (open) {
            // Default to first layout if available
            const first = layoutRows[0];
            setCloneFrom(first ? getRowVal(first, "name") ?? "" : "");
        }
    }, [open, layoutRows]);

    const handleContinue = () => {
        if (!selectedModule) return;
        onClose();
        if (embedInSettings) {
            router.push(
                moduleSettingsLayoutCreatePath(selectedModule, cloneFrom || undefined)
            );
        } else {
            const basePath = `/setup/customization/modules/${encodeURIComponent(selectedModule)}/layouts/create`;
            const url = cloneFrom ? `${basePath}?clone_from=${encodeURIComponent(cloneFrom)}` : basePath;
            router.push(url);
        }
        onSubmitSuccess?.();
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 600 }}>Create New Layout</DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{ mt: 2 }} size="medium">
                    <InputLabel id="clone-layout-label">Clone Layout from</InputLabel>
                    <Select
                        labelId="clone-layout-label"
                        id="clone-layout-select"
                        value={cloneFrom}
                        label="Clone Layout from"
                        onChange={(e) => setCloneFrom(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>Create from scratch (empty)</em>
                        </MenuItem>
                        {layoutRows.map((row: any) => {
                            const docName = getRowVal(row, "name");
                            const layoutName = getRowVal(row, "layout_name") ?? docName;
                            return (
                                <MenuItem key={docName} value={docName}>
                                    {layoutName}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleCancel} color="inherit">
                    Cancel
                </Button>
                <Button onClick={handleContinue} variant="contained" color="primary">
                    Continue
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateLayoutDialog;
