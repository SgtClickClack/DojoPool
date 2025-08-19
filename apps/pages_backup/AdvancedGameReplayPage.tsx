import React from 'react';
import { Box } from '@mui/material';
import AdvancedGameReplay from '../components/game/AdvancedGameReplay';
import PageBackground from '../components/common/PageBackground';
import Layout from '../components/layout/Layout';

const AdvancedGameReplayPage: React.FC = () => {
  return (
    <Layout>
      <PageBackground variant="tournaments">
        <Box sx={{ minHeight: '100vh', py: 2 }}>
          <AdvancedGameReplay />
        </Box>
      </PageBackground>
    </Layout>
  );
};

export default AdvancedGameReplayPage;
