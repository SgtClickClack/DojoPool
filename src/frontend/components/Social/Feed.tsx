import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import ShareIcon from '@mui/icons-material/Share';

interface FeedItem {
  id: string;
  type: 'achievement' | 'game' | 'tournament' | 'social';
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  media?: {
    type: 'image' | 'video';
    url: string;
  };
}

const Feed: React.FC = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/v1/feed');
        // Backend returns { data: { entries: [] } }
        setFeedItems(response.data?.data?.entries || []);
        setError(null);
      } catch (err) {
        setError('Failed to load feed data. Please try again later.');
        console.error('Error fetching feed data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFeedData();
    }
  }, [user]);

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    itemId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedItemId(itemId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItemId(null);
  };

  const handleLike = async (itemId: string) => {
    try {
      await axiosInstance.post(`/v1/feed/${itemId}/like`);
      setFeedItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, likes: item.likes + 1 } : item
        )
      );
    } catch (err) {
      console.error('Error liking feed item:', err);
    }
  };

  const handleShare = async (itemId: string) => {
    try {
      await axiosInstance.post(`/v1/feed/${itemId}/share`);
      setFeedItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, shares: item.shares + 1 } : item
        )
      );
    } catch (err) {
      console.error('Error sharing feed item:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Activity Feed
      </Typography>
      <List>
        {feedItems.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem
              alignItems="flex-start"
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={(e) => handleMenuClick(e, item.id)}
                >
                  <MoreVertIcon />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Avatar src={item.user.avatar} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography
                      component="span"
                      variant="subtitle1"
                      sx={{ fontWeight: 'bold', mr: 1 }}
                    >
                      {item.user.name}
                    </Typography>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body1" paragraph>
                      {item.content}
                    </Typography>
                    {item.media && (
                      <Box
                        component="img"
                        src={item.media.url}
                        alt="Feed media"
                        sx={{
                          width: '100%',
                          maxHeight: 300,
                          objectFit: 'cover',
                          borderRadius: 1,
                          mb: 1,
                        }}
                      />
                    )}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        startIcon={<ThumbUpIcon />}
                        onClick={() => handleLike(item.id)}
                      >
                        {item.likes}
                      </Button>
                      <Button startIcon={<CommentIcon />}>
                        {item.comments}
                      </Button>
                      <Button
                        startIcon={<ShareIcon />}
                        onClick={() => handleShare(item.id)}
                      >
                        {item.shares}
                      </Button>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Report</MenuItem>
        <MenuItem onClick={handleMenuClose}>Hide</MenuItem>
      </Menu>
    </Paper>
  );
};

export default Feed;
