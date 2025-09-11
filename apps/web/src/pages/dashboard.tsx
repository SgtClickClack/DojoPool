import ActivityFeed from '@/components/ActivityFeed';
import { useAuth } from '@/hooks/useAuth';
import { Box, Button, Container, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const DashboardPage = () => {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 8 }}>
        <Typography variant="h4">Welcome, {user.username}</Typography>
        <Button variant="contained" onClick={logout} sx={{ mt: 4 }}>
          Logout
        </Button>
      </Box>
      <Box sx={{ mt: 4 }}>
        <ActivityFeed />
      </Box>
    </Container>
  );
};

export default DashboardPage;
