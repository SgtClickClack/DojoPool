import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Paper,
  Grid,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Message,
  People,
  Forum,
  PostAdd,
  Search,
  Send,
  ThumbUp,
  Comment,
  Share,
  Add,
  PersonAdd,
  Settings,
  Notifications,
  Public,
  Lock,
  Group
} from '@mui/icons-material';
import SocialCommunityService, {
  SocialProfile,
  SocialMessage,
  CommunityPost,
  FriendRequest,
  CommunityForum
} from '../../services/social/SocialCommunityService';

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SocialCommunity: React.FC = () => {
  const service = SocialCommunityService.getInstance();
  const [tabValue, setTabValue] = useState(0);
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [forums, setForums] = useState<CommunityForum[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<SocialProfile | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newPost, setNewPost] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setProfiles(service.getAllProfiles());
    setMessages(service.getMessages('user1')); // Current user
    setPosts(service.getPosts());
    setFriendRequests(service.getFriendRequests('user1')); // Current user
    setForums(service.getForums());
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedProfile) {
      await service.sendMessage({
        senderId: 'user1', // Current user
        recipientId: selectedProfile.userId,
        content: newMessage,
        type: 'text'
      });
      setNewMessage('');
      setShowMessageDialog(false);
      loadData();
    }
  };

  const handleCreatePost = async () => {
    if (newPost.trim()) {
      await service.createPost({
        authorId: 'user1', // Current user
        content: newPost,
        type: 'text',
        tags: [],
        visibility: 'public'
      });
      setNewPost('');
      setShowPostDialog(false);
      loadData();
    }
  };

  const handleLikePost = async (postId: string) => {
    await service.likePost(postId, 'user1'); // Current user
    loadData();
  };

  const handleSendFriendRequest = async (userId: string) => {
    await service.sendFriendRequest({
      senderId: 'user1', // Current user
      recipientId: userId,
      message: 'I would like to be your friend!'
    });
    loadData();
  };

  const handleRespondToFriendRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    await service.respondToFriendRequest(requestId, status);
    loadData();
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <Typography variant="h4" gutterBottom>
        Social & Community
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="social tabs">
          <Tab label="Profiles" icon={<People />} />
          <Tab label="Messages" icon={<Message />} />
          <Tab label="Community" icon={<PostAdd />} />
          <Tab label="Forums" icon={<Forum />} />
          <Tab label="Friends" icon={<Group />} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
        </Box>

        <Grid container spacing={2}>
          {filteredProfiles.map((profile) => (
            <Grid item xs={12} sm={6} md={4} key={profile.userId}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar src={profile.avatar} sx={{ mr: 2 }}>
                      {profile.displayName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{profile.displayName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{profile.username}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {profile.bio}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={`${profile.followers.length} followers`} size="small" />
                    <Chip label={`${profile.following.length} following`} size="small" />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowProfileDialog(true);
                      }}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowMessageDialog(true);
                      }}
                    >
                      Message
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleSendFriendRequest(profile.userId)}
                    >
                      Add Friend
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Message />}
            onClick={() => setShowMessageDialog(true)}
          >
            New Message
          </Button>
        </Box>

        <List>
          {messages.map((message) => (
            <ListItem key={message.id} divider>
              <ListItemAvatar>
                <Avatar>
                  {message.senderId === 'user1' ? 'Me' : 'U'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={message.content}
                secondary={new Date(message.timestamp).toLocaleString()}
              />
              <ListItemSecondaryAction>
                {!message.read && <Badge color="primary" variant="dot" />}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<PostAdd />}
            onClick={() => setShowPostDialog(true)}
          >
            Create Post
          </Button>
        </Box>

        {posts.map((post) => (
          <Card key={post.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2 }}>
                  {profiles.find(p => p.userId === post.authorId)?.displayName.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {profiles.find(p => p.userId === post.authorId)?.displayName || 'Unknown User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(post.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body1" sx={{ mb: 2 }}>
                {post.content}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {post.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<ThumbUp />}
                  onClick={() => handleLikePost(post.id)}
                >
                  {post.likes.length} Likes
                </Button>
                <Button size="small" startIcon={<Comment />}>
                  {post.comments.length} Comments
                </Button>
                <Button size="small" startIcon={<Share />}>
                  {post.shares} Shares
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom>
          Community Forums
        </Typography>

        <Grid container spacing={2}>
          {forums.map((forum) => (
            <Grid item xs={12} sm={6} md={4} key={forum.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {forum.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {forum.description}
                  </Typography>
                  <Chip label={forum.category} size="small" sx={{ mr: 1 }} />
                  <Chip label={`${forum.topics.length} topics`} size="small" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Friend Requests ({friendRequests.length})
          </Typography>
        </Box>

        <List>
          {friendRequests.map((request) => (
            <ListItem key={request.id} divider>
              <ListItemAvatar>
                <Avatar>
                  {profiles.find(p => p.userId === request.senderId)?.displayName.charAt(0) || 'U'}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${profiles.find(p => p.userId === request.senderId)?.displayName || 'Unknown User'} wants to be your friend`}
                secondary={request.message}
              />
              <ListItemSecondaryAction>
                <Button
                  size="small"
                  variant="contained"
                  sx={{ mr: 1 }}
                  onClick={() => handleRespondToFriendRequest(request.id, 'accepted')}
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleRespondToFriendRequest(request.id, 'declined')}
                >
                  Decline
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </TabPanel>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onClose={() => setShowProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Profile</DialogTitle>
        <DialogContent>
          {selectedProfile && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar src={selectedProfile.avatar} sx={{ mr: 2, width: 64, height: 64 }}>
                  {selectedProfile.displayName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedProfile.displayName}</Typography>
                  <Typography variant="body1" color="text.secondary">
                    @{selectedProfile.username}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedProfile.bio}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Location: {selectedProfile.location}
              </Typography>

              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">Matches Played: {selectedProfile.stats.matchesPlayed}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Win Rate: {(selectedProfile.stats.winRate * 100).toFixed(1)}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Tournaments Won: {selectedProfile.stats.tournamentsWon}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Rank: #{selectedProfile.stats.rank}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProfileDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onClose={() => setShowMessageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMessageDialog(false)}>Cancel</Button>
          <Button onClick={handleSendMessage} variant="contained">
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post Dialog */}
      <Dialog open={showPostDialog} onClose={() => setShowPostDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPostDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePost} variant="contained">
            Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialCommunity; 