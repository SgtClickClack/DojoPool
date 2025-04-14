import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PerformanceMonitor } from '../services/PerformanceMonitor';
import { formatBytes, formatTime, formatPercentage } from '../utils/formatters';

interface PerformanceMetrics {
  timestamp: number;
  fps: number;
  memoryUsage: number;
  apiResponseTime: number;
  errorRate: number;
}

interface ChartData {
  time: string;
  value: number;
}

const performanceMonitor = new PerformanceMonitor();

export const PerformanceMonitorDashboard: React.FC = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/performance-metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data: PerformanceMetrics = await response.json();
      setMetrics((prevMetrics: PerformanceMetrics[]) => [...prevMetrics, data].slice(-30)); // Keep last 30 data points
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const renderChart = (
    dataKey: keyof PerformanceMetrics,
    label: string,
    color: string,
    formatter: (value: number) => string
  ) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {label}
        </Typography>
        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp: number) => new Date(timestamp).toLocaleTimeString()}
              />
              <YAxis tickFormatter={formatter} />
              <Tooltip
                formatter={(value: number) => [formatter(value), label]}
                labelFormatter={(timestamp: number) => new Date(timestamp).toLocaleString()}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <ErrorBoundary>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Performance Monitor
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderChart('fps', 'Frame Rate', '#2196f3', (value) => `${Math.round(value)} FPS`)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderChart('memoryUsage', 'Memory Usage', '#4caf50', formatBytes)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderChart('apiResponseTime', 'API Response Time', '#ff9800', formatTime)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderChart('errorRate', 'Error Rate', '#f44336', formatPercentage)}
          </Grid>
        </Grid>
      </Box>
    </ErrorBoundary>
  );
};

export default PerformanceMonitorDashboard; 