import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, error, loading, clearError } = useAuth();
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();

  // Clear error when component mounts or when error changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setPasswordError('');

    try {
      await register(email, password, name);
      // Redirect to dashboard on successful registration
      router.push('/dashboard');
    } catch (err) {
      // Error is already handled by the context
      console.error('Registration error:', err);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" gutterBottom align="center">
          Create Account
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            error={!!passwordError}
            helperText={passwordError}
            disabled={loading}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
          </Button>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link href="/login" variant="body2">
              Already have an account? Sign in here
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
