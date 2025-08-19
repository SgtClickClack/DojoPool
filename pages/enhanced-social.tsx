import { Box, CssBaseline } from '@mui/material';
import React from 'react';
import { EnhancedSocialDashboard } from '../src/frontend/components/social/EnhancedSocialDashboard';

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
      <EnhancedSocialDashboard userId="user1" />
    </Box>
  );
};

export default EnhancedSocialPage;
