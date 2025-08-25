import { Download, Refresh, Speed } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Slider,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface CostReport {
  optimization: {
    optimized: boolean;
    costs: {
      total_cost: number;
      bandwidth_cost: number;
      request_cost: number;
    };
    savings: number;
    optimization_time: number;
    timestamp: string;
  };
  usage: {
    hourly_usage: Array<{ hour: number; value: number }>;
    daily_usage: Record<string, number>;
    weekly_usage: Record<string, number>;
  };
  projections: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  };
  timestamp: string;
}

const CdnCostDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costReport, setCostReport] = useState<CostReport | null>(null);
  const [optimizationStatus, setOptimizationStatus] = useState<string>('');
  const [costThreshold, setCostThreshold] = useState(10);
  const [bandwidthThreshold, setBandwidthThreshold] = useState(50);
  const [requestThreshold, setRequestThreshold] = useState(100);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [optimizationInProgress, setOptimizationInProgress] = useState(false);

  // Mock data for development
  const mockCostReport: CostReport = {
    optimization: {
      optimized: true,
      costs: {
        total_cost: 1000.0,
        bandwidth_cost: 600.0,
        request_cost: 400.0,
      },
      savings: 200.0,
      optimization_time: 1.5,
      timestamp: new Date().toISOString(),
    },
    usage: {
      hourly_usage: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        value: 100,
      })),
      daily_usage: { '2024-01-01': 2400 },
      weekly_usage: { '2024-W01': 16800 },
    },
    projections: {
      daily: { '2024-01-02': 2500 },
      weekly: { '2024-W02': 17500 },
      monthly: { '2024-01': 70000 },
    },
    timestamp: new Date().toISOString(),
  };

  useEffect(() => {
    const fetchCostData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setCostReport(mockCostReport);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch cost data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCostData();

    // Handle online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load thresholds from localStorage after component mounts
  useEffect(() => {
    try {
      const savedCostThreshold = localStorage.getItem('costThreshold');
      const savedBandwidthThreshold =
        localStorage.getItem('bandwidthThreshold');
      const savedRequestThreshold = localStorage.getItem('requestThreshold');

      if (savedCostThreshold) setCostThreshold(parseInt(savedCostThreshold));
      if (savedBandwidthThreshold)
        setBandwidthThreshold(parseInt(savedBandwidthThreshold));
      if (savedRequestThreshold)
        setRequestThreshold(parseInt(savedRequestThreshold));
    } catch (err) {
      console.warn('Failed to load thresholds from localStorage:', err);
    }
  }, []);

  // Save thresholds to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('costThreshold', costThreshold.toString());
    } catch (err) {
      console.warn('Failed to save cost threshold to localStorage:', err);
    }
  }, [costThreshold]);

  useEffect(() => {
    try {
      localStorage.setItem('bandwidthThreshold', bandwidthThreshold.toString());
    } catch (err) {
      console.warn('Failed to save bandwidth threshold to localStorage:', err);
    }
  }, [bandwidthThreshold]);

  useEffect(() => {
    try {
      localStorage.setItem('requestThreshold', requestThreshold.toString());
    } catch (err) {
      console.warn('Failed to save request threshold to localStorage:', err);
    }
  }, [requestThreshold]);

  const handleOptimizeCosts = async () => {
    if (optimizationInProgress) return;

    try {
      setOptimizationInProgress(true);
      setOptimizationStatus('Optimization in progress...');

      // Simulate optimization process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (costThreshold < 1000) {
        setOptimizationStatus('Optimization completed');
      } else {
        setOptimizationStatus('No optimization needed');
      }
    } catch (err) {
      setOptimizationStatus('Optimization failed');
    } finally {
      setOptimizationInProgress(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    setShowExportOptions(!showExportOptions);
  };

  const handleExportCSV = () => {
    // Mock CSV export
    const csvContent =
      'data:text/csv;charset=utf-8,Date,Cost,Bandwidth,Requests\n2024-01-01,8.5,32GB,33333';
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = 'cdn-cost-report.csv';
    link.click();
  };

  const handleExportJSON = () => {
    // Mock JSON export
    const jsonContent = JSON.stringify(costReport, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cdn-cost-report.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simulate error state for testing
  const simulateError = () => {
    setError('Simulated error for testing');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" data-testid="cdn-cost-dashboard">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress data-testid="loading-indicator" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" data-testid="cdn-cost-dashboard">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="error" data-testid="error-message" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            data-testid="retry-button"
          >
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  if (!costReport) {
    return (
      <Container maxWidth="lg" data-testid="cdn-cost-dashboard">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No cost data available
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" data-testid="cdn-cost-dashboard">
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          CDN Cost Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Monitor and optimize your content delivery network costs
        </Typography>
      </Box>

      {/* Test Error Button - Hidden by default */}
      <Box sx={{ display: 'none' }}>
        <Button onClick={simulateError} data-testid="test-error-button">
          Test Error
        </Button>
      </Box>

      {/* Offline Message */}
      {isOffline && (
        <Alert severity="warning" sx={{ mb: 2 }} data-testid="offline-message">
          You are offline
        </Alert>
      )}

      {/* Cost Overview Cards */}
      <Grid
        container
        spacing={3}
        sx={{ mb: 4 }}
        data-testid="cost-overview"
        direction={{ xs: 'column', md: 'row' }}
      >
        <Grid item xs={12} md={4}>
          <Card data-testid="total-cost">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Cost
              </Typography>
              <Typography variant="h4" color="primary">
                {formatCurrency(costReport.optimization.costs.total_cost)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card data-testid="bandwidth-cost">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bandwidth Cost
              </Typography>
              <Typography variant="h4" color="warning.main">
                {formatCurrency(costReport.optimization.costs.bandwidth_cost)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card data-testid="request-cost">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Request Cost
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(costReport.optimization.costs.request_cost)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cost Savings - Always visible */}
      <Card sx={{ mb: 4 }} data-testid="cost-savings">
        <CardContent>
          <Alert severity="success">
            Potential savings: {formatCurrency(costReport.optimization.savings)}
          </Alert>
        </CardContent>
      </Card>

      {/* Usage Patterns */}
      <Card sx={{ mb: 4 }} data-testid="usage-patterns">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usage Patterns
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box data-testid="hourly-usage-chart">
                <Typography variant="h4" color="primary">
                  {formatNumber(
                    Object.values(costReport.usage.daily_usage)[0] / 24
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average hourly requests
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box data-testid="daily-usage">
                <Typography variant="h4" color="secondary">
                  {formatNumber(Object.values(costReport.usage.daily_usage)[0])}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average daily requests
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box data-testid="weekly-usage">
                <Typography variant="h4" color="info">
                  {formatNumber(
                    Object.values(costReport.usage.weekly_usage)[0]
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average weekly requests
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cost Projections */}
      <Card sx={{ mb: 4 }} data-testid="cost-projections">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Cost Projections
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box data-testid="daily-projection">
                <Typography variant="h4" color="primary">
                  {formatNumber(Object.values(costReport.projections.daily)[0])}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Projected daily cost
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box data-testid="weekly-projection">
                <Typography variant="h4" color="secondary">
                  {formatNumber(
                    Object.values(costReport.projections.weekly)[0]
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Projected weekly cost
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box data-testid="monthly-projection">
                <Typography variant="h4" color="info">
                  {formatNumber(
                    Object.values(costReport.projections.monthly)[0]
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Projected monthly cost
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Optimization Controls */}
      <Card sx={{ mb: 4 }} data-testid="optimization-controls">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Optimization Controls
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Cost Threshold ($)</Typography>
              <Slider
                value={costThreshold}
                onChange={(_, value) => setCostThreshold(value as number)}
                min={1}
                max={2000}
                marks
                valueLabelDisplay="auto"
                data-testid="cost-threshold-slider"
                aria-label="Cost threshold"
                disabled={optimizationInProgress}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Bandwidth Threshold (GB)</Typography>
              <Slider
                value={bandwidthThreshold}
                onChange={(_, value) => setBandwidthThreshold(value as number)}
                min={10}
                max={500}
                marks
                valueLabelDisplay="auto"
                data-testid="bandwidth-threshold-slider"
                aria-label="Bandwidth threshold"
                disabled={optimizationInProgress}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>Request Threshold</Typography>
              <Slider
                value={requestThreshold}
                onChange={(_, value) => setRequestThreshold(value as number)}
                min={10}
                max={500}
                marks
                valueLabelDisplay="auto"
                data-testid="request-threshold-slider"
                aria-label="Request threshold"
                disabled={optimizationInProgress}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<Speed />}
              onClick={handleOptimizeCosts}
              data-testid="optimize-costs-button"
              aria-label="Optimize costs"
              disabled={optimizationInProgress}
            >
              {optimizationInProgress ? 'Optimizing...' : 'Optimize Costs'}
            </Button>
          </Box>
          {optimizationStatus && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" data-testid="optimization-status">
                {optimizationStatus}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Optimization Feedback */}
      {optimizationStatus && (
        <Card sx={{ mb: 4 }} data-testid="optimization-feedback">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Optimization Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Optimization time: {costReport.optimization.optimization_time}s
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" data-testid="bandwidth-optimization">
                Bandwidth optimization applied
              </Typography>
              <Typography variant="body2" data-testid="request-optimization">
                Request optimization applied
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          data-testid="refresh-button"
        >
          Refresh Data
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleExport}
          data-testid="export-button"
        >
          Export Report
        </Button>
      </Box>

      {/* Export Options */}
      {showExportOptions && (
        <Card sx={{ mb: 4 }} data-testid="export-options">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Export Options
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleExportCSV}
                data-testid="export-csv"
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                onClick={handleExportJSON}
                data-testid="export-json"
              >
                Export JSON
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card sx={{ mb: 4 }} data-testid="performance-metrics">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>
          <Typography variant="body2" data-testid="optimization-time">
            Last optimization completed in{' '}
            {costReport.optimization.optimization_time} seconds
          </Typography>
        </CardContent>
      </Card>

      {/* Mobile Optimization Controls */}
      <Card
        sx={{ mb: 4, display: { xs: 'block', md: 'none' } }}
        data-testid="mobile-optimization-controls"
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Mobile Controls
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={handleOptimizeCosts}
            data-testid="mobile-optimize-button"
            disabled={optimizationInProgress}
          >
            {optimizationInProgress ? 'Optimizing...' : 'Optimize'}
          </Button>
        </CardContent>
      </Card>

      {/* Unauthorized Message - Hidden by default */}
      <Box sx={{ display: 'none' }} data-testid="unauthorized-message">
        <Alert severity="error">Insufficient permissions</Alert>
      </Box>
    </Container>
  );
};

export default CdnCostDashboard;
