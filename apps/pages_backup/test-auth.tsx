import { Box, Button, Container, Paper, Typography } from '@mui/material';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestAuthPage: React.FC = () => {
  const { user, loading, isAuthenticated, error } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{ mb: 4, textAlign: 'center' }}
          >
            Authentication Test Page
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Current Auth State:
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body1">
                <strong>User:</strong>{' '}
                {user ? JSON.stringify(user, null, 2) : 'None'}
              </Typography>
            </Box>

            {error && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" color="error">
                  <strong>Error:</strong> {error}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => (window.location.href = '/login')}
              sx={{
                background: 'linear-gradient(45deg, #1e3c72, #2a5298)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #152f5b, #1e3c72)',
                },
              }}
            >
              Go to Login
            </Button>

            <Button
              variant="outlined"
              onClick={() => (window.location.href = '/register')}
              sx={{ color: '#1e3c72', borderColor: '#1e3c72' }}
            >
              Go to Register
            </Button>

            {isAuthenticated && (
              <Button
                variant="outlined"
                onClick={() => (window.location.href = '/dashboard')}
                sx={{ color: '#1e3c72', borderColor: '#1e3c72' }}
              >
                Go to Dashboard
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default TestAuthPage;
