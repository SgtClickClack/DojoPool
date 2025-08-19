import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface APIAnalysis {
  total_requests: number;
  by_endpoint: Record<
    string,
    {
      count: number;
      avg_time: number;
      error_rate: number;
    }
  >;
  average_time: number;
  max_time: number;
  error_rate: number;
}

interface SlowEndpoint {
  endpoint: string;
  avg_time: number;
  count: number;
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
      id={`api-optimization-tabpanel-${index}`}
      aria-labelledby={`api-optimization-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function APIOptimizationDashboard() {
  const [analysis, setAnalysis] = useState<APIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [threshold, setThreshold] = useState(100);
  const [slowEndpoints, setSlowEndpoints] = useState<SlowEndpoint[]>([]);
  const [optimizationAction, setOptimizationAction] =
    useState('optimize_payload');
  const [payloadData, setPayloadData] = useState('');

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/optimization/api');
      if (!response.ok) {
        throw new Error('Failed to fetch API analysis');
      }
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleThresholdChange = async (
    event: Event,
    newValue: number | number[]
  ) => {
    const newThreshold = typeof newValue === 'number' ? newValue : newValue[0];
    setThreshold(newThreshold);

    try {
      setLoading(true);
      const response = await fetch('/api/optimization/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_slow_endpoints',
          threshold: newThreshold,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch slow endpoints');
      }
      const data = await response.json();
      setSlowEndpoints(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch slow endpoints'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizePayload = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/optimization/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'optimize_payload',
          data: JSON.parse(payloadData),
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to optimize payload');
      }
      const data = await response.json();
      setPayloadData(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to optimize payload'
      );
    } finally {
      setLoading(false);
    }
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
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          API Optimization Dashboard
        </Typography>

        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="API Analysis" />
            <Tab label="Slow Endpoints" />
            <Tab label="Payload Optimization" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    API Overview
                  </Typography>
                  <Typography>
                    Total Requests: {analysis?.total_requests}
                  </Typography>
                  <Typography>
                    Average Response Time: {analysis?.average_time.toFixed(2)}ms
                  </Typography>
                  <Typography>
                    Max Response Time: {analysis?.max_time.toFixed(2)}ms
                  </Typography>
                  <Typography>
                    Error Rate: {analysis?.error_rate.toFixed(2)}%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Response Times by Endpoint
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(analysis?.by_endpoint || {}).map(
                        ([endpoint, stats]) => ({
                          endpoint,
                          avg_time: stats.avg_time,
                        })
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="endpoint" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avg_time" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Slow Endpoints
                  </Typography>
                  <Typography gutterBottom>
                    Response Time Threshold: {threshold}ms
                  </Typography>
                  <Slider
                    value={threshold}
                    onChange={handleThresholdChange}
                    min={0}
                    max={500}
                    step={10}
                    valueLabelDisplay="auto"
                    sx={{ mb: 3 }}
                  />
                  <List>
                    {slowEndpoints.map((endpoint, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={endpoint.endpoint}
                          secondary={`Average Time: ${endpoint.avg_time.toFixed(2)}ms, Count: ${endpoint.count}`}
                        />
                        <Chip
                          label={`${endpoint.avg_time.toFixed(0)}ms`}
                          color={endpoint.avg_time > 200 ? 'error' : 'warning'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Payload Optimization
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Optimization Action</InputLabel>
                    <Select
                      value={optimizationAction}
                      onChange={(e) => setOptimizationAction(e.target.value)}
                      label="Optimization Action"
                    >
                      <MenuItem value="optimize_payload">
                        Optimize Payload
                      </MenuItem>
                      <MenuItem value="compress_response">
                        Compress Response
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={payloadData}
                    onChange={(e) => setPayloadData(e.target.value)}
                    placeholder="Enter JSON payload to optimize"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleOptimizePayload}
                    disabled={!payloadData}
                  >
                    Optimize Payload
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}
