import {
  getFeedbackStats,
  getModerationFeedback,
  updateModerationFeedbackStatus,
} from '@/services/APIService';
import {
  Feedback,
  FeedbackCategory,
  FeedbackFilter,
  FeedbackListResponse,
  FeedbackPriority,
  FeedbackStats,
  FeedbackStatus,
  UpdateFeedbackRequest,
} from '@dojopool/types';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

const statusColors: Record<FeedbackStatus, { bg: string; color: string }> = {
  [FeedbackStatus.PENDING]: {
    bg: 'warning.light',
    color: 'warning.contrastText',
  },
  [FeedbackStatus.IN_REVIEW]: { bg: 'info.light', color: 'info.contrastText' },
  [FeedbackStatus.IN_PROGRESS]: {
    bg: 'primary.light',
    color: 'primary.contrastText',
  },
  [FeedbackStatus.RESOLVED]: {
    bg: 'success.light',
    color: 'success.contrastText',
  },
  [FeedbackStatus.CLOSED]: { bg: 'grey.400', color: 'grey.contrastText' },
  [FeedbackStatus.REJECTED]: { bg: 'error.light', color: 'error.contrastText' },
};

const priorityColors: Record<FeedbackPriority, { bg: string; color: string }> =
  {
    [FeedbackPriority.LOW]: {
      bg: 'success.light',
      color: 'success.contrastText',
    },
    [FeedbackPriority.NORMAL]: { bg: 'info.light', color: 'info.contrastText' },
    [FeedbackPriority.HIGH]: {
      bg: 'warning.light',
      color: 'warning.contrastText',
    },
    [FeedbackPriority.CRITICAL]: {
      bg: 'error.light',
      color: 'error.contrastText',
    },
  };

const categoryLabels: Record<FeedbackCategory, string> = {
  [FeedbackCategory.BUG]: 'Bug',
  [FeedbackCategory.FEATURE_REQUEST]: 'Feature',
  [FeedbackCategory.GENERAL_FEEDBACK]: 'General',
  [FeedbackCategory.VENUE_ISSUE]: 'Venue',
  [FeedbackCategory.TECHNICAL_SUPPORT]: 'Support',
  [FeedbackCategory.UI_UX_IMPROVEMENT]: 'UI/UX',
  [FeedbackCategory.PERFORMANCE_ISSUE]: 'Performance',
};

export const AdminFeedbackDashboard: React.FC = () => {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [list, setList] = useState<FeedbackListResponse | null>(null);
  const [filters, setFilters] = useState<FeedbackFilter>({});
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Feedback | null>(null);
  const [updateData, setUpdateData] = useState<UpdateFeedbackRequest>({});
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const totalPages = useMemo(() => list?.pagination?.totalPages ?? 1, [list]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, listRes] = await Promise.all([
        getFeedbackStats(),
        getModerationFeedback(filters, page, limit),
      ]);
      setStats(statsRes);
      setList(listRes);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), page]);

  const openUpdate = (item: Feedback) => {
    setSelected(item);
    setUpdateError(null);
    setUpdateData({
      status: item.status,
      priority: item.priority,
      adminNotes: item.adminNotes ?? '',
    });
  };

  const submitUpdate = async () => {
    if (!selected) return;
    try {
      setUpdating(true);
      setUpdateError(null);
      await updateModerationFeedbackStatus(selected.id, updateData);
      setSelected(null);
      await load();
    } catch (err: any) {
      setUpdateError(
        err?.response?.data?.message || 'Failed to update feedback'
      );
    } finally {
      setUpdating(false);
    }
  };

  const statCards = [
    {
      title: 'Total',
      value: stats?.total ?? 0,
      color: 'primary' as const,
      description: 'All feedback entries',
    },
    {
      title: 'Pending',
      value: stats?.pending ?? 0,
      color: 'warning' as const,
      description: 'Awaiting triage',
    },
    {
      title: 'In Review',
      value: stats?.inReview ?? 0,
      color: 'info' as const,
      description: 'Being evaluated',
    },
    {
      title: 'Resolved',
      value: stats?.resolved ?? 0,
      color: 'success' as const,
      description: 'Closed with fix',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>
        Feedback Management Dashboard
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {statCards.map((s, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card
              elevation={1}
              sx={{
                height: '100%',
                borderTop: 3,
                borderColor: `${s.color}.main`,
              }}
            >
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {s.value}
                </Typography>
                <Typography variant="subtitle1">{s.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {s.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.status ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    status: (e.target.value as FeedbackStatus) || undefined,
                  }))
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {Object.values(FeedbackStatus).map((s) => (
                  <MenuItem key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={filters.category ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    category: (e.target.value as FeedbackCategory) || undefined,
                  }))
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {Object.values(FeedbackCategory).map((c) => (
                  <MenuItem key={c} value={c}>
                    {categoryLabels[c]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                label="Priority"
                value={filters.priority ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    priority: (e.target.value as FeedbackPriority) || undefined,
                  }))
                }
              >
                <MenuItem value="">
                  <em>Any</em>
                </MenuItem>
                {Object.values(FeedbackPriority).map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="User ID"
              fullWidth
              value={filters.userId ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  userId: e.target.value || undefined,
                }))
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date From (YYYY-MM-DD)"
              fullWidth
              value={filters.dateFrom ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  dateFrom: e.target.value || undefined,
                }))
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Date To (YYYY-MM-DD)"
              fullWidth
              value={filters.dateTo ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  dateTo: e.target.value || undefined,
                }))
              }
            />
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => setFilters({})}>
                Clear Filters
              </Button>
              <Button variant="contained" onClick={() => setPage(1)}>
                Apply
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Created</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : list && list.feedback.length > 0 ? (
                list.feedback.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell>
                      {new Date(f.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {f.user?.username || f.userId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {f.user?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={categoryLabels[f.category]} size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 360 }}>
                      <Typography variant="body2" noWrap title={f.message}>
                        {f.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={f.status.replace(/_/g, ' ')}
                        sx={{
                          bgcolor: statusColors[f.status].bg,
                          color: statusColors[f.status].color,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={f.priority}
                        sx={{
                          bgcolor: priorityColors[f.priority].bg,
                          color: priorityColors[f.priority].color,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openUpdate(f)}>
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No feedback found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination
            page={page}
            count={totalPages}
            onChange={(_, p) => setPage(p)}
          />
        </Box>
      </Paper>

      {/* Update Dialog */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Feedback</DialogTitle>
        <DialogContent>
          {updateError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={updateData.status ?? ''}
                  onChange={(e) =>
                    setUpdateData((d) => ({
                      ...d,
                      status: e.target.value as FeedbackStatus,
                    }))
                  }
                >
                  {Object.values(FeedbackStatus).map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  label="Priority"
                  value={updateData.priority ?? ''}
                  onChange={(e) =>
                    setUpdateData((d) => ({
                      ...d,
                      priority: e.target.value as FeedbackPriority,
                    }))
                  }
                >
                  {Object.values(FeedbackPriority).map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Admin Notes"
                multiline
                rows={4}
                fullWidth
                value={updateData.adminNotes ?? ''}
                onChange={(e) =>
                  setUpdateData((d) => ({ ...d, adminNotes: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)} disabled={updating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitUpdate}
            disabled={updating}
            startIcon={updating ? <CircularProgress size={18} /> : null}
          >
            {updating ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFeedbackDashboard;
