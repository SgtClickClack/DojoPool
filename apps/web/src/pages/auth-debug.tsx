import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

const AuthDebugPage: React.FC = () => {
  const { user, loading, isAdmin } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [apiTest, setApiTest] = useState<any>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    setToken(storedToken);
  }, []);

  const testApiCall = async () => {
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setApiTest({ status: response.status, data });
    } catch (error) {
      setApiTest({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Authentication Debug
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Auth Hook Status
          </Typography>
          <Typography>Loading: {loading ? 'Yes' : 'No'}</Typography>
          <Typography>User: {user ? JSON.stringify(user) : 'None'}</Typography>
          <Typography>Is Admin: {isAdmin ? 'Yes' : 'No'}</Typography>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Local Storage Token
          </Typography>
          <Typography>
            Token: {token ? token.substring(0, 50) + '...' : 'None'}
          </Typography>
          {token && (
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" onClick={testApiCall}>
                Test API Call
              </Button>
            </Box>
          )}
        </Paper>

        {apiTest && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              API Test Result
            </Typography>
            <pre>{JSON.stringify(apiTest, null, 2)}</pre>
          </Paper>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Actions
          </Typography>
          <Button
            variant="outlined"
            onClick={() => (window.location.href = '/login')}
            sx={{ mr: 2 }}
          >
            Go to Login
          </Button>
          <Button
            variant="outlined"
            onClick={() => (window.location.href = '/dashboard')}
            sx={{ mr: 2 }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
              window.location.reload();
            }}
          >
            Clear Tokens & Reload
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthDebugPage;
