import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import React from 'react';
import ProtectedRoute from '../components/Common/ProtectedRoute';

const AdminPage: React.FC = () => {
  // Sample admin data
  const recentUsers = [
    {
      id: '1',
      username: 'Player1',
      email: 'player1@example.com',
      status: 'Active',
      joinDate: '2024-01-15',
    },
    {
      id: '2',
      username: 'Player2',
      email: 'player2@example.com',
      status: 'Active',
      joinDate: '2024-01-14',
    },
    {
      id: '3',
      username: 'Player3',
      email: 'player3@example.com',
      status: 'Suspended',
      joinDate: '2024-01-13',
    },
  ];

  const systemStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalClans: 45,
    activeMatches: 23,
    totalVenues: 67,
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 6 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            System Overview & Management
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* System Stats */}
          <Grid item xs={12} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h3" color="primary">
                {systemStats.totalUsers}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h3" color="success.main">
                {systemStats.activeUsers}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Total Clans
              </Typography>
              <Typography variant="h3" color="warning.main">
                {systemStats.totalClans}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Active Matches
              </Typography>
              <Typography variant="h3" color="info.main">
                {systemStats.activeMatches}
              </Typography>
            </Paper>
          </Grid>

          {/* Recent Users Table */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Users
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Join Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={
                              user.status === 'Active'
                                ? 'success.main'
                                : 'error.main'
                            }
                          >
                            {user.status}
                          </Typography>
                        </TableCell>
                        <TableCell>{user.joinDate}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Management
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="contained" fullWidth>
                  View All Users
                </Button>
                <Button variant="outlined" fullWidth>
                  Manage Bans
                </Button>
                <Button variant="outlined" fullWidth>
                  User Analytics
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                System Management
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="contained" fullWidth>
                  System Status
                </Button>
                <Button variant="outlined" fullWidth>
                  Backup Data
                </Button>
                <Button variant="outlined" fullWidth>
                  View Logs
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ProtectedRoute>
  );
};

export default dynamic(() => Promise.resolve(AdminPage), { ssr: false });
