import ProtectedRoute from '@/components/Common/ProtectedRoute';
import { AdminFeedbackDashboard } from '@/components/Feedback';
import { Breadcrumbs, Container, Link, Typography } from '@mui/material';
import { NextPage } from 'next';

const ModerationDashboardPage: NextPage = () => {
  return (
    <ProtectedRoute requireModerator={true}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">Moderation</Typography>
        </Breadcrumbs>
        <Typography variant="h3" component="h1" gutterBottom>
          Community Moderation
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Review and manage user feedback, bug reports, and player reports.
        </Typography>
        <AdminFeedbackDashboard />
      </Container>
    </ProtectedRoute>
  );
};

export default ModerationDashboardPage;
