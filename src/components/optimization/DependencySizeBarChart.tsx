import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Box, Typography, Paper } from "@mui/material";

interface ChartData {
  name: string;
  size: number;
}

interface DependencySizeBarChartProps {
  chartData: ChartData[];
}

const DependencySizeBarChart: React.FC<DependencySizeBarChartProps> = ({ chartData }) => (
  <Paper sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Dependency Size Distribution
    </Typography>
    <Box sx={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            label={{
              value: "Size (KB)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <RechartsTooltip />
          <Legend />
          <Bar dataKey="size" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  </Paper>
);

export default DependencySizeBarChart; 