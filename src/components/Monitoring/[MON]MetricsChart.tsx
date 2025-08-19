import {
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
  useTheme,
} from '@mui/material';
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
import { type MetricData, type TrendAnalysis } from '../../types/monitoring';
// import { gameMetricsMonitor } from '../../utils/monitoring';

// Temporary mock until monitoring utility is fixed
const gameMetricsMonitor = {
  getMetricsSnapshot: async () => ({ mock: true }),
};

interface MetricsChartProps {
  gameId?: string;
  metricId: string;
  chartType: 'line' | 'bar' | 'pie';
  refreshInterval?: number;
  timeRange: {
    startTime: number;
    endTime: number;
  };
  aggregatedData: {
    updateTimes: MetricData[];
    latency: MetricData[];
    memoryUsage: MetricData[];
  };
  aggregationInterval: number;
  onDataPointClick?: (dataPoint: MetricData) => void;
  showTrendLine?: boolean;
  showForecast?: boolean;
  showAnomalies?: boolean;
  trendAnalysis?: TrendAnalysis;
}

interface ChartDataPoint {
  time: string;
  value: number;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  gameId,
  metricId,
  chartType,
  refreshInterval = 1000,
  timeRange,
  aggregatedData,
  aggregationInterval,
  onDataPointClick,
  showTrendLine,
  showForecast,
  showAnomalies,
  trendAnalysis,
}) => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const snapshot = await gameMetricsMonitor.getMetricsSnapshot();
        setMetrics(snapshot);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatMetricData = (data: MetricData[]): ChartDataPoint[] => {
    return data.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      value: point.value,
    }));
  };

  const getMetricData = () => {
    if (!aggregatedData) return [];

    switch (metricId) {
      case 'updateTimes':
        return aggregatedData.updateTimes;
      case 'latency':
        return aggregatedData.latency;
      case 'memoryUsage':
        return aggregatedData.memoryUsage;
      default:
        return [];
    }
  };

  const handleDataPointClick = (event: any, payload: any) => {
    if (onDataPointClick && payload && payload.payload) {
      const dataPoint = payload.payload as ChartDataPoint;
      // Find the corresponding MetricData from the original data
      const metricData = getMetricData().find(
        (point) =>
          new Date(point.timestamp).toLocaleTimeString() === dataPoint.time &&
          Math.abs(point.value - dataPoint.value) < 0.001
      );

      if (metricData) {
        onDataPointClick(metricData);
      }
    }
  };

  const renderChart = () => {
    const data = getMetricData();
    const formattedData = formatMetricData(data);

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fill: theme.palette.text.secondary }}
                tickLine={{ stroke: theme.palette.text.secondary }}
              />
              <YAxis
                tick={{ fill: theme.palette.text.secondary }}
                tickLine={{ stroke: theme.palette.text.secondary }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={theme.palette.primary.main}
                dot={false}
                onClick={handleDataPointClick}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      // Add other chart types (bar, pie) here if needed
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {metricId}
            </Typography>
            {metrics ? renderChart() : <CircularProgress />}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
