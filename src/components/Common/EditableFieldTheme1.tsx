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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { GridCheckCircleIcon, GridCloseIcon } from "@mui/x-data-grid";
import CloseIcon from "@mui/icons-material/Close";

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

const EditableFieldTheme1 = ({
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

  return (
    <Box
      display="flex"
      alignItems="flex-start"
      gap={1}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      flexDirection="column" // vertical layout
      sx={{ mb: 3 }}
    >
      <Typography
        className="font-normal text-1xl"
        sx={{ mb: 0.5 }}
      >
        {label}
      </Typography>

      {isEditing ? (
        type === "component" && component ? (
          <Box sx={{ minWidth: 250 }}>
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
          <TextField
            size="small"
            fullWidth
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
            }
            autoFocus
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
        )
      ) : (
        <Box
          sx={{
            width: "100%",
            minHeight: 40,
            padding: "2px 10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: hover ? "1px solid var(--mui-palette-primary-main)" : "1px solid #ccc",
            borderRadius: 1,
          }}
        >
          <Typography sx={{ flexGrow: 1 }}>{value}</Typography>
          {hover && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => setIsEditing(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>

  );
};
export default EditableFieldTheme1;
