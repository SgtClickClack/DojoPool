import { Paper, Typography } from '@mui/material';
import React from 'react';

const GameBalancePanel: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Game Balance Panel
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Game balance and difficulty adjustment tools. This component is under
        development.
      </Typography>
    </Paper>
  );
};

export default GameBalancePanel;
