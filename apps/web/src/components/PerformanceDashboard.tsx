import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Speed,
  Memory,
  Storage,
  Warning,
  Error,
} from '@mui/icons-material';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

interface PerformanceMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    rss_mb: number;
    heap_used_mb: number;
  };
  cpu: {
    usage_user: number;
    usage_system: number;
  };
  database: {
    connections: number;
  };
  redis: {
    isConnected: boolean;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  performance: {
    totalMetrics: number;
    totalAlerts: number;
    criticalAlerts: number;
    warningAlerts: number;
  };
}

interface PerformanceDashboardProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = React.memo(
  ({ isVisible = false, onToggle }) => {
    const { metrics } = usePerformanceOptimization('PerformanceDashboard');
    const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPerformanceData = useCallback(async () => {
      try {
        const response = await fetch('/api/metrics');
        if (!response.ok) {
          throw 'Failed to fetch performance data';
        }
        const data = await response.json();
        setPerformanceData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch performance data');
      }
    }, []);

    useEffect(() => {
      if (isVisible) {
        fetchPerformanceData();
        const interval = setInterval(fetchPerformanceData, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
      }
    }, [isVisible, fetchPerformanceData]);

    const handleToggle = useCallback(() => {
      setIsExpanded(!isExpanded);
      onToggle?.();
    }, [isExpanded, onToggle]);

    if (!isVisible) return null;

    const getStatusColor = (value: number, warning: number, critical: number) => {
      if (value >= critical) return 'error';
      if (value >= warning) return 'warning';
      return 'success';
    };

    const formatUptime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    return (
      <Card
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          width: isExpanded ? 400 : 300,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed />
              Performance Monitor
            </Typography>
            <IconButton onClick={handleToggle} size="small" sx={{ color: 'white' }}>
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {performanceData && (
            <Collapse in={isExpanded}>
              <Grid container spacing={2}>
                {/* Memory Usage */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Memory fontSize="small" />
                    <Typography variant="body2">Memory Usage</Typography>
                    <Chip
                      label={`${performanceData.memory.heap_used_mb}MB`}
                      size="small"
                      color={getStatusColor(performanceData.memory.heap_used_mb, 500, 800)}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((performanceData.memory.heap_used_mb / 1000) * 100, 100)}
                    color={getStatusColor(performanceData.memory.heap_used_mb, 500, 800)}
                  />
                </Grid>

                {/* Cache Performance */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Storage fontSize="small" />
                    <Typography variant="body2">Cache Hit Rate</Typography>
                    <Chip
                      label={`${(performanceData.cache.hitRate * 100).toFixed(1)}%`}
                      size="small"
                      color={getStatusColor(performanceData.cache.hitRate * 100, 60, 40)}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={performanceData.cache.hitRate * 100}
                    color={getStatusColor(performanceData.cache.hitRate * 100, 60, 40)}
                  />
                </Grid>

                {/* Database Connections */}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    DB Connections
                  </Typography>
                  <Chip
                    label={performanceData.database.connections}
                    size="small"
                    color={getStatusColor(performanceData.database.connections, 80, 95)}
                  />
                </Grid>

                {/* Uptime */}
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Uptime
                  </Typography>
                  <Typography variant="body2">
                    {formatUptime(performanceData.uptime)}
                  </Typography>
                </Grid>

                {/* Alerts */}
                {performanceData.performance.totalAlerts > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {performanceData.performance.criticalAlerts > 0 ? (
                        <Error color="error" fontSize="small" />
                      ) : (
                        <Warning color="warning" fontSize="small" />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Alerts: {performanceData.performance.totalAlerts}
                      </Typography>
                      {performanceData.performance.criticalAlerts > 0 && (
                        <Chip
                          label={`${performanceData.performance.criticalAlerts} Critical`}
                          size="small"
                          color="error"
                        />
                      )}
                      {performanceData.performance.warningAlerts > 0 && (
                        <Chip
                          label={`${performanceData.performance.warningAlerts} Warning`}
                          size="small"
                          color="warning"
                        />
                      )}
                    </Box>
                  </Grid>
                )}

                {/* Component Performance */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Component Performance
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption">
                      Render Count: {metrics.renderCount}
                    </Typography>
                    <Typography variant="caption">
                      Avg Time: {metrics.averageRenderTime.toFixed(2)}ms
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Collapse>
          )}

          {/* Compact View */}
          {!isExpanded && performanceData && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip
                label={`${performanceData.memory.heap_used_mb}MB`}
                size="small"
                color={getStatusColor(performanceData.memory.heap_used_mb, 500, 800)}
              />
              <Chip
                label={`${(performanceData.cache.hitRate * 100).toFixed(0)}% Cache`}
                size="small"
                color={getStatusColor(performanceData.cache.hitRate * 100, 60, 40)}
              />
              {performanceData.performance.totalAlerts > 0 && (
                <Chip
                  label={`${performanceData.performance.totalAlerts} Alerts`}
                  size="small"
                  color={performanceData.performance.criticalAlerts > 0 ? 'error' : 'warning'}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }
);

PerformanceDashboard.displayName = 'PerformanceDashboard';
