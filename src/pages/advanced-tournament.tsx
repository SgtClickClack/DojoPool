import { Box, Container, Typography } from '@mui/material';
import React from 'react';
// import { AdvancedTournamentDashboard } from '../../../../../apps/web/src/components/tournament/AdvancedTournamentDashboard';

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
        {/* <AdvancedTournamentDashboard /> */}
        <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Advanced Tournament Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Advanced tournament management dashboard temporarily unavailable.
            This component will be implemented in a future update.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AdvancedTournamentPage;
