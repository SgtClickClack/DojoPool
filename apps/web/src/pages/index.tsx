import { useAuth } from '@/hooks/useAuth';
import { Box, Button, Container, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

const HomePage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Ensure this runs only on the client and only when a real user exists
    if (typeof window !== 'undefined' && !loading && user && user.id) {
      void router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h4">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (user && user.id) {
    return null; // Will redirect to dashboard
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h3" gutterBottom>
          Welcome to DojoPool
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: '#EEEEEE' }}>
          Explore venues, manage your dojo, and join tournaments.
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="contained" href="/venues">
            Browse Venues
          </Button>
          <Button variant="outlined" href="/venue/portal/profile">
            Venue Portal
          </Button>
          <Button variant="contained" href="/auth/register">
            Sign Up
          </Button>
          <Button variant="outlined" href="/login">
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
