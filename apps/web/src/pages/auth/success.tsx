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
  const { setToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGoogleAuthSuccess = async () => {
      try {
        const { user: userParam } = router.query;

        if (!userParam || typeof userParam !== 'string') {
          console.error('No user data received from Google');
          setError(
            'No user data received from Google. Please try signing in again.'
          );
          setLoading(false);
          return;
        }

        const userData: GoogleUserData = JSON.parse(
          decodeURIComponent(userParam)
        );

        // For now, we'll create a simple token based on the Google user data
        // In a real implementation, you would:
        // 1. Send the user data to your backend
        // 2. Create or find the user in your database
        // 3. Generate a proper JWT token
        // 4. Return the token to the frontend

        // Create a temporary token (this is not secure for production)
        const tempToken = btoa(
          JSON.stringify({
            sub: userData.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
          })
        );

        console.log('Setting token for user:', userData.email);

        // Set the token in the auth context
        await setToken(tempToken);

        console.log('Token set, redirecting to dashboard');

        // Redirect to dashboard
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
  }, [router, setToken]);

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
