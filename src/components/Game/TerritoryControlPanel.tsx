import { Paper, Typography } from '@mui/material';
import React from 'react';

const TerritoryControlPanel: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Territory Control Panel
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage and control game territories. This component is under
        development.
      </Typography>
    </Paper>
  );
};

export default TerritoryControlPanel;
