import { Paper, Typography } from '@mui/material';
import React from 'react';

const RealTimeMatchTracker: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Real-Time Match Tracker
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Live match tracking and statistics. This component is under development.
      </Typography>
    </Paper>
  );
};

export default RealTimeMatchTracker;
