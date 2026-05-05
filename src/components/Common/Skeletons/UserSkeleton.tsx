"use client";

import {
  Box,
  Card,
  Divider,
  Skeleton,
  Stack,
} from "@mui/material";

import StyledContainer from "@/@core/theme/overrides/container";

/** Loading placeholder aligned with `UserDetailTabs` → `UserOverview` (single column, same chrome). */
const UserSkeleton = () => {
  const fieldBar = (
    <Skeleton animation="wave" variant="rounded" height={40} sx={{ borderRadius: 1 }} />
  );

  return (
    <StyledContainer
      maxWidth={false}
      sx={{
        backgroundColor: "var(--mui-palette-background-paper)",
      }}
    >
      <Box sx={{ p: 3 }}>
        <Card sx={{ boxShadow: "none", p: { xs: 3, sm: 6 } }} className="border">
          <Stack spacing={3}>
            {/* Profile header — matches UserOverview (column: avatar + text block) */}
            <Stack
              direction="column"
              alignItems="flex-start"
              spacing={2}
              sx={{
                pb: 3,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Skeleton variant="circular" width={96} height={96} />
              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ width: "100%" }}>
                <Skeleton animation="wave" width={200} height={36} />
                <Skeleton animation="wave" width={120} height={28} sx={{ borderRadius: 2 }} />
              </Stack>
              <Skeleton animation="wave" width="55%" height={22} />
              <Stack direction="row" spacing={3} flexWrap="wrap">
                <Skeleton animation="wave" width={220} height={22} />
                <Skeleton animation="wave" width={140} height={22} />
              </Stack>
            </Stack>

            {/* Basic information */}
            <Box>
              <Skeleton animation="wave" width={180} height={32} sx={{ mb: 3 }} />
              <Stack spacing={2}>
                {fieldBar}
                {fieldBar}
                <Stack spacing={0.5}>
                  <Skeleton animation="wave" width={56} height={18} />
                  <Skeleton animation="wave" width="min(100%, 280px)" height={22} />
                </Stack>
                {fieldBar}
                {fieldBar}
              </Stack>
            </Box>

            <Divider sx={{ borderBottomWidth: 2 }} />

            {/* Role information */}
            <Box>
              <Skeleton animation="wave" width={160} height={32} sx={{ mb: 3 }} />
              {fieldBar}
            </Box>

            <Divider sx={{ borderBottomWidth: 2 }} />

            {/* More information */}
            <Box>
              <Skeleton animation="wave" width={200} height={32} sx={{ mb: 3 }} />
              <Stack spacing={2}>
                {fieldBar}
                {fieldBar}
                {fieldBar}
              </Stack>
            </Box>

            <Divider sx={{ borderBottomWidth: 2 }} />

            {/* Address */}
            <Box>
              <Skeleton animation="wave" width={100} height={32} sx={{ mb: 3 }} />
              <Stack spacing={2}>
                {fieldBar}
                {fieldBar}
                {fieldBar}
              </Stack>
            </Box>
          </Stack>
        </Card>
      </Box>
    </StyledContainer>
  );
};

export default UserSkeleton;
