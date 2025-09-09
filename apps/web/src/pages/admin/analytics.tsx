import { AnalyticsDashboard } from '@/components/Analytics';
import { useAuth } from '@/hooks/useAuth';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

const AdminAnalyticsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You don't have permission to access this page. Admin privileges
          required.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Real-time insights into player behavior and system performance
        </Typography>
      </Box>

      {/* Main Dashboard */}
      <AnalyticsDashboard />

      {/* Footer */}
      <Box
        sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          Analytics data is updated in real-time. Last refresh:{' '}
          {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminAnalyticsPage;
