import { Paper, Typography } from '@mui/material';
import React from 'react';

const MatchResultDialog: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Match Result Dialog
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Display match results and statistics. This component is under
        development.
      </Typography>
    </Paper>
  );
};

export default MatchResultDialog;
