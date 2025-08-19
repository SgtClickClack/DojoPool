import { Box, Container, Typography } from '@mui/material';
import React from 'react';
import TournamentBracketManager from '../components/Tournament/TournamentBracketManager';

const TournamentBracketDemo: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Tournament Bracket Generator Demo
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          align="center"
          color="text.secondary"
        >
          Test the tournament bracket generation system with different formats
        </Typography>

        <Box sx={{ mt: 4 }}>
          <TournamentBracketManager />
        </Box>
      </Box>
    </Container>
  );
};

export default TournamentBracketDemo;
