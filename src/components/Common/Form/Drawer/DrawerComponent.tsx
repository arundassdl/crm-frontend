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

/** Height of the form footer (Cancel / Submit), kept clear when a field scrolls into view. */
const FOOTER_CLEARANCE = 88;

const DrawerComponent: React.FC<DrawerComponentProps> = ({
  open,
  onClose,
  title,
  children,
  width = 900, // 👈 default width
}) => {
  // newdocs/80 §12.12: never wider than the screen (it was a fixed 900 px, so on a phone the close
  // button and Cancel/Submit were off-screen); full width on phones.
  const desktopWidth = typeof width === "number" ? `min(${width}px, 100vw)` : `min(${width}, 100vw)`;

  // On-screen keyboard: once it has opened, bring the focused field back into view above the footer.
  const onFocusIn = (event: React.FocusEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches("input, textarea, [contenteditable=true]")) return;
    window.setTimeout(() => target.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
  };

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
             width: { xs: "100vw", sm: desktopWidth },
             maxWidth: "100vw",
             // paddingTop: "72px",
             zIndex: 1300, // Set custom z-index
             // The visible screen (dvh shrinks with the browser bars and, on Android, the keyboard).
             height: "100vh",
             "@supports (height: 100dvh)": { height: "100dvh" },
             display: "flex",
             flexDirection: "column",
             overflowX: "hidden",
           },
           backgroundColor: "rgba(0, 0, 0, 0.3)",
         }}
       >
         <Box
           sx={{
             display: "flex",
             alignItems: "center",
             justifyContent: "space-between",
             gap: 1,
             padding: { xs: 1.5, sm: 2 },
             borderBottom: "1px solid #ccc",
             position: "sticky",
             top: 0,
             background: "white",
             zIndex: 1100,
             backgroundColor: "var(--mui-palette-background-default)",
             marginBottom: { xs: 1, sm: "25px" },
             paddingLeft: { xs: 2, sm: 6 },
             flexShrink: 0,
           }}
         >
        <Typography variant="h5" noWrap sx={{ minWidth: 0 }}>{title}</Typography>
        <IconButton onClick={onClose} aria-label="Close" data-testid="crm-form-close">
          <CloseIcon />
        </IconButton>
      </Box>
      <Box
        onFocus={onFocusIn}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          scrollPaddingBottom: `${FOOTER_CLEARANCE}px`,
          padding: { xs: 0, sm: 2 },
        }}
      >
        {children}
      </Box>
    </Drawer>
  );
};

export default DrawerComponent;
