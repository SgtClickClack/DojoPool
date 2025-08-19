import React from 'react';
import { Box } from '@mui/material';
import Layout from '../src/components/layout/Layout';
import { AvatarProgression } from '../src/components/avatar/AvatarProgression';
import PageBackground from '../src/components/common/PageBackground';

const AvatarProgressionPage: React.FC = () => {
  return (
    <Layout>
      <PageBackground variant="avatar">
        <Box sx={{ minHeight: '100vh', position: 'relative' }}>
          <AvatarProgression />
        </Box>
      </PageBackground>
    </Layout>
  );
};

export default AvatarProgressionPage;
