import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
  Tooltip,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart,
} from 'recharts';
import {
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';

interface VenueAnalyticsData {
  totalRevenue: number;
  totalGames: number;
  averageOccupancy: number;
  peakHours: {
    [hour: string]: number;
  };
  revenueByDay: Array<{
    date: string;
    revenue: number;
  }>;
  gamesByDay: Array<{
    date: string;
    count: number;
  }>;
  tableUtilization: Array<{
    tableId: number;
    utilization: number;
  }>;
  maintenanceStats: {
    totalMaintenance: number;
    averageDuration: number;
    maintenanceByReason: {
      [reason: string]: number;
    };
  };
}

interface VenueAnalyticsVisualizationsProps {
  data: VenueAnalyticsData;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  onDateRangeChange: (range: { startDate: Date; endDate: Date }) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const VenueAnalyticsVisualizations: React.FC<VenueAnalyticsVisualizationsProps> = ({
  data,
  dateRange,
  onDateRangeChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [viewMode, setViewMode] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showTrendLines, setShowTrendLines] = React.useState(true);

  const RevenueTrendChart = () => (
    <Paper sx={{ p: 2, height: 400 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Revenue Trend</Typography>
        <Box>
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel>View</InputLabel>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'daily' | 'weekly' | 'monthly')}
              label="View"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={showTrendLines}
                onChange={(e) => setShowTrendLines(e.target.checked)}
              />
            }
            label="Trend Lines"
          />
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data.revenueByDay}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            fill="#8884d8"
            stroke="#8884d8"
            fillOpacity={0.3}
          />
          {showTrendLines && (
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#ff7300"
              dot={false}
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );

  const PeakHoursChart = () => (
    <Paper sx={{ p: 2, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Peak Hours Analysis
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={Object.entries(data.peakHours).map(([hour, rate]) => ({ hour, rate }))}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          <Bar dataKey="rate" fill="#82ca9d" name="Occupancy Rate">
            {Object.entries(data.peakHours).map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry[1] > 80 ? '#ff7300' : entry[1] > 50 ? '#82ca9d' : '#8884d8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );

  const TableUtilizationChart = () => (
    <Paper sx={{ p: 2, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Table Utilization
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="tableId" name="Table ID" />
          <YAxis type="number" dataKey="utilization" name="Utilization %" />
          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter name="Table Utilization" data={data.tableUtilization} fill="#8884d8">
            {data.tableUtilization.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.utilization > 80 ? '#ff7300' : entry.utilization > 50 ? '#82ca9d' : '#8884d8'}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </Paper>
  );

  const MaintenancePieChart = () => (
    <Paper sx={{ p: 2, height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Maintenance Distribution
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={Object.entries(data.maintenanceStats.maintenanceByReason).map(([reason, count]) => ({
              name: reason,
              value: count,
            }))}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {Object.entries(data.maintenanceStats.maintenanceByReason).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <RechartsTooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <RevenueTrendChart />
      </Grid>
      <Grid item xs={12} md={4}>
        <PeakHoursChart />
      </Grid>
      <Grid item xs={12} md={6}>
        <TableUtilizationChart />
      </Grid>
      <Grid item xs={12} md={6}>
        <MaintenancePieChart />
      </Grid>
    </Grid>
  );
};

export default VenueAnalyticsVisualizations; 