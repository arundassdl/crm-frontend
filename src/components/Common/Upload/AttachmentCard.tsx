"use client";

import React, { useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  DotsThreeVertical,
  Eye,
  DownloadSimple,
  Trash,
  FilePdf,
  FileText,
  ImageSquare,
} from "@phosphor-icons/react";
import { CONSTANTS } from "@/services/config/app-config";

const frappeBaseUrl = CONSTANTS.API_BASE_URL || "";

const IMAGE_RE = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;

/** Human-readable file size (B / KB / MB). */
export const formatFileSize = (bytes: number) => {
  const n = Number(bytes);
  if (!n || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

/** Icon for a non-image file, chosen by extension. */
export const fileTypeIcon = (fileName = "", size = 26, color = "#1D4ED8") => {
  if (/\.pdf$/i.test(fileName)) return <FilePdf size={size} color={color} weight="duotone" />;
  if (IMAGE_RE.test(fileName)) return <ImageSquare size={size} color={color} weight="duotone" />;
  return <FileText size={size} color={color} weight="duotone" />;
};

export const getFullUrl = (url: string) =>
  url?.startsWith("http") ? url : `${frappeBaseUrl}${url}`;

export const AttachmentCard = ({ file, onView, onDelete, deletingFile }: any) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isImage = IMAGE_RE.test(file?.file_url || file?.file_name || "");
  const isDeleting = deletingFile === file.file_url;

  const closeMenu = () => setAnchorEl(null);

  return (
    <Box
      sx={{
        width: 190,
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${isDark ? "#27272A" : "#E3ECFC"}`,
        backgroundColor: isDark ? "#1C1C1E" : "#f9fbff",
        transition: "all 0.18s ease",
        "&:hover": {
          borderColor: "#1D4ED8",
          boxShadow: isDark ? "0 6px 20px rgba(0,0,0,0.35)" : "0 6px 20px rgba(15,23,42,0.10)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {isDeleting && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: isDark ? "rgba(0,0,0,0.55)" : "rgba(249,251,255,0.75)",
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={26} />
        </Box>
      )}

      {/* Preview */}
      <Box
        onClick={() => onView?.(file)}
        sx={{
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backgroundColor: isDark ? "#27272A" : "#EFF6FF",
          borderBottom: `1px solid ${isDark ? "#27272A" : "#E3ECFC"}`,
          overflow: "hidden",
        }}
      >
        {isImage ? (
          <Box
            component="img"
            src={getFullUrl(file.file_url)}
            alt={file.file_name}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          fileTypeIcon(file?.file_name, 30, isDark ? "#9CA3AF" : "#1D4ED8")
        )}
      </Box>

      {/* Meta row: name + size + actions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.25, py: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Tooltip title={file?.file_name || ""}>
            <Box
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                lineHeight: "18px",
                color: isDark ? "#D4D4D8" : "#0C2472",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {file?.file_name}
            </Box>
          </Tooltip>
          <Box sx={{ fontSize: "11.5px", lineHeight: "16px", color: isDark ? "#71717A" : "#94A3B8" }}>
            {formatFileSize(file?.file_size)}
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            p: 0.5,
            borderRadius: "6px",
            color: isDark ? "#71717A" : "#94A3B8",
            "&:hover": { color: "#1D4ED8", bgcolor: isDark ? "#27272A" : "#EFF6FF" },
          }}
        >
          <DotsThreeVertical size={16} weight="bold" />
        </IconButton>
      </Box>

      {/* Context menu */}
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={closeMenu}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            mt: 0.5,
            minWidth: 150,
            border: `1px solid ${isDark ? "#27272A" : "#E3ECFC"}`,
            bgcolor: isDark ? "#1C1C1E" : "#fff",
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(12,36,114,0.10)",
          },
        }}
      >
        <MenuItem
          onClick={() => { onView?.(file); closeMenu(); }}
          sx={{ mx: 0.5, borderRadius: "8px", py: 0.75, "&:hover": { bgcolor: isDark ? "#27272A" : "#EFF6FF" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Eye size={15} color={isDark ? "#9CA3AF" : "#64748B"} weight="duotone" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: isDark ? "#D4D4D8" : "#334155" }}>
            View
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => { window.open(getFullUrl(file.file_url), "_blank"); closeMenu(); }}
          sx={{ mx: 0.5, borderRadius: "8px", py: 0.75, "&:hover": { bgcolor: isDark ? "#27272A" : "#EFF6FF" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DownloadSimple size={15} color={isDark ? "#9CA3AF" : "#64748B"} weight="duotone" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: isDark ? "#D4D4D8" : "#334155" }}>
            Download
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => { onDelete?.(file); closeMenu(); }}
          sx={{ mx: 0.5, borderRadius: "8px", py: 0.75, "&:hover": { bgcolor: isDark ? "#27272A" : "#FEF2F2" } }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <Trash size={15} color="#EF4444" weight="duotone" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600, color: "#EF4444" }}>
            Delete
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};
