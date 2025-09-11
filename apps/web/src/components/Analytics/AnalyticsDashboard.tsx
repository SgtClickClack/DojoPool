import {
  Assessment,
  EmojiEvents,
  MonetizationOn,
  People,
  Timeline,
  TrendingUp,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import { theme } from '../../styles/theme';

const AnalyticsCard = styled(Card)(({ theme }) => ({
  background: theme.cyberpunk.gradients.card,
  border: theme.cyberpunk.borders.subtle,
  borderRadius: '12px',
  boxShadow: theme.cyberpunk.shadows.card,
  '&:hover': {
    boxShadow: theme.cyberpunk.shadows.elevated,
    transform: 'translateY(-2px)',
    transition: 'all 0.3s ease',
  },
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  textShadow: theme.cyberpunk.glows.text,
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  totalRevenue: number;
  userRetention: number;
  avgSessionDuration: number;
  conversionRate: number;
  topVenues: Array<{
    id: string;
    name: string;
    matches: number;
    revenue: number;
  }>;
  userGrowth: Array<{
    date: string;
    users: number;
  }>;
  matchTrends: Array<{
    date: string;
    matches: number;
  }>;
}

interface AnalyticsDashboardProps {
  userId?: string;
  isAdmin?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  isAdmin = false,
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, userId]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics?range=${timeRange}&userId=${userId || ''}`
      );
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 3 }} />
        <Typography>Loading analytics...</Typography>
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Failed to load analytics data</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Analytics Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isAdmin ? 'Platform-wide analytics' : 'Your personal analytics'}
        </Typography>
      </Box>

      {/* Time Range Selector */}
      <Box sx={{ mb: 3 }}>
        {['1d', '7d', '30d', '90d'].map((range) => (
          <Chip
            key={range}
            label={range}
            onClick={() => setTimeRange(range)}
            variant={timeRange === range ? 'filled' : 'outlined'}
            sx={{ mr: 1 }}
          />
        ))}
      </Box>

      {/* Key Metrics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 3,
          mb: 4,
        }}
      >
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <AnalyticsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: theme.palette.primary.main }} />
                <MetricLabel>Total Users</MetricLabel>
              </Box>
              <MetricValue>
                {formatNumber(analyticsData.totalUsers)}
              </MetricValue>
              <Typography variant="body2" color="success.main">
                +12% from last period
              </Typography>
            </CardContent>
          </AnalyticsCard>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <AnalyticsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: theme.palette.success.main }} />
                <MetricLabel>Active Users</MetricLabel>
              </Box>
              <MetricValue>
                {formatNumber(analyticsData.activeUsers)}
              </MetricValue>
              <Typography variant="body2" color="success.main">
                +8% from last period
              </Typography>
            </CardContent>
          </AnalyticsCard>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <AnalyticsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEvents
                  sx={{ mr: 1, color: theme.palette.warning.main }}
                />
                <MetricLabel>Total Matches</MetricLabel>
              </Box>
              <MetricValue>
                {formatNumber(analyticsData.totalMatches)}
              </MetricValue>
              <Typography variant="body2" color="success.main">
                +15% from last period
              </Typography>
            </CardContent>
          </AnalyticsCard>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <AnalyticsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MonetizationOn
                  sx={{ mr: 1, color: theme.palette.secondary.main }}
                />
                <MetricLabel>Total Revenue</MetricLabel>
              </Box>
              <MetricValue>
                {formatCurrency(analyticsData.totalRevenue)}
              </MetricValue>
              <Typography variant="body2" color="success.main">
                +22% from last period
              </Typography>
            </CardContent>
          </AnalyticsCard>
        </Box>
      </Box>

      {/* Secondary Metrics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 3,
          mb: 4,
        }}
      >
        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <AnalyticsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Timeline sx={{ mr: 1, color: theme.palette.info.main }} />
                <MetricLabel>User Retention</MetricLabel>
              </Box>
              <MetricValue>
                {formatPercentage(analyticsData.userRetention)}
              </MetricValue>
              <Typography variant="body2" color="success.main">
                +3% from last period
              </Typography>
            </CardContent>
          </AnalyticsCard>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <AnalyticsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, color: theme.palette.primary.main }} />
                <MetricLabel>Avg Session</MetricLabel>
              </Box>
              <MetricValue>
                {formatDuration(analyticsData.avgSessionDuration)}
              </MetricValue>
              <Typography variant="body2" color="success.main">
                +5% from last period
              </Typography>
            </CardContent>
          </AnalyticsCard>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <AnalyticsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: theme.palette.success.main }} />
                <MetricLabel>Conversion Rate</MetricLabel>
              </Box>
              <MetricValue>
                {formatPercentage(analyticsData.conversionRate)}
              </MetricValue>
              <Typography variant="body2" color="success.main">
                +2% from last period
              </Typography>
            </CardContent>
          </AnalyticsCard>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <AnalyticsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People sx={{ mr: 1, color: theme.palette.warning.main }} />
                <MetricLabel>Active Venues</MetricLabel>
              </Box>
              <MetricValue>{analyticsData.topVenues.length}</MetricValue>
              <Typography variant="body2" color="success.main">
                +1 new venue
              </Typography>
            </CardContent>
          </AnalyticsCard>
        </Box>
      </Box>

      {/* Top Venues */}
      {isAdmin && (
        <AnalyticsCard sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Top Performing Venues
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: 2,
              }}
            >
              {analyticsData.topVenues.slice(0, 4).map((venue, index) => (
                <Box
                  sx={{
                    gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' },
                  }}
                  key={venue.id}
                >
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      #{index + 1} {venue.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {venue.matches} matches
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(venue.revenue)} revenue
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </AnalyticsCard>
      )}

      {/* Charts would go here */}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}
      >
        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <AnalyticsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                User Growth Trend
              </Typography>
              {/* Chart component would go here */}
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">
                  Chart placeholder
                </Typography>
              </Box>
            </CardContent>
          </AnalyticsCard>
        </Box>

        <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
          <AnalyticsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Match Activity Trend
              </Typography>
              {/* Chart component would go here */}
              <Box
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">
                  Chart placeholder
                </Typography>
              </Box>
            </CardContent>
          </AnalyticsCard>
        </Box>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;
