import {
  getAllContent,
  getContentStats,
  moderateContent,
} from '@/services/APIService';
import {
  Content,
  ContentFilter,
  ContentListResponse,
  ContentStats,
  ContentStatus,
  ContentType,
  ContentVisibility,
  ModerateContentRequest,
} from '@dojopool/types';
import {
  CheckCircle as ApproveIcon,
  Archive as ArchiveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
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
  IconButton,
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
  [ContentStatus.PENDING]: {
    bg: 'warning.light',
    color: 'warning.contrastText',
  },
  [ContentStatus.APPROVED]: {
    bg: 'success.light',
    color: 'success.contrastText',
  },
  [ContentStatus.REJECTED]: { bg: 'error.light', color: 'error.contrastText' },
  [ContentStatus.ARCHIVED]: { bg: 'grey.400', color: 'grey.contrastText' },
} as const;

const contentTypeLabels = {
  [ContentType.MATCH_REPLAY]: '🎮 Match',
  [ContentType.CUSTOM_ITEM]: '🎨 Custom',
  [ContentType.HIGH_SCORE]: '🏆 Score',
  [ContentType.ACHIEVEMENT]: '🎯 Achievement',
  [ContentType.TOURNAMENT_HIGHLIGHT]: '🏟️ Tournament',
  [ContentType.VENUE_REVIEW]: '🏢 Venue',
  [ContentType.GENERAL]: '💬 General',
  [ContentType.EVENT]: '📅 Event',
  [ContentType.NEWS_ARTICLE]: '📰 News',
  [ContentType.SYSTEM_MESSAGE]: '📢 System',
};

const visibilityLabels = {
  [ContentVisibility.PUBLIC]: '🌐 Public',
  [ContentVisibility.FRIENDS_ONLY]: '👥 Friends',
  [ContentVisibility.PRIVATE]: '🔒 Private',
};

interface AdminContentModerationProps {
  onContentUpdated?: () => void;
}

