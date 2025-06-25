import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import AdvancedAIReferee from '../components/ai/AdvancedAIReferee';
import PageBackground from '../components/common/PageBackground';
import Layout from '../components/layout/Layout';

const AdvancedAIRefereePage: React.FC = () => {
  return (
    <Layout>
      <PageBackground variant="referee">
        <Container maxWidth="xl">
          <Box sx={{ py: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
              Advanced AI Referee System
            </Typography>
            <AdvancedAIReferee />
          </Box>
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default AdvancedAIRefereePage; 