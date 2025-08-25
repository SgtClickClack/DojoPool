import PrivateRoute from '@/components/Auth/[AUTH]PrivateRoute';
import { useAuth } from '@/frontend/contexts/AuthContext';
import {
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React from 'react';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <PrivateRoute>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar sx={{ width: 80, height: 80, fontSize: '2rem', mr: 3 }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  Welcome, {user?.name || 'User'}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {user?.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Role: {user?.role}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => router.push('/tournaments')}
                >
                  View Tournaments
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/world-map')}
                >
                  World Map
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/challenges')}
                >
                  Challenges
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Member since:{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : 'N/A'}
              </Typography>
              <Button variant="outlined" color="error" onClick={handleLogout}>
                Sign Out
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </PrivateRoute>
  );
};

export default Dashboard;
