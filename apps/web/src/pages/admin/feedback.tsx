import { AdminFeedbackDashboard } from '@/components/Feedback';
import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  Breadcrumbs,
  Container,
  Link,
  Typography,
} from '@mui/material';
import { NextPage } from 'next';

const AdminFeedbackPage: NextPage = () => {
  const { user } = useAuth();

  // Check if user is authenticated
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          You don't have permission to access this page. Admin privileges
          required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Link color="inherit" href="/admin">
          Admin
        </Link>
        <Typography color="text.primary">Feedback Management</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Feedback Management
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Review and manage user feedback, bug reports, and feature requests.
        </Typography>
      </Box>

      {/* Admin Feedback Dashboard */}
      <AdminFeedbackDashboard />
    </Container>
  );
};

export default AdminFeedbackPage;
