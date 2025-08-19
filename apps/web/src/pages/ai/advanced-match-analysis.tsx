import React from 'react';
import { Box } from '@mui/material';
import Layout from '../../components/layout/Layout';
import AdvancedMatchAnalysis from '../../components/ai/AdvancedMatchAnalysis';
import PageBackground from '../../components/common/PageBackground';

const AdvancedMatchAnalysisPage: React.FC = () => {
  return (
    <Layout>
      <PageBackground variant="analytics">
        <Box sx={{ minHeight: '100vh', position: 'relative' }}>
          <AdvancedMatchAnalysis />
        </Box>
      </PageBackground>
    </Layout>
  );
};

export default AdvancedMatchAnalysisPage;
