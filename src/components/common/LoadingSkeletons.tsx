import React from "react";
import { Box, Skeleton } from "@mui/material";

export const ChartLoadingSkeleton = React.memo(() => (
  <Box
    sx={{ width: "100%", height: 300 }}
    role="status"
    aria-label="Loading chart"
  >
    <Skeleton
      variant="rectangular"
      height="100%"
      animation="wave"
      sx={{
        borderRadius: 1,
        backgroundColor: (theme) => theme.palette.action.hover,
      }}
    />
  </Box>
));

export const StatLoadingSkeleton = React.memo(() => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 1 }}>
    <Skeleton variant="circular" width={24} height={24} animation="wave" />
    <Skeleton variant="text" width="60%" height={24} animation="wave" />
  </Box>
)); 