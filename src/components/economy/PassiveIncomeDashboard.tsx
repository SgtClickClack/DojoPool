import { Paper, Typography } from '@mui/material';
import React from 'react';

const PassiveIncomeDashboard: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Passive Income Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Track and manage passive income from dojo ownership. This component is
        under development.
      </Typography>
    </Paper>
  );
};

export default PassiveIncomeDashboard;
