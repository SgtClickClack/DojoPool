import ProtectedRoute from '@/components/Common/ProtectedRoute';
import {
  Box,
  Button,
  Collapse,
  Container,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';

import { DynamicCMSDashboard } from '@/components/Common/DynamicImports';

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
};

const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showUsersTable, setShowUsersTable] = useState(false);
  const recentUsersRef = useRef<HTMLDivElement | null>(null);

  const adminUsers: AdminUser[] = [
    {
      id: 'user-1',
      username: 'testuser1',
      email: 'user1@example.com',
      role: 'USER',
      status: 'ACTIVE',
      joinDate: '2024-01-15',
    },
    {
      id: 'user-2',
      username: 'testuser2',
      email: 'user2@example.com',
      role: 'USER',
      status: 'ACTIVE',
      joinDate: '2024-01-14',
    },
  ];

  const systemStats = {
    totalUsers: 1250,
    activeUsers: 892,
    totalClans: 45,
    activeMatches: 23,
  };

  const formattedTotalUsers = new Intl.NumberFormat('en-US').format(
    systemStats.totalUsers
  );
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(systemStats.totalUsers / pageSize));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (!showUsersTable) {
      setShowUsersTable(true);
    }
  }, [showUsersTable]);

  const handleViewAllUsers = () => {
    setShowUsersTable(true);
    setTabValue(0);
  };

  const SystemOverviewTab = () => (
    <>
      <Box sx={{ mt: 4, mb: 6 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          data-testid="admin-heading"
        >
          Admin Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          System Overview & Management
        </Typography>
      </Box>

      <Box
        data-testid="admin-stat-cards"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        {/* System Stats */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Total Users
          </Typography>
          <Typography variant="h3" color="primary" data-testid="stat-totalUsers">
            {systemStats.totalUsers}
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Users
          </Typography>
          <Typography variant="h3" color="success.main" data-testid="stat-activeUsers">
            {systemStats.activeUsers}
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Total Clans
          </Typography>
          <Typography variant="h3" color="warning.main" data-testid="stat-totalClans">
            {systemStats.totalClans}
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Matches
          </Typography>
          <Typography variant="h3" color="info.main" data-testid="stat-activeMatches">
            {systemStats.activeMatches}
          </Typography>
        </Paper>
      </Box>

      {/* Recent Users Table */}
      <Box sx={{ mt: 3 }}>
        <Collapse in={showUsersTable} timeout="auto" unmountOnExit>
          <Paper
            elevation={2}
            sx={{ p: 3 }}
            data-testid="recent-users-table"
            ref={recentUsersRef}
          >
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
                  {adminUsers.map((user) => (
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

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}
              data-testid="user-management-footer"
            >
              <Typography variant="body2">{`1 of ${totalPages} pages`}</Typography>
              <Typography variant="body2">{`${formattedTotalUsers} total users`}</Typography>
            </Box>
          </Paper>
        </Collapse>
      </Box>

      {/* Quick Actions */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mt: 3,
        }}
      >
        <Paper elevation={2} sx={{ p: 3 }} data-testid="user-management-card">
          <Typography variant="h6" gutterBottom>
            User Management
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              fullWidth
              data-testid="user-management-view-all"
              onClick={handleViewAllUsers}
            >
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

        <Paper elevation={2} sx={{ p: 3 }} data-testid="system-management-card">
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
      </Box>
    </>
  );

  const renderActiveTab = () => {
    if (tabValue === 0) {
      return <SystemOverviewTab />;
    }

    return (
      <Box data-testid="content-management">
        <DynamicCMSDashboard />
      </Box>
    );
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <Container maxWidth="lg" data-testid="admin-dashboard">
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Panel
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin dashboard tabs"
          >
            <Tab label="System Overview" />
            <Tab label="Content Management" />
          </Tabs>
        </Box>

        {renderActiveTab()}
      </Container>
    </ProtectedRoute>
  );
};

export default dynamic(() => Promise.resolve(AdminPage), { ssr: false });
