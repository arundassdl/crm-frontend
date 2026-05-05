import {
  Card,
  CardMedia,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import React, { useState } from "react";
import { CONSTANTS } from "@/services/config/app-config";

const frappeBaseUrl = CONSTANTS.API_BASE_URL || "";

export const AttachmentCard = ({ file, onView, onDelete,deletingFile }: any) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isImage = file?.file_url?.match(/\.(jpg|jpeg|png|gif)$/i);
  const isDeleting = deletingFile === file.file_url;


  const getFullUrl = (url: string) => {
    return url?.startsWith("http") ? url : `${frappeBaseUrl}${url}`;
  };

  return (
    <Paper
      elevation={1}
      sx={{
        width: 180,
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        p: 1,
      }}
    >
      {/* Top Bar: File name and menu */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          right: 8,
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--mui-palette-background-default)",
          borderRadius: 1,
          px: 1,
          width: "95%",
        }}
      >
        <Typography
          variant="body2"
          noWrap
          sx={{ maxWidth: "130px", fontWeight: 500 }}
        >
          {file?.file_name}
        </Typography>
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>

{isDeleting && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(255, 255, 255, 0.6)",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1,
          }}
        >
          <CircularProgress size={30} />
        </Box>
      )}

      {/* Image or File Preview */}
      {isImage ? (
        <CardMedia
          component="img"
          height="120"
          image={getFullUrl(file.file_url)}
          alt={file.file_name}
          sx={{ borderRadius: 1, mt: 10 }}
        />
      ) : (
        <Box
          sx={{
            height: 120,
            mt: 10,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--mui-palette-background-default)",
          }}
        >
          <InsertDriveFileIcon fontSize="large" />
        </Box>
      )}

      {/* File Size */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
        {/* <InsertDriveFileIcon fontSize="small" color="disabled" /> */}
        <Typography variant="caption" color="textSecondary">
          Size: {(file.file_size / 1024).toFixed(2)} KB
        </Typography>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            onView(file);
            setAnchorEl(null);
          }}
        >
          View
        </MenuItem>
        <MenuItem
          onClick={() => window.open(getFullUrl(file.file_url), "_blank")}
        >
          Download
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete(file);
            setAnchorEl(null);
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </Paper>
  );
};
