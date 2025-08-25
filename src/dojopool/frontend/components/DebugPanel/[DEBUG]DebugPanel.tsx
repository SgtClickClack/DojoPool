import {
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { debounce } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NetworkStatus } from '../../services/[NET]networkStatus';
import { VirtualizedList } from '../VirtualizedList';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  networkLatency: number;
  errors: string[];
  warnings: string[];
}

interface SystemStatus {
  cpu: number;
  memory: number;
  network: 'good' | 'fair' | 'poor';
  lastUpdate: Date;
}

// Memoized helper functions
const getStatusColor = (value: number): 'success' | 'warning' | 'error' => {
  if (value < 70) return 'success';
  if (value < 90) return 'warning';
  return 'error';
};

const formatBytes = (bytes: number): string => {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)}MB`;
};

const DebugPanel: React.FC = () => {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [networkStatus] = useState(() => new NetworkStatus());

  // Memoize API endpoints
  const API_ENDPOINTS = useMemo(
    () => ({
      metrics: '/api/debug/metrics',
      status: '/api/debug/status',
    }),
    []
  );

  // Memoized fetch function with abort controller
  const fetchData = useCallback(
    async (url: string) => {
      const token = await getToken();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        return await response.json();
      } catch (error: unknown) {
        // Handle AbortError and unknown error types safely
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          (error as any).name === 'AbortError'
        ) {
          return null;
        }
        console.error(`Error fetching ${url}:`, error);
        return null;
      }
    },
    [getToken]
  );

  // Debounced refresh function
  const debouncedRefresh = useMemo(
    () =>
      debounce(async () => {
        if (loading) return;
        setLoading(true);

        try {
          const [metricsData, statusData] = await Promise.all([
            fetchData(API_ENDPOINTS.metrics),
            fetchData(API_ENDPOINTS.status),
          ]);

          if (metricsData) setMetrics(metricsData);
          if (statusData) setStatus(statusData);
        } finally {
          setLoading(false);
        }
      }, 300),
    [loading, fetchData, API_ENDPOINTS]
  );

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Auto-refresh effect with cleanup
  useEffect(() => {
    if (!autoRefresh) return;

    debouncedRefresh();
    const intervalId = setInterval(debouncedRefresh, 5000);

    return () => {
      clearInterval(intervalId);
      cleanup();
      debouncedRefresh.cancel();
    };
  }, [autoRefresh, debouncedRefresh, cleanup]);

  // Initial load
  useEffect(() => {
    debouncedRefresh();
    return cleanup;
  }, [debouncedRefresh, cleanup]);

  // Memoized status indicator
  const StatusIndicator = useMemo(() => {
    if (!status) return null;

    const networkQuality = networkStatus.getNetworkQuality();
    const connectionInfo = networkStatus.getConnectionInfo();
    const metrics = networkStatus.getMetrics();
    const latestMetrics = metrics[metrics.length - 1] || {
      latency: 0,
      bandwidth: 0,
      packetLoss: 0,
    };

    return (
      <Box display="flex" alignItems="center" gap={2}>
        <Tooltip title={`CPU: ${status.cpu}%`}>
          <CircularProgress
            variant="determinate"
            value={status.cpu}
            color={getStatusColor(status.cpu)}
            size={24}
          />
        </Tooltip>
        <Tooltip title={`Memory: ${status.memory}%`}>
          <CircularProgress
            variant="determinate"
            value={status.memory}
            color={getStatusColor(status.memory)}
            size={24}
          />
        </Tooltip>
        <Tooltip title={`Network: ${networkQuality} (${connectionInfo.type})`}>
          {networkQuality === 'high' ? (
            <CheckCircleIcon color="success" />
          ) : networkQuality === 'medium' ? (
            <WarningIcon color="warning" />
          ) : (
            <WarningIcon color="error" />
          )}
        </Tooltip>
        <Tooltip
          title={`Latency: ${latestMetrics.latency.toFixed(
            0
          )}ms, Bandwidth: ${latestMetrics.bandwidth.toFixed(1)}Mbps`}
        >
          <Box sx={{ ml: 1, typography: 'body2', color: 'text.secondary' }}>
            {latestMetrics.latency.toFixed(0)}ms
          </Box>
        </Tooltip>
      </Box>
    );
  }, [status, networkStatus]);

  // Memoized metrics table
  const MetricsTable = useMemo(() => {
    if (!metrics) return <CircularProgress size={20} />;

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>Load Time</TableCell>
              <TableCell>{metrics.loadTime.toFixed(2)}ms</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Memory Usage</TableCell>
              <TableCell>{formatBytes(metrics.memoryUsage)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Network Latency</TableCell>
              <TableCell>{metrics.networkLatency.toFixed(2)}ms</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }, [metrics]);

  // Memoized error and warning counts
  const { errorCount, warningCount } = useMemo(
    () => ({
      errorCount: metrics?.errors.length ?? 0,
      warningCount: metrics?.warnings.length ?? 0,
    }),
    [metrics]
  );

  const handleAccordionChange = useCallback(
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  // Add cleanup for NetworkStatus
  useEffect(() => {
    return () => {
      networkStatus.destroy();
    };
  }, [networkStatus]);

  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Debug Panel</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            {StatusIndicator}
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              }
              label="Auto-refresh"
            />
            <IconButton
              onClick={debouncedRefresh}
              disabled={loading}
              aria-label="Refresh data"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>

        <Accordion
          expanded={expanded === 'performance'}
          onChange={handleAccordionChange('performance')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Performance Metrics</Typography>
          </AccordionSummary>
          <AccordionDetails>{MetricsTable}</AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded === 'errors'}
          onChange={handleAccordionChange('errors')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              Errors & Warnings
              {(errorCount > 0 || warningCount > 0) && (
                <Box component="span" ml={1}>
                  <WarningIcon color="error" fontSize="small" />
                </Box>
              )}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {metrics ? (
              <>
                {errorCount > 0 && (
                  <Box mb={2}>
                    <Typography color="error" variant="subtitle2" gutterBottom>
                      Errors ({errorCount})
                    </Typography>
                    <VirtualizedList
                      items={metrics.errors}
                      renderItem={(error) => (
                        <Typography color="error" variant="body2">
                          • {error}
                        </Typography>
                      )}
                      itemHeight={24}
                      maxHeight={200}
                    />
                  </Box>
                )}
                {warningCount > 0 && (
                  <Box>
                    <Typography
                      color="warning"
                      variant="subtitle2"
                      gutterBottom
                    >
                      Warnings ({warningCount})
                    </Typography>
                    <VirtualizedList
                      items={metrics.warnings}
                      renderItem={(warning) => (
                        <Typography color="warning" variant="body2">
                          • {warning}
                        </Typography>
                      )}
                      itemHeight={24}
                      maxHeight={200}
                    />
                  </Box>
                )}
              </>
            ) : (
              <CircularProgress size={20} />
            )}
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
