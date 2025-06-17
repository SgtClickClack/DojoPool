import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import TournamentFranchiseSystem from '../../components/tournament/TournamentFranchiseSystem';

const TournamentFranchisePage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              background: 'linear-gradient(45deg, #00ff88 30%, #00cc6a 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              textShadow: '0 0 30px rgba(0, 255, 136, 0.5)',
              mb: 2,
            }}
          >
            🌐 GLOBAL FRANCHISE MANAGEMENT
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#888',
              fontWeight: 300,
              mb: 1,
            }}
          >
            Scale Your DojoPool Business Worldwide
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#aaa',
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Manage your global DojoPool franchise network with real-time analytics, 
            multi-venue coordination, and international tournament support. 
            Monitor performance across regions and scale your business globally.
          </Typography>
        </Box>

        <TournamentFranchiseSystem />
      </Container>
    </Box>
  );
};

export default TournamentFranchisePage;