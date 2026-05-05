import { Tab, Tabs } from "@mui/material";
import { styled } from "@mui/material/styles";

// Styled Tabs Component
const StyledTabsOne = styled(Tabs)(({ theme }) => ({
  "& .MuiTab-root": {
    textTransform: "none",
    // fontSize: "14px",
    minWidth: "120px",
  },
  "& .MuiTabs-indicator": {
    height: "3px",
    backgroundColor: "var(--mui-palette-primary-main)", // Fixed primary color
  },
  '&.MuiTabs-root .MuiTab-root:hover': {
    backgroundColor: 'transparent !important',
    // color: 'var(--mui-palette-primary-contrastText) !important',
  },
  '&.MuiTabs-root .MuiTabs-flexContainer': {
    // backgroundColor: 'var(--mui-palette-background-paper)',
    backgroundColor: "var(--mui-palette-background-default)",
    width:"100%"
  }
}));

// Styled Tab Component (Fix selected background)
const StyledTabOne = styled(Tab)(({ theme }) => ({
  "&.Mui-selected": {
    backgroundColor: "transparent !important",
    color: 'var(--mui-palette-primary-main) !important',
    boxShadow: "none !important",
    "&:hover, &.Mui-focused, &.Mui-focusVisible": {
      backgroundColor: "transparent !important",
      color: 'var(--mui-palette-primary-main) !important',
      boxShadow: "none !important",
    },
  },   
}));

export { StyledTabsOne, StyledTabOne };
