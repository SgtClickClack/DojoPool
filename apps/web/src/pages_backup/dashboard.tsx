import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <ProtectedRoute>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              mb: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{
                color: 'white',
                fontWeight: 700,
              }}
            >
              Welcome, {user?.firstName || user?.username}!
            </Typography>
            <Button
              variant="outlined"
              onClick={handleLogout}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Logout
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Profile
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Username: {user?.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {user?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Role: {user?.role || 'Player'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => router.push('/profile')}>
                    View Profile
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Tournaments
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View and join tournaments
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => router.push('/tournaments')}
                  >
                    Browse Tournaments
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Venues
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Find nearby pool venues
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => router.push('/venues')}>
                    Find Venues
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Matches
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View your match history
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => router.push('/matches')}>
                    View Matches
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Friends
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connect with other players
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => router.push('/friends')}>
                    Manage Friends
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your account settings
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => router.push('/settings')}>
                    Open Settings
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ProtectedRoute>
  );
};

export default DashboardPage;
