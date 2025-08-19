import { Paper, Typography } from '@mui/material';
import React from 'react';

const TournamentRegistration: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tournament Registration
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Register players for tournaments. This component is under development.
      </Typography>
    </Paper>
  );
};

export default TournamentRegistration;
