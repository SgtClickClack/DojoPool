import analyticsService from '@/services/analyticsService';
import { AnalyticsData, AnalyticsFilter } from '@dojopool/types';
import {
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useCallback, useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isConnected, setIsConnected] = useState(false);

  const createFilter = useCallback((): AnalyticsFilter => {
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    return { startDate, endDate, timeRange };
  }, [timeRange]);

  const fetchInitialAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filter = createFilter();
      const analyticsData = await analyticsService.getAnalyticsData(filter);
      setData(analyticsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch analytics data'
      );
    } finally {
      setLoading(false);
    }
  }, [createFilter]);

  // Set up SSE subscriptions
  useEffect(() => {
    const filter = createFilter();

    // Subscribe to analytics updates
    const unsubscribeAnalytics = analyticsService.onAnalyticsUpdate(
      (analyticsData) => {
        setData(analyticsData);
        setLastUpdate(new Date());
        setError(null);
      }
    );

    // Subscribe to errors
    const unsubscribeError = analyticsService.onError((err) => {
      console.error('SSE Analytics error:', err);
      setError(err.message);
    });

    // Start SSE stream
    analyticsService.startAnalyticsStream(filter);

    return () => {
      unsubscribeAnalytics();
      unsubscribeError();
      analyticsService.stopStream();
    };
  }, [createFilter]);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(analyticsService.isConnected());
    };

    const interval = setInterval(checkConnection, 5000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchInitialAnalyticsData();
  };

  if (loading && !data) {
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

  if (error && !data) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return <Alert severity="info">No analytics data available yet.</Alert>;
  }

  // Prepare chart data
  const userEngagementChartData = {
    labels: data.userEngagement.map((d) => d.date),
    datasets: [
      {
        label: 'Active Users',
        data: data.userEngagement.map((d) => d.activeUsers),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Sessions',
        data: data.userEngagement.map((d) => d.sessions),
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const topEventsChartData = {
    labels: data.topEvents.map((e) => e.eventName.replace('_', ' ')),
    datasets: [
      {
        label: 'Event Count',
        data: data.topEvents.map((e) => e.count),
        backgroundColor: [
          '#00d4ff',
          '#ff6b6b',
          '#00ff88',
          '#ffa500',
          '#9c27b0',
        ],
        borderColor: '#1a1a2e',
        borderWidth: 2,
      },
    ],
  };

  const featureUsageChartData = {
    labels: data.featureUsage.map((f) => f.feature),
    datasets: [
      {
        label: 'Usage Count',
        data: data.featureUsage.map((f) => f.usageCount),
        backgroundColor: '#00d4ff',
        borderColor: '#0099cc',
        borderWidth: 1,
      },
      {
        label: 'Unique Users',
        data: data.featureUsage.map((f) => f.uniqueUsers),
        backgroundColor: '#ff6b6b',
        borderColor: '#cc5555',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box>
      {/* Header with controls */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h5" gutterBottom>
            Analytics Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={timeRange === '7d' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === '30d' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant={timeRange === '90d' ? 'contained' : 'outlined'}
              onClick={() => setTimeRange('90d')}
            >
              90 Days
            </Button>
          </ButtonGroup>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isConnected ? '#00ff88' : '#ff6b6b',
                boxShadow: isConnected
                  ? '0 0 10px rgba(0, 255, 136, 0.5)'
                  : '0 0 10px rgba(255, 107, 107, 0.5)',
                animation: isConnected ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            />
            <Typography variant="body2" color="text.secondary">
              {isConnected ? 'Live' : 'Offline'}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
              border: '1px solid #00d4ff',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ color: '#00d4ff', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#00d4ff' }}>
                  Daily Active Users
                </Typography>
              </Box>
              <Typography
                variant="h3"
                sx={{ color: '#ffffff', fontWeight: 'bold' }}
              >
                {data.dau.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
              border: '1px solid #ff6b6b',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: '#ff6b6b', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#ff6b6b' }}>
                  Monthly Active Users
                </Typography>
              </Box>
              <Typography
                variant="h3"
                sx={{ color: '#ffffff', fontWeight: 'bold' }}
              >
                {data.mau.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
              border: '1px solid #00ff88',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon sx={{ color: '#00ff88', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#00ff88' }}>
                  Total Events
                </Typography>
              </Box>
              <Typography
                variant="h3"
                sx={{ color: '#ffffff', fontWeight: 'bold' }}
              >
                {data.totalEvents.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
              border: '1px solid #ffa500',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimelineIcon sx={{ color: '#ffa500', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#ffa500' }}>
                  System Uptime
                </Typography>
              </Box>
              <Typography
                variant="h3"
                sx={{ color: '#ffffff', fontWeight: 'bold' }}
              >
                {data.systemPerformance.uptime}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* User Engagement Chart */}
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
              border: '1px solid #00d4ff',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: '#00d4ff', fontWeight: 'bold' }}
            >
              User Engagement Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={userEngagementChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Top Events Chart */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
              border: '1px solid #ff6b6b',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: '#ff6b6b', fontWeight: 'bold' }}
            >
              Top Events
            </Typography>
            <Box sx={{ height: 300 }}>
              <Doughnut data={topEventsChartData} />
            </Box>
          </Paper>
        </Grid>

        {/* Feature Usage Chart */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
              border: '1px solid #00ff88',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: '#00ff88', fontWeight: 'bold' }}
            >
              Feature Usage
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={featureUsageChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* System Performance */}
        <Grid item xs={12} lg={6}>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
              border: '1px solid #ffa500',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: '#ffa500', fontWeight: 'bold' }}
            >
              System Performance
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Card
                  sx={{
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    border: '1px solid #00d4ff',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response Time
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#00d4ff' }}>
                      {data.systemPerformance.avgResponseTime}ms
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card
                  sx={{
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    border: '1px solid #ff6b6b',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ff6b6b' }}>
                      {data.systemPerformance.errorRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 3, mb: 2, color: '#00ff88' }}>
              Economy Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card
                  sx={{
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid #00ff88',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Transactions
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00ff88' }}>
                      {data.economyMetrics.totalTransactions.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card
                  sx={{
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    border: '1px solid #ff6b6b',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Volume
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ff6b6b' }}>
                      {data.economyMetrics.totalVolume.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card
                  sx={{
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    border: '1px solid #ffa500',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Avg Value
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ffa500' }}>
                      {data.economyMetrics.avgTransactionValue.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
