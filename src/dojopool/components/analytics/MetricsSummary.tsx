import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';

interface MetricsSummaryProps {
  metric: string;
  data: any[];
  loading: boolean;
}

const METRIC_LABELS: { [key: string]: string } = {
  games_played: 'Games Played',
  win_rate: 'Win Rate',
  avg_score: 'Average Score',
  occupancy_rate: 'Occupancy Rate',
  revenue: 'Revenue',
  response_time: 'Response Time',
  error_rate: 'Error Rate',
  cpu_usage: 'CPU Usage',
};

const METRIC_FORMATS: { [key: string]: (value: number) => string } = {
  games_played: (value) => value.toFixed(0),
  win_rate: (value) => `${(value * 100).toFixed(1)}%`,
  avg_score: (value) => value.toFixed(1),
  occupancy_rate: (value) => `${(value * 100).toFixed(1)}%`,
  revenue: (value) => `$${value.toFixed(2)}`,
  response_time: (value) => `${value.toFixed(0)}ms`,
  error_rate: (value) => `${(value * 100).toFixed(2)}%`,
  cpu_usage: (value) => `${(value * 100).toFixed(1)}%`,
};

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({
  metric,
  data,
  loading,
}) => {
  const theme = useTheme();

  const { currentValue, previousValue, trend, percentageChange } =
    useMemo(() => {
      if (!data.length) {
        return {
          currentValue: 0,
          previousValue: 0,
          trend: 'flat',
          percentageChange: 0,
        };
      }

      // Filter data for the current metric
      const metricData = data.filter((item) => item.metric_type === metric);
      if (!metricData.length) {
        return {
          currentValue: 0,
          previousValue: 0,
          trend: 'flat',
          percentageChange: 0,
        };
      }

      // Sort by date
      const sortedData = [...metricData].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      const currentValue = sortedData[0]?.value || 0;
      const previousValue = sortedData[1]?.value || currentValue;
      const percentageChange = previousValue
        ? ((currentValue - previousValue) / previousValue) * 100
        : 0;

      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (percentageChange > 1) trend = 'up';
      else if (percentageChange < -1) trend = 'down';

      return {
        currentValue,
        previousValue,
        trend,
        percentageChange,
      };
    }, [data, metric]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return theme.palette.success.main;
      case 'down':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon sx={{ color: getTrendColor(trend) }} />;
      case 'down':
        return <TrendingDownIcon sx={{ color: getTrendColor(trend) }} />;
      default:
        return <TrendingFlatIcon sx={{ color: getTrendColor(trend) }} />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="80%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {METRIC_LABELS[metric] || metric}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
          <Typography variant="h4" component="div">
            {METRIC_FORMATS[metric]?.(currentValue) || currentValue.toFixed(2)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            {getTrendIcon(trend)}
            <Typography
              variant="body2"
              sx={{
                color: getTrendColor(trend),
                ml: 0.5,
              }}
            >
              {Math.abs(percentageChange).toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          vs. previous period
        </Typography>
      </CardContent>
    </Card>
  );
};
