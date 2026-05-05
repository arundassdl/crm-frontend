"use client";
import { readAccessTokenString } from '@/utils/accessTokenDataStorage'
import React, { useEffect, useMemo, useState } from "react";
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
  StageProbabilityOption,
  getComponentStageProbability,
} from "@/services/api/general_apis/component-picklist-api";
import {
  inlineEditLabelColumnSx,
  inlineEditValueColumnSx,
  inlineEditRowRootSx,
} from "@/components/Common/inlineFieldLayout";

interface EditableStageProbabilityFieldProps {
  label: string;
  field: string; // stage field technical name
  value?: string;
  module: string;
  layoutName: string;
  onSave: (field: string, value: any) => Promise<void> | void;
  onSaveBatch?: (updates: Record<string, any>) => Promise<void> | void;
  isEditPermission?: boolean;
  probabilityFieldName?: string;
  recordCategoryFieldName?: string;
  forecastCategoryFieldName?: string;
}

const EditableStageProbabilityField: React.FC<EditableStageProbabilityFieldProps> = ({
  label,
  field,
  value = "",
  module,
  layoutName,
  onSave,
  onSaveBatch,
  isEditPermission = true,
  probabilityFieldName = "probability",
  recordCategoryFieldName = "record_category",
  forecastCategoryFieldName = "forecast_category",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const [options, setOptions] = useState<StageProbabilityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<StageProbabilityOption | null>(null);
  const [open, setOpen] = useState(false);

  const token = useMemo(() => readAccessTokenString(), []);

  useEffect(() => {
    const loadOptions = async () => {
      if (!token || !module || !layoutName || !field) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const result = await getComponentStageProbability(module, layoutName, field, token);
        setOptions(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error("EditableStageProbabilityField: Failed to load options", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [token, module, layoutName, field]);

  // Sync selected option with external value
  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    const match = options.find((opt) => opt.value === value) || null;
    setSelectedOption(match);
  }, [value, options]);

  const displayValue = selectedOption?.label || value || "-";
  const selectedColor = selectedOption?.color;

  const handleSave = async () => {
    const nextStage = selectedOption?.value || "";
    const updates: Record<string, any> = {
      [field]: nextStage,
    };

    if (selectedOption) {
      updates[probabilityFieldName] = selectedOption.probability ?? 0;
      updates[recordCategoryFieldName] = selectedOption.record_category ?? "";
      updates[forecastCategoryFieldName] = selectedOption.forecast_category ?? "";
    }

    if (onSaveBatch) {
      await onSaveBatch(updates);
    } else {
      await onSave(field, nextStage);
      if (selectedOption) {
        await onSave(probabilityFieldName, updates[probabilityFieldName]);
        await onSave(recordCategoryFieldName, updates[recordCategoryFieldName]);
        await onSave(forecastCategoryFieldName, updates[forecastCategoryFieldName]);
      }
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    const match = value ? options.find((opt) => opt.value === value) || null : null;
    setSelectedOption(match);
    setIsEditing(false);
  };

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
              setSelectedOption(newValue as StageProbabilityOption | null);
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
            <Tooltip title="Edit">
              <Box
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
                <IconButton size="small" onClick={() => setIsEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            </Tooltip>
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

export default EditableStageProbabilityField;

