import {
  BatchPrediction,
  CompressOutlined,
  Error,
  Favorite,
  People,
  Refresh,
  SignalCellularAlt,
  Speed,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import React from 'react';
import { useQuery } from 'react-query';
import StatCard from './StatCard';

interface WebSocketStats {
  total_connections: number;
  messages_sent: number;
  errors: number;
  last_update: string | null;
  connected_users: number[];
  peak_connections: number;
  current_connections: number;
  rate_limited_attempts: number;
  last_error: string | null;
  reconnection_attempts: number;
  successful_reconnections: number;
  failed_heartbeats: number;
  rate_limits: {
    max_connections_per_user: number;
    max_total_connections: number;
    update_cooldown: number;
    broadcast_cooldown: number;
    heartbeat_interval: number;
    reconnect_timeout: number;
  };
  compression_stats: {
    compressed_messages: number;
    total_bytes_raw: number;
    total_bytes_compressed: number;
  };
  batch_stats: {
    batches_sent: number;
    messages_batched: number;
    avg_batch_size: number;
  };
}

const WebSocketMonitor: React.FC = () => {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<WebSocketStats>(
    'websocket-stats',
    async () => {
      const response = await axios.get('/api/ws/stats');
      return response.data;
    },
    {
      refetchInterval: 5000,
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">Error loading WebSocket statistics</Alert>
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  const errorRate =
    stats.messages_sent > 0
      ? ((stats.errors / stats.messages_sent) * 100).toFixed(2)
      : '0.00';

  const rateLimitRate =
    stats.messages_sent > 0
      ? ((stats.rate_limited_attempts / stats.messages_sent) * 100).toFixed(2)
      : '0.00';

  const reconnectionRate =
    stats.reconnection_attempts > 0
      ? (
          (stats.successful_reconnections / stats.reconnection_attempts) *
          100
        ).toFixed(2)
      : '100.00';

  const heartbeatFailureRate =
    stats.messages_sent > 0
      ? ((stats.failed_heartbeats / stats.messages_sent) * 100).toFixed(2)
      : '0.00';

  const compressionRatio =
    stats.compression_stats.total_bytes_raw > 0
      ? (
          (1 -
            stats.compression_stats.total_bytes_compressed /
              stats.compression_stats.total_bytes_raw) *
          100
        ).toFixed(2)
      : '0.00';

  const avgBatchSize =
    stats.batch_stats.batches_sent > 0
      ? (
          stats.batch_stats.messages_batched / stats.batch_stats.batches_sent
        ).toFixed(1)
      : '0.0';

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        WebSocket Monitor
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Current Connections"
            value={`${stats.current_connections} / ${stats.rate_limits.max_total_connections}`}
            icon={<SignalCellularAlt />}
            color={
              stats.current_connections >
              stats.rate_limits.max_total_connections * 0.8
                ? '#f44336'
                : '#2196f3'
            }
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Connected Users"
            value={stats.connected_users.length}
            icon={<People />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Messages Sent"
            value={stats.messages_sent}
            icon={<Speed />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Error Rate"
            value={`${errorRate}%`}
            icon={<Error />}
            color={Number(errorRate) > 5 ? '#f44336' : '#4caf50'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Reconnection Rate"
            value={`${reconnectionRate}%`}
            icon={<Refresh />}
            color={Number(reconnectionRate) < 95 ? '#f44336' : '#4caf50'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Heartbeat Health"
            value={`${(100 - Number(heartbeatFailureRate)).toFixed(2)}%`}
            icon={<Favorite />}
            color={Number(heartbeatFailureRate) > 5 ? '#f44336' : '#4caf50'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Compression Ratio"
            value={`${compressionRatio}%`}
            icon={<CompressOutlined />}
            color={Number(compressionRatio) > 30 ? '#4caf50' : '#ff9800'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Batch Size"
            value={avgBatchSize}
            icon={<BatchPrediction />}
            color={Number(avgBatchSize) > 50 ? '#4caf50' : '#ff9800'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Connection Health
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Reconnection Attempts</TableCell>
                    <TableCell align="right">
                      {stats.reconnection_attempts}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Successful Reconnections</TableCell>
                    <TableCell align="right">
                      {stats.successful_reconnections} ({reconnectionRate}%)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Failed Heartbeats</TableCell>
                    <TableCell align="right">
                      {stats.failed_heartbeats}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Heartbeat Interval</TableCell>
                    <TableCell align="right">
                      {stats.rate_limits.heartbeat_interval}s
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Reconnect Timeout</TableCell>
                    <TableCell align="right">
                      {stats.rate_limits.reconnect_timeout}s
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Connection Statistics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Peak Connections</TableCell>
                    <TableCell align="right">
                      {stats.peak_connections}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Connections</TableCell>
                    <TableCell align="right">
                      {stats.total_connections}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Errors</TableCell>
                    <TableCell align="right">{stats.errors}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Rate Limited Attempts</TableCell>
                    <TableCell align="right">
                      {stats.rate_limited_attempts} ({rateLimitRate}%)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Last Error</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      {stats.last_error || 'None'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Last Update</TableCell>
                    <TableCell align="right">
                      {stats.last_update
                        ? format(new Date(stats.last_update), 'PPpp')
                        : 'Never'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Rate Limits
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Max Connections per User</TableCell>
                    <TableCell align="right">
                      {stats.rate_limits.max_connections_per_user}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Max Total Connections</TableCell>
                    <TableCell align="right">
                      {stats.rate_limits.max_total_connections}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Update Cooldown</TableCell>
                    <TableCell align="right">
                      {stats.rate_limits.update_cooldown}s
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Broadcast Cooldown</TableCell>
                    <TableCell align="right">
                      {stats.rate_limits.broadcast_cooldown}s
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Connected Users
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {stats.connected_users.map((userId) => (
                <Chip
                  key={userId}
                  label={`User ${userId}`}
                  color="primary"
                  variant="outlined"
                />
              ))}
              {stats.connected_users.length === 0 && (
                <Typography color="textSecondary">
                  No users currently connected
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Compressed Messages</TableCell>
                    <TableCell align="right">
                      {stats.compression_stats.compressed_messages}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Raw Data Size</TableCell>
                    <TableCell align="right">
                      {formatBytes(stats.compression_stats.total_bytes_raw)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Compressed Size</TableCell>
                    <TableCell align="right">
                      {formatBytes(
                        stats.compression_stats.total_bytes_compressed
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Space Saved</TableCell>
                    <TableCell align="right">
                      {formatBytes(
                        stats.compression_stats.total_bytes_raw -
                          stats.compression_stats.total_bytes_compressed
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Batches</TableCell>
                    <TableCell align="right">
                      {stats.batch_stats.batches_sent}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Messages in Batches</TableCell>
                    <TableCell align="right">
                      {stats.batch_stats.messages_batched}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Average Batch Size</TableCell>
                    <TableCell align="right">{avgBatchSize} messages</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export default WebSocketMonitor;
