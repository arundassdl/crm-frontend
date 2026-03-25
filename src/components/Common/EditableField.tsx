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

}

const EditableField = ({
  name,
  label,
  field,
  value,
  type = "text",
  options = [],
  onSave,
  component
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

  const handleSave = () => {
    console.log("inputValue", inputValue);
    if (String(inputValue).trim() !== "") {
      onSave?.(field, inputValue, name, label);
    }
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

  return (
    <Box
      display="flex"
      alignItems="flex-start"
      gap={1}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      flexDirection="row"
    >
      <Typography className="font-medium text-1xl" color={"GrayText"} sx={{ minWidth: 125 }}>{label}:</Typography>

      {isEditing ? (
        <>
          {type === "component" && component ? (
            <Box sx={{ minWidth: 250, margin: "-8px 0 8px 0px" }}>
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
                  sx={{ minWidth: 250, margin: "-8px 0 8px 0px" }}
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
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label={label}
                      value={fieldValue}
                      onChange={(val) => {
                        setFieldValue(val);
                        setInputValue(val);
                        onSave?.(field, formatCalDate(val), name, label);
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
                      sx={{ width: 300 }}
                    />
                  </LocalizationProvider>

                </>

              ) : (
                <>
                  <TextField
                    sx={{ minWidth: 180, margin: "-8px 0 8px 0px" }}
                    size="small"
                    select={type === "select"}
                    multiline={type === "textarea"}
                    rows={type === "textarea" ? 3 : 1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={
                      type !== "textarea"
                        ? (e) => {
                          if (e.key === "Enter") handleSave();
                        }
                        : undefined
                    } autoFocus
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
          {hover && !isEditing ? (
            <Typography
              sx={{
                minWidth: 250,
                minHeight: 40, // Keeps height consistent
                border: "1px solid transparent", // Default border to prevent jumping
                "&:hover": {
                  border: "1px solid var(--mui-palette-primary-main)",
                  margin: "-8px 0 8px 0px"
                }, // Show border on hover

                display: "flex",
                alignItems: "flex-start", // Align text to the top
                justifyContent: "space-between",
                borderRadius: 1,
                // marginTop: -2,
                margin: "-8px 0 8px 0px"

              }}
            >
              <Box sx={{ flexGrow: 1, padding: "8px 8px 0 13px" }}>{value}</Box>{" "}
              {/* Text stays at the top */}
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => setIsEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
          ) : (
            <Typography
              sx={{ minWidth: 300, minHeight: 40, padding: "1px 8px 0 14px" }}
              color={"var(--mui-palette-secondary-dark)"}
            >
              {value}
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
