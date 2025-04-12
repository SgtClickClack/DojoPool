import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Button,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  LinearProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
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
  Line
} from 'recharts';
import { format, parseISO } from 'date-fns';
import VenueAnalyticsVisualizations from './components/VenueAnalyticsVisualizations';
import { AnalyticsExportService } from './services/exportService';

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

const VenueAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [data, setData] = useState<VenueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });
  const [selectedVenue, setSelectedVenue] = useState<number>(1);
  const [showFilters, setShowFilters] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedVenue, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/venues/${selectedVenue}/analytics?start_date=${format(dateRange.startDate, 'yyyy-MM-dd')}&end_date=${format(dateRange.endDate, 'yyyy-MM-dd')}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  const handleExport = async () => {
    if (!data) return;

    try {
      const content = await AnalyticsExportService.exportData(data, exportFormat);
      const filename = `venue-analytics-${format(dateRange.startDate, 'yyyy-MM-dd')}-to-${format(dateRange.endDate, 'yyyy-MM-dd')}`;
      AnalyticsExportService.downloadFile(content, exportFormat, filename);
      setExportDialogOpen(false);
    } catch (error) {
      setError('Failed to export data. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">Venue Analytics</Typography>
            <Box>
              <Tooltip title="Filter Analytics">
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  aria-label="Filter analytics data"
                  color={showFilters ? 'primary' : 'default'}
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Data">
                <IconButton
                  onClick={() => setExportDialogOpen(true)}
                  aria-label="Export analytics data"
                  color="primary"
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh Analytics">
                <IconButton
                  onClick={handleRefresh}
                  aria-label="Refresh analytics data"
                  color="primary"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grid>

        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" color="primary">
                ${data.totalRevenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Games
              </Typography>
              <Typography variant="h4" color="primary">
                {data.totalGames.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Occupancy
              </Typography>
              <Typography variant="h4" color="primary">
                {data.averageOccupancy.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Maintenance Events
              </Typography>
              <Typography variant="h4" color="primary">
                {data.maintenanceStats.totalMaintenance}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12}>
          <VenueAnalyticsVisualizations
            data={data}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </Grid>

        {/* Table Utilization */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Table Utilization Details
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Table ID</TableCell>
                    <TableCell>Utilization Rate</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.tableUtilization.map((table) => (
                    <TableRow key={table.tableId}>
                      <TableCell>{table.tableId}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={table.utilization}
                              color={table.utilization > 80 ? 'success' : table.utilization > 50 ? 'warning' : 'error'}
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {`${Math.round(table.utilization)}%`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={table.utilization > 80 ? 'High' : table.utilization > 50 ? 'Medium' : 'Low'}
                          color={table.utilization > 80 ? 'success' : table.utilization > 50 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
        <DialogTitle>Export Analytics Data</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'pdf')}
              label="Format"
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} variant="contained" color="primary">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VenueAnalyticsDashboard; 