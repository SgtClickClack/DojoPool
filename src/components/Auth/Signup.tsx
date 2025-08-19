import { Paper, Typography } from '@mui/material';
import React from 'react';

const Signup: React.FC = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Sign Up
      </Typography>
      <Typography variant="body1" color="text.secondary">
        User registration and account creation. This component is under
        development.
      </Typography>
    </Paper>
  );
};

export default Signup;
