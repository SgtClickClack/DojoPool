import { Box, Paper, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import React from 'react';

const WorldHubMap = dynamic(
  () => import('@/components/world/WorldHubMap'),
  { ssr: false } // This is the crucial part
);

const WorldHubMapPage: React.FC = () => {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          World Hub Map - Live WebSocket Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page tests the real-time WebSocket integration with heartbeat
          animations. Watch the connection status indicator for the green pulse
          animation when data updates arrive.
        </Typography>
      </Paper>

      <Box sx={{ flex: 1, position: 'relative' }}>
        <WorldHubMap height="100%" />
      </Box>
    </Box>
  );
};

export default WorldHubMapPage;
