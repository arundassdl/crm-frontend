"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  TextField,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Autocomplete } from "@mui/lab";
import {
  ComponentPicklistOption,
  getComponentPicklist,
} from "@/services/api/general_apis/component-picklist-api";
import {
  inlineEditLabelColumnSx,
  inlineEditValueColumnSx,
  inlineEditRowRootSx,
} from "@/components/Common/inlineFieldLayout";

interface EditablePicklistProps {
  label: string;
  field: string;
  value?: string;
  module: string;
  layoutName: string;
  parentValue?: string | null;
  onSave: (field: string, value: any) => Promise<void> | void;
  isEditPermission?: boolean;
}

const EditablePicklist: React.FC<EditablePicklistProps> = ({
  label,
  field,
  value = "",
  module,
  layoutName,
  parentValue,
  onSave,
  isEditPermission = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const [options, setOptions] = useState<ComponentPicklistOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] =
    useState<ComponentPicklistOption | null>(null);
  const [open, setOpen] = useState(false);

  // Load options from backend like PickListField
  useEffect(() => {
    const loadOptions = async () => {
      const token = readAccessTokenString();

      if (!token || !module || !layoutName || !field) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const result = await getComponentPicklist(
          module,
          layoutName,
          field,
          token,
          parentValue ?? undefined
        );
        setOptions(result || []);
      } catch (err) {
        console.error("EditablePicklist: Failed to load options", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [module, layoutName, field, parentValue]);

  // Keep selected option in sync with external value
  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    const match = options.find((opt) => opt.value === value);
    setSelectedOption(match || null);
  }, [value, options]);

  const handleSave = async () => {
    const nextValue = selectedOption?.value || "";
    await onSave(field, nextValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    const match = options.find((opt) => opt.value === value);
    setSelectedOption(match || null);
    setIsEditing(false);
  };

  const displayValue = selectedOption?.label || value || "-";
  const selectedColor = selectedOption?.color;

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
      <Typography
        className="font-medium text-1xl"
        color={"GrayText"}
        sx={inlineEditLabelColumnSx}
      >
        {label}:
      </Typography>

      <Box sx={inlineEditValueColumnSx}>
      {isEditing ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, width: "100%" }}>
          <Autocomplete
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            options={options}
            loading={loading}
            getOptionLabel={(option) =>
              typeof option === "string"
                ? option
                : option.label || option.value || ""
            }
            value={selectedOption}
            onChange={(_, newValue) => {
              setSelectedOption(newValue as ComponentPicklistOption | null);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder={`Select ${label}`}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
            sx={{
              minWidth: 0,
              flex: 1,
              margin: "-8px 0 8px 0px",
                  ...(selectedColor
                    ? {
                        "& .MuiOutlinedInput-input": {
                          bgcolor: selectedColor,
                          color: "#fff",
                        },
                      }
                    : {}),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {option.color && (
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: option.color,
                        border: "1px solid rgba(0,0,0,0.12)",
                      }}
                    />
                  )}
                  <Typography variant="body2">
                    {option.label || option.value}
                  </Typography>
                </Box>
              </li>
            )}
            fullWidth
          />
          <Tooltip title="Save">
            <IconButton size="small" color="primary" onClick={handleSave}>
              <CheckIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel">
            <IconButton size="small" onClick={handleCancel}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <>
          {hover && isEditPermission ? (
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
              <Box
                sx={{
                  flexGrow: 1,
                  padding: "8px 8px 0 0",
                  ...(selectedColor
                    ? {
                        bgcolor: selectedColor,
                        color: "#fff",
                        borderRadius: 0.8,
                      }
                    : {}),
                }}
              >
                {displayValue}
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
                ...(selectedColor
                  ? {
                      bgcolor: selectedColor,
                      color: "#fff",
                      borderRadius: 0.8,
                    }
                  : {}),
              }}
              color={"var(--mui-palette-secondary-dark)"}
            >
              {displayValue}
            </Typography>
          )}
        </>
      )}
      </Box>
    </Box>
  );
};

export default EditablePicklist;

