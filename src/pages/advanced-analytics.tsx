import React from 'react';
import { Box } from '@mui/material';
import AdvancedAnalytics from '../components/analytics/AdvancedAnalytics';
import PageBackground from '../components/common/PageBackground';
import Layout from '../components/layout/Layout';

const AdvancedAnalyticsPage: React.FC = () => {
  return (
    <Layout>
      <PageBackground variant="analytics">
        <Box sx={{ minHeight: '100vh', position: 'relative' }}>
          <AdvancedAnalytics />
        </Box>
      </PageBackground>
    </Layout>
  );
};

export default AdvancedAnalyticsPage; 