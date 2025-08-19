import { Paper, Typography } from '@mui/material';
import React from 'react';

const AchievementsList: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Achievements List
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Display player achievements and accomplishments. This component is under
        development.
      </Typography>
    </Paper>
  );
};

export default AchievementsList;
