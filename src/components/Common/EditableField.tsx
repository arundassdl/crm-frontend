'use client'
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  TextField,
  Stack,
  Grid,
  InputAdornment,
  MenuItem,
  Autocomplete,
  Link,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { GridCheckCircleIcon, GridCloseIcon } from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close";
import DatePickerField from "./Form/FormFields/DatePickerField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { formatCalDate } from "@/services/api/common-erpnext-api/libs/utils";
import {
  inlineEditLabelColumnSx,
  inlineEditValueColumnSx,
} from "@/components/Common/inlineFieldLayout";

export interface EditOption {
  label: string;
  value: string;
}
interface EditProps {
  options?: EditOption[]; // Explicitly define options as a string array
  label?: string,
  field?: string,
  value?: string,
  type?: string,
  name?: string,
  onSave?: (field: any, value: any, name?: any, label?: string) => void | Promise<void>;
  component?: React.ComponentType<any>;
  isEditpermission?: boolean;
  displayColor?: string;
  max_length?: number;
  /** When true, saving an empty value calls `onSave` (e.g. clear optional fields). Default: false. */
  allowEmptySave?: boolean;
  /** Label on its own row above the value; full-width left alignment (e.g. company settings). */
  stackedLayout?: boolean;
}

const EditableField = ({
  name,
  label,
  field,
  value,
  type = "text",
  options = [],
  onSave,
  component,
  isEditpermission = true,
  displayColor,
  max_length,
  allowEmptySave = false,
  stackedLayout = false,
}: EditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hover, setHover] = useState(false);
  // const [inputValue, setInputValue] = useState(value);
  const [inputValue, setInputValue] = useState<string>(
    type === "select"
      ? typeof options[0] === "string"
        ? options[0]
        : options[0]?.value || ""
      : value || ""
  );
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    if (!isEditpermission && isEditing) setIsEditing(false);
  }, [isEditpermission, isEditing]);

  const handleSave = () => {
    const trimmed = String(inputValue ?? "").trim();
    if (trimmed === "" && !allowEmptySave) {
      setIsEditing(false);
      return;
    }
    onSave?.(field, inputValue ?? "", name, label);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue(value || ""); // Reset to original value
    setIsEditing(false);
  };
  const [currentValue, setCurrentValue] = useState<any>(options.find(opt => opt.value === value) || null)
  const [fieldValue, setFieldValue] = useState<any>(value ? new Date(value) : null);

  useEffect(() => {
    setFieldValue(value ? new Date(value) : null);
  }, [value]);

  const displayValueSx = {
    minWidth: 0,
    wordBreak: "break-word" as const,
    overflowWrap: "anywhere" as const,
  };

  const renderReadonlyValue = () => {
    const raw = value;
    if (raw === undefined || raw === null || raw === "") return "-";
    if (type === "email" && String(raw).trim()) {
      return (
        <Link
          href={`mailto:${String(raw).trim()}`}
          underline="hover"
          color={displayColor ? "inherit" : "primary"}
          sx={{
            ...displayValueSx,
            fontSize: "inherit",
            ...(displayColor ? { color: "inherit" } : {}),
          }}
        >
          {String(raw)}
        </Link>
      );
    }
    return raw;
  };

  const labelColumnSx = stackedLayout
    ? {
        width: '100%',
        flex: '0 0 auto',
        maxWidth: '100%',
        flexShrink: 0,
        pr: 0,
        pb: 0.5,
        textAlign: 'left' as const,
        alignSelf: 'stretch',
      }
    : inlineEditLabelColumnSx

  const valueColumnSx = stackedLayout
    ? {
        flex: '0 0 auto',
        width: '100%',
        minWidth: 0,
        textAlign: 'left' as const,
        alignSelf: 'stretch',
      }
    : inlineEditValueColumnSx

  return (
    <Box
      display="flex"
      alignItems="flex-start"
      justifyContent="flex-start"
      gap={0}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      flexDirection={stackedLayout ? 'column' : { xs: 'column', sm: 'row' }}
      sx={{ flex: 1, minWidth: 0, width: "100%", textAlign: 'left' }}
    >
      <Typography className="font-medium text-1xl" color={"GrayText"} sx={labelColumnSx}>
        {label}:
      </Typography>

      {isEditing ? (
        <>
          {type === "component" && component ? (
            <Box sx={{ ...valueColumnSx, minWidth: 250, margin: "-8px 0 8px 0px" }}>
              {React.createElement(component, {
                value: inputValue,
                touched: {},
                errors: {},
                onCustomerSelect: (customer: any) => {
                  setInputValue(customer?.value || "");
                  onSave?.(field, customer?.value, name, label);
                  setIsEditing(false);
                },
              })}
              <Tooltip title="Cancel">
                <IconButton size="small" onClick={handleCancel}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <>
              {type === "autocomplete" ? (
                <Autocomplete
                  sx={{ ...valueColumnSx, minWidth: 250, margin: "-8px 0 8px 0px" }}
                  options={options}
                  getOptionLabel={(option) => option.label}
                  value={currentValue}
                  onChange={(event, newValue) =>
                    // handleFieldChange(
                    //   field.name,
                    //   newValue?.value || "",
                    //   setFieldValue,
                    //   values
                    // )
                    setCurrentValue(newValue)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={label}
                      // error={touched[name] && Boolean(errors[name])}
                      // helperText={
                      //   touched[name] && typeof errors[name] === "string"
                      //     ? (errors[name] as string)
                      //     : undefined
                      // }
                      fullWidth
                    />
                  )}

                />
              ) : type === "date" ? (
                <>
                  {/* <DatePickerField name={name} label={label} /> */}
                  <Box sx={{ ...valueColumnSx, margin: "-8px 0 8px 0px" }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label={label}
                        value={fieldValue}
                        onChange={(val) => {
                          setFieldValue(val);
                          setInputValue(val);
                          let payload = "";
                          if (val instanceof Date && !Number.isNaN(val.getTime())) {
                            try {
                              payload = formatCalDate(val);
                            } catch {
                              payload = "";
                            }
                          }
                          onSave?.(field, payload, name, label);
                          setIsEditing(false);
                        }}
                        slots={{
                          textField: TextField,
                        }}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                          },
                        }}
                        sx={{ width: '100%', maxWidth: stackedLayout ? '100%' : 360 }}
                      />
                    </LocalizationProvider>
                  </Box>

                </>

              ) : (
                <>
                  <TextField
                    fullWidth={
                      stackedLayout ||
                      type === "email" ||
                      type === "select" ||
                      type === "multiline" ||
                      type === "textarea"
                    }
                    sx={{
                      ...valueColumnSx,
                      minWidth: stackedLayout ? 0 : type === "email" ? 0 : 180,
                      maxWidth: "100%",
                      margin: "-8px 0 8px 0px",
                    }}
                    size="small"
                    select={type === "select"}
                    multiline={type === "textarea" || type === "multiline"}
                    rows={type === "textarea" || type === "multiline" ? 3 : 1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={
                      type !== "textarea" && type !== "multiline"
                        ? (e) => {
                          if (e.key === "Enter") handleSave();
                        }
                        : undefined
                    } autoFocus
                    inputProps={
                      type === "select"
                        ? undefined
                        : {
                            maxLength:
                              !type || type === "text" || type === "email"
                                ? max_length ?? (type === "email" ? 254 : 255)
                                : undefined,
                            type: type === "email" ? "email" : "text",
                          }
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Save">
                            <IconButton
                              size="small"
                              onClick={handleSave}
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
                  >
                    {type === "select" &&
                      options.map((option) => {
                        const val = typeof option === "string" ? option : option.value;
                        const label = typeof option === "string" ? option : option.label;
                        return (
                          <MenuItem key={val} value={val}>
                            {label}
                          </MenuItem>
                        );
                      })}
                  </TextField>
                </>
              )}
            </>
          )}

        </>
      ) : (
        <>
          {hover && isEditpermission && !isEditing ? (
            <Box
              sx={{
                ...valueColumnSx,
                minHeight: 40,
                border: "1px solid transparent",
                "&:hover": {
                  border: "1px solid var(--mui-palette-primary-main)",
                  margin: "-8px 0 8px 0px",
                },
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                borderRadius: 1,
                margin: "-8px 0 8px 0px",
              }}
              component="div"
            >
              <Box
                sx={{
                  flex: 1,
                  padding: "8px 8px 0 0",
                  textAlign: "left",
                  ...displayValueSx,
                  ...(displayColor
                    ? {
                        bgcolor: displayColor,
                        color: "#fff",
                        borderRadius: 0.8,
                      }
                    : {}),
                }}
              >
                {renderReadonlyValue()}
              </Box>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => setIsEditing(true)} sx={{ flexShrink: 0, ml: 0.5 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Typography
              sx={{
                ...valueColumnSx,
                minHeight: 40,
                padding: "1px 0 0 0",
                ...displayValueSx,
                ...(displayColor
                  ? {
                      bgcolor: displayColor,
                      color: "#fff",
                      borderRadius: 0.8,
                    }
                  : {}),
              }}
              component="div"
            >
              {renderReadonlyValue()}
            </Typography>
          )}
        </>
      )}

      {/* {hover && !isEditing && (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => setIsEditing(true)} >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )} */}
    </Box>
  );
};
export default EditableField;
