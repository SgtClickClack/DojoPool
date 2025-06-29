import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Tabs,
  Tab,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Divider,
  Badge,
  Tooltip,
  Fab,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Send,
  Chat,
  Forum,
  People,
  TrendingUp,
  Favorite,
  FavoriteBorder,
  Share,
  Comment,
  Reply,
  EmojiEmotions,
  Add,
  Close,
  PersonAdd,
  Star,
  Visibility,
  VisibilityOff,
  SportsEsports,
  EmojiEvents,
  Psychology,
  Speed,
  CheckCircle,
  Warning,
  Info,
  MoreVert,
  AttachFile,
  Image,
  VideoLibrary,
  Gif,
  Poll,
  LocationOn,
  Schedule,
  Public,
  Group,
  Notifications,
  NotificationsOff,
} from '@mui/icons-material';
import TournamentSocialService, {
  TournamentChat,
  ChatMessage,
  CommunityPost,
  SocialProfile,
  SocialStats,
  Comment as PostComment,
} from '../../services/social/TournamentSocialService';

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
  const [tabValue, setTabValue] = useState(0);
  const [tournamentId, setTournamentId] = useState('tournament_001');
  const [chat, setChat] = useState<TournamentChat | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newPost, setNewPost] = useState('');
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<SocialProfile | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socialService = TournamentSocialService.getInstance();

  useEffect(() => {
    initializeSocial();
    return () => {
      socialService.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const initializeSocial = async () => {
    try {
      // Mock user ID - in real app, get from auth context
      const userId = 'user_001';
      
      // Join tournament chat
      const tournamentChat = await socialService.joinTournamentChat(tournamentId, userId);
      setChat(tournamentChat);
      
      // Load community posts
      const trendingPosts = await socialService.getTrendingPosts(tournamentId);
      setPosts(trendingPosts);
      
      // Load social stats
      const socialStats = await socialService.getSocialStats(tournamentId);
      setStats(socialStats);
      
      setIsConnected(true);
      showNotification('Connected to tournament social features!', 'success');
    } catch (error) {
      console.error('Error initializing social features:', error);
      showNotification('Failed to connect to social features', 'error');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat) return;

    try {
      const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
        tournamentId: chat.tournamentId,
        senderId: 'user_001', // Mock user ID
        senderName: 'CyberPlayer',
        senderAvatar: '/images/avatars/default.jpg',
        message: newMessage,
        type: 'text',
        reactions: {},
      };

      await socialService.sendMessage(chat.tournamentId, message);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message', 'error');
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    try {
      const post: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'shares'> = {
        authorId: 'user_001',
        authorName: 'CyberPlayer',
        authorAvatar: '/images/avatars/default.jpg',
        content: newPost,
        tournamentId,
        tags: ['tournament', 'pool', 'gaming'],
      };

      await socialService.createCommunityPost(post);
      setNewPost('');
      showNotification('Post created successfully!', 'success');
    } catch (error) {
      console.error('Error creating post:', error);
      showNotification('Failed to create post', 'error');
    }
  };

  const likePost = async (postId: string) => {
    try {
      await socialService.likePost(postId, 'user_001');
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? { ...post, likes: post.likes + 1 } : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      showNotification('Failed to like post', 'error');
    }
  };

  const followUser = async (userId: string) => {
    try {
      await socialService.followUser('user_001', userId);
      showNotification('User followed successfully!', 'success');
    } catch (error) {
      console.error('Error following user:', error);
      showNotification('Failed to follow user', 'error');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
  };

  const renderChat = () => (
    <Card
      sx={{
        background: 'rgba(20, 20, 20, 0.9)',
        border: '2px solid #00ff9d',
        borderRadius: 3,
        boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
        backdropFilter: 'blur(10px)',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
        {/* Chat Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid rgba(0, 255, 157, 0.3)',
            background: 'rgba(0, 255, 157, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chat sx={{ color: '#00ff9d', mr: 1 }} />
              <Typography
                variant="h6"
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                }}
              >
                Tournament Chat
              </Typography>
            </Box>
            <Chip
              label={isConnected ? 'Connected' : 'Disconnected'}
              sx={{
                backgroundColor: isConnected ? '#00ff9d' : '#ff6b6b',
                color: '#000',
                fontWeight: 600,
              }}
            />
          </Box>
          {chat && (
            <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
              {chat.participants.length} participants • {chat.messages.length} messages
            </Typography>
          )}
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {chat?.messages.map((message, index) => (
            <Box
              key={message.id}
              sx={{
                mb: 2,
                display: 'flex',
                flexDirection: message.senderId === 'user_001' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                src={message.senderAvatar}
                sx={{
                  width: 40,
                  height: 40,
                  mr: message.senderId === 'user_001' ? 0 : 1,
                  ml: message.senderId === 'user_001' ? 1 : 0,
                  border: '2px solid #00ff9d',
                }}
              />
              <Box
                sx={{
                  maxWidth: '70%',
                  background: message.senderId === 'user_001' 
                    ? 'rgba(0, 255, 157, 0.2)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  p: 1.5,
                  border: `1px solid ${message.senderId === 'user_001' ? '#00ff9d' : 'rgba(255, 255, 255, 0.3)'}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: message.senderId === 'user_001' ? '#00ff9d' : '#fff',
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {message.senderName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                  {message.message}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: '#ccc', fontSize: '0.75rem' }}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(0, 255, 157, 0.3)',
            background: 'rgba(0, 255, 157, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              sx={{
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(0, 255, 157, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00ff9d',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00ff9d',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                },
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              sx={{
                backgroundColor: '#00ff9d',
                color: '#000',
                '&:hover': {
                  backgroundColor: '#00cc7a',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(0, 255, 157, 0.3)',
                  color: 'rgba(0, 0, 0, 0.5)',
                },
              }}
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderCommunity = () => (
    <Box>
      {/* Create Post */}
      <Card
        sx={{
          background: 'rgba(20, 20, 20, 0.9)',
          border: '2px solid #00a8ff',
          borderRadius: 3,
          boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          mb: 3,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src="/images/avatars/default.jpg"
              sx={{ mr: 2, border: '2px solid #00a8ff' }}
            />
            <Typography
              variant="h6"
              sx={{
                color: '#00a8ff',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
              }}
            >
              Share something with the community
            </Typography>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: 'rgba(0, 168, 255, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: '#00a8ff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00a8ff',
                },
              },
              '& .MuiInputBase-input': {
                color: '#fff',
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <IconButton sx={{ color: '#00a8ff' }}>
                <Image />
              </IconButton>
              <IconButton sx={{ color: '#00a8ff' }}>
                <VideoLibrary />
              </IconButton>
              <IconButton sx={{ color: '#00a8ff' }}>
                <Gif />
              </IconButton>
              <IconButton sx={{ color: '#00a8ff' }}>
                <Poll />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              onClick={createPost}
              disabled={!newPost.trim()}
              sx={{
                backgroundColor: '#00a8ff',
                color: '#000',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#0086cc',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(0, 168, 255, 0.3)',
                  color: 'rgba(0, 0, 0, 0.5)',
                },
              }}
            >
              Post
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <Box>
        {posts.map((post) => (
          <Card
            key={post.id}
            sx={{
              background: 'rgba(20, 20, 20, 0.9)',
              border: '2px solid #feca57',
              borderRadius: 3,
              boxShadow: '0 0 30px rgba(254, 202, 87, 0.3)',
              backdropFilter: 'blur(10px)',
              mb: 2,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  src={post.authorAvatar}
                  sx={{ mr: 2, border: '2px solid #feca57' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#feca57',
                      fontWeight: 600,
                    }}
                  >
                    {post.authorName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#ccc' }}>
                    {new Date(post.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <IconButton sx={{ color: '#feca57' }}>
                  <MoreVert />
                </IconButton>
              </Box>

              <Typography variant="body1" sx={{ color: '#fff', mb: 2 }}>
                {post.content}
              </Typography>

              {post.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {post.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{
                        backgroundColor: '#feca57',
                        color: '#000',
                        fontWeight: 600,
                        mr: 1,
                        mb: 1,
                      }}
                    />
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    onClick={() => likePost(post.id)}
                    sx={{ color: '#ff6b6b' }}
                  >
                    <Favorite />
                  </IconButton>
                  <Typography variant="body2" sx={{ color: '#fff', mr: 2 }}>
                    {post.likes}
                  </Typography>
                  <IconButton sx={{ color: '#00a8ff' }}>
                    <Comment />
                  </IconButton>
                  <Typography variant="body2" sx={{ color: '#fff', mr: 2 }}>
                    {post.comments.length}
                  </Typography>
                  <IconButton sx={{ color: '#00ff9d' }}>
                    <Share />
                  </IconButton>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {post.shares}
                  </Typography>
                </Box>
                {post.isHighlight && (
                  <Chip
                    icon={<Star />}
                    label="Highlight"
                    sx={{
                      backgroundColor: '#ff6b6b',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );

  const renderParticipants = () => (
    <Card
      sx={{
        background: 'rgba(20, 20, 20, 0.9)',
        border: '2px solid #ff6b6b',
        borderRadius: 3,
        boxShadow: '0 0 30px rgba(255, 107, 107, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <People sx={{ color: '#ff6b6b', mr: 1 }} />
          <Typography
            variant="h6"
            sx={{
              color: '#ff6b6b',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 600,
            }}
          >
            Tournament Participants
          </Typography>
        </Box>

        {chat?.participants.map((participant) => (
          <ListItem
            key={participant.userId}
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 2,
              mb: 1,
              border: `1px solid ${participant.status === 'online' ? '#00ff9d' : 'rgba(255, 255, 255, 0.3)'}`,
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: participant.status === 'online' ? '#00ff9d' : '#ff6b6b',
                      border: '2px solid #000',
                    }}
                  />
                }
              >
                <Avatar
                  src={participant.avatar}
                  sx={{ border: '2px solid #ff6b6b' }}
                />
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ color: '#fff', fontWeight: 600 }}>
                  {participant.username}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Level {participant.level} • {participant.followers} followers
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#00a8ff' }}>
                    {participant.status.charAt(0).toUpperCase() + participant.status.slice(1)}
                  </Typography>
                </Box>
              }
            />
            <IconButton
              onClick={() => followUser(participant.userId)}
              sx={{
                color: '#00ff9d',
                '&:hover': {
                  backgroundColor: 'rgba(0, 255, 157, 0.2)',
                },
              }}
            >
              <PersonAdd />
            </IconButton>
          </ListItem>
        ))}
      </CardContent>
    </Card>
  );

  const renderStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card
          sx={{
            background: 'rgba(20, 20, 20, 0.9)',
            border: '2px solid #00ff9d',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ color: '#00ff9d', mr: 1 }} />
              <Typography
                variant="h6"
                sx={{
                  color: '#00ff9d',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                }}
              >
                Social Stats
              </Typography>
            </Box>
            {stats && (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    Total Participants
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: '#00ff9d',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 700,
                    }}
                  >
                    {stats.totalParticipants}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    Active Chats
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: '#00a8ff',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 700,
                    }}
                  >
                    {stats.activeChats}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    Total Messages
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: '#feca57',
                      fontFamily: 'Orbitron, monospace',
                      fontWeight: 700,
                    }}
                  >
                    {stats.totalMessages}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                    Engagement Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.engagementRate}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#00ff9d',
                        boxShadow: '0 0 10px rgba(0, 255, 157, 0.5)',
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
                    {stats.engagementRate}%
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card
          sx={{
            background: 'rgba(20, 20, 20, 0.9)',
            border: '2px solid #00a8ff',
            borderRadius: 3,
            boxShadow: '0 0 30px rgba(0, 168, 255, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Star sx={{ color: '#00a8ff', mr: 1 }} />
              <Typography
                variant="h6"
                sx={{
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                }}
              >
                Top Contributors
              </Typography>
            </Box>
            {stats?.topContributors.map((contributor, index) => (
              <Box
                key={contributor.userId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                  p: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#feca57',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 700,
                    mr: 2,
                    minWidth: 30,
                  }}
                >
                  #{index + 1}
                </Typography>
                <Avatar
                  src={contributor.avatar}
                  sx={{ mr: 2, border: '2px solid #00a8ff' }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {contributor.username}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ccc' }}>
                    Level {contributor.level} • {contributor.achievements.length} achievements
                  </Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        sx={{
          background: 'rgba(20, 20, 20, 0.95)',
          border: '2px solid #00ff9d',
          borderRadius: 3,
          boxShadow: '0 0 50px rgba(0, 255, 157, 0.3)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(0, 255, 157, 0.3)' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: '#ccc',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                '&.Mui-selected': {
                  color: '#00ff9d',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00ff9d',
                height: 3,
              },
            }}
          >
            <Tab
              icon={<Chat />}
              label="Tournament Chat"
              iconPosition="start"
            />
            <Tab
              icon={<Forum />}
              label="Community"
              iconPosition="start"
            />
            <Tab
              icon={<People />}
              label="Participants"
              iconPosition="start"
            />
            <Tab
              icon={<TrendingUp />}
              label="Stats"
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {renderChat()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderCommunity()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderParticipants()}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {renderStats()}
        </TabPanel>
      </Paper>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert
          onClose={() => setShowSnackbar(false)}
          severity={snackbarSeverity}
          sx={{
            backgroundColor: snackbarSeverity === 'success' ? '#00ff9d' : '#ff6b6b',
            color: '#000',
            fontWeight: 600,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TournamentSocial; 