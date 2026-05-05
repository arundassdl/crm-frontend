"use client";

import React from "react";
import { TreeView, TreeItem } from "@mui/lab";
import { Box, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface RoleNode {
  id: string;
  name: string;
  parent?: string;
  description?: string;
  children?: RoleNode[];
}

const roleHierarchy: RoleNode = {
  id: "admin",
  name: "Administrator",
  children: [
    {
      id: "dept-head",
      name: "Department Head",
      parent: "admin",
      children: [
        {
          id: "manager",
          name: "Manager",
          parent: "dept-head",
          children: [
            {
              id: "team-lead",
              name: "Team Lead",
              parent: "manager",
              children: [
                {
                  id: "executive",
                  name: "Executive",
                  parent: "team-lead",
                  children: [
                    {
                      id: "associate",
                      name: "Associate",
                      parent: "executive",
                      children: [
                        {
                          id: "intern",
                          name: "Intern",
                          parent: "associate",
                          children: [],
                          description: "Temporary learning positions"
                        }
                      ],
                      description: "Entry-level specialists"
                    }
                  ],
                  description: "Mid-level professionals"
                }
              ],
              description: "Direct team leadership"
            }
          ],
          description: "Team and project management"
        }
      ],
      description: "Department oversight and strategy"
    }
  ],
  description: "Full system administration"
};

export default function RoleTreeView(): JSX.Element {
  const handleEdit = (node: RoleNode) => {
    alert(`Editing role: ${node.name}`);
  };

  const renderTree = (node: RoleNode): JSX.Element => (
    <TreeItem
      key={node.id}
      nodeId={node.id} // MUI v5 uses nodeId
      label={
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body1" sx={{ flexGrow: 1 }}>
            {node.name}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(node);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      {node.children?.map((child) => renderTree(child))}
    </TreeItem>
  );

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{
        height: 500,
        flexGrow: 1,
        overflowY: "auto",
        backgroundColor: "#fafafa",
        p: 2,
        borderRadius: 2
      }}
    >
      {renderTree(roleHierarchy)}
    </TreeView>
  );
}
