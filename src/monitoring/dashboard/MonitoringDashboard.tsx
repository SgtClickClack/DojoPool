import React, { useEffect, useState } from "react";
import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import { MetricsPanel } from "./components/MetricsPanel";
import { AlertsPanel } from "./components/AlertsPanel";
import { MetricsChart } from "./components/MetricsChart";
import { MonitoringService } from "../MonitoringService";
import { Alert } from "../alerts/AlertManager";
import { MetricsData } from "../collectors/MetricsCollector";

interface MonitoringDashboardProps {
  monitoringService: MonitoringService;
}

interface MetricsUpdate {
  name: string;
  timestamp: number;
  metrics: MetricsData;
}

interface MetricsHistory {
  timestamp: number;
  metrics: MetricsData;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  monitoringService,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<Record<string, MetricsData>>({});
  const [metricsHistory, setMetricsHistory] = useState<
    Record<string, MetricsHistory[]>
  >({});
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    // Subscribe to monitoring events
    monitoringService.on("metrics", (update: MetricsUpdate) => {
      setMetrics((prev) => ({
        ...prev,
        [update.name]: update.metrics,
      }));
      setMetricsHistory((prev) => ({
        ...prev,
        [update.name]: [
          ...(prev[update.name] || []),
          { timestamp: update.timestamp, metrics: update.metrics },
        ].slice(-100), // Keep last 100 data points
      }));
      setLastUpdate(update.timestamp);
    });

    monitoringService.on("alert", (alert: Alert) => {
      setAlerts((prev) => [...prev, alert]);
    });

    // Initialize with current data
    setAlerts(monitoringService.getActiveAlerts());

    // Start monitoring
    monitoringService.start();

    return () => {
      monitoringService.stop();
    };
  }, [monitoringService]);

  const handleAlertDismiss = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Monitoring Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Last updated: {new Date(lastUpdate).toLocaleString()}
        </Typography>

        <Grid container spacing={3}>
          {/* Alerts Panel */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <AlertsPanel alerts={alerts} onDismiss={handleAlertDismiss} />
            </Paper>
          </Grid>

          {/* Consistency Metrics */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <MetricsPanel
                title="Consistency Metrics"
                metrics={metrics.consistency}
                thresholds={monitoringService.config.consistencyThresholds}
              />
            </Paper>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <MetricsPanel
                title="Performance Metrics"
                metrics={metrics.performance}
                thresholds={monitoringService.config.performanceThresholds}
              />
            </Paper>
          </Grid>

          {/* Node Metrics */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <MetricsPanel
                title="Node Metrics"
                metrics={metrics.node}
                thresholds={monitoringService.config.nodeThresholds}
              />
            </Paper>
          </Grid>

          {/* Consistency Metrics Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <MetricsChart
                title="Consistency Metrics Over Time"
                data={metricsHistory.consistency || []}
                metricNames={[
                  "latency",
                  "successRate",
                  "activeNodes",
                  "syncDelay",
                ]}
                thresholds={monitoringService.config.consistencyThresholds}
              />
            </Paper>
          </Grid>

          {/* Performance Metrics Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <MetricsChart
                title="Performance Metrics Over Time"
                data={metricsHistory.performance || []}
                metricNames={[
                  "operationLatency",
                  "errorRate",
                  "throughput",
                  "cpuUsage",
                  "memoryUsage",
                ]}
                thresholds={monitoringService.config.performanceThresholds}
              />
            </Paper>
          </Grid>

          {/* Node Metrics Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <MetricsChart
                title="Node Metrics Over Time"
                data={metricsHistory.node || []}
                metricNames={[
                  "uptime",
                  "connectionCount",
                  "messageRate",
                  "errorCount",
                ]}
                thresholds={monitoringService.config.nodeThresholds}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};
