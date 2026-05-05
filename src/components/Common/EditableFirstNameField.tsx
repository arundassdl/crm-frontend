"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { GridCheckCircleIcon, GridCloseIcon } from "@mui/x-data-grid";
import { FieldConfigNew } from "@/components/Common/Form/validationSchema";
import {
  inlineEditLabelColumnSx,
  inlineEditValueColumnSx,
  inlineEditRowRootSx,
} from "@/components/Common/inlineFieldLayout";

const DEFAULT_SALUTATIONS = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];

export interface EditableFirstNameFieldProps {
  field: FieldConfigNew;
  /** Record from API (e.g. Contact: salutation + first_name) */
  data: Record<string, any>;
  onSave: (field: string, value: any) => Promise<void>;
  /** When set, salutation + first name are persisted in one request */
  onSaveBatch?: (updates: Record<string, any>) => Promise<void>;
  isEditPermission: boolean;
  isFieldDisabled: boolean | undefined;
}

/**
 * Inline editable first name: salutation select + text, aligned with CustomForm firstname type.
 */
const EditableFirstNameField: React.FC<EditableFirstNameFieldProps> = ({
  field,
  data,
  onSave,
  onSaveBatch,
  isEditPermission,
  isFieldDisabled,
}) => {
  const salutationOptions =
    ((field as any).salutation_options as string[] | undefined) ??
    DEFAULT_SALUTATIONS;

  const salutationFromData =
    data?.salutation ??
    data?.[`${field.name}_salutation`] ??
    "";
  const firstNameFromData = data?.[field.name] ?? "";

  const [isEditing, setIsEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const [tempSalutation, setTempSalutation] = useState<string>(salutationFromData);
  const [tempFirstName, setTempFirstName] = useState<string>(firstNameFromData);

  useEffect(() => {
    setTempSalutation(salutationFromData);
    setTempFirstName(firstNameFromData);
  }, [salutationFromData, firstNameFromData]);

  const displayText = [salutationFromData, firstNameFromData]
    .filter((s) => s != null && String(s).trim() !== "")
    .join(" ")
    .trim();

  const canEdit = isEditPermission && !isFieldDisabled;

  const handleSave = async () => {
    const patch: Record<string, any> = {
      salutation: tempSalutation,
      [field.name]: tempFirstName,
    };
    try {
      if (onSaveBatch) {
        await onSaveBatch(patch);
      } else {
        await onSave("salutation", tempSalutation);
        await onSave(field.name, tempFirstName);
      }
      setIsEditing(false);
    } catch {
      // Parent handles errors / toast; stay in edit mode
    }
  };

  const handleCancel = () => {
    setTempSalutation(salutationFromData);
    setTempFirstName(firstNameFromData);
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
        color="GrayText"
        sx={inlineEditLabelColumnSx}
      >
        {field.label}:
      </Typography>

      <Box sx={inlineEditValueColumnSx}>
      {isEditing ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            alignItems: "center",
            width: "100%",
            minWidth: 0,
            margin: "-8px 0 8px 0px",
          }}
        >
          <FormControl sx={{ minWidth: 90 }} size="small">
            <InputLabel id={`cf-sal-label-${field.name}`}>Salutation</InputLabel>
            <Select
              labelId={`cf-sal-label-${field.name}`}
              label="Salutation"
              size="small"
              value={tempSalutation}
              onChange={(e) => setTempSalutation(e.target.value)}
              autoFocus
            >
              {salutationOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            sx={{ flex: 1, minWidth: 140 }}
            size="small"
            label={field.label}
            value={tempFirstName}
            onChange={(e) => setTempFirstName(e.target.value)}
            inputProps={{
              maxLength: (field as any).max_length ?? 255,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Save">
                    <IconButton
                      size="small"
                      onClick={() => void handleSave()}
                      sx={{ color: "var(--mui-palette-primary-main) !important" }}
                    >
                      <GridCheckCircleIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel">
                    <IconButton size="small" onClick={handleCancel}>
                      <GridCloseIcon fontSize="small" color="secondary" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      ) : hover && canEdit ? (
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
            {displayText || "-"}
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
        >
          {displayText || "-"}
        </Typography>
      )}
      </Box>
    </Box>
  );
};

export default EditableFirstNameField;
