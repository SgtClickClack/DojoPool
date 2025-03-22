import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
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
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  AppBar,
  Toolbar,
  Divider,
  Snackbar,
  AlertTitle,
  LinearProgress
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FixedSizeList as ListWindow } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

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

interface LargeChunk {
  name: string;
  size: number;
  dependencies: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bundle-optimization-tabpanel-${index}`}
      aria-labelledby={`bundle-optimization-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box 
          sx={{ p: 3 }}
          role="region"
          aria-label={`Bundle optimization content for ${index === 0 ? 'analysis' : index === 1 ? 'large chunks' : 'optimization'}`}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

// Cache for API responses with type safety
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const API_CACHE = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Type-safe utility functions for API caching
function getCachedData<T>(key: string): T | null {
  const cached = API_CACHE.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  API_CACHE.set(key, { data, timestamp: Date.now() });
}

// Enhanced BundleSizeChart with optimized resize handling
const BundleSizeChart = React.memo(({ data, isMobile }: { data: BundleAnalysis, isMobile: boolean }) => {
  const chartData = useMemo(() => {
    return Object.entries(data.dependencies)
      .map(([name, size]) => ({
        name,
        size: size / 1024 // Convert to KB
      }))
      .sort((a, b) => b.size - a.size); // Sort by size descending
  }, [data.dependencies]);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(setTimeout(() => {}, 0));

  const updateDimensions = useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  useEffect(() => {
    clearTimeout(resizeTimeoutRef.current); // Clear initial timeout

    const handleResize = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(updateDimensions, 250);
    };

    window.addEventListener('resize', handleResize);
    updateDimensions(); // Initial dimensions

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeoutRef.current);
    };
  }, [updateDimensions]);

  return (
    <div role="img" aria-label="Bundle size distribution chart">
      <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: isMobile ? 10 : 12 }}
            interval={isMobile ? 1 : 0}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
          />
          <YAxis 
            tick={{ fontSize: isMobile ? 10 : 12 }}
            tickFormatter={(value) => `${value}KB`}
            width={isMobile ? 60 : 80}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(2)}KB`, 'Size']}
            labelFormatter={(label) => `Dependency: ${label}`}
            contentStyle={{ fontSize: isMobile ? '12px' : '14px' }}
          />
          <Legend wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }} />
          <Bar 
            dataKey="size" 
            fill="#8884d8" 
            name="Size (KB)"
            aria-label="Bundle size in kilobytes"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// Enhanced ChunkList with virtualization
const ChunkList = React.memo(({ chunks, threshold, isMobile }: { chunks: LargeChunk[], threshold: number, isMobile: boolean }) => {
  const itemSize = isMobile ? 100 : 72;

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const chunk = chunks[index];
    return (
      <ListItem 
        style={style}
        key={index}
        role="listitem"
        aria-label={`Chunk ${chunk.name} with size ${(chunk.size / 1024).toFixed(2)}KB and ${chunk.dependencies.length} dependencies`}
        sx={{
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 1 : 0,
        }}
      >
        <ListItemText
          primary={chunk.name}
          secondary={`Size: ${(chunk.size / 1024).toFixed(2)} KB, Dependencies: ${chunk.dependencies.length}`}
          primaryTypographyProps={{ variant: isMobile ? 'body2' : 'body1' }}
          secondaryTypographyProps={{ variant: isMobile ? 'caption' : 'body2' }}
        />
        <Chip
          label={`${(chunk.size / 1024).toFixed(0)} KB`}
          color={chunk.size > threshold ? 'error' : 'warning'}
          size={isMobile ? 'small' : 'medium'}
          aria-label={`Chunk size ${(chunk.size / 1024).toFixed(0)}KB ${chunk.size > threshold ? 'exceeds threshold' : 'within threshold'}`}
        />
      </ListItem>
    );
  }, [threshold, isMobile]);

  return (
    <Box sx={{ height: Math.min(chunks.length * itemSize, 400), width: '100%' }}>
      <AutoSizer>
        {({ height, width }) => (
          <ListWindow
            height={height}
            width={width}
            itemCount={chunks.length}
            itemSize={itemSize}
          >
            {Row}
          </ListWindow>
        )}
      </AutoSizer>
    </Box>
  );
});

// Enhanced loading components
const ChartLoadingSkeleton = () => (
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
);

const StatLoadingSkeleton = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
    <Skeleton variant="circular" width={24} height={24} animation="wave" />
    <Skeleton variant="text" width="60%" height={24} animation="wave" />
  </Box>
);

const LoadingSkeleton = () => (
  <Box 
    sx={{ width: '100%', mt: 4 }}
    role="status"
    aria-label="Loading bundle optimization dashboard"
  >
    <Box sx={{ mb: 4 }}>
      <Skeleton variant="text" width="40%" height={40} animation="wave" />
      <Box sx={{ mt: 2 }}>
        <StatLoadingSkeleton />
        <StatLoadingSkeleton />
        <StatLoadingSkeleton />
      </Box>
    </Box>
    <ChartLoadingSkeleton />
    <Grid container spacing={3} sx={{ mt: 2 }}>
      <Grid item xs={12} md={6}>
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Skeleton variant="text" width="30%" height={32} animation="wave" />
          <ChartLoadingSkeleton />
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Skeleton variant="text" width="30%" height={32} animation="wave" />
          <ChartLoadingSkeleton />
        </Box>
      </Grid>
    </Grid>
  </Box>
);

// Error types
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string>;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
};

// Utility function for exponential backoff
const getBackoffDelay = (retryCount: number, { baseDelay, maxDelay }: RetryConfig) => {
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  return delay + Math.random() * 1000; // Add jitter
};

// Error boundary component
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
        <Box p={3}>
          <Alert 
            severity="error"
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => window.location.reload()}
              >
                RELOAD PAGE
              </Button>
            }
          >
            <AlertTitle>Something went wrong</AlertTitle>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Enhanced error display component
const ErrorDisplay = ({ 
  error, 
  onRetry 
}: { 
  error: string | null;
  onRetry: () => void;
}) => {
  if (!error) return null;

  return (
    <Box p={3}>
      <Alert 
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
          >
            RETRY
          </Button>
        }
      >
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    </Box>
  );
};

export default function BundleOptimizationDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [threshold, setThreshold] = useState(100 * 1024);
  const [largeChunks, setLargeChunks] = useState<LargeChunk[]>([]);
  const [optimizationAction, setOptimizationAction] = useState('analyze_bundle');
  const [bundlePath, setBundlePath] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [snackbarMessage, setSnackbarMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const [loadingStates, setLoadingStates] = useState({
    initial: true,
    analysis: false,
    largeChunks: false,
    optimization: false
  });

  const updateLoadingState = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const handleApiError = useCallback((error: unknown): string => {
    if (error instanceof Response) {
      switch (error.status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication required. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return 'An unexpected error occurred.';
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred.';
  }, []);

  const retryOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> => {
    let lastError: unknown;
    
    for (let i = 0; i <= config.maxRetries; i++) {
      try {
        const result = await operation();
        if (i > 0) {
          setSnackbarMessage({
            type: 'success',
            message: 'Operation recovered successfully'
          });
        }
        setRetryCount(0);
        return result;
      } catch (error) {
        lastError = error;
        setRetryCount(i + 1);
        
        if (i < config.maxRetries) {
          const delay = getBackoffDelay(i, config);
          setSnackbarMessage({
            type: 'info',
            message: `Retrying operation (${i + 1}/${config.maxRetries})...`
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }, []);

  const fetchAnalysis = useCallback(async () => {
    try {
      updateLoadingState('analysis', true);
      setError(null);
      
      // Check cache first with type safety
      const cachedAnalysis = getCachedData<BundleAnalysis>('bundleAnalysis');
      if (cachedAnalysis) {
        setAnalysis(cachedAnalysis);
        updateLoadingState('analysis', false);
        updateLoadingState('initial', false);
        return;
      }
      
      const result = await retryOperation(async () => {
        const response = await fetch('/api/optimization/bundle');
        if (!response.ok) {
          throw response;
        }
        return response.json();
      });
      
      // Cache the result with type safety
      setCachedData<BundleAnalysis>('bundleAnalysis', result);
      setAnalysis(result);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      setSnackbarMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      updateLoadingState('analysis', false);
      updateLoadingState('initial', false);
    }
  }, [retryOperation, handleApiError]);

  const fetchLargeChunks = useCallback(async (newThreshold: number) => {
    try {
      updateLoadingState('largeChunks', true);
      
      // Check cache first with type safety
      const cacheKey = `largeChunks-${newThreshold}`;
      const cachedChunks = getCachedData<LargeChunk[]>(cacheKey);
      if (cachedChunks) {
        setLargeChunks(cachedChunks);
        updateLoadingState('largeChunks', false);
        return;
      }
      
      const response = await fetch('/api/optimization/bundle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_large_chunks',
          data: { threshold: newThreshold }
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch large chunks');
      }
      const data = await response.json();
      
      // Cache the result with type safety
      setCachedData<LargeChunk[]>(cacheKey, data);
      setLargeChunks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch large chunks');
    } finally {
      updateLoadingState('largeChunks', false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  // Debounced threshold change handler
  const debouncedThresholdChange = useCallback(
    debounce(async (newThreshold: number) => {
      await fetchLargeChunks(newThreshold);
    }, 500),
    [fetchLargeChunks]
  );

  const handleThresholdChange = useCallback(async (event: Event, newValue: number | number[]) => {
    const newThreshold = typeof newValue === 'number' ? newValue : newValue[0];
    setThreshold(newThreshold);
    debouncedThresholdChange(newThreshold);
  }, [debouncedThresholdChange]);

  const handleAnalyzeBundle = useCallback(async () => {
    try {
      updateLoadingState('optimization', true);
      const response = await fetch('/api/optimization/bundle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze_bundle',
          data: { bundle_path: bundlePath }
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to analyze bundle');
      }
      const data = await response.json();
      setAnalysis(data);
      setSnackbarMessage({
        type: 'success',
        message: 'Bundle analysis completed successfully'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze bundle';
      setError(errorMessage);
      setSnackbarMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      updateLoadingState('optimization', false);
    }
  }, [bundlePath]);

  const handleDrawerToggle = useCallback(() => {
    setMobileOpen(!mobileOpen);
  }, [mobileOpen]);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchAnalysis();
  }, [fetchAnalysis]);

  const drawer = (
    <Box sx={{ width: isMobile ? '100%' : 240 }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Bundle Optimization
        </Typography>
      </Toolbar>
      <Divider />
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        orientation={isMobile ? 'vertical' : 'horizontal'}
        variant={isMobile ? 'fullWidth' : 'standard'}
        sx={{ 
          borderRight: isMobile ? 1 : 0,
          borderColor: 'divider',
          '& .MuiTabs-flexContainer': {
            flexDirection: isMobile ? 'column' : 'row',
          }
        }}
      >
        <Tab 
          label="Bundle Analysis" 
          id="bundle-optimization-tab-0"
          aria-controls="bundle-optimization-tabpanel-0"
        />
        <Tab 
          label="Large Chunks" 
          id="bundle-optimization-tab-1"
          aria-controls="bundle-optimization-tabpanel-1"
        />
        <Tab 
          label="Optimization" 
          id="bundle-optimization-tab-2"
          aria-controls="bundle-optimization-tabpanel-2"
        />
      </Tabs>
    </Box>
  );

  if (loadingStates.initial) {
    return <LoadingSkeleton />;
  }

  return (
    <ErrorBoundary>
      <Container maxWidth="lg">
        {isMobile && (
          <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div">
                Bundle Optimization
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        <Box sx={{ display: 'flex', mt: isMobile ? 8 : 0 }}>
          <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? mobileOpen : true}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: '100%',
                maxWidth: '100%'
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: 240 
              },
            }}
            open
          >
            {drawer}
          </Drawer>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              width: { sm: `calc(100% - 240px)` },
              ml: { sm: '240px' },
            }}
          >
            <Paper 
              sx={{ 
                p: { xs: 1, sm: 2 },
                mb: 2,
                width: '100%'
              }}
            >
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={{ xs: 1, sm: 3 }}>
                  <Grid item xs={12}>
                    <Paper 
                      sx={{ 
                        p: { xs: 1, sm: 2 }
                      }}
                      role="region"
                      aria-label="Bundle overview statistics"
                    >
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        component="h2"
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        Bundle Overview
                      </Typography>
                      {loadingStates.analysis ? (
                        <>
                          <StatLoadingSkeleton />
                          <StatLoadingSkeleton />
                          <StatLoadingSkeleton />
                        </>
                      ) : analysis && (
                        <>
                          <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                            Total Size: {((analysis?.total_size || 0) / (1024 * 1024)).toFixed(2)} MB
                          </Typography>
                          <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                            Number of Chunks: {analysis.chunks.length}
                          </Typography>
                          <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                            Number of Dependencies: {Object.keys(analysis.dependencies).length}
                          </Typography>
                        </>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper 
                      sx={{ 
                        p: { xs: 1, sm: 2 }
                      }}
                      role="region"
                      aria-label="Bundle size distribution visualization"
                    >
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        component="h2"
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        Bundle Size Distribution
                      </Typography>
                      {loadingStates.analysis ? (
                        <ChartLoadingSkeleton />
                      ) : analysis && (
                        <BundleSizeChart data={analysis} isMobile={isMobile} />
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={{ xs: 1, sm: 3 }}>
                  <Grid item xs={12}>
                    <Paper 
                      sx={{ 
                        p: { xs: 1, sm: 2 }
                      }}
                      role="region"
                      aria-label="Large chunks analysis"
                    >
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        component="h2"
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        Large Chunks
                      </Typography>
                      <Typography 
                        gutterBottom
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        Size Threshold: {(threshold / 1024).toFixed(2)} KB
                      </Typography>
                      <Slider
                        value={threshold}
                        onChange={handleThresholdChange}
                        min={0}
                        max={500 * 1024}
                        step={1024}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${(value / 1024).toFixed(2)}KB`}
                        aria-label="Size threshold slider"
                        aria-valuetext={`${(threshold / 1024).toFixed(2)}KB`}
                        sx={{ mb: 3 }}
                      />
                      <ChunkList chunks={largeChunks} threshold={threshold} isMobile={isMobile} />
                      {loadingStates.largeChunks && (
                        <Box sx={{ mt: 2 }}>
                          <LinearProgress />
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={{ xs: 1, sm: 3 }}>
                  <Grid item xs={12}>
                    <Paper 
                      sx={{ 
                        p: { xs: 1, sm: 2 }
                      }}
                      role="region"
                      aria-label="Bundle optimization controls"
                    >
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        component="h2"
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        Bundle Optimization
                      </Typography>
                      <FormControl 
                        fullWidth 
                        sx={{ 
                          mb: 2,
                          '& .MuiInputLabel-root': {
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }
                        }}
                      >
                        <InputLabel id="optimization-action-label">Optimization Action</InputLabel>
                        <Select
                          value={optimizationAction}
                          onChange={(e) => setOptimizationAction(e.target.value)}
                          label="Optimization Action"
                          labelId="optimization-action-label"
                          aria-label="Select optimization action"
                        >
                          <MenuItem value="analyze_bundle">Analyze Bundle</MenuItem>
                          <MenuItem value="optimize_bundle">Optimize Bundle</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        value={bundlePath}
                        onChange={(e) => setBundlePath(e.target.value)}
                        placeholder="Enter bundle path"
                        label="Bundle Path"
                        aria-label="Enter bundle path for analysis"
                        sx={{ 
                          mb: 2,
                          '& .MuiInputLabel-root': {
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAnalyzeBundle}
                        disabled={!bundlePath || loadingStates.optimization}
                        aria-label={loadingStates.optimization ? "Analyzing bundle..." : "Analyze bundle"}
                        fullWidth={isMobile}
                        sx={{ position: 'relative' }}
                      >
                        {loadingStates.optimization ? (
                          <>
                            <CircularProgress 
                              size={24} 
                              sx={{ 
                                position: 'absolute',
                                left: '50%',
                                marginLeft: '-12px'
                              }} 
                            />
                            <Box sx={{ visibility: 'hidden' }}>Analyze Bundle</Box>
                          </>
                        ) : (
                          'Analyze Bundle'
                        )}
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>
            </Paper>
          </Box>
        </Box>

        {error && <ErrorDisplay error={error} onRetry={handleRetry} />}
        
        <Snackbar
          open={!!snackbarMessage}
          autoHideDuration={6000}
          onClose={() => setSnackbarMessage(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbarMessage(null)} 
            severity={snackbarMessage?.type || 'info'}
            sx={{ width: '100%' }}
          >
            {snackbarMessage?.message || ''}
          </Alert>
        </Snackbar>
      </Container>
    </ErrorBoundary>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 