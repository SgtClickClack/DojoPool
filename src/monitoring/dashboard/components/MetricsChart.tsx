import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '@mui/material/styles';

interface MetricDataPoint {
  timestamp: number;
  value?: number;
  [key: string]: number | undefined;
}

interface SeriesSpec {
  key: string;
  name: string;
}

interface MetricsChartProps {
  data: MetricDataPoint[];
  yAxisLabel: string;
  height?: number;
  reverseThreshold?: boolean;
  series?: SeriesSpec[];
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

export const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  yAxisLabel,
  height = 240,
  reverseThreshold = false,
  series = [{ key: 'value', name: 'Value' }],
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
        <Legend />
        {series.map((s, idx) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={
              idx === 0
                ? theme.palette.primary.main
                : theme.palette.secondary.main
            }
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
