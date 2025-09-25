import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

interface GoogleUserData {
  email: string;
  name: string;
  picture: string;
  id: string;
}

const AuthSuccessPage: React.FC = () => {
  // const { setToken } = useAuth(); // Removed setToken
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleAuthSuccess = async () => {
      try {
        const { user: userParam, error } = router.query;

        if (error) {
          setError('Google authentication failed. Please try again.');
          setLoading(false);
          return;
        }

        if (!userParam || typeof userParam !== 'string') {
          console.error('No user data received from Google');
          setError(
            'No user data received from Google. Please try signing in again.'
          );
          setLoading(false);
          return;
        }

        // Parse user data for logging, but no token needed
        try {
          const userData: GoogleUserData = JSON.parse(
            decodeURIComponent(userParam)
          );
          console.log('Google auth success for user:', userData.email);
        } catch (parseErr) {
          console.error('Failed to parse user data:', parseErr);
        }

        // Redirect to dashboard - NextAuth session should be updated
        router.push('/dashboard');
      } catch (err) {
        console.error('Google auth success error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    };

    if (router.isReady) {
      handleGoogleAuthSuccess();
    }
  }, [router]);

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Completing Google authentication...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Please try signing in again.
          </Typography>
        </Box>
      </Container>
    );
  }

  return null;
};

export default AuthSuccessPage;
