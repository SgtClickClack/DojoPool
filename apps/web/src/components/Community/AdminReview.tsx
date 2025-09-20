import { useAuth } from '@/hooks/useAuth';
import {
  CheckCircle as ApproveIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface CosmeticItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  designFileUrl?: string;
  previewImageUrl?: string;
  status: string;
  rejectionReason?: string;
  likes: number;
  views: number;
  creator: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  reviewer?: {
    id: string;
    username: string;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewFormData {
  status: string;
  rejectionReason: string;
  approvedPrice: string;
}

interface BulkOperationResult {
  success: boolean;
  [key: string]: unknown;
}

const AdminReview: React.FC = () => {
  const { user: _user } = useAuth();
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);
  const [reviewFormData, setReviewFormData] = useState<ReviewFormData>({
    status: 'APPROVED',
    rejectionReason: '',
    approvedPrice: '100',
  });

  // Filters
  const [filters, setFilters] = useState({
    status: 'PENDING',
    category: '',
    search: '',
  });

  // Bulk operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<'approve' | 'reject'>(
    'approve'
  );

  useEffect(() => {
    fetchSubmissions();
  }, [filters]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        page: '1',
        limit: '50',
      });

      const response = await fetch(
        `/api/community/admin/submissions?${queryParams}`
      );
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        setError('Failed to fetch submissions');
      }
    } catch (err) {
      setError('Failed to fetch submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (item: CosmeticItem) => {
    setSelectedItem(item);
    setReviewFormData({
      status: 'APPROVED',
      rejectionReason: '',
      approvedPrice: '100',
    });
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch(
        `/api/community/admin/cosmetic-items/${selectedItem.id}/review`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: reviewFormData.status,
            rejectionReason: reviewFormData.rejectionReason || undefined,
            approvedPrice:
              reviewFormData.status === 'APPROVED'
                ? parseInt(reviewFormData.approvedPrice)
                : undefined,
          }),
        }
      );

      if (response.ok) {
        setSuccess(
          `Submission ${reviewFormData.status.toLowerCase()} successfully`
        );
        setReviewDialogOpen(false);
        fetchSubmissions();
      } else {
        setError('Failed to submit review');
      }
    } catch (err) {
      setError('Failed to submit review');
      console.error('Error submitting review:', err);
    }
  };

  const handleBulkOperation = (operation: 'approve' | 'reject') => {
    if (selectedItems.size === 0) {
      setError('Please select items first');
      return;
    }

    setBulkOperation(operation);
    setBulkDialogOpen(true);
  };

  const executeBulkOperation = async () => {
    try {
      const endpoint =
        bulkOperation === 'approve' ? 'bulk-approve' : 'bulk-reject';
      const payload =
        bulkOperation === 'approve'
          ? { itemIds: Array.from(selectedItems), price: 100 }
          : {
              itemIds: Array.from(selectedItems),
              reason: 'Bulk review action',
            };

      const response = await fetch(`/api/community/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const successCount = result.results.filter(
          (r: BulkOperationResult) => r.success
        ).length;
        setSuccess(
          `Successfully ${bulkOperation}d ${successCount} out of ${selectedItems.size} items`
        );
        setSelectedItems(new Set());
        setBulkDialogOpen(false);
        fetchSubmissions();
      } else {
        setError('Bulk operation failed');
      }
    } catch (err) {
      setError('Bulk operation failed');
      console.error('Error in bulk operation:', err);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map((item) => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'REQUIRES_CHANGES':
        return 'info';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      CUE_SKIN: 'Cue Skin',
      BALL_SET: 'Ball Set',
      TABLE_THEME: 'Table Theme',
      TABLE_CLOTH: 'Table Cloth',
      AVATAR_FRAME: 'Avatar Frame',
      PARTICLE_EFFECT: 'Particle Effect',
      SOUND_PACK: 'Sound Pack',
      OTHER: 'Other',
    };
    return categories[category] || category;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <Typography>Loading submissions...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Review Panel
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and manage cosmetic item submissions from the community
          </Typography>
        </Box>

        {selectedItems.size > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<ApproveIcon />}
              onClick={() => handleBulkOperation('approve')}
            >
              Approve Selected ({selectedItems.size})
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<RejectIcon />}
              onClick={() => handleBulkOperation('reject')}
            >
              Reject Selected ({selectedItems.size})
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 3 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="REQUIRES_CHANGES">Requires Changes</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category}
                label="Category"
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="CUE_SKIN">Cue Skin</MenuItem>
                <MenuItem value="BALL_SET">Ball Set</MenuItem>
                <MenuItem value="TABLE_THEME">Table Theme</MenuItem>
                <MenuItem value="TABLE_CLOTH">Table Cloth</MenuItem>
                <MenuItem value="AVATAR_FRAME">Avatar Frame</MenuItem>
                <MenuItem value="PARTICLE_EFFECT">Particle Effect</MenuItem>
                <MenuItem value="SOUND_PACK">Sound Pack</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              placeholder="Search by title or creator..."
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={fetchSubmissions}
              fullWidth
            >
              Apply
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Submissions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={
                    selectedItems.size === items.length && items.length > 0
                  }
                  indeterminate={
                    selectedItems.size > 0 && selectedItems.size < items.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>Submission</TableCell>
              <TableCell>Creator</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Stats</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onChange={(e) =>
                      handleSelectItem(item.id, e.target.checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.title}
                    </Typography>
                    {item.description && (
                      <Typography variant="caption" color="text.secondary">
                        {item.description.substring(0, 60)}...
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={item.creator.avatarUrl}
                      sx={{ width: 32, height: 32 }}
                    >
                      {item.creator.username[0].toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">
                      {item.creator.username}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getCategoryLabel(item.category)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.status}
                    size="small"
                    color={getStatusColor(item.status) as any}
                  />
                  {item.rejectionReason && (
                    <Tooltip title={`Rejection: ${item.rejectionReason}`}>
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        ⚠️
                      </Typography>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    ❤️ {item.likes} | 👁️ {item.views}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleReview(item)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  {item.designFileUrl && (
                    <IconButton
                      size="small"
                      href={item.designFileUrl}
                      target="_blank"
                      color="info"
                    >
                      <ViewIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {items.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No submissions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters to see more submissions.
          </Typography>
        </Paper>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Submission: {selectedItem?.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Decision</InputLabel>
              <Select
                value={reviewFormData.status}
                label="Decision"
                onChange={(e) =>
                  setReviewFormData({
                    ...reviewFormData,
                    status: e.target.value,
                  })
                }
              >
                <MenuItem value="APPROVED">Approve</MenuItem>
                <MenuItem value="REJECTED">Reject</MenuItem>
                <MenuItem value="REQUIRES_CHANGES">Requires Changes</MenuItem>
              </Select>
            </FormControl>

            {reviewFormData.status === 'APPROVED' && (
              <TextField
                fullWidth
                label="Marketplace Price (DojoCoins)"
                type="number"
                value={reviewFormData.approvedPrice}
                onChange={(e) =>
                  setReviewFormData({
                    ...reviewFormData,
                    approvedPrice: e.target.value,
                  })
                }
                helperText="Price in DojoCoins for approved items"
              />
            )}

            {(reviewFormData.status === 'REJECTED' ||
              reviewFormData.status === 'REQUIRES_CHANGES') && (
              <TextField
                fullWidth
                label="Feedback/Reason"
                value={reviewFormData.rejectionReason}
                onChange={(e) =>
                  setReviewFormData({
                    ...reviewFormData,
                    rejectionReason: e.target.value,
                  })
                }
                multiline
                rows={3}
                required
                helperText="Provide constructive feedback to help the creator improve"
              />
            )}

            {selectedItem && (
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Submission Details:
                </Typography>
                <Typography variant="body2">
                  Creator: {selectedItem.creator.username}
                </Typography>
                <Typography variant="body2">
                  Category: {getCategoryLabel(selectedItem.category)}
                </Typography>
                <Typography variant="body2">
                  Created:{' '}
                  {new Date(selectedItem.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitReview} variant="contained">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Operation Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bulk {bulkOperation === 'approve' ? 'Approve' : 'Reject'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {bulkOperation} {selectedItems.size}{' '}
            selected submissions?
          </Typography>
          {bulkOperation === 'approve' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              All approved items will be set to 100 DojoCoins and added to the
              marketplace.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={executeBulkOperation}
            variant="contained"
            color="primary"
          >
            Confirm {bulkOperation}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminReview;
