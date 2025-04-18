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

interface AnalyticsData {
  shares?: {
    total_shares: number;
    shares_by_type: Record<string, number>;
    shares_by_day: Array<{
      date: string;
      count: number;
    }>;
  };
  social?: {
    total_activities: number;
    activities_by_type: Record<string, number>;
    total_friendships: number;
    active_users: number;
  };
  performance?: {
    cache_hits: number;
    api_response_times: {
      average: number;
      p95: number;
      p99: number;
    };
    database_metrics: {
      connections: number;
      active_queries: number;
      cache_size: string;
    };
  };
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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, [tabValue]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const types = ["shares", "social", "performance"];
      const analytics = await Promise.all(
        types.map(async (type) => {
          const response = await fetch(`/api/analytics?type=${type}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${type} analytics`);
          }
          return response.json();
        }),
      );

      setData({
        shares: analytics[0],
        social: analytics[1],
        performance: analytics[2],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics",
      );
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
          Analytics Dashboard
        </Typography>

        <Paper sx={{ width: "100%", mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Share Analytics" />
            <Tab label="Social Analytics" />
            <Tab label="Performance Metrics" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Total Shares: {data.shares?.total_shares}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(data.shares?.shares_by_type || {}).map(
                      ([type, count]) => ({ type, count }),
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Shares Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.shares?.shares_by_day || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Social Activity Overview
                  </Typography>
                  <Typography>
                    Total Activities: {data.social?.total_activities}
                  </Typography>
                  <Typography>
                    Active Users: {data.social?.active_users}
                  </Typography>
                  <Typography>
                    Total Friendships: {data.social?.total_friendships}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Activity Types
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.entries(
                        data.social?.activities_by_type || {},
                      ).map(([type, count]) => ({ type, count }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Cache Performance
                  </Typography>
                  <Typography>
                    Cache Hits: {data.performance?.cache_hits}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    API Response Times
                  </Typography>
                  <Typography>
                    Average: {data.performance?.api_response_times.average}ms
                  </Typography>
                  <Typography>
                    P95: {data.performance?.api_response_times.p95}ms
                  </Typography>
                  <Typography>
                    P99: {data.performance?.api_response_times.p99}ms
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Database Metrics
                  </Typography>
                  <Typography>
                    Connections:{" "}
                    {data.performance?.database_metrics.connections}
                  </Typography>
                  <Typography>
                    Active Queries:{" "}
                    {data.performance?.database_metrics.active_queries}
                  </Typography>
                  <Typography>
                    Cache Size: {data.performance?.database_metrics.cache_size}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}
