"use client";

import { Box } from "@mui/material";

import StyledContainer from "@/@core/theme/overrides/container";
import UserOverview from "./UserOverview";

/** User detail content (single view; tab bar removed). */
const UserDetailTabs = ({ userdetails }: { userdetails: unknown }) => {
  return (
    <StyledContainer
      maxWidth={false}
      sx={{
        backgroundColor: "var(--mui-palette-background-paper)",
      }}
    >
      <Box sx={{ p: 3 }}>
        <UserOverview detail={userdetails} />
      </Box>
    </StyledContainer>
  );
};

export default UserDetailTabs;
