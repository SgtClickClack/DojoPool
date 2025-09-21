import ProtectedRoute from '@/components/Common/ProtectedRoute';
import { Container } from '@mui/material';
import dynamic from 'next/dynamic';
import React from 'react';

const CreatorHub = dynamic(() => import('@/components/Community/CreatorHub'), {
  loading: () => <div>Loading Creator Hub...</div>,
});

const CreatorHubPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <Container maxWidth="lg">
        <CreatorHub />
      </Container>
    </ProtectedRoute>
  );
};

export default dynamic(() => Promise.resolve(CreatorHubPage), { ssr: false });
