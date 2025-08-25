import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { authApi, type AdminUser } from '../../services/services/api/auth';

export const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authApi.getAllUsers(
        page,
        limit,
        search,
        statusFilter
      );
      setUsers(response.users);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, statusFilter]);

  const handleBanUser = async (userId: string) => {
    try {
      await authApi.banUser(userId, 'Violation of platform rules');
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await authApi.unbanUser(userId);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      try {
        await authApi.deleteUser(userId);
        await fetchUsers(); // Refresh the list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete user');
      }
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await authApi.updateUserRole(userId, newRole);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update user role'
      );
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      active: { color: 'success' as const, label: 'Active' },
      banned: { color: 'error' as const, label: 'Banned' },
      suspended: { color: 'warning' as const, label: 'Suspended' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: 'default' as const,
      label: status,
    };

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  if (loading && users.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 4 }}
      >
        <Typography variant="h4" component="h2" fontWeight="bold">
          User Management
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e: SelectChangeEvent) =>
                setStatusFilter(e.target.value)
              }
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="banned">Banned</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error: {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Games</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'grey.300', color: 'grey.700' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    size="small"
                    onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="USER">User</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                    <MenuItem value="MODERATOR">Moderator</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>{getStatusChip(user.status)}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.totalGames} ({user.totalWins}W/{user.totalLosses}L)
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {user.status === 'banned' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => handleUnbanUser(user.id)}
                      >
                        Unban
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleBanUser(user.id)}
                      >
                        Ban
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of{' '}
          {total} results
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
        />
      </Box>
    </Box>
  );
};
