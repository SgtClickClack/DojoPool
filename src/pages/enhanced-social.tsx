import { Box, Container, CssBaseline, Typography } from '@mui/material';
import React from 'react';
// import { EnhancedSocialDashboard } from '../../../../../apps/web/src/components/social/EnhancedSocialDashboard';

const EnhancedSocialPage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#fff',
      }}
    >
      <CssBaseline />
      {/* <EnhancedSocialDashboard userId="user1" /> */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Enhanced Social Dashboard
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          align="center"
          color="text.secondary"
        >
          Advanced social networking and community features
        </Typography>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Enhanced social dashboard temporarily unavailable. This component
            will be implemented in a future update.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default EnhancedSocialPage;
