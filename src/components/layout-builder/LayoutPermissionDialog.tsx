"use client";

import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Autocomplete,
    CircularProgress,
    Typography,
    IconButton,
    Tooltip,
    Chip,
} from "@mui/material";
import { InfoOutlined as InfoIcon } from "@mui/icons-material";
import { get_full_roles_withouttree } from "@/services/api/roles/roles-api";

export interface LayoutPermissionDialogProps {
    open: boolean;
    onClose: () => void;
    layoutName: string;
    initialSharedTo: string[];
    onSave: (sharedTo: string[]) => Promise<void>;
    /** Optional custom title, defaults to 'Layout Permission' */
    title?: string;
}

const LayoutPermissionDialog: React.FC<LayoutPermissionDialogProps> = ({
    open,
    onClose,
    layoutName,
    initialSharedTo,
    onSave,
    title = "Layout Permission",
}) => {
    const [roleOptions, setRoleOptions] = useState<{ id: string; role_name: string }[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [tempSharedTo, setTempSharedTo] = useState<string[]>(initialSharedTo);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setRolesLoading(true);
            get_full_roles_withouttree("")
                .then((list) => setRoleOptions(Array.isArray(list) ? list : []))
                .finally(() => setRolesLoading(false));
        }
    }, [open]);

    useEffect(() => {
        setTempSharedTo(initialSharedTo ?? []);
    }, [initialSharedTo, open]);

    const handleCancel = () => {
        setTempSharedTo(initialSharedTo ?? []);
        onClose();
    };

    const handleDone = async () => {
        setSaving(true);
        try {
            await onSave(tempSharedTo);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    minHeight: 250,
                    p: 4,
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                    pb: 3,
                }}
            >
                <Typography component="span" variant="h6" fontWeight={600}>
                    {title}
                </Typography>
                <Typography component="span" variant="h6" fontWeight={600}>
                    -
                </Typography>
                <Chip
                    label={layoutName || "Untitled"}
                    size="small"
                    variant="outlined"
                    sx={{
                        borderRadius: 20,
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        fontWeight: 500,
                        px: 1,
                        height: 26,
                    }}
                />
                <Tooltip
                    title="Select the profile(s) you want to assign the permissions to"
                    placement="top"
                    arrow
                >
                    <IconButton
                        size="small"
                        sx={{ ml: 0.5, color: "text.secondary" }}
                        aria-label="Permission help"
                    >
                        <InfoIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </DialogTitle>
            <DialogContent
                dividers
                sx={{
                    pt: 2.5,
                    pb: 2,
                    minHeight: 130,
                    "&.MuiDialogContent-dividers": {
                        borderTop: 0,
                        borderBottom: 0,
                    },
                }}
            >
                <Autocomplete
                    multiple
                    size="medium"
                    options={roleOptions}
                    getOptionLabel={(option) =>
                        typeof option === "string"
                            ? option
                            : option.role_name ?? option.id ?? ""
                    }
                    value={roleOptions.filter((r) => (tempSharedTo ?? []).includes(r.id))}
                    onChange={(_, newValue) => {
                        setTempSharedTo(
                            newValue.map((r: any) => (typeof r === "string" ? r : r.id))
                        );
                    }}
                    loading={rolesLoading}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const { key, ...chipProps } = getTagProps({ index });
                            return (
                                <Chip
                                    key={key}
                                    label={
                                        typeof option === "string"
                                            ? option
                                            : option.role_name ?? option.id
                                    }
                                    size="small"
                                    {...chipProps}
                                    sx={{
                                        borderRadius: 2,
                                        bgcolor: "secondary.light",
                                        color: "secondary.contrastText",
                                        "& .MuiChip-deleteIcon": { color: "secondary.dark" },
                                    }}
                                />
                            );
                        })
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder=""
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    minHeight: 80,
                                    alignItems: "flex-start",
                                    pt: 1.75,
                                    "& .MuiInputBase-input": {
                                        minHeight: 32,
                                    },
                                },
                            }}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {rolesLoading ? (
                                            <CircularProgress color="inherit" size={20} />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    fullWidth
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                <Button
                    onClick={handleCancel}
                    color="inherit"
                    disabled={saving}
                    variant="outlined"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleDone}
                    variant="contained"
                    color="primary"
                    disabled={saving}
                >
                    {saving ? "Saving…" : "Save"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LayoutPermissionDialog;
