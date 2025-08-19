import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Box, Heading } from '@chakra-ui/react';

interface PieData {
  name: string;
  value: number;
}

interface BallDistributionPieChartProps {
  data: PieData[];
  colors: string[];
  title?: string;
}

const BallDistributionPieChart: React.FC<BallDistributionPieChartProps> = ({
  data,
  colors,
  title,
}) => (
  <Box p={4} bg="white" borderRadius="md" boxShadow="md">
    {title && (
      <Heading as="h3" size="md" mb={4}>
        {title}
      </Heading>
    )}
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </Box>
);

export default BallDistributionPieChart;
