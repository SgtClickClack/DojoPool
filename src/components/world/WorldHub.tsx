import { Box, Paper, Typography } from '@mui/material';
import React from 'react';

const WorldHub: React.FC = () => {
  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="h4" gutterBottom>
          🌍 DojoPool World Hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Interactive world map of DojoPool dojos and territories. This
          component is under development.
        </Typography>
      </Paper>
    </Box>
  );
};

export default WorldHub;
