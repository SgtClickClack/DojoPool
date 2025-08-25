import {
  AccountBalanceWallet,
  EmojiEvents,
  Group,
  SportsEsports,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../components/Common/ProtectedRoute';
import ActivityCard from '../components/Dashboard/ActivityCard';
import StatCard from '../components/Dashboard/StatCard';
import { useAuth } from '../hooks/useAuth';
import { DashboardStats, getDashboardStats } from '../services/APIService';
import { mockDashboardStats } from '../services/mockDashboardData';

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats:', err);
        console.log('Using mock data as fallback');
        setStats(mockDashboardStats);
        setError('Using demo data - API endpoint not available');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <ProtectedRoute>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome back, {user?.username || 'Player'}!
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your DojoPool Dashboard
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Quick Stats */}
            <Grid item xs={12} md={3}>
              <StatCard
                title="Games Played"
                value={stats?.matches.total || 0}
                subtitle={`${stats?.matches.thisMonth || 0} this month`}
                icon={SportsEsports}
                color="primary"
                trend={{
                  value: 12,
                  isPositive: true,
                  label: 'vs last month',
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <StatCard
                title="Win Rate"
                value={`${stats?.matches.winRate || 0}%`}
                subtitle="Last 30 days"
                icon={EmojiEvents}
                color="success"
                trend={{
                  value: 5,
                  isPositive: true,
                  label: 'vs last month',
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <StatCard
                title="Clan Points"
                value={stats?.clan.points || 0}
                subtitle={`Rank: ${stats?.clan.rank || 'N/A'}`}
                icon={Group}
                color="warning"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <StatCard
                title="DojoCoins"
                value={stats?.dojoCoins.balance || 0}
                subtitle={`Earned: ${stats?.dojoCoins.earned || 0}`}
                icon={AccountBalanceWallet}
                color="info"
              />
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={8}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    stats.recentActivity.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 2 }}
                    >
                      No recent activity
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <Button variant="contained" fullWidth>
                    Find Match
                  </Button>
                  <Button variant="outlined" fullWidth>
                    View Clan
                  </Button>
                  <Button variant="outlined" fullWidth>
                    Check Venues
                  </Button>
                  {isAdmin && (
                    <Button variant="outlined" color="secondary" fullWidth>
                      Admin Panel
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => window.location.reload()}
                    disabled={loading}
                  >
                    Refresh Data
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </ProtectedRoute>
  );
};

export default DashboardPage;
