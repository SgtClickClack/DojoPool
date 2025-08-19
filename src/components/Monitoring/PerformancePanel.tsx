import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PerformanceMonitor } from '../../performance_monitor';
import {
  type MetricsSnapshot,
  type PerformanceMetrics,
} from '../../types/monitoring';

const performanceMonitor = PerformanceMonitor.getInstance();

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit }) => (
  <Card>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h5" component="h2">
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span style={{ fontSize: '0.8em' }}>{unit}</span>}
      </Typography>
    </CardContent>
  </Card>
);

export const PerformancePanel: React.FC = () => {
  const [currentMetrics, setCurrentMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<MetricsSnapshot | null>(
    null
  );

  useEffect(() => {
    // Start monitoring when component mounts
    performanceMonitor.startMonitoring(5000); // Update every 5 seconds

    // Initial data fetch
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    setCurrentMetrics(performanceMonitor.getCurrentMetrics());
    setHistoricalData(performanceMonitor.getMetrics(oneHourAgo, now));

    // Set up periodic updates
    const intervalId = setInterval(() => {
      setCurrentMetrics(performanceMonitor.getCurrentMetrics());
      setHistoricalData(performanceMonitor.getMetrics(oneHourAgo, now));
    }, 5000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      performanceMonitor.stopMonitoring();
    };
  }, []);

  if (!currentMetrics || !historicalData) {
    return <div>Loading metrics...</div>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Performance
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="CPU Usage"
            value={currentMetrics.cpuUsage}
            unit="%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={currentMetrics.memoryUsage / 1024}
            unit="GB"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Disk Usage"
            value={currentMetrics.diskUsage}
            unit="%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Network Traffic"
            value={
              (currentMetrics.networkSent + currentMetrics.networkReceived) /
              1024
            }
            unit="MB/s"
          />
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Historical Performance
        </Typography>
        <Card>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={(historicalData as any).historical?.cpuUsage || []}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(timestamp) =>
                    new Date(timestamp).toLocaleTimeString()
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(timestamp) =>
                    new Date(timestamp).toLocaleString()
                  }
                  formatter={(value: number) => [
                    `${value.toFixed(1)}%`,
                    'CPU Usage',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  dot={false}
                  name="CPU Usage"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
