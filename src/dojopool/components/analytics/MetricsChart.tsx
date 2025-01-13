import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import { formatDate, parseDate } from '../../utils/dateUtils';

interface MetricsChartProps {
  data: any[];
  metrics: string[];
  period: string;
}

const COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#F44336', // Red
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
];

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

export const MetricsChart: React.FC<MetricsChartProps> = ({ data, metrics, period }) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    // Group data by date
    const groupedData = data.reduce((acc: { [key: string]: any }, item) => {
      const date = formatDate(parseDate(item.date));
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][item.metric_type] = item.value;
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.values(groupedData).sort((a: any, b: any) => {
      return parseDate(a.date).getTime() - parseDate(b.date).getTime();
    });
  }, [data]);

  const formatXAxis = (value: string) => {
    const date = parseDate(value);
    switch (period) {
      case 'hourly':
        return date.toLocaleTimeString([], { hour: '2-digit' });
      case 'daily':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case 'weekly':
        return `Week ${date.getWeek()}`;
      case 'monthly':
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return value;
    }
  };

  const formatTooltip = (value: number, name: string) => {
    return [value.toFixed(2), METRIC_LABELS[name] || name];
  };

  if (!data.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No data available for the selected period
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fill: theme.palette.text.secondary }}
          />
          <YAxis tick={{ fill: theme.palette.text.secondary }} />
          <Tooltip
            formatter={formatTooltip}
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
          <Legend />
          {metrics.map((metric, index) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              name={METRIC_LABELS[metric] || metric}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};
