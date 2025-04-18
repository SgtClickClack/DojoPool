import React, { useState, useEffect } from "react";
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
  LinearProgress,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface SystemMetrics {
  cpu: {
    percent: number;
    cores: number;
    frequency: {
      current: number;
      min: number;
      max: number;
    };
  };
  memory: {
    total: number;
    available: number;
    percent: number;
    used: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
}

interface ApiMetrics {
  total_requests: number;
  requests_by_type: Record<string, number>;
  average_response_time: number;
  error_rate: number;
}

interface DatabaseMetrics {
  connections: {
    total: number;
    checkedin: number;
    overflow: number;
    checkedout: number;
  };
  queries: {
    total: number;
    slow: number;
    errors: number;
  };
}

interface CacheMetrics {
  hits: number;
  misses: number;
  hit_rate: number;
  memory_used: number;
  connected_clients: number;
}

interface PerformanceData {
  system?: SystemMetrics;
  api?: ApiMetrics;
  database?: DatabaseMetrics;
  cache?: CacheMetrics;
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
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchMetrics();
  }, [tabValue]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const types = ["system", "api", "database", "cache"];
      const metrics = await Promise.all(
        types.map(async (type) => {
          const response = await fetch(
            `/api/monitoring/performance?type=${type}`,
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch ${type} metrics`);
          }
          return response.json();
        }),
      );

      setData({
        system: metrics[0],
        api: metrics[1],
        database: metrics[2],
        cache: metrics[3],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      <Box sx={{ width: "100%", mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Performance Dashboard
        </Typography>

        <Paper sx={{ width: "100%", mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="System Metrics" />
            <Tab label="API Metrics" />
            <Tab label="Database Metrics" />
            <Tab label="Cache Metrics" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    CPU Usage
                  </Typography>
                  <Typography>Usage: {data.system?.cpu.percent}%</Typography>
                  <Typography>Cores: {data.system?.cpu.cores}</Typography>
                  <Typography>
                    Frequency: {data.system?.cpu.frequency.current}MHz
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={data.system?.cpu.percent || 0}
                      color="primary"
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Memory Usage
                  </Typography>
                  <Typography>Usage: {data.system?.memory.percent}%</Typography>
                  <Typography>
                    Used:{" "}
                    {Math.round(data.system?.memory.used || 0 / 1024 / 1024)}MB
                  </Typography>
                  <Typography>
                    Available:{" "}
                    {Math.round(
                      data.system?.memory.available || 0 / 1024 / 1024,
                    )}
                    MB
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={data.system?.memory.percent || 0}
                      color="secondary"
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Disk Usage
                  </Typography>
                  <Typography>Usage: {data.system?.disk.percent}%</Typography>
                  <Typography>
                    Used:{" "}
                    {Math.round(data.system?.disk.used || 0 / 1024 / 1024)}MB
                  </Typography>
                  <Typography>
                    Free:{" "}
                    {Math.round(data.system?.disk.free || 0 / 1024 / 1024)}MB
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={data.system?.disk.percent || 0}
                      color="error"
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    API Overview
                  </Typography>
                  <Typography>
                    Total Requests: {data.api?.total_requests}
                  </Typography>
                  <Typography>
                    Average Response Time: {data.api?.average_response_time}ms
                  </Typography>
                  <Typography>Error Rate: {data.api?.error_rate}%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Requests by Type
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(
                        data.api?.requests_by_type || {},
                      ).map(([type, count]) => ({ type, count }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Database Connections
                  </Typography>
                  <Typography>
                    Total: {data.database?.connections.total}
                  </Typography>
                  <Typography>
                    Checked In: {data.database?.connections.checkedin}
                  </Typography>
                  <Typography>
                    Checked Out: {data.database?.connections.checkedout}
                  </Typography>
                  <Typography>
                    Overflow: {data.database?.connections.overflow}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Query Statistics
                  </Typography>
                  <Typography>
                    Total Queries: {data.database?.queries.total}
                  </Typography>
                  <Typography>
                    Slow Queries: {data.database?.queries.slow}
                  </Typography>
                  <Typography>
                    Query Errors: {data.database?.queries.errors}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cache Performance
                  </Typography>
                  <Typography>Hits: {data.cache?.hits}</Typography>
                  <Typography>Misses: {data.cache?.misses}</Typography>
                  <Typography>
                    Hit Rate: {(data.cache?.hit_rate || 0 * 100).toFixed(2)}%
                  </Typography>
                  <Typography>
                    Memory Used:{" "}
                    {Math.round((data.cache?.memory_used || 0) / 1024 / 1024)}MB
                  </Typography>
                  <Typography>
                    Connected Clients: {data.cache?.connected_clients}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cache Hit Rate
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(data.cache?.hit_rate || 0) * 100}
                      color="success"
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}
