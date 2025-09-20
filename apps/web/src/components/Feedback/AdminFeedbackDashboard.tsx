import {
  getAllFeedback,
  getFeedbackStats,
  updateFeedback,
} from '@/services/APIService';
import {
  type Feedback,
  FeedbackCategory,
  type FeedbackFilter,
  type FeedbackListResponse,
  FeedbackPriority,
  type FeedbackStats,
  FeedbackStatus,
} from '@/types/feedback';
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
import React, { useEffect, useState } from 'react';

const statusColors = {
  [FeedbackStatus.PENDING]: 'warning',
  [FeedbackStatus.IN_REVIEW]: 'info',
  [FeedbackStatus.IN_PROGRESS]: 'primary',
  [FeedbackStatus.RESOLVED]: 'success',
  [FeedbackStatus.CLOSED]: 'default',
  [FeedbackStatus.REJECTED]: 'error',
} as const;

const priorityColors = {
  [FeedbackPriority.LOW]: 'default',
  [FeedbackPriority.NORMAL]: 'info',
  [FeedbackPriority.HIGH]: 'warning',
  [FeedbackPriority.CRITICAL]: 'error',
} as const;

const categoryLabels = {
  [FeedbackCategory.BUG]: '🐛 Bug',
  [FeedbackCategory.FEATURE_REQUEST]: '💡 Feature',
  [FeedbackCategory.GENERAL_FEEDBACK]: '💬 Feedback',
  [FeedbackCategory.VENUE_ISSUE]: '🏢 Venue',
  [FeedbackCategory.TECHNICAL_SUPPORT]: '🛠️ Support',
  [FeedbackCategory.UI_UX_IMPROVEMENT]: '🎨 UI/UX',
  [FeedbackCategory.PERFORMANCE_ISSUE]: '⚡ Performance',
};

interface AdminFeedbackDashboardProps {
  onFeedbackUpdated?: () => void;
}

export const AdminFeedbackDashboard: React.FC<AdminFeedbackDashboardProps> = ({
  onFeedbackUpdated,
}) => {
  const [feedback, setFeedback] = useState<FeedbackListResponse | null>(null);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedbackFilter>({});
  const [page, setPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const [feedbackResponse, statsResponse] = await Promise.all([
        getAllFeedback(filters, page, 20),
        getFeedbackStats(),
      ]);
      setFeedback(feedbackResponse);
      setStats(statsResponse);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message
          : 'Failed to load feedback';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [filters, page]);

  const handleStatusUpdate = async (
    id: string,
    status: FeedbackStatus,
    adminNotes?: string
  ) => {
    setUpdating(true);
    try {
      const updatedFeedback = await updateFeedback(id, { status, adminNotes });
      setFeedback((prev) =>
        prev
          ? {
              ...prev,
              feedback: prev.feedback.map((f) =>
                f.id === id ? updatedFeedback : f
              ),
            }
          : null
      );
      setUpdateDialogOpen(false);
      setSelectedFeedback(null);
      onFeedbackUpdated?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message
          : 'Failed to update feedback';
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityUpdate = async (
    id: string,
    priority: FeedbackPriority
  ) => {
    try {
      const updatedFeedback = await updateFeedback(id, { priority });
      setFeedback((prev) =>
        prev
          ? {
              ...prev,
              feedback: prev.feedback.map((f) =>
                f.id === id ? updatedFeedback : f
              ),
            }
          : null
      );
      onFeedbackUpdated?.();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as any).response?.data?.message
          : 'Failed to update priority';
      setError(errorMessage);
    }
  };

  if (loading && !feedback) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Feedback Management Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Feedback
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {stats.inReview}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {stats.resolved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resolved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: (e.target.value as FeedbackStatus) || undefined,
                }))
              }
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(FeedbackStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  category: (e.target.value as FeedbackCategory) || undefined,
                }))
              }
              label="Category"
            >
              <MenuItem value="">All</MenuItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={() => setFilters({})}
            size="small"
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Feedback Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {feedback?.feedback.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {item.user.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.user.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={categoryLabels[item.category]}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: 300,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.message}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.status.replace('_', ' ')}
                    color={statusColors[item.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <FormControl size="small">
                    <Select
                      value={item.priority}
                      onChange={(e) =>
                        handlePriorityUpdate(
                          item.id,
                          e.target.value as FeedbackPriority
                        )
                      }
                      size="small"
                    >
                      {Object.values(FeedbackPriority).map((priority) => (
                        <MenuItem key={priority} value={priority}>
                          <Chip
                            label={priority}
                            color={priorityColors[priority]}
                            size="small"
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedFeedback(item);
                      setUpdateDialogOpen(true);
                    }}
                  >
                    Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {feedback && feedback.pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={feedback.pagination.totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Update Dialog */}
      <Dialog
        open={updateDialogOpen}
        onClose={() => setUpdateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Update Feedback</DialogTitle>
        <DialogContent>
          {selectedFeedback && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {categoryLabels[selectedFeedback.category]}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                From: {selectedFeedback.user.username} (
                {selectedFeedback.user.email})
              </Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  {selectedFeedback.message}
                </Typography>
              </Paper>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedFeedback.status}
                  onChange={(e) =>
                    setSelectedFeedback((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: e.target.value as FeedbackStatus,
                          }
                        : null
                    )
                  }
                  label="Status"
                >
                  {Object.values(FeedbackStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Admin Notes"
                multiline
                rows={3}
                fullWidth
                value={selectedFeedback.adminNotes || ''}
                onChange={(e) =>
                  setSelectedFeedback((prev) =>
                    prev
                      ? {
                          ...prev,
                          adminNotes: e.target.value,
                        }
                      : null
                  )
                }
                placeholder="Add internal notes about this feedback..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() =>
              selectedFeedback &&
              handleStatusUpdate(
                selectedFeedback.id,
                selectedFeedback.status,
                selectedFeedback.adminNotes
              )
            }
            variant="contained"
            disabled={updating}
          >
            {updating ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
