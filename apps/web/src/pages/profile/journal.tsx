import { Box, Breadcrumbs, Container, Link, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import JournalFeed from '../../components/profile/JournalFeed';
import { useAuth } from '../../hooks/useAuth';

const JournalPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link component={NextLink} href="/" color="inherit">
            Home
          </Link>
          <Link component={NextLink} href="/profile" color="inherit">
            Profile
          </Link>
          <Typography color="text.primary">Journal</Typography>
        </Breadcrumbs>

        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Personal Player Journal
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your pool journey, achievements, and milestones in your
            personal journal.
          </Typography>
        </Box>

        {/* Journal Feed */}
        <JournalFeed />
      </Box>
    </Container>
  );
};

export default JournalPage;
