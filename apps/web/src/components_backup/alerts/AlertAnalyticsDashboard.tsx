import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
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
} from '@mui/material';
import {
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
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
} from 'recharts';
import { AlertType, AlertStatus } from '../../types/alert';
import { useWebSocket } from '../../hooks/useWebSocket';
import { formatDistanceToNow } from 'date-fns';

interface AlertAnalyticsData {
  totalAlerts: number;
  alertsByType: {
    [AlertType.ERROR]: number;
    [AlertType.WARNING]: number;
    [AlertType.SUCCESS]: number;
    [AlertType.INFO]: number;
  };
  alertsByStatus: {
    [AlertStatus.OPEN]: number;
    [AlertStatus.ACKNOWLEDGED]: number;
    [AlertStatus.DISMISSED]: number;
  };
}

interface MetricCardProps {
  title: string;
  value: number;
  total: number;
  color: string;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface FilterState {
  types: AlertType[];
  statuses: AlertStatus[];
  dateRange: [Date, Date];
  minSeverity: number;
  showTrends: boolean;
  viewMode: 'chart' | 'table' | 'both';
}

const initialFilterState: FilterState = {
  types: [],
  statuses: [],
  dateRange: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()],
  minSeverity: 0,
  showTrends: true,
  viewMode: 'chart',
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  total,
  color,
}) => {
  const percentage = ((value / total) * 100).toFixed(1);

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: color,
        borderRadius: 1,
        textAlign: 'center',
      }}
      role="status"
      aria-label={`${title} alerts: ${value} out of ${total} (${percentage}%)`}
    >
      <Typography variant="h4">{value}</Typography>
      <Typography variant="body2">{title}</Typography>
      <Typography variant="caption">{percentage}%</Typography>
    </Box>
  );
};

interface AlertAnalyticsHook {
  analytics: AlertAnalyticsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
  isConnected: boolean;
}

const POLLING_INTERVAL = 30000; // 30 seconds
const WEBSOCKET_RECONNECT_DELAY = 5000; // 5 seconds

