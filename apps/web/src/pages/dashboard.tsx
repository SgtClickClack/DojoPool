import { ActivityFeed } from '@/components/ActivityFeed';
import ProtectedRoute from '@/components/Common/ProtectedRoute';
import ActivityCard from '@/components/Dashboard/ActivityCard';
import StatCard from '@/components/Dashboard/StatCard';
import { Notifications } from '@/components/Notifications';
import { useAuth } from '@/hooks/useAuth';
import { DashboardStats, getDashboardStats } from '@/services/APIService';
import { mockDashboardStats } from '@/services/mockDashboardData';
import {
  AccountBalanceWallet,
  EmojiEvents,
  Group,
  Notifications as NotificationsIcon,
  SportsEsports,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

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
        <Box sx={{ mt: 4, mb: 6, position: 'relative' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                Welcome back, {user?.username || 'Player'}!
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your DojoPool Dashboard
              </Typography>
            </Box>
            <IconButton
              onClick={() => setShowNotifications(!showNotifications)}
              sx={{
                color: '#00d4ff',
                '&:hover': {
                  backgroundColor: 'rgba(0, 212, 255, 0.1)',
                },
              }}
            >
              <NotificationsIcon />
            </IconButton>
          </Box>

          {/* Notifications Panel */}
          {showNotifications && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                right: 0,
                zIndex: 1000,
                mt: 1,
              }}
            >
              <Notifications
                onClose={() => setShowNotifications(false)}
                compact={true}
              />
            </Box>
          )}
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
          <Box>
            {/* Quick Stats */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
                gap: 3,
              }}
            >
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
              <StatCard
                title="Clan Points"
                value={stats?.clan.points || 0}
                subtitle={`Rank: ${stats?.clan.rank || 'N/A'}`}
                icon={Group}
                color="warning"
              />
              <StatCard
                title="DojoCoins"
                value={stats?.dojoCoins.balance || 0}
                subtitle={`Earned: ${stats?.dojoCoins.earned || 0}`}
                icon={AccountBalanceWallet}
                color="info"
              />
            </Box>

            {/* Main Content Grid */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Activity Feed - Takes up more space */}
              <Grid item xs={12} md={8}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    background:
                      'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
                    border: '1px solid #00d4ff',
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: '#00d4ff', fontWeight: 'bold' }}
                  >
                    Activity Feed
                  </Typography>
                  <ActivityFeed filter="global" />
                </Paper>
              </Grid>

              {/* Sidebar with Quick Actions and Recent Activity */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Quick Actions */}
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      background:
                        'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
                      border: '1px solid #00d4ff',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: '#00d4ff', fontWeight: 'bold' }}
                    >
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
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: '#00d4ff',
                          '&:hover': {
                            backgroundColor: '#00b8e6',
                          },
                        }}
                      >
                        Find Match
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                          color: '#00d4ff',
                          borderColor: '#00d4ff',
                          '&:hover': {
                            borderColor: '#00d4ff',
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          },
                        }}
                      >
                        View Clan
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{
                          color: '#00d4ff',
                          borderColor: '#00d4ff',
                          '&:hover': {
                            borderColor: '#00d4ff',
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          },
                        }}
                      >
                        Check Venues
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outlined"
                          color="secondary"
                          fullWidth
                          sx={{
                            color: '#ff6b6b',
                            borderColor: '#ff6b6b',
                            '&:hover': {
                              borderColor: '#ff6b6b',
                              backgroundColor: 'rgba(255, 107, 107, 0.1)',
                            },
                          }}
                        >
                          Admin Panel
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => window.location.reload()}
                        disabled={loading}
                        sx={{
                          color: '#00d4ff',
                          borderColor: '#00d4ff',
                          '&:hover': {
                            borderColor: '#00d4ff',
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                          },
                        }}
                      >
                        Refresh Data
                      </Button>
                    </Box>
                  </Paper>

                  {/* Recent Activity Summary */}
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      background:
                        'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
                      border: '1px solid #00d4ff',
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ color: '#00d4ff', fontWeight: 'bold' }}
                    >
                      Recent Activity
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {stats?.recentActivity &&
                      stats.recentActivity.length > 0 ? (
                        stats.recentActivity
                          .slice(0, 3)
                          .map((activity) => (
                            <ActivityCard
                              key={activity.id}
                              activity={activity}
                            />
                          ))
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textAlign: 'center', py: 2, color: '#b0b0b0' }}
                        >
                          No recent activity
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Container>
    </ProtectedRoute>
  );
};

export default DashboardPage;
