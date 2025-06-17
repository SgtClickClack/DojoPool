import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import TournamentAnalytics from '../../components/tournament/TournamentAnalytics';

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

const AnalyticsPage: React.FC = () => {
  return (
    <StyledContainer maxWidth={false}>
      <HeaderPaper>
        <Typography variant="h3" sx={{ 
          color: '#00d4ff', 
          textAlign: 'center', 
          fontWeight: 'bold',
          textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
          mb: 2
        }}>
          Tournament Analytics
        </Typography>
        <Typography variant="h6" sx={{ 
          color: '#b0b0b0', 
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Real-time performance tracking and statistical analysis
        </Typography>
      </HeaderPaper>
      
      <TournamentAnalytics />
    </StyledContainer>
  );
};

export default AnalyticsPage; 