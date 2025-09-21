import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { performance_monitor } from '../../core/monitoring/performance';
import { metrics_monitor, AlertSeverity } from '../../core/monitoring/metrics_monitor';

interface PerformanceDashboardProps {
  refreshInterval?: number; // milliseconds
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = React.memo(({
  refreshInterval = 5000,
}) => {
  const [currentMetrics, setCurrentMetrics] = useState(performance_monitor.getCurrentMetrics());
  const [alerts, setAlerts] = useState(metrics_monitor.getAlerts());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      setCurrentMetrics(performance_monitor.getCurrentMetrics());
      setAlerts(metrics_monitor.getAlerts());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const alertCounts = useMemo(() => {
    const counts = {
      [AlertSeverity.INFO]: 0,
      [AlertSeverity.WARNING]: 0,
      [AlertSeverity.ERROR]: 0,
    };
    
    alerts.forEach(alert => {
      counts[alert.severity]++;
    });
    
    return counts;
  }, [alerts]);

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.ERROR:
        return <ErrorIcon color="error" />;
      case AlertSeverity.WARNING:
        return <WarningIcon color="warning" />;
      case AlertSeverity.INFO:
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.ERROR:
        return 'error';
      case AlertSeverity.WARNING:
        return 'warning';
      case AlertSeverity.INFO:
        return 'info';
      default:
        return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Performance Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshData}
          disabled={isRefreshing}
        >
          Refresh
        </Button>
      </Box>

      {/* Alert Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Errors</Typography>
              </Box>
              <Typography variant="h3" color="error">
                {alertCounts[AlertSeverity.ERROR]}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Warnings</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {alertCounts[AlertSeverity.WARNING]}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InfoIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Info</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {alertCounts[AlertSeverity.INFO]}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <MemoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Memory Usage
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Used</Typography>
                  <Typography variant="body2">
                    {formatPercentage(currentMetrics.memoryUsage)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={currentMetrics.memoryUsage}
                  color={currentMetrics.memoryUsage > 80 ? 'error' : 'primary'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Available: {formatBytes(currentMetrics.memoryAvailable * 1024 * 1024 * 1024)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                CPU Usage
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">CPU</Typography>
                  <Typography variant="body2">
                    {formatPercentage(currentMetrics.cpuUsage)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={currentMetrics.cpuUsage}
                  color={currentMetrics.cpuUsage > 80 ? 'error' : 'primary'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Processes: {currentMetrics.processCount} | Threads: {currentMetrics.threadCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Network Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Network Sent
              </Typography>
              <Typography variant="h4">
                {formatBytes(currentMetrics.networkSent * 1024 * 1024)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Network Received
              </Typography>
              <Typography variant="h4">
                {formatBytes(currentMetrics.networkReceived * 1024 * 1024)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Alerts */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Alerts
          </Typography>
          {alerts.length === 0 ? (
            <Alert severity="success">No alerts at this time</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Severity</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.slice(0, 10).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Chip
                          icon={getSeverityIcon(alert.severity)}
                          label={alert.severity.toUpperCase()}
                          color={getSeverityColor(alert.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {alert.message}
                        </Typography>
                        {alert.details && (
                          <Typography variant="caption" color="text.secondary">
                            {JSON.stringify(alert.details)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {alert.timestamp.toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.acknowledged ? 'Acknowledged' : 'Active'}
                          color={alert.acknowledged ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {!alert.acknowledged && (
                          <Tooltip title="Acknowledge Alert">
                            <IconButton
                              size="small"
                              onClick={() => {
                                metrics_monitor.acknowledgeAlert(alert.id, 'current-user');
                                refreshData();
                              }}
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

export default PerformanceDashboard;
