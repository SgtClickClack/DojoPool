import React from 'react';
import { AdvancedTournamentDashboard } from '../src/components/tournament/AdvancedTournamentDashboard';
import { Box, Container, Typography } from '@mui/material';

const AdvancedTournamentPage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ textAlign: 'center', mb: 4 }}
        >
          🏆 Advanced Tournament Management
        </Typography>
        <AdvancedTournamentDashboard />
      </Container>
    </Box>
  );
};

export default AdvancedTournamentPage;
