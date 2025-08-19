import { Paper, Typography } from '@mui/material';
import React from 'react';

const ChallengeCreationPanel: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Challenge Creation Panel
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Create and manage game challenges and missions. This component is under
        development.
      </Typography>
    </Paper>
  );
};

export default ChallengeCreationPanel;
