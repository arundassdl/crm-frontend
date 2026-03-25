import React from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

type DrawerComponentProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number | string; // 👈 optional now
};

const DrawerComponent: React.FC<DrawerComponentProps> = ({
  open,
  onClose,
  title,
  children,
  width = 900, // 👈 default width
}) => {
  return (
    <Drawer
         anchor="right"
         variant="persistent"
         open={open}
         onClose={onClose}
         ModalProps={{
           sx: {
             "& .MuiBackdrop-root": {
               transition: "opacity 1.5s ease-in-out", // Slow fade-in effect
             },
           },
         }}
         sx={{
           "& .MuiDrawer-paper": {
             // Moves the drawer manually
             transition: "transform 1.5s ease-in-out !important",
             width: width,
             // paddingTop: "72px",
             zIndex: 1300, // Set custom z-index
             height: "100vh",
             display: "flex",
             flexDirection: "column",
             "& .MuiDrawer-paper": {
               height: "100vh", // Ensure drawer content also takes full height
             },
           },
           backgroundColor: "rgba(0, 0, 0, 0.3)",
         }}
       >
         <Box
           sx={{
             display: "flex",
             alignItems: "center",
             justifyContent: "space-between",
             padding: 2,
             borderBottom: "1px solid #ccc",
             position: "sticky",
             top: 0,
             background: "white",
             zIndex: 1100,
             backgroundColor: "var(--mui-palette-background-default)",
             marginBottom: "25px",
             paddingLeft: 6,
           }}
         >
        <Typography variant="h5">{title}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", padding: 2 }}>{children}</Box>
    </Drawer>
  );
};

export default DrawerComponent;