const useAlertAnalytics = (): AlertAnalyticsHook => {
  const [analytics, setAnalytics] = useState<AlertAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const { connect, disconnect, subscribe } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'wss://api.dojopool.com/ws/alerts',
    onError: (err) => {
      console.error('WebSocket error:', err);
      setError('Connection lost. Attempting to reconnect...');
      setIsPolling(true);
    },
    onClose: () => {
      console.log('WebSocket closed');
      setIsPolling(true);
    },
    onOpen: () => {
      console.log('WebSocket connected');
      setError(null);
      setIsPolling(false);
      setIsConnected(true);
    },
  });

  useEffect(() => {
    const unsubscribe = subscribe(
      'analytics_update',
      (data: AlertAnalyticsData) => {
        setAnalytics(data);
        setLastUpdated(new Date());
      }
    );
    return () => unsubscribe();
  }, [subscribe]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/alerts/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalytics({
        totalAlerts: data.totalAlerts,
        alertsByType: {
          [AlertType.ERROR]: data.alertsByType[AlertType.ERROR] || 0,
          [AlertType.WARNING]: data.alertsByType[AlertType.WARNING] || 0,
          [AlertType.SUCCESS]: data.alertsByType[AlertType.SUCCESS] || 0,
          [AlertType.INFO]: data.alertsByType[AlertType.INFO] || 0,
        },
        alertsByStatus: {
          [AlertStatus.OPEN]: data.alertsByStatus[AlertStatus.OPEN] || 0,
          [AlertStatus.ACKNOWLEDGED]:
            data.alertsByStatus[AlertStatus.ACKNOWLEDGED] || 0,
          [AlertStatus.DISMISSED]:
            data.alertsByStatus[AlertStatus.DISMISSED] || 0,
        },
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and WebSocket connection
  useEffect(() => {
    fetchAnalytics();
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect, fetchAnalytics]);

  // Polling fallback when WebSocket is disconnected
  useInterval(() => {
    if (isPolling) {
      fetchAnalytics();
    }
  }, POLLING_INTERVAL);

  return {
    analytics,
    loading,
    error,
    refresh: fetchAnalytics,
    lastUpdated,
    isConnected,
  };
};

// Custom hook for polling
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

interface TrendData {
  date: string;
  total: number;
  types: Record<AlertType, number>;
  statuses: Record<AlertStatus, number>;
}

const AlertTable: React.FC<{ data: AlertAnalyticsData }> = ({ data }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] =
    useState<keyof Pick<ChartData, 'name' | 'value'>>('value');

  const handleRequestSort = (
    property: keyof Pick<ChartData, 'name' | 'value'>
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = useMemo(() => {
    return [
      ...Object.entries(data.alertsByType).map(([name, value]) => ({
        name,
        value,
      })),
    ].sort((a, b) => {
      const isAsc = order === 'asc';
      if (a[orderBy] === undefined && b[orderBy] === undefined) return 0;
      if (a[orderBy] === undefined) return isAsc ? 1 : -1;
      if (b[orderBy] === undefined) return isAsc ? -1 : 1;
      return isAsc
        ? a[orderBy] < b[orderBy]
          ? -1
          : 1
        : b[orderBy] < a[orderBy]
          ? -1
          : 1;
    });
  }, [data, order, orderBy]);

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'name'}
                  direction={orderBy === 'name' ? order : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Alert Type
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'value'}
                  direction={orderBy === 'value' ? order : 'asc'}
                  onClick={() => handleRequestSort('value')}
                >
                  Count
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Percentage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{row.value}</TableCell>
                  <TableCell align="right">
                    {((row.value / data.totalAlerts) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={sortedData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
};

const getAlertColor = (type: AlertType): string => {
  switch (type) {
    case AlertType.ERROR:
      return 'error.main';
    case AlertType.WARNING:
      return 'warning.main';
    case AlertType.SUCCESS:
      return 'success.main';
    case AlertType.INFO:
      return 'info.main';
    default:
      return 'text.primary';
  }
};

const ChartErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">
          Failed to load chart. Please try refreshing the page.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export const AlertAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { analytics, loading, error, refresh, lastUpdated, isConnected } =
    useAlertAnalytics();
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [showFilters, setShowFilters] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>(
    'csv'
  );

  const typeData = useMemo<ChartData[]>(() => {
    if (!analytics) return [];
    return Object.entries(analytics.alertsByType).map(([type, count]) => ({
      name: type,
      value: count,
      color: getAlertColor(type as AlertType),
    }));
  }, [analytics]);

  const statusData = useMemo<ChartData[]>(() => {
    if (!analytics) return [];
    return Object.entries(analytics.alertsByStatus).map(([name, value]) => ({
      name,
      value,
    }));
  }, [analytics]);

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: any) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleExport = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: exportFormat,
          filters,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alert-analytics-${new Date().toISOString()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      // Handle error
    }
  }, [exportFormat, filters]);

  const filteredData = useMemo(() => {
    if (!analytics) return null;
    // Apply filters to analytics data
    return {
      totalAlerts: analytics.totalAlerts,
      alertsByType: {
        [AlertType.ERROR]:
          filters.types.length === 0 || filters.types.includes(AlertType.ERROR)
            ? analytics.alertsByType[AlertType.ERROR]
            : 0,
        [AlertType.WARNING]:
          filters.types.length === 0 ||
          filters.types.includes(AlertType.WARNING)
            ? analytics.alertsByType[AlertType.WARNING]
            : 0,
        [AlertType.SUCCESS]:
          filters.types.length === 0 ||
          filters.types.includes(AlertType.SUCCESS)
            ? analytics.alertsByType[AlertType.SUCCESS]
            : 0,
        [AlertType.INFO]:
          filters.types.length === 0 || filters.types.includes(AlertType.INFO)
            ? analytics.alertsByType[AlertType.INFO]
            : 0,
      },
      alertsByStatus: {
        [AlertStatus.OPEN]:
          filters.statuses.length === 0 ||
          filters.statuses.includes(AlertStatus.OPEN)
            ? analytics.alertsByStatus[AlertStatus.OPEN]
            : 0,
        [AlertStatus.ACKNOWLEDGED]:
          filters.statuses.length === 0 ||
          filters.statuses.includes(AlertStatus.ACKNOWLEDGED)
            ? analytics.alertsByStatus[AlertStatus.ACKNOWLEDGED]
            : 0,
        [AlertStatus.DISMISSED]:
          filters.statuses.length === 0 ||
          filters.statuses.includes(AlertStatus.DISMISSED)
            ? analytics.alertsByStatus[AlertStatus.DISMISSED]
            : 0,
      },
    };
  }, [analytics, filters]);

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        role="region"
        aria-label="Alert Analytics Dashboard"
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2,
          }}
          role="status"
          aria-label="Loading alert analytics"
        >
          <CircularProgress
            size={60}
            thickness={4}
            aria-label="Loading spinner"
          />
          <Typography variant="h6" color="text.secondary">
            Loading Alert Analytics...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        maxWidth="lg"
        role="region"
        aria-label="Alert Analytics Dashboard"
      >
        <Alert
          severity="error"
          role="alert"
          aria-label="Error loading alert analytics"
          sx={{
            mt: 4,
            '& .MuiAlert-message': {
              width: '100%',
            },
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              aria-label="Retry loading analytics"
            >
              Retry
            </Button>
          }
        >
          <AlertTitle>Error Loading Analytics</AlertTitle>
          <Typography variant="body1">{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please try refreshing the page or contact support if the issue
            persists.
          </Typography>
        </Alert>
      </Container>
    );
  }

  if (!analytics) {
    return (
      <Container
        maxWidth="lg"
        role="region"
        aria-label="Alert Analytics Dashboard"
      >
        <Alert
          severity="info"
          role="alert"
          aria-label="No analytics data available"
          sx={{ mt: 4 }}
        >
          <AlertTitle>No Data Available</AlertTitle>
          <Typography variant="body1">
            There are no alert analytics available at this time.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      role="region"
      aria-label="Alert Analytics Dashboard"
    >
      <Box sx={{ my: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" id="alert-analytics-title">
              Alert Analytics
            </Typography>
            {lastUpdated && (
              <Typography
                variant="caption"
                color="text.secondary"
                aria-label="Last updated time"
              >
                Last updated{' '}
                {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <Tooltip title={isConnected ? 'Connected' : 'Disconnected'}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: isConnected ? 'success.main' : 'error.main',
                  ml: 1,
                }}
                aria-label={
                  isConnected ? 'WebSocket connected' : 'WebSocket disconnected'
                }
              />
            </Tooltip>
          </Box>
        </Box>

        {showFilters && (
          <Paper sx={{ p: 2, mb: 3 }} elevation={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Alert Types</InputLabel>
                  <Select
                    multiple
                    value={filters.types}
                    onChange={(e) =>
                      handleFilterChange('types', e.target.value)
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {Object.values(AlertType).map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    multiple
                    value={filters.statuses}
                    onChange={(e) =>
                      handleFilterChange('statuses', e.target.value)
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {Object.values(AlertStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>View Mode</InputLabel>
                  <Select
                    value={filters.viewMode}
                    onChange={(e) =>
                      handleFilterChange('viewMode', e.target.value)
                    }
                  >
                    <MenuItem value="chart">Charts Only</MenuItem>
                    <MenuItem value="table">Table Only</MenuItem>
                    <MenuItem value="both">Both</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.showTrends}
                      onChange={(e) =>
                        handleFilterChange('showTrends', e.target.checked)
                      }
                    />
                  }
                  label="Show Trends"
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{ p: 2 }}
              role="region"
              aria-label="Alert Types Distribution"
            >
              <Typography variant="h6" gutterBottom>
                Alert Types
              </Typography>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      aria-label="Alert types distribution"
                    >
                      {typeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => [
                        `${value} alerts`,
                        'Count',
                      ]}
                      labelFormatter={(label: string) => `Type: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{ p: 2 }}
              role="region"
              aria-label="Alert Status Distribution"
            >
              <Typography variant="h6" gutterBottom>
                Alert Status
              </Typography>
              <ChartErrorBoundary>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={statusData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    aria-label="Alert status distribution"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" aria-label="Status" />
                    <YAxis aria-label="Number of alerts" />
                    <RechartsTooltip
                      formatter={(value: number) => [
                        `${value} alerts`,
                        'Count',
                      ]}
                      labelFormatter={(label: string) => `Status: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      fill="#8884d8"
                      name="Number of alerts"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartErrorBoundary>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{ p: 2 }}
              role="region"
              aria-label="Alert Summary"
            >
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'primary.light',
                      borderRadius: 1,
                      textAlign: 'center',
                    }}
                    role="status"
                    aria-label="Total alerts"
                  >
                    <Typography variant="h4">
                      {analytics.totalAlerts}
                    </Typography>
                    <Typography variant="body2">Total Alerts</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'warning.light',
                      borderRadius: 1,
                      textAlign: 'center',
                    }}
                    role="status"
                    aria-label="Open alerts"
                  >
                    <Typography variant="h4">
                      {analytics.alertsByStatus['open']}
                    </Typography>
                    <Typography variant="body2">Open</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'info.light',
                      borderRadius: 1,
                      textAlign: 'center',
                    }}
                    role="status"
                    aria-label="Acknowledged alerts"
                  >
                    <Typography variant="h4">
                      {analytics.alertsByStatus['acknowledged']}
                    </Typography>
                    <Typography variant="body2">Acknowledged</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'success.light',
                      borderRadius: 1,
                      textAlign: 'center',
                    }}
                    role="status"
                    aria-label="Dismissed alerts"
                  >
                    <Typography variant="h4">
                      {analytics.alertsByStatus['dismissed']}
                    </Typography>
                    <Typography variant="body2">Dismissed</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {(filters.viewMode === 'table' || filters.viewMode === 'both') && (
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Alert Data Table
                </Typography>
                <AlertTable data={filteredData || analytics} />
              </Paper>
            </Grid>
          )}
        </Grid>

        <Dialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          aria-labelledby="export-dialog-title"
        >
          <DialogTitle id="export-dialog-title">
            Export Analytics Data
          </DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as 'csv' | 'json' | 'pdf')
                }
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
    </Container>
  );
};
