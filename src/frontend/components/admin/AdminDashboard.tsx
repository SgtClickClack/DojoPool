import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { authApi, type AdminStats } from '../../services/services/api/auth';
import StatCard from './StatCard';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await authApi.getAdminStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Error: {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        No stats available
      </Alert>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 4 }}
      >
        <Typography variant="h4" component="h2" fontWeight="bold">
          Platform Overview
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Refresh Stats
        </Button>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
          gap: 3,
        }}
      >
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon="🟢"
          color="green"
        />
        <StatCard
          title="Total Games"
          value={stats.totalGames.toLocaleString()}
          icon="🎱"
          color="purple"
        />
        <StatCard
          title="Total Tournaments"
          value={stats.totalTournaments.toLocaleString()}
          icon="🏆"
          color="yellow"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon="💰"
          color="green"
        />
        <StatCard
          title="Active Dojos"
          value={stats.activeDojos.toLocaleString()}
          icon="🏛️"
          color="indigo"
        />
      </Box>
    </Box>
  );
};
