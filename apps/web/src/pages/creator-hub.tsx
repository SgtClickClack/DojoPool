import ProtectedRoute from '@/components/Common/ProtectedRoute';
import CreatorHub from '@/components/Community/CreatorHub';
import { Container } from '@mui/material';
import dynamic from 'next/dynamic';

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
