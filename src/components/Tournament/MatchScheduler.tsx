import { Paper, Typography } from '@mui/material';
import React from 'react';

const MatchScheduler: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Match Scheduler
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Schedule and manage tournament matches. This component is under
        development.
      </Typography>
    </Paper>
  );
};

export default MatchScheduler;
