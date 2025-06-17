import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import MatchAnalysis from '../../components/ai/MatchAnalysis';

const StyledContainer = styled(Container)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
  minHeight: '100vh',
  padding: theme.spacing(0)
}));

const HeaderPaper = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '1px solid #00d4ff',
  borderRadius: 12,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
  backdropFilter: 'blur(10px)'
}));

const MatchAnalysisPage: React.FC = () => {
  return (
    <StyledContainer maxWidth={false}>
      <HeaderPaper>
        <Typography variant="h3" color="#00d4ff" gutterBottom sx={{ fontWeight: 'bold' }}>
          AI-Powered Match Analysis & Coaching
        </Typography>
        <Typography variant="h6" color="#ffffff" sx={{ opacity: 0.8 }}>
          Advanced shot analysis, performance tracking, personalized training programs, and AI coaching recommendations
        </Typography>
      </HeaderPaper>
      
      <MatchAnalysis />
    </StyledContainer>
  );
};

export default MatchAnalysisPage; 