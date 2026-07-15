import React from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { X, IdentificationBadge } from "@phosphor-icons/react";

type DrawerComponentProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number | string;
};

const DrawerComponent: React.FC<DrawerComponentProps> = ({
  open,
  onClose,
  title,
  children,
  width = 640,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: 1300 }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: width },
          display: "flex",
          flexDirection: "column",
          bgcolor: isDark ? "#18181B" : "#F8FAFF",
          boxShadow: isDark ? "-12px 0 48px rgba(0,0,0,0.5)" : "-12px 0 48px 0 rgba(12,36,114,0.14)",
        },
      }}
    >
      {/* ══ Sticky Header ══ */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 6,
          py: 4,
          borderBottom: `1px solid ${isDark ? "#27272A" : "#E3ECFC"}`,
          position: "sticky",
          top: 0,
          bgcolor: isDark ? "#111113" : "#f9fbff",
          zIndex: 1100,
        }}
      >
        <Box className="flex items-center gap-3">
          <Box className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${isDark ? "bg-[#27272A]" : "bg-[#1D4ED8]"}`}>
            <IdentificationBadge size={18} color={isDark ? "#A1A1AA" : "#fff"} weight="duotone" />
          </Box>
          <Box>
            <h2 className={`text-[15px] font-extrabold tracking-tight m-0 ${isDark ? "text-[#F4F4F5]" : "text-slate-900"}`}>
              {title}
            </h2>
            <p className={`text-[11px] font-medium m-0 ${isDark ? "text-[#71717A]" : "text-slate-400"}`}>
              Fields marked <span className="text-red-400 font-bold">*</span> are required
            </p>
          </Box>
        </Box>

        <Tooltip title="Close">
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              borderRadius: "9px",
              border: `1.5px solid ${isDark ? "#3F3F46" : "#E3ECFC"}`,
              "&:hover": { bgcolor: isDark ? "#27272A" : "#EFF6FF", borderColor: isDark ? "#52525B" : "#E3ECFC" },
            }}
          >
            <X size={17} color={isDark ? "#71717A" : "#64748B"} weight="duotone" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ══ Scrollable Body ══ */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 5, py: 5 }}>
        {children}
      </Box>
    </Drawer>
  );
};

export default DrawerComponent;
