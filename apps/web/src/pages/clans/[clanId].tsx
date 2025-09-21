import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Box, Container, Typography } from '@mui/material';
import Layout from '@/components/Layout/Layout';

const ClanProfile = dynamic(() => import('@/components/ClanProfile'), {
  loading: () => (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Loading clan profile...</Typography>
      </Container>
    </Layout>
  ),
});

const ClanProfilePage: React.FC = () => {
  const router = useRouter();
  const { _clanId } = router.query;

  if (!_clanId) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Container>
      </Layout>
    );
  }

  return <ClanProfile />;
};

export default ClanProfilePage;
