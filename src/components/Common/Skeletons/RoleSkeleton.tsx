import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";

type RoleSkeletonRowProps = {
  valueHeight?: number;
};

const RoleSkeletonRow: React.FC<RoleSkeletonRowProps> = ({ valueHeight = 28 }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 1,
      flexDirection: "row",
    }}
  >
    <Box sx={{ minWidth: 125, pt: 0.5 }}>
      <Skeleton animation="wave" variant="text" width="70%" height={20} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 250 }}>
      <Skeleton
        animation="wave"
        variant="rounded"
        width="100%"
        height={valueHeight}
      />
    </Box>
  </Box>
);

const RoleSkeleton: React.FC = () => {
  return (
    <Stack direction="column" spacing={2.5} sx={{ width: "100%" }}>
      {/* Role Name */}
      <RoleSkeletonRow valueHeight={28} />
      {/* Role Description (textarea) */}
      <RoleSkeletonRow valueHeight={80} />
      {/* Reports To (select) */}
      <RoleSkeletonRow valueHeight={28} />
    </Stack>
  );
};

export default RoleSkeleton;
