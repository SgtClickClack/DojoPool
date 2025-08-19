import { Paper, Typography } from '@mui/material';
import React from 'react';

export const AICommentaryHighlightsDashboard: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        AI Commentary Highlights Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        AI-powered commentary and match highlights system. This component is
        under development.
      </Typography>
    </Paper>
  );
};
