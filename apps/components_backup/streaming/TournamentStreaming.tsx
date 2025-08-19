import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Slider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Divider,
  Paper,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Pause,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  Chat,
  Settings,
  Visibility,
  VisibilityOff,
  MonetizationOn,
  Highlight,
  Analytics,
  RecordVoiceOver,
  LiveTv,
  People,
  TrendingUp,
  Message,
  Send,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import TournamentStreamingService, {
  type StreamConfig,
  type StreamStats,
  type CommentaryEvent,
  type ChatMessage,
  BroadcastSettings,
  type StreamSession,
} from '../../services/streaming/TournamentStreamingService';

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
      id={`streaming-tabpanel-${index}`}
      aria-labelledby={`streaming-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentStreaming: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [session, setSession] = useState<StreamSession | null>(null);
  const [config, setConfig] = useState<StreamConfig | null>(null);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [commentary, setCommentary] = useState<CommentaryEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [newCommentary, setNewCommentary] = useState('');
  const [commentaryType, setCommentaryType] = useState<
    'shot' | 'foul' | 'game_end' | 'highlight' | 'analysis'
  >('shot');
  const [commentaryExcitement, setCommentaryExcitement] = useState(5);

  const streamingService = TournamentStreamingService.getInstance();

  useEffect(() => {
    const interval = setInterval(() => {
      setSession(streamingService.getCurrentSession());
      setConfig(streamingService.getConfig());
      setStats(streamingService.getStreamStats());
      setCommentary(streamingService.getCommentary());
      setChatMessages(streamingService.getChatMessages());
      setIsConnected(streamingService.isConnected());
      setIsStreaming(streamingService.isStreaming());
    }, 1000);

    return () => clearInterval(interval);
  }, [streamingService]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStartStream = async () => {
    const success = await streamingService.startStream('t1', 'm1');
    if (success) {
      console.log('Stream started successfully');
    }
  };

  const handleStopStream = () => {
    streamingService.stopStream();
  };

  const handlePauseStream = () => {
    streamingService.pauseStream();
  };

  const handleResumeStream = () => {
    streamingService.resumeStream();
  };

  const handleSendChat = () => {
    if (chatMessage.trim()) {
      streamingService.sendChatMessage(chatMessage, 'user1', 'StreamViewer');
      setChatMessage('');
    }
  };

  const handleAddCommentary = () => {
    if (newCommentary.trim()) {
      streamingService.addCommentary({
        type: commentaryType,
        message: newCommentary,
        excitement: commentaryExcitement,
        priority:
          commentaryExcitement > 7
            ? 'high'
            : commentaryExcitement > 4
              ? 'medium'
              : 'low',
      });
      setNewCommentary('');
    }
  };

  const handleConfigUpdate = (updates: Partial<StreamConfig>) => {
    streamingService.updateConfig(updates);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'success';
      case 'paused':
        return 'warning';
      case 'ended':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <LiveTv color="success" />;
      case 'paused':
        return <Pause color="warning" />;
      case 'ended':
        return <Stop color="error" />;
      default:
        return <Settings color="info" />;
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ color: '#00ff9d' }}
        >
          Tournament Streaming
        </Typography>
        <Typography variant="subtitle1" sx={{ color: '#00a8ff', mb: 2 }}>
          Advanced live streaming and broadcasting system with real-time
          commentary
        </Typography>

        <Alert
          severity={isConnected ? 'success' : 'error'}
          sx={{ mb: 2 }}
          icon={isConnected ? <CheckCircle /> : <Error />}
        >
          {isConnected
            ? 'Connected to streaming service'
            : 'Disconnected from streaming service'}
        </Alert>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: '#ffffff',
              '&.Mui-selected': { color: '#00ff9d' },
            },
          }}
        >
          <Tab label="Live Stream" icon={<LiveTv />} iconPosition="start" />
          <Tab
            label="Commentary"
            icon={<RecordVoiceOver />}
            iconPosition="start"
          />
          <Tab label="Chat" icon={<Chat />} iconPosition="start" />
          <Tab label="Analytics" icon={<Analytics />} iconPosition="start" />
          <Tab label="Settings" icon={<Settings />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', mb: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    position: 'relative',
                    bgcolor: '#000',
                    borderRadius: 2,
                    p: 2,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: '#ffffff', textAlign: 'center', py: 8 }}
                  >
                    {session?.status === 'live' ? '🔴 LIVE' : 'Stream Preview'}
                  </Typography>
                  {session?.status === 'live' && (
                    <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
                      <Chip
                        label="LIVE"
                        color="error"
                        size="small"
                        icon={<LiveTv />}
                      />
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color={isStreaming ? 'error' : 'success'}
                    startIcon={isStreaming ? <Stop /> : <PlayArrow />}
                    onClick={isStreaming ? handleStopStream : handleStartStream}
                    sx={{
                      bgcolor: isStreaming ? '#ff4444' : '#00ff9d',
                      color: '#000',
                    }}
                  >
                    {isStreaming ? 'Stop Stream' : 'Start Stream'}
                  </Button>

                  {isStreaming && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<Pause />}
                        onClick={handlePauseStream}
                        sx={{ borderColor: '#00a8ff', color: '#00a8ff' }}
                      >
                        Pause
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PlayArrow />}
                        onClick={handleResumeStream}
                        sx={{ borderColor: '#00a8ff', color: '#00a8ff' }}
                      >
                        Resume
                      </Button>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Stream Status
                </Typography>

                {session && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getStatusIcon(session.status)}
                      <Typography
                        variant="body1"
                        sx={{ color: '#ffffff', ml: 1 }}
                      >
                        {session.title}
                      </Typography>
                    </Box>
                    <Chip
                      label={session.status.toUpperCase()}
                      color={getStatusColor(session.status) as any}
                      size="small"
                    />
                  </Box>
                )}

                {stats && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Viewers: {formatNumber(stats.viewers)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Peak: {formatNumber(stats.peakViewers)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Uptime: {formatDuration(stats.streamUptime)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Chat Messages: {formatNumber(stats.chatMessages)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Donations: ${stats.donations}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Stream Quality
                </Typography>

                {stats && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Bitrate: {(stats.bitrate / 1000000).toFixed(1)} Mbps
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Frame Rate: {stats.frameRate} FPS
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Dropped Frames: {stats.droppedFrames}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Audio Level: {(stats.audioLevel * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Video Quality: {(stats.videoQuality * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Live Commentary
                </Typography>

                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {commentary.map((event) => (
                    <ListItem
                      key={event.id}
                      sx={{ borderBottom: '1px solid #333' }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#00a8ff' }}>
                          <RecordVoiceOver />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{ color: '#ffffff' }}
                            >
                              {event.message}
                            </Typography>
                            <Chip
                              label={event.type}
                              size="small"
                              sx={{ bgcolor: '#333', color: '#00ff9d' }}
                            />
                            {event.player && (
                              <Chip
                                label={event.player}
                                size="small"
                                sx={{ bgcolor: '#333', color: '#00a8ff' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#888' }}>
                            {event.timestamp.toLocaleTimeString()} - Excitement:{' '}
                            {event.excitement}/10
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Add Commentary
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={newCommentary}
                  onChange={(e) => setNewCommentary(e.target.value)}
                  placeholder="Enter commentary message..."
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: { color: '#ffffff', bgcolor: '#333' },
                  }}
                />

                <TextField
                  select
                  fullWidth
                  value={commentaryType}
                  onChange={(e) => setCommentaryType(e.target.value as any)}
                  label="Type"
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: { color: '#ffffff', bgcolor: '#333' },
                  }}
                >
                  <option value="shot">Shot</option>
                  <option value="foul">Foul</option>
                  <option value="game_end">Game End</option>
                  <option value="highlight">Highlight</option>
                  <option value="analysis">Analysis</option>
                </TextField>

                <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                  Excitement Level: {commentaryExcitement}/10
                </Typography>
                <Slider
                  value={commentaryExcitement}
                  onChange={(e, value) =>
                    setCommentaryExcitement(value as number)
                  }
                  min={1}
                  max={10}
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddCommentary}
                  disabled={!newCommentary.trim()}
                  sx={{ bgcolor: '#00ff9d', color: '#000' }}
                >
                  Add Commentary
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Live Chat
                </Typography>

                <List sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                  {chatMessages.map((message) => (
                    <ListItem
                      key={message.id}
                      sx={{ borderBottom: '1px solid #333' }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              message.type === 'moderator'
                                ? '#00ff9d'
                                : '#00a8ff',
                          }}
                        >
                          {message.username.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{ color: '#ffffff', fontWeight: 'bold' }}
                            >
                              {message.username}
                            </Typography>
                            {message.type === 'moderator' && (
                              <Chip
                                label="MOD"
                                size="small"
                                sx={{ bgcolor: '#00ff9d', color: '#000' }}
                              />
                            )}
                            {message.donation && (
                              <Chip
                                label={`$${message.donation}`}
                                size="small"
                                sx={{ bgcolor: '#feca57', color: '#000' }}
                                icon={<MonetizationOn />}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#888' }}>
                            {message.message}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                    InputProps={{
                      sx: { color: '#ffffff', bgcolor: '#333' },
                    }}
                  />
                  <IconButton
                    onClick={handleSendChat}
                    disabled={!chatMessage.trim()}
                    sx={{
                      bgcolor: '#00ff9d',
                      color: '#000',
                      '&:hover': { bgcolor: '#00cc7a' },
                    }}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Chat Stats
                </Typography>

                {stats && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Total Messages: {formatNumber(stats.chatMessages)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Active Viewers: {formatNumber(stats.viewers)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Average Watch Time: {stats.averageWatchTime.toFixed(1)}{' '}
                      minutes
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {stats && (
            <>
              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00ff9d', mb: 1 }}>
                      Current Viewers
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ffffff' }}>
                      {formatNumber(stats.viewers)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Peak: {formatNumber(stats.peakViewers)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#00a8ff', mb: 1 }}>
                      Stream Uptime
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ffffff' }}>
                      {formatDuration(stats.streamUptime)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      {stats.averageWatchTime.toFixed(1)} min avg watch
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#feca57', mb: 1 }}>
                      Chat Activity
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ffffff' }}>
                      {formatNumber(stats.chatMessages)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Messages sent
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={3}>
                <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 1 }}>
                      Donations
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#ffffff' }}>
                      ${stats.donations}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Total received
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00ff9d', mb: 2 }}>
                  Stream Configuration
                </Typography>

                {config && (
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.videoEnabled}
                          onChange={(e) =>
                            handleConfigUpdate({
                              videoEnabled: e.target.checked,
                            })
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00ff9d',
                            },
                          }}
                        />
                      }
                      label="Video Enabled"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.audioEnabled}
                          onChange={(e) =>
                            handleConfigUpdate({
                              audioEnabled: e.target.checked,
                            })
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00ff9d',
                            },
                          }}
                        />
                      }
                      label="Audio Enabled"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.commentaryEnabled}
                          onChange={(e) =>
                            handleConfigUpdate({
                              commentaryEnabled: e.target.checked,
                            })
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00ff9d',
                            },
                          }}
                        />
                      }
                      label="Commentary Enabled"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.chatEnabled}
                          onChange={(e) =>
                            handleConfigUpdate({
                              chatEnabled: e.target.checked,
                            })
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00ff9d',
                            },
                          }}
                        />
                      }
                      label="Chat Enabled"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.recordingEnabled}
                          onChange={(e) =>
                            handleConfigUpdate({
                              recordingEnabled: e.target.checked,
                            })
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#00ff9d',
                            },
                          }}
                        />
                      }
                      label="Recording Enabled"
                      sx={{ color: '#ffffff', mb: 1 }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid #333' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#00a8ff', mb: 2 }}>
                  Quality Settings
                </Typography>

                {config && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Quality: {config.quality.toUpperCase()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Resolution: {config.resolution}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Frame Rate: {config.frameRate} FPS
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#888', mb: 1 }}>
                      Bitrate: {(config.bitrate / 1000000).toFixed(1)} Mbps
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default TournamentStreaming;
