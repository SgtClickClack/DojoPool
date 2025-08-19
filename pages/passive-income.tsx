import { Box, Container, Typography } from '@mui/material';
import React from 'react';
import PassiveIncomeDashboard from '../src/components/economy/PassiveIncomeDashboard';

const PassiveIncomePage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ color: '#00ff9d', fontWeight: 'bold' }}
        >
          Passive Income System
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage passive income generation for territory holders. Monitor
          DojoCoin rewards, venue activity bonuses, and clan-controlled
          territory benefits.
        </Typography>

        <PassiveIncomeDashboard />
      </Box>
    </Container>
  );
};

export default PassiveIncomePage;