export const AdminContentModeration: React.FC<AdminContentModerationProps> = ({
  onContentUpdated,
}) => {
  const [content, setContent] = useState<ContentListResponse | null>(null);
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContentFilter>({});
  const [page, setPage] = useState(1);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [moderateDialogOpen, setModerateDialogOpen] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [moderationData, setModerationData] = useState<ModerateContentRequest>({
    status: ContentStatus.APPROVED,
    moderationNotes: '',
  });

  const loadContent = async () => {
    try {
      setLoading(true);
      const [contentResponse, statsResponse] = await Promise.all([
        getAllContent(filters, page, 20),
        getContentStats(),
      ]);
      setContent(contentResponse);
      setStats(statsResponse);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [filters, page]);

  const handleModerate = async () => {
    if (!selectedContent) return;

    setModerating(true);
    try {
      const updatedContent = await moderateContent(
        selectedContent.id,
        moderationData
      );
      setContent((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((c) =>
                c.id === selectedContent.id ? updatedContent : c
              ),
            }
          : null
      );
      setModerateDialogOpen(false);
      setSelectedContent(null);
      setModerationData({
        status: ContentStatus.APPROVED,
        moderationNotes: '',
      });
      onContentUpdated?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to moderate content');
    } finally {
      setModerating(false);
    }
  };

  const openModerateDialog = (content: Content) => {
    setSelectedContent(content);
    setModerationData({
      status: ContentStatus.APPROVED,
      moderationNotes: '',
    });
    setModerateDialogOpen(true);
  };

  if (loading && !content) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Content Moderation Dashboard
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
                  Total Content
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
                <Typography variant="h6" color="success.main">
                  {stats.approved}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {stats.rejected}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejected
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
          <TextField
            label="Search"
            size="small"
            value={filters.search || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value || undefined,
              }))
            }
            placeholder="Search content..."
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: (e.target.value as ContentStatus) || undefined,
                }))
              }
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(ContentStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.contentType || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  contentType: (e.target.value as ContentType) || undefined,
                }))
              }
              label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.entries(contentTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={filters.visibility || ''}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  visibility:
                    (e.target.value as ContentVisibility) || undefined,
                }))
              }
              label="Visibility"
            >
              <MenuItem value="">All</MenuItem>
              {Object.entries(visibilityLabels).map(([value, label]) => (
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

      {/* Content Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Content</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Visibility</TableCell>
              <TableCell>Stats</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {content?.content.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.title}
                    </Typography>
                    {item.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={item.user.avatarUrl}
                      sx={{ width: 32, height: 32, mr: 1 }}
                    >
                      {item.user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2">
                      {item.user.username}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={contentTypeLabels[item.contentType]}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.status.replace('_', ' ')}
                    size="small"
                    sx={{
                      bgcolor: statusColors[item.status].bg,
                      color: statusColors[item.status].color,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {visibilityLabels[item.visibility]}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="caption" display="block">
                      ❤️ {item.likes} 👍 {item.shares}
                    </Typography>
                    <Typography variant="caption" display="block">
                      👁️ {item.views}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => window.open(item.fileUrl || '#', '_blank')}
                      disabled={!item.fileUrl}
                    >
                      <ViewIcon />
                    </IconButton>

                    {item.status === ContentStatus.PENDING && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => openModerateDialog(item)}
                        >
                          <ApproveIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedContent(item);
                            setModerationData({
                              status: ContentStatus.REJECTED,
                              moderationNotes: '',
                            });
                            setModerateDialogOpen(true);
                          }}
                        >
                          <RejectIcon />
                        </IconButton>
                      </>
                    )}

                    {item.status === ContentStatus.APPROVED && (
                      <IconButton
                        size="small"
                        color="default"
                        onClick={() => {
                          setSelectedContent(item);
                          setModerationData({
                            status: ContentStatus.ARCHIVED,
                            moderationNotes: '',
                          });
                          setModerateDialogOpen(true);
                        }}
                      >
                        <ArchiveIcon />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {content && content.pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={content.pagination.totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Moderation Dialog */}
      <Dialog
        open={moderateDialogOpen}
        onClose={() => setModerateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Moderate Content: {selectedContent?.title}</DialogTitle>
        <DialogContent>
          {selectedContent && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Content Details
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Creator:</strong> {selectedContent.user.username}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Type:</strong>{' '}
                  {contentTypeLabels[selectedContent.contentType]}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Visibility:</strong>{' '}
                  {visibilityLabels[selectedContent.visibility]}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Created:</strong>{' '}
                  {new Date(selectedContent.createdAt).toLocaleString()}
                </Typography>

                {selectedContent.description && (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Description:</strong> {selectedContent.description}
                  </Typography>
                )}

                {selectedContent.fileUrl && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>File:</strong>
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        window.open(selectedContent.fileUrl!, '_blank')
                      }
                    >
                      View File
                    </Button>
                  </Box>
                )}
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Action</InputLabel>
                <Select
                  value={moderationData.status}
                  onChange={(e) =>
                    setModerationData((prev) => ({
                      ...prev,
                      status: e.target.value as ContentStatus,
                    }))
                  }
                  label="Action"
                >
                  <MenuItem value={ContentStatus.APPROVED}>✅ Approve</MenuItem>
                  <MenuItem value={ContentStatus.REJECTED}>❌ Reject</MenuItem>
                  <MenuItem value={ContentStatus.ARCHIVED}>📁 Archive</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Moderation Notes (Optional)"
                multiline
                rows={3}
                fullWidth
                value={moderationData.moderationNotes}
                onChange={(e) =>
                  setModerationData((prev) => ({
                    ...prev,
                    moderationNotes: e.target.value,
                  }))
                }
                placeholder="Add notes about your moderation decision..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModerateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleModerate}
            variant="contained"
            disabled={moderating}
          >
            {moderating ? <CircularProgress size={20} /> : 'Moderate Content'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
