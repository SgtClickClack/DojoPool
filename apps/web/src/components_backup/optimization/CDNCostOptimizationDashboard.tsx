import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Button,
  Slider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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
    hourly_usage: Record<number, number>;
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function CDNCostOptimizationDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costReport, setCostReport] = useState<CostReport | null>(null);
  const [costThreshold, setCostThreshold] = useState(1000);
  const [bandwidthThreshold, setBandwidthThreshold] = useState(500);
  const [requestThreshold, setRequestThreshold] = useState(100);
  const [optimizationInterval, setOptimizationInterval] = useState(24);

  useEffect(() => {
    fetchCostReport();
  }, []);

  const fetchCostReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cdn/cost');
      if (!response.ok) {
        throw new Error('Failed to fetch cost report');
      }
      const data = await response.json();
      setCostReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cdn/cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cost_threshold: costThreshold,
          bandwidth_threshold: bandwidthThreshold,
          request_threshold: requestThreshold,
          optimization_interval: optimizationInterval,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to optimize costs');
      }
      await fetchCostReport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!costReport) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No cost report available
      </Alert>
    );
  }

  const costData = [
    { name: 'Total Cost', value: costReport.optimization.costs.total_cost },
    {
      name: 'Bandwidth Cost',
      value: costReport.optimization.costs.bandwidth_cost,
    },
    { name: 'Request Cost', value: costReport.optimization.costs.request_cost },
  ];

  const hourlyData = Object.entries(costReport.usage.hourly_usage).map(
    ([hour, value]) => ({
      hour: parseInt(hour),
      value,
    })
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CDN Cost Optimization
      </Typography>

      <Grid container spacing={3}>
        {/* Cost Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Overview
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${formatPercentage(percent)}`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatCurrency} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Optimization Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Results
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography>
                    Status:{' '}
                    {costReport.optimization.optimized
                      ? 'Optimized'
                      : 'No Optimization Needed'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography>
                    Total Savings:{' '}
                    {formatCurrency(costReport.optimization.savings)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography>
                    Optimization Time:{' '}
                    {costReport.optimization.optimization_time.toFixed(2)}s
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Patterns */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hourly Usage Patterns
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Optimization Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Optimization Controls
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Cost Threshold</Typography>
                  <Slider
                    value={costThreshold}
                    onChange={(_, value) => setCostThreshold(value as number)}
                    min={0}
                    max={5000}
                    step={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={formatCurrency}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    value={costThreshold}
                    onChange={(e) => setCostThreshold(Number(e.target.value))}
                    InputProps={{
                      startAdornment: '$',
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Bandwidth Threshold</Typography>
                  <Slider
                    value={bandwidthThreshold}
                    onChange={(_, value) =>
                      setBandwidthThreshold(value as number)
                    }
                    min={0}
                    max={2000}
                    step={50}
                    valueLabelDisplay="auto"
                    valueLabelFormat={formatCurrency}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    value={bandwidthThreshold}
                    onChange={(e) =>
                      setBandwidthThreshold(Number(e.target.value))
                    }
                    InputProps={{
                      startAdornment: '$',
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Request Threshold</Typography>
                  <Slider
                    value={requestThreshold}
                    onChange={(_, value) =>
                      setRequestThreshold(value as number)
                    }
                    min={0}
                    max={500}
                    step={10}
                    valueLabelDisplay="auto"
                    valueLabelFormat={formatCurrency}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    value={requestThreshold}
                    onChange={(e) =>
                      setRequestThreshold(Number(e.target.value))
                    }
                    InputProps={{
                      startAdornment: '$',
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>
                    Optimization Interval (hours)
                  </Typography>
                  <Slider
                    value={optimizationInterval}
                    onChange={(_, value) =>
                      setOptimizationInterval(value as number)
                    }
                    min={1}
                    max={168}
                    step={1}
                    valueLabelDisplay="auto"
                  />
                  <TextField
                    fullWidth
                    type="number"
                    value={optimizationInterval}
                    onChange={(e) =>
                      setOptimizationInterval(Number(e.target.value))
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOptimize}
                    disabled={loading}
                  >
                    Optimize Costs
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
