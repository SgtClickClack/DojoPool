import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import TournamentPrediction from '../../components/tournament/TournamentPrediction';
import PageBackground from '../../components/common/PageBackground';

const TournamentPredictionPage: React.FC = () => {
  return (
    <PageBackground variant="tournaments">
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              color: '#fff',
              textAlign: 'center',
              fontWeight: 700,
              textShadow:
                '0 0 20px rgba(0, 255, 157, 0.8), 0 0 40px rgba(0, 255, 157, 0.4)',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '3px',
              mb: 2,
            }}
          >
            🔮 AI Tournament Prediction
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#00a8ff',
              textAlign: 'center',
              fontWeight: 400,
              textShadow: '0 0 10px rgba(0, 168, 255, 0.5)',
              fontFamily: 'Orbitron, monospace',
              letterSpacing: '1px',
            }}
          >
            Advanced AI-powered tournament outcome forecasting and match
            predictions for analytics and entertainment
          </Typography>
        </Box>

        <TournamentPrediction />
      </Container>
    </PageBackground>
  );
};

export default TournamentPredictionPage;
