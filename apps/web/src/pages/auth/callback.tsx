import { useAuth } from '@/hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const { setToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const {
          token,
          access_token,
          error: urlError,
        } = router.query as {
          token?: string;
          access_token?: string;
          error?: string;
        };

        if (urlError) {
          setError('Authentication failed. Please try again.');
          setIsProcessing(false);
          return;
        }

        const jwt =
          typeof access_token === 'string'
            ? access_token
            : typeof token === 'string'
              ? token
              : undefined;
        if (jwt) {
          // Set the token in auth context
          await setToken(jwt);

          // Redirect to home page
          router.push('/');
        } else {
          setError('No authentication token received.');
          setIsProcessing(false);
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        setIsProcessing(false);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query, setToken, router]);

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
