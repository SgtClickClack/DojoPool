import React from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
} from "@mui/material";
import { NetworkMetricsData } from "../../collectors/NetworkMetricsCollector";
import { MetricsChart } from "./MetricsChart";
import {
  formatBytes,
  formatDuration,
  formatPercentage,
} from "../utils/formatters";

interface NetworkMetricsPanelProps {
  metrics: NetworkMetricsData;
  history: NetworkMetricsData[];
  timeRange: number; // Time range in milliseconds
}

interface MetricCardProps {
  title: string;
  value: string | number;
  threshold?: number;
  critical?: number;
  unit?: string;
  progress?: number;
  isInverted?: boolean; // For metrics where lower is better
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  threshold,
  critical,
  unit,
  progress,
  isInverted = false,
}) => {
  const getColor = (value: number, threshold?: number, critical?: number) => {
    if (threshold == null || critical == null) return undefined;
    if (isInverted) {
      if (value <= critical) return 'error';
      if (value <= threshold) return 'warning';
      return 'success';
    } else {
      if (value >= critical) return 'error';
      if (value >= threshold) return 'warning';
      return 'success';
    }
  };

  const severity = typeof progress === 'number' ? getColor(progress, threshold, critical) : undefined;

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="textSecondary">
          {title}
        </Typography>
        <Typography
          variant="h6"
          component="div"
          sx={severity ? { color: (theme) => theme.palette[severity].main } : undefined}
        >
          {typeof value === 'number' ? (value as number).toFixed(2) : value}
          {unit && (
            <Typography variant="caption" component="span">
              {' '}
              {unit}
            </Typography>
          )}
        </Typography>
        {progress !== undefined && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, (progress / (critical || threshold || 100)) * 100)}
              color={severity || 'primary'}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const NetworkMetricsPanel: React.FC<NetworkMetricsPanelProps> = ({
  metrics,
  history,
  timeRange,
}) => {
  const latencyData = history.map((m) => ({
    timestamp: m.timestamp,
    value: m.messageLatency,
    p95: m.p95Latency,
  }));

  const bandwidthData = history.map((m) => ({
    timestamp: m.timestamp,
    value: m.bandwidthUsage,
  }));

  const errorRateData = history.map((m) => ({
    timestamp: m.timestamp,
    value: m.errors > 0 ? (m.errors / m.messagesSent) * 100 : 0,
  }));

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Network Performance
      </Typography>
      <Grid container spacing={2}>
        {/* Latency Metrics */}
        <Grid item xs={12} md={6}>
          <MetricCard
            title="Average Latency"
            value={metrics.messageLatency}
            unit="ms"
            threshold={200}
            critical={500}
            progress={metrics.messageLatency}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MetricCard
            title="P95 Latency"
            value={`${metrics.p95Latency.toFixed(2)}`}
            unit="ms"
            threshold={300}
            critical={750}
            progress={metrics.p95Latency}
          />
        </Grid>

        {/* Bandwidth and Connection Metrics */}
        <Grid item xs={12} md={6}>
          <MetricCard
            title="Bandwidth Usage"
            value={formatBytes(metrics.bandwidthUsage)}
            unit="/s"
            threshold={5 * 1024 * 1024} // 5MB/s
            critical={10 * 1024 * 1024} // 10MB/s
            progress={metrics.bandwidthUsage}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MetricCard
            title="Connection Stability"
            value={formatPercentage(metrics.connectionStability)}
            threshold={80}
            critical={60}
            progress={metrics.connectionStability}
            isInverted={true}
          />
        </Grid>

        {/* Message Queue and Error Metrics */}
        <Grid item xs={12} md={6}>
          <MetricCard
            title="Queue Size"
            value={metrics.queueSize}
            unit="messages"
            threshold={100}
            critical={500}
            progress={metrics.queueSize}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <MetricCard
            title="Error Rate"
            value={formatPercentage(
              (metrics.errors / metrics.messagesSent) * 100,
              1,
            )}
            threshold={5}
            critical={10}
            progress={(metrics.errors / metrics.messagesSent) * 100}
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Latency Over Time
              </Typography>
              <MetricsChart
                data={latencyData}
                timeRange={timeRange}
                yAxisLabel="Latency (ms)"
                series={[
                  { key: 'value', name: 'Average' },
                  { key: 'p95', name: '95th Percentile' },
                ]}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Typography variant="caption">Average</Typography>
                <Typography variant="caption">95th Percentile</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bandwidth Usage
              </Typography>
              <MetricsChart
                data={bandwidthData}
                timeRange={timeRange}
                yAxisLabel="Bandwidth (KB/s)"
                series={[{ key: 'value', name: 'Usage' }]}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Rate
              </Typography>
              <MetricsChart
                data={errorRateData}
                timeRange={timeRange}
                yAxisLabel="Error Rate (%)"
                series={[{ key: 'value', name: 'Rate' }]}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
