import ProtectedRoute from '@/components/Common/ProtectedRoute';
import { SocialFeed } from '@/components/Content';
import { Box, Breadcrumbs, Container, Link, Typography } from '@mui/material';
import { NextPage } from 'next';

const MyContentPage: NextPage = () => {
  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" href="/dashboard">
            Dashboard
          </Link>
          <Typography color="text.primary">My Content</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            My Shared Content
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Track your uploads, likes, shares, and visibility.
          </Typography>
        </Box>

        {/* Creator feed scoped to current user via SocialFeed's userId-less path will be handled by API using /v1/content/user/:userId route on a dedicated user page. */}
        <SocialFeed showFilters={false} />
      </Container>
    </ProtectedRoute>
  );
};

export default MyContentPage;
