import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { MetricData } from '../../types/monitoring';

interface MetricCardProps {
  title: string;
  metric: MetricData;
  previousMetric?: MetricData;
  unit?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, metric, previousMetric, unit = '' }) => {
  const calculateTrend = () => {
    if (!previousMetric) return null;
    const diff = metric.value - previousMetric.value;
    const percentage = (diff / previousMetric.value) * 100;
    return {
      direction: diff >= 0 ? 'up' : 'down',
      value: Math.abs(percentage).toFixed(1)
    };
  };

  const trend = calculateTrend();

  return (
    <Card sx={{ minWidth: 275, height: '100%' }}>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h4" component="div">
            {metric.value.toFixed(2)}{unit}
          </Typography>
          {trend && (
            <Box display="flex" alignItems="center" sx={{ color: trend.direction === 'up' ? 'success.main' : 'error.main' }}>
              {trend.direction === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
              <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                {trend.value}%
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default MetricCard; 