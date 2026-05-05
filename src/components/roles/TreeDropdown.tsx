import React, { useState } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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

const TreeDropdown: React.FC<TreeDropdownProps> = ({
  label,
  value,
  onChange,
  data,
}) => {


  const handleChangeselect = (e) => {
       console.log(e, '32');
       
    };

  const [selectedDept, setSelectedDept] = useState<string | number>(value);

  // const handleChange = (event: SelectChangeEvent<string | number>) => {
  //   alert("hi");
  //   const newValue =
  //     typeof event.target.value === "string" && !isNaN(Number(event.target.value))
  //       ? Number(event.target.value)
  //       : event.target.value;

  //   setSelectedDept(newValue);
  //   onChange(newValue);
  //   console.log("Selected Department:", newValue);
  // };

  // const handleChange = (event: SelectChangeEvent<string>) => {
  //   const val = event.target.value;
  //   onChange(isNaN(Number(val)) ? val : Number(val)); // keep original type
  // };

  const renderMenuItems = (nodes: TreeNode[], level = 0) => {
    return nodes.map((node) => (
      <React.Fragment key={node.id}>
        <MenuItem
          value={String(node.id)} // always store internally as string
          sx={{ pl: level * 2 }}
        >
          {node.name}
        </MenuItem>
        {node.children && renderMenuItems(node.children, level + 1)}
      </React.Fragment>
    ));
  };

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={selectedDept}
        // onChange={handleChange}
        sx={{
          border: "1px solid #ccc",
          borderRadius: 1,
          backgroundColor: "white",
        }}
      >
        {renderMenuItems(data)}
      </Select>
    </FormControl>
  );
};

export default TreeDropdown;
