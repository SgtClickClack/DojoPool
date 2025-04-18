import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme,
} from "@mui/material";
import {
  Speed as PerformanceIcon,
  Psychology as AccuracyIcon,
  Timer as LatencyIcon,
  Refresh as RefreshRateIcon,
  Memory as ResourceIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

interface MetricData {
  current: number;
  previous: number;
  change: number;
}

interface SystemMetric {
  name: string;
  value: MetricData;
  unit: string;
  description: string;
  threshold: {
    warning: number;
    critical: number;
  };
}

interface PerformanceMetric {
  name: string;
  value: MetricData;
  description: string;
}

interface AIMetricsProps {
  systemMetrics: SystemMetric[];
  performanceMetrics: PerformanceMetric[];
  lastUpdated: string;
  onRefresh: () => void;
}

export const AIMetrics: React.FC<AIMetricsProps> = ({
  systemMetrics,
  performanceMetrics,
  lastUpdated,
  onRefresh,
}) => {
  const theme = useTheme();

  const getMetricIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "performance":
        return <PerformanceIcon />;
      case "accuracy":
        return <AccuracyIcon />;
      case "latency":
        return <LatencyIcon />;
      case "refresh rate":
        return <RefreshRateIcon />;
      case "resource usage":
        return <ResourceIcon />;
      default:
        return <PerformanceIcon />;
    }
  };

  const getStatusColor = (
    value: number,
    threshold: { warning: number; critical: number },
  ) => {
    if (value >= threshold.critical) return theme.palette.error.main;
    if (value >= threshold.warning) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  const formatChange = (change: number) => {
    const prefix = change > 0 ? "+" : "";
    return `${prefix}${change.toFixed(1)}%`;
  };

  return (
    <Stack spacing={3}>
      {/* System Metrics */}
      <Card variant="outlined">
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6">System Metrics</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastUpdated}
              </Typography>
              <Tooltip title="Refresh metrics">
                <IconButton onClick={onRefresh} size="small">
                  <RefreshRateIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {systemMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getMetricIcon(metric.name)}
                        <Typography variant="subtitle1">
                          {metric.name}
                        </Typography>
                      </Box>
                      <Tooltip title={metric.description}>
                        <IconButton size="small">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="h4">
                          {metric.value.current}
                          {metric.unit}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              metric.value.change > 0
                                ? "success.main"
                                : "error.main",
                          }}
                        >
                          {formatChange(metric.value.change)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={
                          (metric.value.current / metric.threshold.critical) *
                          100
                        }
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: theme.palette.grey[200],
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: getStatusColor(
                              metric.value.current,
                              metric.threshold,
                            ),
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>
          <Grid container spacing={3}>
            {performanceMetrics.map((metric, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getMetricIcon(metric.name)}
                        <Typography variant="subtitle1">
                          {metric.name}
                        </Typography>
                      </Box>
                      <Tooltip title={metric.description}>
                        <IconButton size="small">
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="h4">
                          {metric.value.current}%
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              metric.value.change > 0
                                ? "success.main"
                                : "error.main",
                          }}
                        >
                          {formatChange(metric.value.change)}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={metric.value.current}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: theme.palette.grey[200],
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: theme.palette.primary.main,
                          },
                        }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        Previous: {metric.value.previous}%
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
};
