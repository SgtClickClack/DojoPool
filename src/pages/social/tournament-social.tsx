import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import PageBackground from '../../components/common/PageBackground';
import TournamentSocial from '../../components/social/TournamentSocial';

const TournamentSocialPage: React.FC = () => {
  return (
    <PageBackground backgroundType="social">
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h2"
              sx={{
                color: '#00ff9d',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                textShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
                mb: 2,
              }}
            >
              Tournament Social Hub
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#ccc',
                fontFamily: 'Orbitron, monospace',
                textShadow: '0 0 10px rgba(204, 204, 204, 0.3)',
              }}
            >
              Connect, Chat, and Share with the Pool Community
            </Typography>
          </Box>

          <TournamentSocial />
        </Box>
      </Container>
    </PageBackground>
  );
};

export default TournamentSocialPage; 