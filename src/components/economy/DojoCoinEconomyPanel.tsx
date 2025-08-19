import { Paper, Typography } from '@mui/material';
import React from 'react';

const DojoCoinEconomyPanel: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Dojo Coin Economy Panel
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Digital currency management and economy system. This component is under
        development.
      </Typography>
    </Paper>
  );
};

export default DojoCoinEconomyPanel;
