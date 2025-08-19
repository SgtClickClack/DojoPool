import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
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
  FormControlLabel,
  Alert,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  ListItemAvatar,
  Slider,
  Rating,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  SkipNext,
  SkipPrevious,
  Settings,
  Add,
  Edit,
  Delete,
  Share,
  Download,
  Visibility,
  ThumbUp,
  Comment,
  ExpandMore,
  Timeline,
  VideoLibrary,
  SportsEsports,
  Psychology,
  EmojiEvents,
  Speed,
  Fullscreen,
  VolumeUp,
  VolumeOff,
} from '@mui/icons-material';
import AdvancedGameReplayService, {
  type ReplaySession,
  type ReplayEvent,
  type ReplayConfig,
  type ReplayMetrics,
  ReplayComment,
} from '../../services/game/AdvancedGameReplayService';

const AdvancedGameReplay: React.FC = () => {
  const service = AdvancedGameReplayService.getInstance();
  const [tabValue, setTabValue] = useState(0);
  const [sessions, setSessions] = useState<ReplaySession[]>([]);
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [config, setConfig] = useState<ReplayConfig | null>(null);
  const [metrics, setMetrics] = useState<ReplayMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ReplaySession | null>(
    null
  );
  const [selectedEvent, setSelectedEvent] = useState<ReplayEvent | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedSessionForComment, setSelectedSessionForComment] =
    useState<string>('');

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form states
  const [newSession, setNewSession] = useState({
    matchId: '',
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(),
    tags: '',
    isPublic: false,
  });

  const [newComment, setNewComment] = useState({
    userId: '',
    userName: '',
    content: '',
    eventId: '',
  });

  useEffect(() => {
    loadData();
    setupEventListeners();

    return () => {
      service.removeAllListeners();
    };
  }, []);

  const loadData = () => {
    setSessions(service.getSessions());
    setEvents(service.getEvents());
    setConfig(service.getConfig());
    setMetrics(service.getMetrics());
    setIsConnected(service.getConnectionStatus());
  };

  const setupEventListeners = () => {
    service.on('sessionCreated', (session: ReplaySession) => {
      setSessions(service.getSessions());
      setMetrics(service.getMetrics());
    });

    service.on('sessionUpdated', () => {
      setSessions(service.getSessions());
      setMetrics(service.getMetrics());
    });

    service.on('sessionDeleted', () => {
      setSessions(service.getSessions());
      setMetrics(service.getMetrics());
    });

    service.on('eventRecorded', (event: ReplayEvent) => {
      setEvents(service.getEvents());
      setMetrics(service.getMetrics());
    });

    service.on('eventUpdated', () => {
      setEvents(service.getEvents());
      setMetrics(service.getMetrics());
    });

    service.on('commentAdded', () => {
      setSessions(service.getSessions());
    });

    service.on('configUpdated', (newConfig: ReplayConfig) => {
      setConfig(newConfig);
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateSession = async () => {
    try {
      await service.createReplaySession({
        matchId: newSession.matchId,
        title: newSession.title,
        description: newSession.description,
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        duration:
          (newSession.endTime.getTime() - newSession.startTime.getTime()) /
          1000,
        events: [],
        highlights: [],
        analysis: {
          totalEvents: 0,
          highlights: 0,
          averageShotQuality: 0,
          bestShot: null,
          worstShot: null,
          playerPerformance: {},
          matchSummary: '',
          keyMoments: [],
          improvementAreas: [],
          recommendations: [],
        },
        tags: newSession.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        isPublic: newSession.isPublic,
        createdBy: 'currentUser',
      });
      setSessionDialogOpen(false);
      setNewSession({
        matchId: '',
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(),
        tags: '',
        isPublic: false,
      });
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleAddComment = async () => {
    try {
      await service.addComment(selectedSessionForComment, {
        userId: newComment.userId,
        userName: newComment.userName,
        content: newComment.content,
        eventId: newComment.eventId || undefined,
      });
      setCommentDialogOpen(false);
      setNewComment({
        userId: '',
        userName: '',
        content: '',
        eventId: '',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<ReplayConfig>) => {
    try {
      await service.updateConfig(newConfig);
      setConfigDialogOpen(false);
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (event: Event, newValue: number | number[]) => {
    setCurrentTime(newValue as number);
  };

  const handleSpeedChange = (event: Event, newValue: number | number[]) => {
    setPlaybackSpeed(newValue as number);
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
    if (newValue === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getEventTypeIcon = (type: ReplayEvent['eventType']) => {
    switch (type) {
      case 'shot':
        return <SportsEsports />;
      case 'foul':
        return <ThumbUp />;
      case 'score':
        return <EmojiEvents />;
      case 'turnover':
        return <Timeline />;
      case 'timeout':
        return <Pause />;
      case 'highlight':
        return <EmojiEvents />;
      case 'analysis':
        return <Psychology />;
      default:
        return <PlayArrow />;
    }
  };

  const getImportanceColor = (importance: ReplayEvent['importance']) => {
    switch (importance) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <VideoLibrary sx={{ mr: 2, color: '#00ff9d' }} />
          Advanced Game Replay System
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
          />
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setConfigDialogOpen(true)}
          >
            Configuration
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Sessions" icon={<VideoLibrary />} />
          <Tab label="Player" icon={<PlayArrow />} />
          <Tab label="Events" icon={<Timeline />} />
          <Tab label="Analytics" icon={<Psychology />} />
        </Tabs>
      </Paper>

      {/* Sessions Tab */}
      {tabValue === 0 && (
        <Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h6">Replay Sessions</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setSessionDialogOpen(true)}
            >
              Create Session
            </Button>
          </Box>

          <Grid container spacing={2}>
            {sessions.map((session) => (
              <Grid item xs={12} md={6} key={session.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">{session.title}</Typography>
                      <Chip
                        label={session.isPublic ? 'Public' : 'Private'}
                        color={session.isPublic ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {session.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {session.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Duration: {formatDuration(session.duration)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Events: {session.analysis.totalEvents}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Views: {session.views}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Likes: {session.likes}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedSession(session)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedSessionForComment(session.id);
                          setCommentDialogOpen(true);
                        }}
                      >
                        Add Comment
                      </Button>
                      <IconButton size="small">
                        <Share />
                      </IconButton>
                      <IconButton size="small">
                        <Download />
                      </IconButton>
                    </Box>

                    {session.comments.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Comments:
                        </Typography>
                        <List dense>
                          {session.comments.slice(0, 3).map((comment) => (
                            <ListItem key={comment.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ width: 24, height: 24 }}>
                                  {comment.userName.charAt(0)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={comment.userName}
                                secondary={comment.content}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Player Tab */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Replay Player
          </Typography>

          {selectedSession ? (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedSession.title}
                  </Typography>

                  {/* Video Player Placeholder */}
                  <Box
                    sx={{
                      width: '100%',
                      height: 400,
                      bgcolor: 'black',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h5">Video Player</Typography>
                  </Box>

                  {/* Player Controls */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <IconButton onClick={handlePlayPause}>
                      {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>
                    <IconButton onClick={handleStop}>
                      <Stop />
                    </IconButton>
                    <IconButton>
                      <SkipPrevious />
                    </IconButton>
                    <IconButton>
                      <SkipNext />
                    </IconButton>

                    <Box sx={{ flexGrow: 1, mx: 2 }}>
                      <Slider
                        value={currentTime}
                        onChange={handleSeek}
                        max={duration}
                        valueLabelDisplay="auto"
                        valueLabelFormat={formatDuration}
                      />
                    </Box>

                    <Typography variant="body2">
                      {formatDuration(currentTime)} / {formatDuration(duration)}
                    </Typography>
                  </Box>

                  {/* Additional Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Speed />
                      <Slider
                        value={playbackSpeed}
                        onChange={handleSpeedChange}
                        min={0.25}
                        max={4}
                        step={0.25}
                        sx={{ width: 100 }}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}x`}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton onClick={handleToggleMute}>
                        {isMuted ? <VolumeOff /> : <VolumeUp />}
                      </IconButton>
                      <Slider
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        max={100}
                        sx={{ width: 100 }}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${value}%`}
                      />
                    </Box>

                    <IconButton onClick={handleToggleFullscreen}>
                      <Fullscreen />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Session Events
              </Typography>
              <Grid container spacing={2}>
                {service.getEventsBySession(selectedSession.id).map((event) => (
                  <Grid item xs={12} md={6} key={event.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getEventTypeIcon(event.eventType)}
                            <Typography variant="h6" sx={{ ml: 1 }}>
                              {event.eventType.toUpperCase()}
                            </Typography>
                          </Box>
                          <Chip
                            label={event.importance}
                            color={getImportanceColor(event.importance) as any}
                            size="small"
                          />
                        </Box>

                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {event.description}
                        </Typography>

                        {event.playerName && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            Player: {event.playerName}
                          </Typography>
                        )}

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Quality: {event.aiAnalysis.shotQuality.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatTimestamp(event.timestamp)}
                          </Typography>
                        </Box>

                        {event.highlights.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Highlights:
                            </Typography>
                            {event.highlights.map((highlight, index) => (
                              <Chip
                                key={index}
                                label={highlight}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                                color="success"
                              />
                            ))}
                          </Box>
                        )}

                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle2">
                              AI Analysis
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Technique:</strong>{' '}
                                {event.aiAnalysis.technique}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Strategy:</strong>{' '}
                                {event.aiAnalysis.strategy}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Success Probability:</strong>{' '}
                                {(
                                  event.aiAnalysis.prediction
                                    .successProbability * 100
                                ).toFixed(1)}
                                %
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Improvements:</strong>
                              </Typography>
                              <List dense>
                                {event.aiAnalysis.improvement.map(
                                  (improvement, index) => (
                                    <ListItem key={index}>
                                      <ListItemText primary={improvement} />
                                    </ListItem>
                                  )
                                )}
                              </List>
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Alert severity="info">
              Select a session from the Sessions tab to start playing
            </Alert>
          )}
        </Box>
      )}

      {/* Events Tab */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            All Replay Events
          </Typography>

          <Grid container spacing={2}>
            {events.map((event) => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getEventTypeIcon(event.eventType)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {event.eventType.toUpperCase()}
                        </Typography>
                      </Box>
                      <Chip
                        label={event.importance}
                        color={getImportanceColor(event.importance) as any}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {event.description}
                    </Typography>

                    {event.playerName && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Player: {event.playerName}
                      </Typography>
                    )}

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Power: {event.power}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Accuracy: {event.accuracy}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Quality: {event.aiAnalysis.shotQuality.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          {formatTimestamp(event.timestamp)}
                        </Typography>
                      </Grid>
                    </Grid>

                    {event.highlights.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Highlights:
                        </Typography>
                        {event.highlights.map((highlight, index) => (
                          <Chip
                            key={index}
                            label={highlight}
                            size="small"
                            sx={{ mr: 1, mb: 1 }}
                            color="success"
                          />
                        ))}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedEvent(event)}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Analytics Tab */}
      {tabValue === 3 && metrics && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Replay Analytics
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Sessions
                  </Typography>
                  <Typography variant="h4">{metrics.totalSessions}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Events
                  </Typography>
                  <Typography variant="h4">{metrics.totalEvents}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Views
                  </Typography>
                  <Typography variant="h4">{metrics.totalViews}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Highlight Rate
                  </Typography>
                  <Typography variant="h4">
                    {(metrics.highlightRate * 100).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Popular Sessions
                  </Typography>
                  <Grid container spacing={2}>
                    {metrics.popularSessions.map((session) => (
                      <Grid item xs={12} md={6} key={session.id}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box>
                            <Typography variant="subtitle1">
                              {session.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {session.views} views • {session.likes} likes
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setSelectedSession(session)}
                          >
                            View
                          </Button>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Recent Activity
                  </Typography>
                  <List dense>
                    {metrics.recentActivity.map((event) => (
                      <ListItem key={event.id}>
                        <ListItemAvatar>
                          <Avatar>{getEventTypeIcon(event.eventType)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={event.description}
                          secondary={`${event.playerName} • ${formatTimestamp(event.timestamp)}`}
                        />
                        <Chip
                          label={event.importance}
                          color={getImportanceColor(event.importance) as any}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Replay Configuration</DialogTitle>
        <DialogContent>
          {config && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enabled}
                        onChange={(e) =>
                          setConfig({ ...config, enabled: e.target.checked })
                        }
                      />
                    }
                    label="Enable Replay System"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.autoRecord}
                        onChange={(e) =>
                          setConfig({ ...config, autoRecord: e.target.checked })
                        }
                      />
                    }
                    label="Auto Record"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Quality</InputLabel>
                    <Select
                      value={config.quality}
                      onChange={(e) =>
                        setConfig({ ...config, quality: e.target.value as any })
                      }
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="ultra">Ultra</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Duration (seconds)"
                    type="number"
                    value={config.maxDuration}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        maxDuration: Number(e.target.value),
                      })
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Features
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.aiAnalysisEnabled}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                aiAnalysisEnabled: e.target.checked,
                              })
                            }
                          />
                        }
                        label="AI Analysis"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.highlightDetection}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                highlightDetection: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Highlight Detection"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.autoTagging}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                autoTagging: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Auto Tagging"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.publicByDefault}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                publicByDefault: e.target.checked,
                              })
                            }
                          />
                        }
                        label="Public by Default"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => config && handleUpdateConfig(config)}
            variant="contained"
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Dialog */}
      <Dialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Replay Session</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Match ID"
                value={newSession.matchId}
                onChange={(e) =>
                  setNewSession({ ...newSession, matchId: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Title"
                value={newSession.title}
                onChange={(e) =>
                  setNewSession({ ...newSession, title: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newSession.description}
                onChange={(e) =>
                  setNewSession({ ...newSession, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tags (comma-separated)"
                value={newSession.tags}
                onChange={(e) =>
                  setNewSession({ ...newSession, tags: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newSession.isPublic}
                    onChange={(e) =>
                      setNewSession({
                        ...newSession,
                        isPublic: e.target.checked,
                      })
                    }
                  />
                }
                label="Public Session"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSession} variant="contained">
            Create Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="User ID"
                value={newComment.userId}
                onChange={(e) =>
                  setNewComment({ ...newComment, userId: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="User Name"
                value={newComment.userName}
                onChange={(e) =>
                  setNewComment({ ...newComment, userName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comment"
                multiline
                rows={3}
                value={newComment.content}
                onChange={(e) =>
                  setNewComment({ ...newComment, content: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event ID (optional)"
                value={newComment.eventId}
                onChange={(e) =>
                  setNewComment({ ...newComment, eventId: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComment} variant="contained">
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Session Details</DialogTitle>
        <DialogContent>
          {selectedSession && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedSession.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedSession.description}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration: {formatDuration(selectedSession.duration)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Events: {selectedSession.analysis.totalEvents}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Highlights: {selectedSession.analysis.highlights}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Average Quality:{' '}
                    {selectedSession.analysis.averageShotQuality.toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Views: {selectedSession.views}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Likes: {selectedSession.likes}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedSession.tags.map((tag, index) => (
                    <Chip key={index} label={tag} />
                  ))}
                </Box>
              </Box>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {selectedSession.analysis.matchSummary}
                    </Typography>

                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Improvement Areas:
                    </Typography>
                    <List dense>
                      {selectedSession.analysis.improvementAreas.map(
                        (area, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={area} />
                          </ListItem>
                        )
                      )}
                    </List>

                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Recommendations:
                    </Typography>
                    <List dense>
                      {selectedSession.analysis.recommendations.map(
                        (rec, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={rec} />
                          </ListItem>
                        )
                      )}
                    </List>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {selectedSession.comments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Comments:
                  </Typography>
                  <List dense>
                    {selectedSession.comments.map((comment) => (
                      <ListItem key={comment.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {comment.userName.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={comment.userName}
                          secondary={comment.content}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(comment.timestamp)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSession(null)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setSelectedSession(null);
              setTabValue(1);
            }}
          >
            Play Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Event Details</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedEvent.description}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Event Type: {selectedEvent.eventType}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Importance: {selectedEvent.importance}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Power: {selectedEvent.power}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Accuracy: {selectedEvent.accuracy}%
                  </Typography>
                </Grid>
                {selectedEvent.playerName && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Player: {selectedEvent.playerName}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">AI Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Technique:</strong>{' '}
                      {selectedEvent.aiAnalysis.technique}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Strategy:</strong>{' '}
                      {selectedEvent.aiAnalysis.strategy}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Success Probability:</strong>{' '}
                      {(
                        selectedEvent.aiAnalysis.prediction.successProbability *
                        100
                      ).toFixed(1)}
                      %
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Expected Outcome:</strong>{' '}
                      {selectedEvent.aiAnalysis.prediction.expectedOutcome}
                    </Typography>

                    <Typography variant="h6" sx={{ mb: 1 }}>
                      Improvements:
                    </Typography>
                    <List dense>
                      {selectedEvent.aiAnalysis.improvement.map(
                        (improvement, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={improvement} />
                          </ListItem>
                        )
                      )}
                    </List>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {selectedEvent.highlights.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Highlights:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedEvent.highlights.map((highlight, index) => (
                      <Chip key={index} label={highlight} color="success" />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedEvent.insights.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Insights:
                  </Typography>
                  <List dense>
                    {selectedEvent.insights.map((insight, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={insight} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Tags:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedEvent.tags.map((tag, index) => (
                    <Chip key={index} label={tag} variant="outlined" />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedGameReplay;
