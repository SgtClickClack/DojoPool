import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const { sendPasswordResetEmail, loading, error, resetRequestSent } =
    useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendPasswordResetEmail(email);
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
          Reset Password
        </Typography>
        {resetRequestSent ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Check your email for instructions to reset your password.
            </Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Enter your email address and we'll send you instructions to reset
              your password.
            </Typography>
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
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </Box>
        )}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link href="/login">Back to Sign In</Link>
        </Box>
      </Paper>
    </Box>
  );
};
