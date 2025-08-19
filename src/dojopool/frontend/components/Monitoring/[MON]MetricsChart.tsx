import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  type MetricData,
  type MetricsSnapshot,
  type TrendAnalysis,
} from '../../types/monitoring';
import { gameMetricsMonitor } from '../../utils/monitoring';

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
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);

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

  const formatMetricData = (data: MetricData[]) => {
    return data.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      value: point.value,
      label: point.label,
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
                onClick={(point) =>
                  onDataPointClick?.(point as unknown as MetricData)
                }
              />
              {showTrendLine && trendAnalysis?.trendLine && (
                <Line
                  type="monotone"
                  data={formatMetricData(trendAnalysis.trendLine)}
                  dataKey="value"
                  stroke={theme.palette.secondary.main}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
              {showForecast && trendAnalysis?.forecast && (
                <Line
                  type="monotone"
                  data={formatMetricData(
                    trendAnalysis.forecast.map((f) => ({
                      timestamp: f.timestamp,
                      value: f.value,
                    }))
                  )}
                  dataKey="value"
                  stroke={theme.palette.info.main}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
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
