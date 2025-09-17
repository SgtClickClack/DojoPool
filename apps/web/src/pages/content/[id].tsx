import {
  getContentById,
  likeContent,
  shareContent,
} from '@/services/APIService';
import { Content, ContentLikeResponse } from '@dojopool/types';
import {
  ArrowBack as ArrowBackIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Link,
  Paper,
  Typography,
} from '@mui/material';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const contentTypeLabels = {
  MATCH_REPLAY: '🎮 Match Replay',
  CUSTOM_ITEM: '🎨 Custom Item',
  HIGH_SCORE: '🏆 High Score',
  ACHIEVEMENT: '🎯 Achievement',
  TOURNAMENT_HIGHLIGHT: '🏟️ Tournament Highlight',
  VENUE_REVIEW: '🏢 Venue Review',
  GENERAL: '💬 General Content',
  EVENT: '📅 Event',
  NEWS_ARTICLE: '📰 News Article',
  SYSTEM_MESSAGE: '📢 System Message',
};

const visibilityLabels = {
  PUBLIC: '🌐 Public',
  FRIENDS_ONLY: '👥 Friends Only',
  PRIVATE: '🔒 Private',
};

const ContentDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadContent();
    }
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const contentData = await getContentById(id as string);
      setContent(contentData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!content) return;

    setLiking(true);
    try {
      const result: ContentLikeResponse = await likeContent(content.id);
      setContent((prev) =>
        prev
          ? {
              ...prev,
              likes: result.liked ? prev.likes + 1 : prev.likes - 1,
              userLiked: result.liked,
            }
          : null
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to like content');
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    if (!content) return;

    const shareWithIds = prompt(
      'Enter user IDs to share with (comma-separated):'
    );
    if (!shareWithIds?.trim()) return;

    try {
      const userIds = shareWithIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id);
      await shareContent(content.id, userIds);

      setContent((prev) =>
        prev
          ? {
              ...prev,
              shares: prev.shares + userIds.length,
              userShared: true,
            }
          : null
      );

      alert('Content shared successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to share content');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !content) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Content not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link color="inherit" href="/dashboard">
          Dashboard
        </Link>
        <Link color="inherit" href="/social-feed">
          Social Feed
        </Link>
        <Typography color="text.primary">{content.title}</Typography>
      </Breadcrumbs>

      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
        >
          Back to Feed
        </Button>
      </Box>

      {/* Content Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
          <Avatar
            src={content.user.avatarUrl}
            sx={{ width: 64, height: 64, mr: 3 }}
          >
            {content.user.username.charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
              {content.title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="subtitle1" color="text.secondary">
                by {content.user.username}
              </Typography>
              <Chip
                label={contentTypeLabels[content.contentType]}
                size="small"
                variant="outlined"
              />
              <Chip
                label={visibilityLabels[content.visibility]}
                size="small"
                variant="outlined"
              />
            </Box>

            <Typography variant="caption" color="text.secondary">
              {new Date(content.createdAt).toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {content.description && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" sx={{ mb: 2 }}>
              {content.description}
            </Typography>
          </>
        )}

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {content.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}

        {/* Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleLike}
              disabled={liking}
              color={content.userLiked ? 'error' : 'default'}
            >
              {content.userLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {content.likes} likes
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleShare}
              color={content.userShared ? 'primary' : 'default'}
            >
              <ShareIcon />
            </IconButton>
            <Typography variant="body2" sx={{ ml: 1 }}>
              {content.shares} shares
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VisibilityIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {content.views} views
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Content Media */}
      {content.fileUrl && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Content
          </Typography>

          {content.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
            <img
              src={content.thumbnailUrl || content.fileUrl}
              alt={content.title}
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }}
            />
          ) : content.fileUrl.match(/\.(mp4|webm|ogg)$/i) ? (
            <video
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              }}
            >
              <source src={content.fileUrl} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <Box sx={{ p: 4 }}>
              <Typography variant="body1" gutterBottom>
                File: {content.fileUrl.split('/').pop()}
              </Typography>
              <Button
                variant="contained"
                href={content.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download/View File
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* Metadata */}
      {Object.keys(content.metadata).length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Additional Information
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 2,
            }}
          >
            {Object.entries(content.metadata).map(([key, value]) => (
              <Box key={key}>
                <Typography variant="subtitle2" color="text.secondary">
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </Typography>
                <Typography variant="body2">
                  {typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ContentDetailPage;
