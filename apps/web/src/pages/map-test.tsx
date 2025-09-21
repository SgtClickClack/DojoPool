import { Box, Paper, Typography } from '@mui/material';
import React from 'react';

const MapTestPage: React.FC = () => {
  const _handleChallengeDojo = (dojoId: string) => {
    console.log('Challenge dojo:', dojoId);
  };

  const _handleViewDojo = (dojoId: string) => {
    console.log('View dojo:', dojoId);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        World Hub Map Test
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          This page tests the WorldHubMap component with full Mapbox
          integration.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Make sure you have set your Mapbox token in .env.local file.
        </Typography>
      </Paper>

      {/* Map test temporarily disabled for stabilization build */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2">
          Map test is temporarily disabled during stabilization. Enable once map
          dependencies are finalized.
        </Typography>
      </Paper>
    </Box>
  );
};

export default MapTestPage;
