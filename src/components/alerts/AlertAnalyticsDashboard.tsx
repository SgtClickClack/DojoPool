import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AlertAnalytics } from '../../services/AlertHistoryService';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface MetricCardProps {
  title: string;
  value: number;
  total: number;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, total, color }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Chip
            label={`${value} (${percentage}%)`}
            sx={{ backgroundColor: color, color: 'white' }}
          />
        </Box>
        <Box sx={{ position: 'relative', height: 4, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Box
            sx={{
              position: 'absolute',
              width: `${percentage}%`,
              height: '100%',
              bgcolor: color,
              borderRadius: 2
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export const AlertAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AlertAnalytics | null>(null);
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/alerts/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const handleTimeRangeChange = (range: '7d' | '30d' | '90d') => {
    const end = new Date();
    const start = new Date();
    switch (range) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
    }
    setTimeRange(range);
    setStartDate(start);
    setEndDate(end);
  };

  const statusData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: 'Open', value: analytics.openAlerts },
      { name: 'Acknowledged', value: analytics.acknowledgedAlerts },
      { name: 'Resolved', value: analytics.resolvedAlerts }
    ];
  }, [analytics]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  if (!analytics) return null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Alert Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small">
              <Select
                value={timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value as '7d' | '30d' | '90d')}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
              </Select>
            </FormControl>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => date && setStartDate(date)}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => date && setEndDate(date)}
              slotProps={{ textField: { size: 'small' } }}
            />
            <Tooltip title="Refresh data">
              <IconButton onClick={fetchAnalytics} size="large">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Status Overview */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Alert Status Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <MetricCard
                    title="Open"
                    value={analytics.openAlerts}
                    total={analytics.totalAlerts}
                    color="#f44336"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <MetricCard
                    title="Acknowledged"
                    value={analytics.acknowledgedAlerts}
                    total={analytics.totalAlerts}
                    color="#ff9800"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <MetricCard
                    title="Resolved"
                    value={analytics.resolvedAlerts}
                    total={analytics.totalAlerts}
                    color="#4caf50"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Status Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Status Distribution
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Alert Trends */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Alert Trends
              </Typography>
              <Box sx={{ height: isMobile ? 300 : 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.recentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      name="Alert Count"
                      stroke="#8884d8"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgImpactScore"
                      name="Avg Impact Score"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Top Impacting Alerts */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Impacting Alerts
              </Typography>
              <Grid container spacing={2}>
                {analytics.topImpactingAlerts.map((alert, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" component="div">
                            {alert.metric}
                          </Typography>
                          <Chip
                            label={`Score: ${alert.impactScore}`}
                            color={alert.type === 'regression' ? 'error' : 'warning'}
                            size="small"
                          />
                        </Box>
                        <Typography color="text.secondary" variant="body2">
                          {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}; 