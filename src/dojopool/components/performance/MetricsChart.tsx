import React from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
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

interface MetricsChartProps {
  data: Array<{
    timestamp: string;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io_rate: number;
  }>;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  timeRange,
  onTimeRangeChange,
}) => {
  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRange: string
  ) => {
    if (newRange !== null) {
      onTimeRangeChange(newRange);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return timeRange === '1h'
      ? date.toLocaleTimeString()
      : date.toLocaleString();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Performance Metrics</Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
        >
          <ToggleButton value="1h">1h</ToggleButton>
          <ToggleButton value="6h">6h</ToggleButton>
          <ToggleButton value="24h">24h</ToggleButton>
          <ToggleButton value="7d">7d</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />
            <YAxis />
            <Tooltip
              labelFormatter={formatTimestamp}
              formatter={(value: number) => [`${value}%`, '']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="cpu_usage"
              name="CPU Usage"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="memory_usage"
              name="Memory Usage"
              stroke="#82ca9d"
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="disk_usage"
              name="Disk Usage"
              stroke="#ffc658"
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="network_io_rate"
              name="Network I/O"
              stroke="#ff7300"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};
