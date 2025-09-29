import { useAuth } from '@/hooks/useAuth';
import { Google as GoogleIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);

      const callbackUrl =
        typeof router.query.callbackUrl === 'string'
          ? router.query.callbackUrl
          : '/dashboard';

      await router.replace(callbackUrl);
    } catch (_err: any) {
      console.error('Login error:', _err);
      // Provide more specific error messages based on the error type
      if (
        _err.message?.includes('Network Error') ||
        _err.message?.includes('ECONNREFUSED')
      ) {
        setError(
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
      } else if (_err.response?.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (_err.response?.status === 429) {
        setError(
          'Too many login attempts. Please wait a few minutes and try again.'
        );
      } else if (_err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(_err.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');

    try {
      const callbackUrl = '/auth/success';
      const fallbackUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(
        callbackUrl
      )}`;
      await signIn('google', { callbackUrl });
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.assign(fallbackUrl);
        }
      }, 300);
    } catch (_err) {
      try {
        const callbackUrl = '/auth/success';
        const fallbackUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(
          callbackUrl
        )}`;
        if (typeof window !== 'undefined') window.location.assign(fallbackUrl);
        return;
      } catch (_ignored) {}
      setError('Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

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
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Login to DojoPool
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Google Sign In Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            component="a"
            href="/api/auth/signin/google?callbackUrl=%2Fauth%2Fsuccess"
            sx={{
              mb: 3,
              borderColor: '#4285f4',
              color: '#4285f4',
              '&:hover': {
                borderColor: '#357ae8',
                backgroundColor: '#f8f9fa',
              },
            }}
          >
            {isGoogleLoading ? 'Connecting...' : 'Sign in with Google'}
          </Button>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              or
            </Typography>
          </Divider>

          <Box
            component="form"
            onSubmit={handleSubmit}
            data-testid="login-form"
            sx={{ mt: 1 }}
          >
            <Box sx={{ mb: 2 }}>
              <Box
                component="label"
                htmlFor="email"
                sx={{
                  display: 'block',
                  mb: 1,
                  fontWeight: 500,
                }}
              >
                Email
              </Box>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                inputProps={{ 'data-testid': 'login-email-input' }}
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Box
                component="label"
                htmlFor="password"
                sx={{
                  display: 'block',
                  mb: 1,
                  fontWeight: 500,
                }}
              >
                Password
              </Box>
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                inputProps={{ 'data-testid': 'login-password-input' }}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
