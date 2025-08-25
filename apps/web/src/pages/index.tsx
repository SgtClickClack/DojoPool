import { Box, Button, Container, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
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

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h3" gutterBottom>
          Welcome to DojoPool
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
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
          <Button variant="outlined" href="/login">
            Sign In
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
