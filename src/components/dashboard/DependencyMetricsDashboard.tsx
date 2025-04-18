import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Paper,
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
} from "recharts";
import DependencyPerformanceMonitor from "../../services/DependencyPerformanceMonitor";

interface DependencyMetrics {
  name: string;
  version: string;
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  errorCount: number;
  timestamp: Date;
}

const DependencyMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Map<string, DependencyMetrics[]>>(
    new Map(),
  );
  const [issues, setIssues] = useState<
    Array<{ dependency: string; issue: string; severity: "warning" | "error" }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const monitor = DependencyPerformanceMonitor.getInstance();
    monitor.startMonitoring();

    const updateMetrics = () => {
      try {
        const newMetrics = monitor.getMetrics();
        const newIssues = monitor.getPerformanceIssues();
        setMetrics(newMetrics);
        setIssues(newIssues);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch metrics");
        setLoading(false);
      }
    };

    // Initial update
    updateMetrics();

    // Set up interval for updates
    const interval = setInterval(updateMetrics, 5000);

    return () => {
      clearInterval(interval);
      monitor.stopMonitoring();
    };
  }, []);

  const formatDataForChart = (dependencyName: string) => {
    const dependencyMetrics = metrics.get(dependencyName);
    if (!dependencyMetrics) return [];

    return dependencyMetrics.map((metric) => ({
      timestamp: new Date(metric.timestamp).toLocaleTimeString(),
      loadTime: metric.loadTime,
      memoryUsage: metric.memoryUsage,
      cpuUsage: metric.cpuUsage,
      errorCount: metric.errorCount,
    }));
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Dependency Performance Dashboard
      </Typography>

      {/* Issues Panel */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Issues
          </Typography>
          <List>
            {issues.map((issue, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={issue.dependency}
                  secondary={issue.issue}
                />
                <Chip
                  label={issue.severity}
                  color={issue.severity === "error" ? "error" : "warning"}
                />
              </ListItem>
            ))}
            {issues.length === 0 && (
              <ListItem>
                <ListItemText primary="No performance issues detected" />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* Metrics Charts */}
      <Grid container spacing={2}>
        {Array.from(metrics.keys()).map((dependencyName) => (
          <Grid item xs={12} md={6} key={dependencyName}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {dependencyName}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatDataForChart(dependencyName)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="loadTime"
                    stroke="#8884d8"
                    name="Load Time (ms)"
                  />
                  <Line
                    type="monotone"
                    dataKey="memoryUsage"
                    stroke="#82ca9d"
                    name="Memory Usage (MB)"
                  />
                  <Line
                    type="monotone"
                    dataKey="cpuUsage"
                    stroke="#ff7300"
                    name="CPU Usage (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DependencyMetricsDashboard;
