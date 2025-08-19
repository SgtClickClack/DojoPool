import { Paper, Typography } from '@mui/material';
import React from 'react';

const PlayerMovementPanel: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Player Movement Panel
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Track and analyze player movement patterns. This component is under
        development.
      </Typography>
    </Paper>
  );
};

export default PlayerMovementPanel;
