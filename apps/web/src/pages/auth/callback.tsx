import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [_isProcessing, setIsProcessing] = useState(true);
  // const { setToken } = useAuth(); // Removed setToken usage
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error: urlError } = router.query;

        if (urlError) {
          setError('Authentication failed. Please try again.');
          setIsProcessing(false);
          return;
        }

        // On success, redirect to home - session will update automatically via NextAuth
        router.push('/');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        setIsProcessing(false);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query, router]);

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ cursor: 'pointer' }}
          onClick={() => router.push('/login')}
        >
          Return to Login
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        Completing authentication...
      </Typography>
    </Box>
  );
};

export default AuthCallback;
