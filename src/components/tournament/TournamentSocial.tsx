import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
  Tabs,
  Tab,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  Add,
  Event,
  People,
  TrendingUp,
  EmojiEvents,
  Star,
  LocationOn,
  Schedule,
  Group,
  Chat,
  Visibility,
  ThumbUp,
  Send,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '1px solid #00d4ff',
  borderRadius: 12,
  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 212, 255, 0.2)',
  },
}));

const PostCard = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)',
  border: '1px solid #00d4ff',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #00d4ff, #ff0080)',
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`social-tabpanel-${index}`}
      aria-labelledby={`social-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentSocial: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showNewEventDialog, setShowNewEventDialog] = useState(false);
  const [socialData, setSocialData] = useState({
    posts: [],
    events: [],
    userProfiles: [],
    stats: {
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
      totalShares: 0,
      activeUsers: 0,
      trendingTopics: [],
      topContributors: [],
    },
  });

  useEffect(() => {
    // Mock data for demonstration
    const mockData = {
      posts: [
        {
          id: 'post1',
          userId: 'user1',
          userName: 'Neon Shadow',
          userAvatar: '/avatars/neon-shadow.jpg',
          content: 'Just won the Cyber Championship! What an incredible tournament. Thanks to everyone who supported me throughout this journey. The competition was fierce, but the community made it special! 🏆🎱',
          type: 'achievement',
          tournamentId: 'tournament_001',
          likes: 156,
          comments: [
            {
              id: 'comment1',
              userId: 'user2',
              userName: 'Digital Phantom',
              userAvatar: '/avatars/digital-phantom.jpg',
              content: 'Congratulations! You played amazingly. Looking forward to our next match!',
              likes: 23,
              createdAt: new Date(Date.now() - 1800000),
              replies: [],
            },
          ],
          shares: 45,
          createdAt: new Date(Date.now() - 3600000),
          isPinned: true,
          tags: ['championship', 'victory', 'cyber-tournament'],
        },
        {
          id: 'post2',
          userId: 'user2',
          userName: 'Digital Phantom',
          userAvatar: '/avatars/digital-phantom.jpg',
          content: 'Hosting a defensive strategy workshop this weekend at Cyber Pool LA. Perfect for players looking to improve their safety game. Limited spots available! 🛡️🎱',
          type: 'general',
          likes: 89,
          comments: [],
          shares: 23,
          createdAt: new Date(Date.now() - 7200000),
          isPinned: false,
          tags: ['workshop', 'defensive-strategy', 'training'],
        },
      ],
      events: [
        {
          id: 'event1',
          title: 'Cyber Championship Watch Party',
          description: 'Join us for an epic watch party as we follow the Cyber Championship finals! Food, drinks, and great company guaranteed.',
          type: 'watch_party',
          venueName: 'Cyber Pool LA',
          startDate: new Date(Date.now() + 86400000),
          endDate: new Date(Date.now() + 86400000 + 18000000),
          maxParticipants: 50,
          currentParticipants: 32,
          organizerName: 'Digital Phantom',
          isOnline: false,
          tags: ['watch-party', 'championship', 'social'],
          status: 'upcoming',
        },
        {
          id: 'event2',
          title: 'Online Strategy Discussion',
          description: 'Weekly online meetup to discuss advanced pool strategies and share tips. All skill levels welcome!',
          type: 'meetup',
          startDate: new Date(Date.now() + 604800000),
          endDate: new Date(Date.now() + 604800000 + 7200000),
          maxParticipants: 100,
          currentParticipants: 45,
          organizerName: 'Cyber Striker',
          isOnline: true,
          meetingUrl: 'https://meet.cyberpool.com/strategy-discussion',
          tags: ['online', 'strategy', 'discussion'],
          status: 'upcoming',
        },
      ],
      userProfiles: [
        {
          id: 'user1',
          name: 'Neon Shadow',
          avatar: '/avatars/neon-shadow.jpg',
          bio: 'Professional pool player and tournament champion. Love the competitive spirit!',
          location: 'New York, NY',
          followers: 1250,
          following: 340,
          tournamentsPlayed: 45,
          tournamentsWon: 12,
          totalMatches: 320,
          winRate: 0.78,
          isOnline: true,
          lastActive: new Date(),
        },
        {
          id: 'user2',
          name: 'Digital Phantom',
          avatar: '/avatars/digital-phantom.jpg',
          bio: 'Defensive specialist with a love for strategic gameplay.',
          location: 'Los Angeles, CA',
          followers: 890,
          following: 215,
          tournamentsPlayed: 32,
          tournamentsWon: 8,
          totalMatches: 245,
          winRate: 0.72,
          isOnline: false,
          lastActive: new Date(Date.now() - 3600000),
        },
      ],
      stats: {
        totalPosts: 156,
        totalComments: 342,
        totalLikes: 2847,
        totalShares: 567,
        activeUsers: 89,
        trendingTopics: ['championship', 'strategy', 'training', 'community', 'tournament'],
        topContributors: [
          { id: 'user1', name: 'Neon Shadow', avatar: '/avatars/neon-shadow.jpg', followers: 1250 },
          { id: 'user2', name: 'Digital Phantom', avatar: '/avatars/digital-phantom.jpg', followers: 890 },
          { id: 'user3', name: 'Cyber Striker', avatar: '/avatars/cyber-striker.jpg', followers: 650 },
        ],
      },
    };

    setSocialData(mockData);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleLikePost = (postId: string) => {
    setSocialData(prev => ({
      ...prev,
      posts: prev.posts.map(post =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      ),
    }));
  };

  const handleCreatePost = () => {
    if (newPostContent.trim()) {
      const newPost = {
        id: `post_${Date.now()}`,
        userId: 'currentUser',
        userName: 'Current User',
        userAvatar: '/avatars/default.jpg',
        content: newPostContent,
        type: 'general',
        likes: 0,
        comments: [],
        shares: 0,
        createdAt: new Date(),
        isPinned: false,
        tags: [],
      };

      setSocialData(prev => ({
        ...prev,
        posts: [newPost, ...prev.posts],
        stats: {
          ...prev.stats,
          totalPosts: prev.stats.totalPosts + 1,
        },
      }));

      setNewPostContent('');
      setShowNewPostDialog(false);
    }
  };

  const renderSocialFeed = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#00d4ff' }}>
          Community Feed
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowNewPostDialog(true)}
          sx={{
            background: 'linear-gradient(45deg, #00d4ff 30%, #ff0080 90%)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(45deg, #00d4ff 10%, #ff0080 100%)',
            },
          }}
        >
          New Post
        </Button>
      </Box>

      {socialData.posts.map((post: any) => (
        <PostCard key={post.id}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              src={post.userAvatar}
              sx={{ width: 48, height: 48, mr: 2, border: '2px solid #00d4ff' }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                {post.userName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                {new Date(post.createdAt).toLocaleString()}
              </Typography>
            </Box>
            {post.isPinned && (
              <Chip
                label="Pinned"
                size="small"
                sx={{ bgcolor: '#ff0080', color: '#ffffff' }}
              />
            )}
          </Box>

          <Typography variant="body1" sx={{ color: '#ffffff', mb: 2 }}>
            {post.content}
          </Typography>

          {post.tags.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {post.tags.map((tag: string) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  sx={{ mr: 1, mb: 1, bgcolor: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff' }}
                />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton
              onClick={() => handleLikePost(post.id)}
              sx={{ color: '#ff0080' }}
            >
              <Favorite />
            </IconButton>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              {post.likes}
            </Typography>
            <IconButton sx={{ color: '#00d4ff' }}>
              <Comment />
            </IconButton>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              {post.comments.length}
            </Typography>
            <IconButton sx={{ color: '#ffaa00' }}>
              <Share />
            </IconButton>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              {post.shares}
            </Typography>
          </Box>

          {post.comments.length > 0 && (
            <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid rgba(0, 212, 255, 0.3)' }}>
              {post.comments.slice(0, 2).map((comment: any) => (
                <Box key={comment.id} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Avatar
                      src={comment.userAvatar}
                      sx={{ width: 24, height: 24, mr: 1 }}
                    />
                    <Typography variant="subtitle2" sx={{ color: '#00d4ff', mr: 1 }}>
                      {comment.userName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#ffffff', ml: 3 }}>
                    {comment.content}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </PostCard>
      ))}
    </Box>
  );

  const renderCommunityEvents = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#00d4ff' }}>
          Community Events
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowNewEventDialog(true)}
          sx={{
            background: 'linear-gradient(45deg, #00d4ff 30%, #ff0080 90%)',
            color: '#ffffff',
            '&:hover': {
              background: 'linear-gradient(45deg, #00d4ff 10%, #ff0080 100%)',
            },
          }}
        >
          Create Event
        </Button>
      </Box>

      <Grid container spacing={3}>
        {socialData.events.map((event: any) => (
          <Grid item xs={12} md={6} key={event.id}>
            <StyledCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Event sx={{ color: '#00d4ff', mr: 1 }} />
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    {event.title}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 2 }}>
                  {event.description}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Schedule sx={{ color: '#ffaa00', mr: 1, fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                    {new Date(event.startDate).toLocaleDateString()} at{' '}
                    {new Date(event.startDate).toLocaleTimeString()}
                  </Typography>
                </Box>

                {event.venueName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ color: '#ff0080', mr: 1, fontSize: 16 }} />
                    <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                      {event.venueName}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People sx={{ color: '#00ff88', mr: 1, fontSize: 16 }} />
                  <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                    {event.currentParticipants}/{event.maxParticipants} participants
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  {event.tags.map((tag: string) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ mr: 1, mb: 1, bgcolor: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff' }}
                    />
                  ))}
                </Box>

                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: '#00d4ff',
                    color: '#00d4ff',
                    '&:hover': {
                      borderColor: '#ff0080',
                      color: '#ff0080',
                    },
                  }}
                >
                  Join Event
                </Button>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderCommunityStats = () => (
    <StyledCard sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2, display: 'flex', alignItems: 'center' }}>
          <TrendingUp sx={{ mr: 1 }} />
          Community Statistics
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#00d4ff' }}>
                {socialData.stats.totalPosts}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                Total Posts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#ff0080' }}>
                {socialData.stats.totalLikes}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                Total Likes
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#00ff88' }}>
                {socialData.stats.activeUsers}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                Active Users
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#ffaa00' }}>
                {socialData.stats.totalComments}
              </Typography>
              <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                Comments
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(0, 212, 255, 0.3)' }} />

        <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
          Trending Topics
        </Typography>
        <Box sx={{ mb: 3 }}>
          {socialData.stats.trendingTopics.map((topic: string) => (
            <Chip
              key={topic}
              label={`#${topic}`}
              sx={{ mr: 1, mb: 1, bgcolor: 'rgba(0, 212, 255, 0.2)', color: '#00d4ff' }}
            />
          ))}
        </Box>

        <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
          Top Contributors
        </Typography>
        <List>
          {socialData.stats.topContributors.map((contributor: any, index: number) => (
            <ListItem key={contributor.id} sx={{ px: 0 }}>
              <ListItemIcon>
                <Badge badgeContent={index + 1} color="primary">
                  <Avatar src={contributor.avatar} sx={{ border: '2px solid #00d4ff' }} />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ color: '#ffffff' }}>
                    {contributor.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {contributor.followers} followers
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </StyledCard>
  );

  return (
    <Box sx={{ p: 3, minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)' }}>
      <Typography variant="h4" sx={{ color: '#00d4ff', mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
        Tournament Social Hub
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(0, 212, 255, 0.3)', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#b0b0b0',
              '&.Mui-selected': {
                color: '#00d4ff',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00d4ff',
            },
          }}
        >
          <Tab label="Community Feed" />
          <Tab label="Events" />
          <Tab label="Statistics" />
        </Tabs>
      </Box>
      
      <TabPanel value={activeTab} index={0}>
        {renderSocialFeed()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        {renderCommunityEvents()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        {renderCommunityStats()}
      </TabPanel>

      {/* New Post Dialog */}
      <Dialog
        open={showNewPostDialog}
        onClose={() => setShowNewPostDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid #00d4ff',
          },
        }}
      >
        <DialogTitle sx={{ color: '#00d4ff' }}>Create New Post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="What's on your mind?"
            fullWidth
            multiline
            rows={4}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#ffffff',
                '& fieldset': {
                  borderColor: '#00d4ff',
                },
                '&:hover fieldset': {
                  borderColor: '#ff0080',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#b0b0b0',
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowNewPostDialog(false)}
            sx={{ color: '#b0b0b0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePost}
            disabled={!newPostContent.trim()}
            sx={{
              background: 'linear-gradient(45deg, #00d4ff 30%, #ff0080 90%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(45deg, #00d4ff 10%, #ff0080 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 212, 255, 0.3)',
                color: '#b0b0b0',
              },
            }}
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentSocial; 