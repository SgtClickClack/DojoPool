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
  Tooltip,
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
  ResponsiveContainer,
} from 'recharts';
import ErrorBoundary from '../common/ErrorBoundary';
import TabPanel from '../common/TabPanel';
import {
  ChartLoadingSkeleton,
  StatLoadingSkeleton,
} from '../common/LoadingSkeletons';
import DependencySizeBarChart from './DependencySizeBarChart';
import LargeChunksList from './LargeChunksList';
import OptimizationSuggestionsList from './OptimizationSuggestionsList';
import { logError } from '../../services/ErrorLoggingService';

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

// Main Component
const BundleOptimizationDashboard: React.FC = () => {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [threshold, setThreshold] = useState(100);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
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
        setTimeout(
          () => fetchAnalysis(retryCount + 1),
          1000 * Math.pow(2, retryCount)
        );
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch analysis'
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Memoized handlers
  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    },
    []
  );

  const handleThresholdChange = useCallback(
    (event: Event, newValue: number | number[]) => {
      setThreshold(typeof newValue === 'number' ? newValue : newValue[0]);
    },
    []
  );

  const handleRefresh = useCallback(() => {
    fetchAnalysis();
    setSnackbar({ open: true, message: 'Refreshing bundle analysis...' });
  }, [fetchAnalysis]);

  // Memoized data transformations
  const chartData = useMemo(() => {
    if (!analysis || !analysis.dependencies) return [];
    return Object.entries(analysis.dependencies).map(([name, size]) => ({
      name,
      size: size / 1024, // Convert to KB
    }));
  }, [analysis]);

  const largeChunks = useMemo(() => {
    if (!analysis || !analysis.chunks) return [];
    return analysis.chunks
      .filter((chunk) => chunk.size > threshold * 1024)
      .sort((a, b) => b.size - a.size);
  }, [analysis, threshold]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
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
                      Total Size:{' '}
                      {typeof analysis?.total_size === 'number'
                        ? (analysis.total_size / (1024 * 1024)).toFixed(2)
                        : 'N/A'}{' '}
                      MB
                    </Typography>
                    <Typography>
                      Number of Chunks:{' '}
                      {Array.isArray(analysis?.chunks)
                        ? analysis.chunks.length
                        : 'N/A'}
                    </Typography>
                    <Typography>
                      Number of Dependencies:{' '}
                      {Object.keys(analysis?.dependencies || {}).length}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <DependencySizeBarChart chartData={chartData} />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <LargeChunksList
                    largeChunks={largeChunks}
                    threshold={threshold}
                    onThresholdChange={handleThresholdChange}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <OptimizationSuggestionsList
                    suggestions={analysis?.optimization_suggestions || []}
                  />
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
