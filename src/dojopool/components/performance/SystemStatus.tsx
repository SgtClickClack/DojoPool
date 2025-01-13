import React from 'react';
import { Box, Grid, Paper, Typography, LinearProgress, Tooltip } from '@mui/material';
import {
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  NetworkCheck as NetworkIcon,
} from '@mui/icons-material';

interface SystemStatusProps {
  status: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: {
      bytes_sent: number;
      bytes_recv: number;
      packets_sent: number;
      packets_recv: number;
    };
    process_metrics: {
      cpu_percent: number;
      memory_percent: number;
      threads: number;
      open_files: number;
      connections: number;
    };
  };
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getProgressColor = (value: number): string => {
    if (value >= 90) return 'error';
    if (value >= 70) return 'warning';
    return 'success';
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        System Status
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SpeedIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">CPU Usage</Typography>
            </Box>
            <Tooltip title={`${status.cpu_usage}%`}>
              <LinearProgress
                variant="determinate"
                value={status.cpu_usage}
                color={getProgressColor(status.cpu_usage)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Tooltip>
            <Typography variant="caption" color="textSecondary">
              Process CPU: {status.process_metrics.cpu_percent}%
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MemoryIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Memory Usage</Typography>
            </Box>
            <Tooltip title={`${status.memory_usage}%`}>
              <LinearProgress
                variant="determinate"
                value={status.memory_usage}
                color={getProgressColor(status.memory_usage)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Tooltip>
            <Typography variant="caption" color="textSecondary">
              Process Memory: {status.process_metrics.memory_percent}%
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <StorageIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Disk Usage</Typography>
            </Box>
            <Tooltip title={`${status.disk_usage}%`}>
              <LinearProgress
                variant="determinate"
                value={status.disk_usage}
                color={getProgressColor(status.disk_usage)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Tooltip>
            <Typography variant="caption" color="textSecondary">
              Open Files: {status.process_metrics.open_files}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={3}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <NetworkIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Network I/O</Typography>
            </Box>
            <Typography variant="body2">
              Sent: {formatBytes(status.network_io.bytes_sent)}
            </Typography>
            <Typography variant="body2">
              Received: {formatBytes(status.network_io.bytes_recv)}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Active Connections: {status.process_metrics.connections}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Process Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2">
                  Active Threads: {status.process_metrics.threads}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">
                  Network Packets Sent: {status.network_io.packets_sent}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">
                  Network Packets Received: {status.network_io.packets_recv}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
