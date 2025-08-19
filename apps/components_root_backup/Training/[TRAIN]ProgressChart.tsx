import React from 'react';
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
import { Box, useTheme } from '@mui/material';

interface Progress {
  program: string;
  exercise: string;
  completion_date: string;
  performance_metrics: Record<string, number>;
  notes: string;
}

interface Props {
  progress: Progress[];
}

export const ProgressChart: React.FC<Props> = ({ progress }) => {
  const theme = useTheme();

  const prepareChartData = () => {
    return progress.map((entry) => ({
      date: new Date(entry.completion_date).toLocaleDateString(),
      accuracy: entry.performance_metrics.accuracy * 100 || 0,
      consistency: entry.performance_metrics.consistency * 100 || 0,
      speed: entry.performance_metrics.speed * 100 || 0,
    }));
  };

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={prepareChartData()}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke={theme.palette.text.secondary}
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            style={{ fontSize: '0.75rem' }}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke={theme.palette.primary.main}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="consistency"
            stroke={theme.palette.secondary.main}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="speed"
            stroke={theme.palette.success.main}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ProgressChart;
