import React from 'react';
import { Box } from '@mui/material';
import Layout from '../components/layout/Layout';
import AvatarProgression from '../components/avatar/AvatarProgression';
import PageBackground from '../components/common/PageBackground';

const AvatarProgressionPage: React.FC = () => {
  // Use a mock userId for demo/testing
  const userId = 'demo-user';
  return (
    <Layout>
      <PageBackground />
      <Box sx={{ p: 4 }}>
        <AvatarProgression userId={userId} />
      </Box>
    </Layout>
  );
};

export default AvatarProgressionPage; 