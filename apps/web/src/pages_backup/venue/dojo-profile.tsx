import React from 'react';
import { Box } from '@mui/material';
import Layout from '../../components/layout/Layout';
import DojoProfileComponent from '../../components/venue/DojoProfile';
import PageBackground from '../../components/common/PageBackground';

const DojoProfilePage: React.FC = () => {
  return (
    <Layout>
      <PageBackground variant="venue">
        <Box sx={{ minHeight: '100vh', py: 2 }}>
          <DojoProfileComponent />
        </Box>
      </PageBackground>
    </Layout>
  );
};

export default DojoProfilePage;
