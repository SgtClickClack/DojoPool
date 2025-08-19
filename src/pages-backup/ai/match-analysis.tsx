import React from 'react';
import { Box, Container } from '@mui/material';
import Layout from '../../components/layout/Layout';
import PageBackground from '../../components/common/PageBackground';
import MatchAnalysisComponent from '../../components/ai/MatchAnalysis';

const MatchAnalysisPage: React.FC = () => {
  return (
    <Layout>
      <PageBackground variant="profile">
        <Container
          maxWidth="xl"
          sx={{ py: 4, position: 'relative', zIndex: 1 }}
        >
          <MatchAnalysisComponent />
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default MatchAnalysisPage;
