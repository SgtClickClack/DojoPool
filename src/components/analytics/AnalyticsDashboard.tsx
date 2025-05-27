import React from 'react';
import { Box, Typography, CircularProgress } from "@mui/material";
import { useAnalytics } from "@/services/analytics/AnalyticsService";

export const AnalyticsDashboard: React.FC = () => {
  const { data } = useAnalytics();

  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 'calc(100vh - 100px)' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, flexGrow: 1, backgroundColor: (theme) => theme.palette.background.default }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        Game Analytics Dashboard
      </Typography>
      {/* ... rest of your Grid layout with StatCard and Chart components ... */}
    </Box>
  );
};