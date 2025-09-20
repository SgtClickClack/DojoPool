import {
  getContentFeed,
  getUserContent,
  likeContent,
  shareContent,
} from '@/services/APIService';
interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

import {
  type Content,
  type ContentFilter,
  type ContentLikeResponse,
  type ContentListResponse,
  ContentType,
  ContentVisibility,
} from '@/types/content';
import {
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface SocialFeedProps {
  userId?: string; // If provided, shows user's content instead of general feed
  showFilters?: boolean;
  onContentClick?: (content: Content) => void;
}

const contentTypeLabels = {
  [ContentType.MATCH_REPLAY]: '🎮 Match Replay',
  [ContentType.CUSTOM_ITEM]: '🎨 Custom Item',
  [ContentType.HIGH_SCORE]: '🏆 High Score',
  [ContentType.ACHIEVEMENT]: '🎯 Achievement',
  [ContentType.TOURNAMENT_HIGHLIGHT]: '🏟️ Tournament',
  [ContentType.VENUE_REVIEW]: '🏢 Venue Review',
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

export const SocialFeed: React.FC<SocialFeedProps> = ({
  userId,
  showFilters = true,
  onContentClick,
}) => {
  const [content, setContent] = useState<ContentListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContentFilter>({});
  const [page, setPage] = useState(1);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [shareWithIds, setShareWithIds] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);

  const loadContent = async () => {
    try {
      setLoading(true);
      let response: ContentListResponse;

      if (userId) {
        response = await getUserContent(userId, page, 20);
      } else {
        response = await getContentFeed(filters, page, 20);
      }

      setContent(response);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as AxiosError).response?.data?.message ||
            'Failed to load content'
          : 'Failed to load content';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, [userId, filters, page]);

  const handleLike = async (contentId: string) => {
    try {
      const result: ContentLikeResponse = await likeContent(contentId);

      // Update local state
      setContent((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((item) =>
                item.id === contentId
                  ? {
                      ...item,
                      likes: result.liked ? item.likes + 1 : item.likes - 1,
                      userLiked: result.liked,
                    }
                  : item
              ),
            }
          : null
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as AxiosError).response?.data?.message ||
            'Failed to like content'
          : 'Failed to like content';
      setError(errorMessage);
    }
  };

  const handleShare = async (content: Content) => {
    setSelectedContent(content);
    setShareDialogOpen(true);
  };

  const handleShareSubmit = async () => {
    if (!selectedContent || shareWithIds.length === 0) return;

    setSharing(true);
    try {
      await shareContent(selectedContent.id, shareWithIds);

      // Update local state
      setContent((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((item) =>
                item.id === selectedContent.id
                  ? {
                      ...item,
                      shares: item.shares + shareWithIds.length,
                      userShared: true,
                    }
                  : item
              ),
            }
          : null
      );

      setShareDialogOpen(false);
      setSelectedContent(null);
      setShareWithIds([]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error && 'response' in err
          ? (err as AxiosError).response?.data?.message ||
            'Failed to share content'
          : 'Failed to share content';
      setError(errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const renderContentCard = (item: Content) => (
    <Card key={item.id} sx={{ mb: 2 }}>
      {/* Header */}
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            src={item.user.avatarUrl}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {item.user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {item.user.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(item.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={contentTypeLabels[item.contentType]}
              size="small"
              variant="outlined"
            />
            <Chip
              label={visibilityLabels[item.visibility]}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom>
          {item.title}
        </Typography>

        {item.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {item.description}
          </Typography>
        )}

        {item.tags && item.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {item.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}
      </CardContent>

      {/* Media */}
      {item.fileUrl && (
        <CardMedia
          component="img"
          height="300"
          image={item.thumbnailUrl || item.fileUrl}
          alt={item.title}
          sx={{ cursor: 'pointer' }}
          onClick={() => onContentClick?.(item)}
        />
      )}

      {/* Actions */}
      <CardActions sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <IconButton
              onClick={() => handleLike(item.id)}
              color={item.userLiked ? 'error' : 'default'}
              size="small"
            >
              {item.userLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {item.likes}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <IconButton
              onClick={() => handleShare(item)}
              color={item.userShared ? 'primary' : 'default'}
              size="small"
            >
              <ShareIcon />
            </IconButton>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {item.shares}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <VisibilityIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {item.views}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Button size="small" onClick={() => onContentClick?.(item)}>
            View Details
          </Button>
        </Box>
      </CardActions>
    </Card>
  );

  if (loading && !content) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {userId
          ? `${content?.content[0]?.user.username}'s Content`
          : 'Social Feed'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      {showFilters && !userId && (
        <Paper sx={{ p: 2, mb: 3 }}>
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
            <TextField
              select
              label="Content Type"
              size="small"
              sx={{ minWidth: 150 }}
              value={filters.contentType || ''}
              SelectProps={{
                title: 'Filter by content type',
                'aria-label': 'Filter by content type',
              }}
              inputProps={{
                'aria-label': 'Content type filter',
              }}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  contentType: (e.target.value as ContentType) || undefined,
                }))
              }
            >
              <option value="">All Types</option>
              {Object.entries(contentTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </TextField>
          </Box>
        </Paper>
      )}

      {/* Content Feed */}
      {content && content.content.length > 0 ? (
        <>
          {content.content.map(renderContentCard)}

          {/* Pagination */}
          {content.pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                disabled={!content.pagination.hasPrev}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ mx: 2, alignSelf: 'center' }}>
                Page {page} of {content.pagination.totalPages}
              </Typography>
              <Button
                disabled={!content.pagination.hasNext}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {userId ? 'No content shared yet' : 'No content in your feed'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userId
              ? "This user hasn't shared any content yet."
              : 'Follow friends or explore public content to see posts here.'}
          </Typography>
        </Paper>
      )}

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Content</DialogTitle>
        <DialogContent>
          {selectedContent && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedContent.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share this content with your friends
              </Typography>

              <TextField
                label="Share with (User IDs)"
                fullWidth
                multiline
                rows={3}
                value={shareWithIds.join('\n')}
                onChange={(e) =>
                  setShareWithIds(
                    e.target.value.split('\n').filter((id) => id.trim())
                  )
                }
                placeholder="Enter user IDs (one per line)"
                helperText="Enter the user IDs you want to share this content with"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleShareSubmit}
            variant="contained"
            disabled={sharing || shareWithIds.length === 0}
          >
            {sharing ? <CircularProgress size={20} /> : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
