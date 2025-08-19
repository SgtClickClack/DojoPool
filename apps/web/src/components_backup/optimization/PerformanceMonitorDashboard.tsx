import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip as MuiTooltip,
  Button,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  type ListChildComponentProps,
  FixedSizeList as VirtualizedList,
} from 'react-window';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  warning: number;
  timestamp: string;
}

interface PerformanceRegression {
  timestamp: string;
  metric: string;
  currentValue: number;
  baselineValue: number;
  percentChange: number;
  severity: 'error' | 'warning';
  threshold: number;
}

interface PerformanceHistory {
  metrics: PerformanceMetric[];
  regressions: PerformanceRegression[];
  violations: Array<{
    metric: string;
    value: number;
    threshold: number;
    overage: number;
  }>;
  warnings: Array<{
    metric: string;
    value: number;
    warning: number;
    overage: number;
  }>;
}

// Cache for performance data
const CACHE_DURATION = 60000; // 1 minute
let cachedData: { data: PerformanceHistory; timestamp: number } | null = null;

// Memoized MetricCard component
const MetricCard = React.memo<{
  metric: PerformanceMetric;
  showTrend?: boolean;
}>(({ metric, showTrend }) => {
  const theme = useTheme();

  const status = useMemo(
    () =>
      metric.value > metric.threshold
        ? 'error'
        : metric.value > metric.warning
          ? 'warning'
          : 'success',
    [metric.value, metric.threshold, metric.warning]
  );

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="h6" component="div">
            {metric.name}
          </Typography>
          <Chip
            label={`${metric.value.toFixed(2)}ms`}
            color={status}
            size="small"
          />
        </Box>
        <Typography color="text.secondary" gutterBottom>
          Threshold: {metric.threshold}ms
        </Typography>
        {showTrend && (
          <Box sx={{ mt: 2, height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[metric]}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={theme.palette[status].main}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

// Error Fallback Component
const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => (
  <Alert severity="error">
    <AlertTitle>Something went wrong</AlertTitle>
    {error.message}
    <Button onClick={resetErrorBoundary}>Try again</Button>
  </Alert>
);

// Virtualized List Item
const VirtualizedListItem: React.FC<
  ListChildComponentProps<PerformanceRegression[]>
> = ({ index, style, data }) => {
  const regression = data[index];
  return (
    <ListItem style={style}>
      <ListItemText
        primary={regression.metric}
        secondary={`${regression.percentChange}% change (${regression.baselineValue}ms → ${regression.currentValue}ms)`}
      />
      {regression.severity === 'error' ? (
        <ErrorOutlineIcon color="error" />
      ) : (
        <WarningIcon color="warning" />
      )}
    </ListItem>
  );
};

VirtualizedListItem.displayName = 'VirtualizedListItem';

const PerformanceMonitorDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerformanceHistory | null>(null);

  const fetchData = useCallback(async (force = false) => {
    try {
      // Check cache first
      if (
        !force &&
        cachedData &&
        Date.now() - cachedData.timestamp < CACHE_DURATION
      ) {
        setData(cachedData.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const response = await fetch('/api/performance/history');
      if (!response.ok) throw new Error('Failed to fetch performance data');
      const result = await response.json();

      // Update cache
      cachedData = {
        data: result,
        timestamp: Date.now(),
      };

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      fetchData(true);
    },
    [fetchData]
  );

  const memoizedMetrics = useMemo(
    () =>
      data?.metrics.map((metric) => (
        <Grid item xs={12} sm={6} md={4} key={metric.name}>
          <MetricCard metric={metric} showTrend />
        </Grid>
      )),
    [data?.metrics]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => fetchData(true)}
    >
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h4" component="h1">
              Performance Monitor
            </Typography>
            <MuiTooltip title="Refresh data">
              <IconButton onClick={handleRefresh} size="large">
                <RefreshIcon />
              </IconButton>
            </MuiTooltip>
          </Box>

          <Grid container spacing={3}>
            {/* Current Status */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Current Status
                </Typography>
                <Grid container spacing={2}>
                  <Suspense fallback={<CircularProgress />}>
                    {memoizedMetrics}
                  </Suspense>
                </Grid>
              </Paper>
            </Grid>

            {/* Regressions */}
            {data?.regressions && data.regressions.length > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance Regressions
                  </Typography>
                  <VirtualizedList
                    height={300}
                    width="100%"
                    itemCount={data.regressions.length}
                    itemSize={50}
                    itemData={data.regressions}
                  >
                    {VirtualizedListItem}
                  </VirtualizedList>
                </Paper>
              </Grid>
            )}

            {/* Budget Violations */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Budget Violations
                </Typography>
                {data.violations.length === 0 && data.warnings.length === 0 ? (
                  <Alert severity="success">All metrics within budget</Alert>
                ) : (
                  <List>
                    {data.violations.map((violation, index) => (
                      <ListItem key={`violation-${index}`}>
                        <ListItemText
                          primary={violation.metric}
                          secondary={`${violation.value.toFixed(2)}ms (${violation.overage.toFixed(2)}ms over budget)`}
                        />
                        <ErrorOutlineIcon color="error" />
                      </ListItem>
                    ))}
                    {data.warnings.map((warning, index) => (
                      <ListItem key={`warning-${index}`}>
                        <ListItemText
                          primary={warning.metric}
                          secondary={`${warning.value.toFixed(2)}ms (${warning.overage.toFixed(2)}ms over warning)`}
                        />
                        <WarningIcon color="warning" />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Trends */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
                </Typography>
                <Box sx={{ height: isMobile ? 300 : 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      {data.metrics.map((metric) => (
                        <Line
                          key={metric.name}
                          type="monotone"
                          dataKey="value"
                          name={metric.name}
                          stroke={theme.palette.primary.main}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </ErrorBoundary>
  );
};

export default PerformanceMonitorDashboard;
