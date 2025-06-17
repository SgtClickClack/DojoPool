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

const SocialPage: React.FC = () => {
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
          Tournament Social Hub
        </Typography>
        <Typography variant="h6" sx={{ 
          color: '#b0b0b0', 
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Connect, share, and engage with the pool community
        </Typography>
      </HeaderPaper>
      
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" sx={{ color: '#00d4ff', mb: 2 }}>
          Advanced Social Features & Community Engagement
        </Typography>
        <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 4 }}>
          Real-time social interactions, community events, and engagement tools
        </Typography>
        
        <Box sx={{ 
          p: 4, 
          bgcolor: 'rgba(0, 212, 255, 0.1)', 
          borderRadius: 2, 
          border: '1px solid #00d4ff',
          maxWidth: 800,
          mx: 'auto'
        }}>
          <Typography variant="h6" sx={{ color: '#ffffff', mb: 2 }}>
            Features Coming Soon:
          </Typography>
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Real-time social feed with posts, comments, and reactions
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Community events and meetups with RSVP functionality
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • User profiles with achievements, badges, and statistics
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Tournament-specific social channels and discussions
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Live match commentary and spectator interactions
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Community challenges and leaderboards
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Social media integration and content sharing
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
              • Advanced moderation tools and community guidelines
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              • Mobile-optimized social experience with push notifications
            </Typography>
          </Box>
        </Box>
      </Box>
    </StyledContainer>
  );
};

export default SocialPage; 