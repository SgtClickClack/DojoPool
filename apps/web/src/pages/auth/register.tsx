import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Google as GoogleIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';

const RegisterPage: React.FC = () => {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(formData.username, formData.email, formData.password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      // Provide more specific error messages based on the error type
      if (
        err.message?.includes('Network Error') ||
        err.message?.includes('ECONNREFUSED')
      ) {
        setError(
          'Unable to connect to the server. Please check your internet connection and try again.'
        );
      } else if (err.response?.status === 409) {
        setError('An account with this email or username already exists.');
      } else if (err.response?.status === 400) {
        setError('Please check your input and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const callbackUrl = '/auth/success';
      const fallbackUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(
        callbackUrl
      )}`;
      await signIn('google', { callbackUrl });
      // Fallback in case NextAuth client-side redirect is blocked
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.assign(fallbackUrl);
        }
      }, 300);
    } catch (err) {
      try {
        const callbackUrl = '/auth/success';
        const fallbackUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(
          callbackUrl
        )}`;
        if (typeof window !== 'undefined') {
          window.location.assign(fallbackUrl);
          return;
        }
      } catch (_ignored) {}
      setIsGoogleLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h4">Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (user) {
    return null; // Will redirect
  }

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
            Create Account
          </Typography>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Join DojoPool and start your pool journey
          </Typography>

          {/* Google Sign In Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
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
            {isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}
          </Button>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              or
            </Typography>
          </Divider>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link href="/login" passHref>
                  <MuiLink component="span" sx={{ cursor: 'pointer' }}>
                    Sign in here
                  </MuiLink>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
