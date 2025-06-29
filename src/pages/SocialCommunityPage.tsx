import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import SocialCommunity from '../components/social/SocialCommunity';
import PageBackground from '../components/common/PageBackground';
import Layout from '../components/layout/Layout';

const SocialCommunityPage: React.FC = () => {
  return (
    <Layout>
      <PageBackground variant="social">
        <Container maxWidth="xl">
          <Box sx={{ py: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
              Social & Community Hub
            </Typography>
            <SocialCommunity />
          </Box>
        </Container>
      </PageBackground>
    </Layout>
  );
};

export default SocialCommunityPage; 