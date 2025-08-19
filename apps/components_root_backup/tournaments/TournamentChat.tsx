import {
  AttachFile,
  Chat,
  EmojiEmotions,
  Group,
  Mic,
  Person,
  Send,
  SportsEsports,
  VideoCall,
  VolumeUp,
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
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../../hooks/useTournament';
import { useTournamentChat } from '../../hooks/useTournamentChat';
import { useUser } from '../../hooks/useUser';

interface TournamentChatProps {
  tournamentId: string;
}

const TournamentChat: React.FC<TournamentChatProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { tournament, loading, error } = useTournament(tournamentId);
  const { user } = useUser();
  const {
    messages,
    sendMessage,
    toggleVoice,
    toggleVideo,
    voiceEnabled,
    videoEnabled,
    participants,
    teams,
    loading: chatLoading,
    error: chatError,
  } = useTournamentChat(tournamentId);
  const [tab, setTab] = React.useState(0);
  const [message, setMessage] = React.useState('');
  const [selectedParticipant, setSelectedParticipant] = React.useState<
    string | null
  >(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage(message);
      setMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (loading || chatLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || chatError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">
          {error?.message || chatError || 'An error occurred'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <Typography variant="h5" gutterBottom>
        Tournament Chat
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Chat color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {messages.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Messages
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Group color="success" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {participants.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Participants
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SportsEsports color="info" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {tournament.type.replace('_', ' ')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tournament Type
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <VolumeUp
                  color={voiceEnabled ? 'primary' : 'error'}
                  sx={{ fontSize: 40 }}
                />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {voiceEnabled ? 'On' : 'Off'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Voice Chat
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ p: 2 }}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<Chat />} label="Chat" />
          <Tab icon={<Person />} label="Participants" />
          <Tab icon={<Group />} label="Teams" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3, flexGrow: 1, overflow: 'auto' }}>
        {tab === 0 && (
          <Box
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                mb: 2,
                display: 'flex',
                flexDirection: 'column-reverse',
              }}
            >
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    mb: 2,
                    alignItems: 'flex-end',
                    justifyContent:
                      message.senderId === user?.id ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '80%',
                      bgcolor:
                        message.senderId === user?.id
                          ? 'primary.main'
                          : 'grey.100',
                      color:
                        message.senderId === user?.id ? 'white' : 'inherit',
                      p: 2,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body1">{message.content}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
              }}
            >
              <IconButton color="primary">
                <EmojiEmotions />
              </IconButton>
              <IconButton color="primary">
                <AttachFile />
              </IconButton>
              <IconButton color="primary">
                <Mic />
              </IconButton>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{ flexGrow: 1 }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <Send />
              </IconButton>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <List>
            {participants.map((participant) => (
              <ListItem
                key={participant.userId}
                secondaryAction={
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => setSelectedParticipant(participant.userId)}
                    >
                      <Person />
                    </IconButton>
                  </ListItemSecondaryAction>
                }
              >
                <ListItemAvatar>
                  <Avatar>{participant.username[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.username}
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {participant.score}
                      </Typography>
                      {' — '}
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {participant.teamName}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {tab === 2 && (
          <List>
            {teams.map((team) => (
              <ListItem
                key={team.id}
                secondaryAction={
                  <ListItemSecondaryAction>
                    <Chip
                      label={team.memberCount}
                      size="small"
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                }
              >
                <ListItemAvatar>
                  <Avatar>{team.name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={team.name}
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {team.score}
                      </Typography>
                      {' — '}
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {team.memberCount} members
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Chat Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VolumeUp color={voiceEnabled ? 'primary' : 'error'} />
              <Typography>Voice Chat</Typography>
              <Switch
                checked={voiceEnabled}
                onChange={toggleVoice}
                color="primary"
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VideoCall color={videoEnabled ? 'primary' : 'error'} />
              <Typography>Video Chat</Typography>
              <Switch
                checked={videoEnabled}
                onChange={toggleVideo}
                color="primary"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TournamentChat;
