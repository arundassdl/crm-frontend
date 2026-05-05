"use client";
import * as React from "react";
import {
  Button,
  Popover,
  Typography,
  Box,
} from "@mui/material";
import { TreeView, TreeItem } from "@mui/lab";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
};

interface TreeDropdownProps {
  label: string;
  data: TreeNode[];
  value: string;
  onChange: (id: string) => void;
}

export default function TreeDropdown({
  label,
  data,
  value,
  onChange,
}: TreeDropdownProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (id: string) => {
    onChange(id);
    handleClose();
  };

  const renderTree = (nodes: TreeNode) => (
    <TreeItem
      key={nodes.id}
      nodeId={nodes.id}
      label={nodes.label}
      onClick={(e) => {
        e.stopPropagation();
        handleSelect(nodes.id);
      }}
    >
      {Array.isArray(nodes.children)
        ? nodes.children.map((node) => renderTree(node))
        : null}
    </TreeItem>
  );

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        {value
          ? data
              .flatMap(flattenTree)
              .find((node) => node.id === value)?.label || label
          : label}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Box sx={{ p: 1, minWidth: 250 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Select Item
          </Typography>
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
          >
            {data.map((node) => renderTree(node))}
          </TreeView>
        </Box>
      </Popover>
    </>
  );
}

// Helper to flatten tree for label lookup
const flattenTree = (node: TreeNode): TreeNode[] => [
  node,
  ...(node.children ? node.children.flatMap(flattenTree) : []),
];
