import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListSubheader,
  SelectChangeEvent,
} from "@mui/material";

interface TreeNode {
  id: string | number;
  name: string;
  children?: TreeNode[];
}

interface TreeDropdownProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  data: TreeNode[];
}

const DepartmentSelect: React.FC<TreeDropdownProps> = ({
  label,
  value,
  onChange,
  data,
}) => {
  const [selectedDept, setSelectedDept] = useState<string | number>(value);

  const handleChange = (event: SelectChangeEvent<string | number>) => {
    const newValue =
      typeof event.target.value === "string" && !isNaN(Number(event.target.value))
        ? Number(event.target.value)
        : event.target.value;

    setSelectedDept(newValue);
    onChange(newValue);
    console.log("Selected Department:", newValue);
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="department-label">{label}</InputLabel>
      <Select
        labelId="department-label"
        label={label}
        value={selectedDept}
        onChange={handleChange}
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          backgroundColor: "white",
        }}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {data.map((dept) => [
          <ListSubheader key={`header-${dept.id}`}>
            {dept.name}
          </ListSubheader>,
          dept.children?.map((child) => (
            <MenuItem key={child.id} value={child.id}>
              {child.name}
            </MenuItem>
          )),
        ])}
      </Select>
    </FormControl>
  );
};

export default DepartmentSelect;
