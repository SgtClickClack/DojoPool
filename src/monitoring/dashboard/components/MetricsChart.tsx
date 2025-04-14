import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@mui/material/styles';

interface MetricDataPoint {
  timestamp: number;
  value: number;
  warning?: number;
  critical?: number;
}

interface MetricsChartProps {
  data: MetricDataPoint[];
  yAxisLabel: string;
  height: number;
  reverseThreshold?: boolean;
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

export const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  yAxisLabel,
  height,
  reverseThreshold = false
}) => {
  const theme = useTheme();

  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
  const latestDataPoint = sortedData[sortedData.length - 1];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={sortedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTimestamp}
          interval="preserveStartEnd"
        />
        <YAxis
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          labelFormatter={formatTimestamp}
          formatter={(value: number) => [value.toFixed(2), yAxisLabel]}
        />
        {latestDataPoint?.warning && (
          <ReferenceLine
            y={latestDataPoint.warning}
            stroke={theme.palette.warning.main}
            strokeDasharray="3 3"
            label={{
              value: 'Warning',
              position: 'right',
              fill: theme.palette.warning.main
            }}
          />
        )}
        {latestDataPoint?.critical && (
          <ReferenceLine
            y={latestDataPoint.critical}
            stroke={theme.palette.error.main}
            strokeDasharray="3 3"
            label={{
              value: 'Critical',
              position: 'right',
              fill: theme.palette.error.main
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={theme.palette.primary.main}
          dot={false}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};