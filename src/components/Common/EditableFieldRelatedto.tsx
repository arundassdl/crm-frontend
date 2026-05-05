"use client";

import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { GridCheckCircleIcon, GridCloseIcon } from "@mui/x-data-grid";
import RelatedTo from "./Form/FormFields/RelatedToField";
import { FieldConfigNew } from "./Form/validationSchema";
import {
    inlineEditLabelColumnSx,
    inlineEditValueColumnSx,
    inlineEditRowRootSx,
} from "@/components/Common/inlineFieldLayout";

interface EditableFieldRelatedtoProps {
    label: string;
    field: FieldConfigNew;
    value: any;
    type?: any;
    onSave: (field: string, value: any) => Promise<void>;
    isEditPermission?: boolean;
    onTypeChange?: (type: any) => void;
    disabled?: boolean;
}

const EditableFieldRelatedto: React.FC<EditableFieldRelatedtoProps> = ({
    label,
    field,
    value,
    type,
    onSave,
    isEditPermission = true,
    onTypeChange,
    disabled = false,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [hover, setHover] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    const handleSave = async () => {
        await onSave(field.name, tempValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempValue(value);
        setIsEditing(false);
    };

    const isFieldDisabled = disabled || (typeof field.disable === "function" ? field.disable(value) : field.disable);
    const canEdit = isEditPermission && !isFieldDisabled;

    return (
        <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="flex-start"
            gap={0}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            flexDirection="row"
            sx={inlineEditRowRootSx}
        >
            <Typography className="font-medium text-1xl" color={"GrayText"} sx={inlineEditLabelColumnSx}>
                {label}:
            </Typography>

            <Box sx={inlineEditValueColumnSx}>
            {isEditing ? (
                <Box sx={{ display: "flex", alignItems: "flex-start", flexGrow: 1, gap: 1, mt: -1, minWidth: 0, width: "100%" }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <RelatedTo
                            fieldName={field.name}
                            doctype={field.doctype || ""}
                            referenceDoctype={field.referenceDoctype}
                            label=""
                            placeholder={field.placeholder}
                            value={tempValue}
                            type={type}
                            onTypeChange={onTypeChange}
                            onChange={(val) => setTempValue(val)}
                            error={false}
                            disabled={false}
                            filters={field.filters}
                            searchFields={field.searchFields || field.search_fields}
                            displayFields={field.displayFields || field.display_fields}
                        />
                    </Box>
                    <Box sx={{ display: "flex", mt: 1 }}>
                        <Tooltip title="Save">
                            <IconButton size="small" color="primary" onClick={handleSave}>
                                <GridCheckCircleIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                            <IconButton size="small" onClick={handleCancel}>
                                <GridCloseIcon fontSize="small" color="secondary" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            ) : (
                <>
                    {hover && canEdit ? (
                        <Typography
                            sx={{
                                width: "100%",
                                minWidth: 0,
                                minHeight: 40,
                                border: "1px solid transparent",
                                "&:hover": {
                                    border: "1px solid var(--mui-palette-primary-main)",
                                    margin: "-8px 0 8px 0px",
                                },
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                borderRadius: 1,
                                margin: "-8px 0 8px 0px",
                            }}
                        >
                            <Box sx={{ flexGrow: 1, padding: "8px 8px 0 0" }}>
                                {value || "-"}
                            </Box>
                            <Tooltip title="Edit">
                                <IconButton size="small" onClick={() => setIsEditing(true)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Typography>
                    ) : (
                        <Typography
                            sx={{
                                width: "100%",
                                minWidth: 0,
                                minHeight: 40,
                                padding: "1px 0 0 0",
                            }}
                            color={"var(--mui-palette-secondary-dark)"}
                        >
                            {value || "-"}
                        </Typography>
                    )}
                </>
            )}
            </Box>
        </Box>
    );
};

export default EditableFieldRelatedto;
