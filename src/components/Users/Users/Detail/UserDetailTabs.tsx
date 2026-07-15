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
        backgroundColor: theme =>
          theme.palette.mode === "dark" ? "#0A0A0A" : "#EFF6FF",
      }}
    >
      <Box sx={{ px: 6, py: 6 }}>
        <UserOverview detail={userdetails} />
      </Box>
    </StyledContainer>
  );
};

export default UserDetailTabs;
