import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import AICommentaryHighlightsDashboard from '../components/ai/AICommentaryHighlightsDashboard';

const AICommentaryHighlightsPage: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h3" gutterBottom align="center">
            🎬 AI-Powered Match Commentary & Highlights System
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            Experience the future of pool gaming with AI-generated commentary,
            highlights, and social sharing
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="body1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              🎯 Real-time AI Commentary
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              🎥 Automated Highlight Generation
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              🔊 Audio Synthesis
            </Typography>
            <Typography
              variant="body1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              📱 Social Media Integration
            </Typography>
          </Box>
        </Paper>

        <AICommentaryHighlightsDashboard />
      </Box>
    </Container>
  );
};

export default AICommentaryHighlightsPage;
