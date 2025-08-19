import { Paper, Typography } from '@mui/material';
import React from 'react';

export const LiveCommentary: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Live Commentary
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Real-time AI commentary system. This component is under development.
      </Typography>
    </Paper>
  );
};
