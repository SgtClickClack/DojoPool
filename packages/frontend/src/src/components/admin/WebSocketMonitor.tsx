import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  SignalCellularAlt,
  People,
  Speed,
  Error as ErrorIcon,
  Update
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';
import { format } from 'date-fns';

interface WebSocketStats {
  total_connections: number;
  messages_sent: number;
  errors: number;
  last_update: string | null;
  connected_users: number[];
  peak_connections: number;
  current_connections: number;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 2 }}>
    <Box display="flex" alignItems="center" gap={2}>
      <Box
        sx={{
          backgroundColor: `${color}20`,
          borderRadius: '50%',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {React.cloneElement(icon as React.ReactElement, { sx: { color } })}
      </Box>
      <Box>
        <Typography color="textSecondary" variant="body2">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ color }}>
          {value}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const WebSocketMonitor: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery<WebSocketStats>(
    'websocket-stats',
    async () => {
      const response = await axios.get('/api/ws/stats');
      return response.data;
    },
    {
      refetchInterval: 5000, // Refresh every 5 seconds
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

  const errorRate = stats.messages_sent > 0
    ? ((stats.errors / stats.messages_sent) * 100).toFixed(2)
    : '0.00';

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        WebSocket Monitor
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Current Connections"
            value={stats.current_connections}
            icon={<SignalCellularAlt />}
            color="#2196f3"
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
            icon={<ErrorIcon />}
            color={Number(errorRate) > 5 ? '#f44336' : '#4caf50'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
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
                    <TableCell align="right">{stats.peak_connections}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Connections</TableCell>
                    <TableCell align="right">{stats.total_connections}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Errors</TableCell>
                    <TableCell align="right">{stats.errors}</TableCell>
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
      </Grid>
    </Box>
  );
};

export default WebSocketMonitor; 