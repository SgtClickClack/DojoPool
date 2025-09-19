import { AdminContentModeration } from '@/components/Content';
import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  Breadcrumbs,
  Container,
  Link,
  Typography,
} from '@mui/material';
import { type NextPage } from 'next';

const AdminContentModerationPage: NextPage = () => {
  const { user } = useAuth();

  // Check if user is authenticated
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
        <Typography color="text.primary">Content Moderation</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Content Moderation
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Review, approve, and manage user-generated content across the
          platform.
        </Typography>
      </Box>

      {/* Admin Content Moderation Component */}
      <AdminContentModeration />
    </Container>
  );
};

export default AdminContentModerationPage;
