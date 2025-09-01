import { useAuth } from '@/hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function AuthCallback() {
  const router = useRouter();
  const { user, setToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { token, error: authError } = router.query;

    if (authError) {
      setError('Authentication failed. Please try again.');
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
      return;
    }

    if (token && typeof token === 'string') {
      // Store the token and redirect to dashboard
      setToken(token);
      router.replace('/dashboard');
    } else if (user) {
      // User is already authenticated
      router.replace('/dashboard');
    } else {
      // No token provided, redirect to login
      router.replace('/login');
    }
  }, [router.query, user, setToken, router]);

  if (error) {
    return (
      <Box
        className="cyber-gradient"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h6" color="error" align="center">
          {error}
        </Typography>
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box
      className="cyber-gradient"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h6" color="primary" align="center">
        Completing authentication...
      </Typography>
      <CircularProgress
        size={60}
        thickness={4}
        sx={{
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
            filter: 'drop-shadow(0 0 8px var(--primary))',
          },
        }}
      />
    </Box>
  );
}
