import ProtectedRoute from '@/components/Common/ProtectedRoute';
import AdminReview from '@/components/Community/AdminReview';
import { Container } from '@mui/material';
import dynamic from 'next/dynamic';

const AdminCommunityReviewPage: React.FC = () => {
  return (
    <ProtectedRoute requireAdmin={true}>
      <Container maxWidth="lg">
        <AdminReview />
      </Container>
    </ProtectedRoute>
  );
};

export default dynamic(() => Promise.resolve(AdminCommunityReviewPage), {
  ssr: false,
});
