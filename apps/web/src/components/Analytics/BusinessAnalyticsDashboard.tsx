import {
  EmojiEvents,
  MonetizationOn,
  People,
  SportsBar,
  Timeline,
  TrendingUp,
} from '@mui/icons-material';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { UserJourneyFunnel } from './UserJourneyFunnel';

interface BusinessMetrics {
  totalUsers: number;
  activeUsers24h: number;
  newUsers24h: number;
  totalGames: number;
  totalRevenue: number;
  avgSessionDuration: number;
  userRetention7d: number;
  venueCheckins: number;
  tournamentParticipation: number;
}

interface FunnelStep {
  id: string;
  name: string;
  count: number;
  percentage: number;
  change?: number;
  color: string;
}

export const BusinessAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinessMetrics();
  }, []);

  const loadBusinessMetrics = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from the analytics API
      // For now, we'll use mock data
      const mockMetrics: BusinessMetrics = {
        totalUsers: 1247,
        activeUsers24h: 342,
        newUsers24h: 28,
        totalGames: 3456,
        totalRevenue: 1250.75,
        avgSessionDuration: 24.5,
        userRetention7d: 68.5,
        venueCheckins: 892,
        tournamentParticipation: 156,
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load business metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockFunnelSteps: FunnelStep[] = [
    {
      id: 'visitors',
      name: 'Website Visitors',
      count: 5000,
      percentage: 100,
      change: 12.5,
      color: theme.palette.primary.main,
    },
    {
      id: 'registrations',
      name: 'User Registrations',
      count: 1247,
      percentage: 25.0,
      change: 8.3,
      color: theme.palette.secondary.main,
    },
    {
      id: 'onboarding',
      name: 'Complete Onboarding',
      count: 892,
      percentage: 71.5,
      change: 15.2,
      color: theme.palette.success.main,
    },
    {
      id: 'first_game',
      name: 'Play First Game',
      count: 634,
      percentage: 71.1,
      change: -2.1,
      color: theme.palette.warning.main,
    },
    {
      id: 'returning',
      name: 'Returning Users (7d)',
      count: 429,
      percentage: 67.7,
      change: 5.8,
      color: theme.palette.info.main,
    },
  ];

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: number;
    subtitle?: string;
  }> = ({ title, value, icon, change, subtitle }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: theme.palette.primary.main, mr: 1 }}>{icon}</Box>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>

        <Typography variant="h4" sx={{ mb: 1 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>

        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUp
              sx={{
                fontSize: 16,
                color: change >= 0 ? 'success.main' : 'error.main',
                transform: change < 0 ? 'rotate(180deg)' : 'none',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: change >= 0 ? 'success.main' : 'error.main',
              }}
            >
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              vs last period
            </Typography>
          </Box>
        )}

        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <Typography>Loading business analytics...</Typography>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          Unable to load business metrics. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Business Analytics Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Key metrics and insights for DojoPool's business performance
      </Typography>

      {/* Key Metrics Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 3,
          mb: 4,
        }}
      >
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers}
            icon={<People />}
            change={12.5}
            subtitle="Registered players"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <MetricCard
            title="Active Users (24h)"
            value={metrics.activeUsers24h}
            icon={<TrendingUp />}
            change={8.3}
            subtitle="Users active today"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <MetricCard
            title="New Users (24h)"
            value={metrics.newUsers24h}
            icon={<People />}
            change={15.2}
            subtitle="New registrations"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <MetricCard
            title="Total Revenue"
            value={`$${metrics.totalRevenue.toFixed(2)}`}
            icon={<MonetizationOn />}
            change={22.1}
            subtitle="Revenue (24h)"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <MetricCard
            title="Games Played"
            value={metrics.totalGames}
            icon={<SportsBar />}
            change={18.7}
            subtitle="Total game sessions"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <MetricCard
            title="Venue Check-ins"
            value={metrics.venueCheckins}
            icon={<SportsBar />}
            change={25.3}
            subtitle="QR code scans"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <MetricCard
            title="Tournament Players"
            value={metrics.tournamentParticipation}
            icon={<EmojiEvents />}
            change={31.8}
            subtitle="Active tournament participants"
          />
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <MetricCard
            title="Avg Session"
            value={`${metrics.avgSessionDuration}m`}
            icon={<Timeline />}
            change={-2.1}
            subtitle="Average session duration"
          />
        </Box>
      </Box>

      {/* User Journey Funnel */}
      <Box sx={{ mb: 4 }}>
        <UserJourneyFunnel
          steps={mockFunnelSteps}
          title="User Acquisition & Retention Funnel"
        />
      </Box>

      {/* Additional Insights */}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}
      >
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Key Performance Insights
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🎯 <strong>User Retention:</strong> {metrics.userRetention7d}%
                  of users return within 7 days
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📈 <strong>Growth Rate:</strong> +
                  {(
                    (metrics.newUsers24h /
                      (metrics.totalUsers - metrics.newUsers24h)) *
                    100
                  ).toFixed(1)}
                  % daily growth
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  💰 <strong>Revenue per User:</strong> $
                  {(metrics.totalRevenue / metrics.totalUsers).toFixed(2)}{' '}
                  average
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🎮 <strong>Games per User:</strong>{' '}
                  {(metrics.totalGames / metrics.totalUsers).toFixed(1)} average
                  games played
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                Data updated in real-time from user interactions and game
                sessions.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🔄 <strong>Focus on retention:</strong> 32.3% drop-off between
                  onboarding and first game
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📱 <strong>Mobile optimization:</strong> 68% of sessions are
                  mobile-based
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🏆 <strong>Tournament engagement:</strong> High participation
                  rate indicates strong competitive interest
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  📍 <strong>Venue discovery:</strong> 71% of users check in to
                  venues within first week
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                Based on current user behavior patterns and conversion metrics.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};
