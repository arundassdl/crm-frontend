import { Container } from "@mui/material";

import { styled } from "@mui/material/styles";

// Styled Tabs Component
const StyledContainer = styled(Container)(({ theme }) => ({ 
  // backgroundColor: "var(--mui-palette-background-paper)", // Uses theme color (white by default)
  paddingLeft:"15px !important",
  borderRadius: "0px !important",
          "::after, ::before": {
      borderRadius: "0px !important",
    }, 
  // padding: theme.spacing(0), // Adds padding
  // borderRadius: theme.shape.borderRadius,  
  "&.MuiContainer-root": {
    paddingRight:0
  }
}));

export default StyledContainer;
