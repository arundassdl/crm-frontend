// import React from "react";
// import {
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   SelectChangeEvent,
// } from "@mui/material";

// type TreeNode = {
//   id: string;
//   name: string;
//   children?: TreeNode[];
// };

// interface TreeDropdownProps {
//   label: string;
//   value: string;
//   onChange: (value: string) => void;
//   data: TreeNode[];
// }

// const TreeDropdown: React.FC<TreeDropdownProps> = ({
//   label,
//   value,
//   onChange,
//   data,
// }) => {
//   const renderTreeItems = (nodes: TreeNode[], level = 0) => {
//     return nodes.map((node) => (
//       <React.Fragment key={node.name}>
//         <MenuItem value={node.name} sx={{ pl: level * 2 + 2 }}>
//           {node.role_name}
//         </MenuItem>
//         {node.children && renderTreeItems(node.children, level + 1)}
//       </React.Fragment>
//     ));
//   };

//   const handleChange = (event: SelectChangeEvent) => {
//     onChange(event.target.value);
//   };

//   return (
//     <FormControl fullWidth variant="outlined" sx={{ minWidth: 240 }}>
//       <InputLabel>{label}</InputLabel>
//       <Select
//         label={label}
//         value={value}
//         onChange={handleChange}
//         sx={{
//           border: "1px solid #ccc",
//           borderRadius: 1,
//           backgroundColor: "white",
//         }}
//       >
//         {renderTreeItems(data)}
//       </Select>
//     </FormControl>
//   );
// };

// export default TreeDropdown;
