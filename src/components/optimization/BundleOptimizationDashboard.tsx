import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Slider,
  Skeleton,
  useTheme,
  useMediaQuery,
  IconButton,
  Snackbar,
  AlertTitle,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Types
interface BundleAnalysis {
  total_size: number;
  chunks: Array<{
    name: string;
    size: number;
    dependencies: string[];
  }>;
  dependencies: Record<string, number>;
  optimization_suggestions: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ChartData {
  name: string;
  size: number;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {this.state.error?.message || 'Something went wrong'}
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Optimized TabPanel Component
const TabPanel = React.memo(({ children, value, index, ...other }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bundle-optimization-tabpanel-${index}`}
      aria-labelledby={`bundle-optimization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
});

// Optimized Loading Components
const ChartLoadingSkeleton = React.memo(() => (
  <Box 
    sx={{ width: '100%', height: 300 }}
    role="status"
    aria-label="Loading chart"
  >
    <Skeleton 
      variant="rectangular" 
      height="100%" 
      animation="wave"
      sx={{
        borderRadius: 1,
        backgroundColor: (theme) => theme.palette.action.hover
      }}
    />
  </Box>
));

const StatLoadingSkeleton = React.memo(() => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
    <Skeleton variant="circular" width={24} height={24} animation="wave" />
    <Skeleton variant="text" width="60%" height={24} animation="wave" />
  </Box>
));

// Main Component
const BundleOptimizationDashboard: React.FC = () => {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [threshold, setThreshold] = useState(100);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Memoized fetch function with retry logic
  const fetchAnalysis = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await fetch('/api/optimization/bundle');
      if (!response.ok) {
        throw new Error('Failed to fetch bundle analysis');
      }
      const data = await response.json();
      setAnalysis(data);
      setError(null);
    } catch (err) {
      if (retryCount < 3) {
        setTimeout(() => fetchAnalysis(retryCount + 1), 1000 * Math.pow(2, retryCount));
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Memoized handlers
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handleThresholdChange = useCallback((event: Event, newValue: number | number[]) => {
    setThreshold(typeof newValue === 'number' ? newValue : newValue[0]);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchAnalysis();
    setSnackbar({ open: true, message: 'Refreshing bundle analysis...' });
  }, [fetchAnalysis]);

  // Memoized data transformations
  const chartData = useMemo(() => {
    if (!analysis) return [];
    return Object.entries(analysis.dependencies).map(([name, size]) => ({
      name,
      size: size / 1024 // Convert to KB
    }));
  }, [analysis]);

  const largeChunks = useMemo(() => {
    if (!analysis) return [];
    return analysis.chunks
      .filter(chunk => chunk.size > threshold * 1024)
      .sort((a, b) => b.size - a.size);
  }, [analysis, threshold]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress aria-label="Loading bundle analysis" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="lg">
        <Box sx={{ width: '100%', mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Bundle Optimization Dashboard
            </Typography>
            <Tooltip title="Refresh analysis">
              <IconButton onClick={handleRefresh} aria-label="Refresh analysis">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Paper sx={{ width: '100%', mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
              aria-label="Bundle optimization tabs"
            >
              <Tab label="Overview" id="bundle-optimization-tab-0" />
              <Tab label="Large Chunks" id="bundle-optimization-tab-1" />
              <Tab label="Optimization" id="bundle-optimization-tab-2" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Bundle Overview
                    </Typography>
                    <Typography>
                      Total Size: {(analysis?.total_size / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                    <Typography>
                      Number of Chunks: {analysis?.chunks.length}
                    </Typography>
                    <Typography>
                      Number of Dependencies: {Object.keys(analysis?.dependencies || {}).length}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Dependency Size Distribution
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis label={{ value: 'Size (KB)', angle: -90, position: 'insideLeft' }} />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="size" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Large Chunks
                    </Typography>
                    <Typography gutterBottom>
                      Size Threshold: {threshold} KB
                    </Typography>
                    <Slider
                      value={threshold}
                      onChange={handleThresholdChange}
                      min={50}
                      max={500}
                      step={10}
                      valueLabelDisplay="auto"
                      aria-label="Size threshold slider"
                    />
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      <List>
                        {largeChunks.map((chunk, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={chunk.name}
                              secondary={`Size: ${(chunk.size / 1024).toFixed(2)} KB, Dependencies: ${chunk.dependencies.length}`}
                            />
                            <Chip
                              label={`${(chunk.size / 1024).toFixed(0)} KB`}
                              color={chunk.size > threshold * 1024 ? 'error' : 'warning'}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Optimization Suggestions
                    </Typography>
                    <List>
                      {analysis?.optimization_suggestions.map((suggestion, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={suggestion} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Container>
    </ErrorBoundary>
  );
};

export default BundleOptimizationDashboard;
