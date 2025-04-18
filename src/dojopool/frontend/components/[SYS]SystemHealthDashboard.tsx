import { Box, Card, CircularProgress, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface SystemMetrics {
  cpu: {
    total: number;
    per_cpu: number[];
  };
  memory: {
    total: number;
    available: number;
    used: number;
    percent: number;
  };
  disk: {
    [key: string]: {
      total: number;
      used: number;
      free: number;
      percent: number;
    };
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
    packets_sent: number;
    packets_recv: number;
  };
}

interface ApplicationMetrics {
  total_requests: number;
  average_latency: number;
  total_errors: number;
  recent_errors: Array<{
    timestamp: number;
    message: string;
    severity: string;
  }>;
}

interface HealthData {
  status: string;
  timestamp: number;
  system: SystemMetrics;
  application: ApplicationMetrics;
}

const SystemHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HealthData[]>([]);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const response = await fetch("/api/health/detailed");
        if (!response.ok) {
          throw new Error("Failed to fetch health data");
        }
        const data = await response.json();
        setHealthData(data);
        setHistoricalData((prev) => [...prev, data].slice(-30)); // Keep last 30 data points
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!healthData) {
    return null;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Health Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* CPU Usage Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <Box p={2}>
              <Typography variant="h6">CPU Usage</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp * 1000).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      new Date(timestamp * 1000).toLocaleString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="system.cpu.total"
                    name="CPU Usage (%)"
                    stroke="#8884d8"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Memory Usage Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <Box p={2}>
              <Typography variant="h6">Memory Usage</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp * 1000).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      new Date(timestamp * 1000).toLocaleString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="system.memory.percent"
                    name="Memory Usage (%)"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Application Metrics */}
        <Grid item xs={12}>
          <Card>
            <Box p={2}>
              <Typography variant="h6">Application Metrics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">
                    Total Requests: {healthData.application.total_requests}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">
                    Average Latency:{" "}
                    {healthData.application.average_latency.toFixed(2)}ms
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1">
                    Total Errors: {healthData.application.total_errors}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>

        {/* Recent Errors */}
        <Grid item xs={12}>
          <Card>
            <Box p={2}>
              <Typography variant="h6">Recent Errors</Typography>
              {healthData.application.recent_errors.map((error, index) => (
                <Box key={index} mt={1}>
                  <Typography variant="body2" color="error">
                    [{new Date(error.timestamp * 1000).toLocaleString()}]{" "}
                    {error.severity}: {error.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemHealthDashboard;
