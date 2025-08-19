import { useAuth } from '@/hooks/useAuth';
import { Box, Button, Link, Paper, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useState } from 'react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
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
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button fullWidth type="submit" variant="contained" sx={{ mt: 3 }}>
            Sign In
          </Button>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link href="/forgot-password">Forgot password?</Link>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account? <Link href="/signup">Sign up</Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
