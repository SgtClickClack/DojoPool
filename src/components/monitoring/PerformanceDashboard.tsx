import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Timeline,
  Memory,
  Speed,
  Timer,
  NetworkCheck,
  Refresh,
  Warning,
} from "@mui/icons-material";
import {
  usePerformanceMonitoring,
  PerformanceMetrics,
} from "../services/PerformanceMonitor";

const MetricCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  progress: number;
  warning?: boolean;
}> = ({ title, value, unit, icon, progress, warning }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "visible",
      }}
    >
      <CardContent>
        <Box
          sx={{
            position: "absolute",
            top: -20,
            left: 20,
            backgroundColor: warning
              ? theme.palette.warning.main
              : theme.palette.primary.main,
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: theme.shadows[3],
          }}
        >
          {icon}
        </Box>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" color="text.primary">
            {value.toFixed(1)}
            <Typography
              component="span"
              variant="subtitle1"
              color="text.secondary"
              sx={{ ml: 0.5 }}
            >
              {unit}
            </Typography>
          </Typography>
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={warning ? "warning" : "primary"}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { getMetrics } = usePerformanceMonitoring((newMetrics) => {
    setMetrics(newMetrics);
  });

  useEffect(() => {
    setMetrics(getMetrics());
  }, [getMetrics, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading performance metrics...</Typography>
      </Box>
    );
  }

  const getFPSProgress = (fps: number) => Math.min((fps / 60) * 100, 100);
  const getMemoryProgress = (memory: number) =>
    Math.min((memory / 1000) * 100, 100);
  const getResponseProgress = (time: number) =>
    Math.min((time / 200) * 100, 100);
  const getLoadProgress = (time: number) => Math.min((time / 3000) * 100, 100);
  const getLatencyProgress = (latency: number) =>
    Math.min((latency / 100) * 100, 100);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Performance Metrics
        </Typography>
        <Tooltip title="Refresh metrics">
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="FPS"
            value={metrics.fps}
            unit="fps"
            icon={<Timeline />}
            progress={getFPSProgress(metrics.fps)}
            warning={metrics.fps < 30}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Memory Usage"
            value={metrics.memoryUsage}
            unit="MB"
            icon={<Memory />}
            progress={getMemoryProgress(metrics.memoryUsage)}
            warning={metrics.memoryUsage > 500}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Response Time"
            value={metrics.responseTime}
            unit="ms"
            icon={<Speed />}
            progress={getResponseProgress(metrics.responseTime)}
            warning={metrics.responseTime > 100}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Load Time"
            value={metrics.loadTime}
            unit="ms"
            icon={<Timer />}
            progress={getLoadProgress(metrics.loadTime)}
            warning={metrics.loadTime > 2000}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Network Latency"
            value={metrics.networkLatency}
            unit="ms"
            icon={<NetworkCheck />}
            progress={getLatencyProgress(metrics.networkLatency)}
            warning={metrics.networkLatency > 50}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Utilization
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  CPU Usage
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.resourceUtilization.cpu}
                    sx={{ flexGrow: 1, mr: 1 }}
                  />
                  <Typography variant="body2">
                    {metrics.resourceUtilization.cpu}%
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Memory Usage
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.resourceUtilization.memory}
                    sx={{ flexGrow: 1, mr: 1 }}
                  />
                  <Typography variant="body2">
                    {metrics.resourceUtilization.memory}%
                  </Typography>
                </Box>
              </Box>
              {metrics.resourceUtilization.gpu !== undefined && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    GPU Usage
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.resourceUtilization.gpu}
                      sx={{ flexGrow: 1, mr: 1 }}
                    />
                    <Typography variant="body2">
                      {metrics.resourceUtilization.gpu}%
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {(metrics.fps < 30 ||
        metrics.memoryUsage > 500 ||
        metrics.responseTime > 100 ||
        metrics.loadTime > 2000 ||
        metrics.networkLatency > 50) && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: "warning.light",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Warning color="warning" sx={{ mr: 1 }} />
          <Typography color="warning.dark">
            Some metrics are outside of optimal ranges. Consider optimizing your
            application.
          </Typography>
        </Box>
      )}
    </Box>
  );
};
