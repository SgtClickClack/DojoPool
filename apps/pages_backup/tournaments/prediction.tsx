import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
  padding: theme.spacing(3),
}));

const HeaderPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '1px solid #00d4ff',
  borderRadius: 12,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.1)',
  backdropFilter: 'blur(10px)',
}));

const PredictionPage: React.FC = () => {
  return (
    <StyledContainer maxWidth={false}>
      <HeaderPaper>
        <Typography
          variant="h3"
          sx={{
            color: '#00d4ff',
            textAlign: 'center',
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            mb: 2,
          }}
        >
          Tournament Prediction & Seeding
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: '#b0b0b0',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          AI-powered matchmaking and bracket predictions
        </Typography>
      </HeaderPaper>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" sx={{ color: '#00d4ff', mb: 2 }}>
          Advanced Tournament Prediction System
        </Typography>
        <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 4 }}>
          AI-powered matchmaking, seeding algorithms, and bracket predictions
        </Typography>

        <Box
          sx={{
            p: 4,
            bgcolor: 'rgba(0, 212, 255, 0.1)',
            borderRadius: 2,
            border: '1px solid #00d4ff',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
            Features Coming Soon:
          </Typography>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • AI-powered match predictions with confidence scores
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Advanced seeding algorithms based on performance metrics
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Real-time bracket predictions and winner forecasting
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Player performance analysis and strategy recommendations
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Dark horse identification and upset probability calculations
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              • Historical data analysis and trend predictions
            </Typography>
          </Box>
        </Box>
      </Box>
    </StyledContainer>
  );
};

export default PredictionPage;
