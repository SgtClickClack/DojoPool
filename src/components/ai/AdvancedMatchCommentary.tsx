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
  ListItemAvatar
} from '@mui/material';
import {
  Mic,
  PlayArrow,
  Stop,
  Settings,
  Add,
  Edit,
  Delete,
  ThumbUp,
  ThumbDown,
  Comment,
  Share,
  ExpandMore,
  Timeline,
  Style,
  EmojiEvents,
  Psychology,
  SportsEsports
} from '@mui/icons-material';
import AdvancedMatchCommentaryService, {
  CommentaryEvent,
  CommentaryStyle,
  CommentaryConfig,
  CommentaryMetrics,
  CommentaryReaction
} from '../../services/ai/AdvancedMatchCommentaryService';

const AdvancedMatchCommentary: React.FC = () => {
  const service = AdvancedMatchCommentaryService.getInstance();
  const [tabValue, setTabValue] = useState(0);
  const [events, setEvents] = useState<CommentaryEvent[]>([]);
  const [styles, setStyles] = useState<CommentaryStyle[]>([]);
  const [config, setConfig] = useState<CommentaryConfig | null>(null);
  const [metrics, setMetrics] = useState<CommentaryMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CommentaryEvent | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [newEventDialogOpen, setNewEventDialogOpen] = useState(false);
  const [reactionDialogOpen, setReactionDialogOpen] = useState(false);
  const [selectedEventForReaction, setSelectedEventForReaction] = useState<string>('');

  // Form states
  const [newEvent, setNewEvent] = useState({
    matchId: '',
    eventType: 'shot' as CommentaryEvent['eventType'],
    description: '',
    style: 'professional',
    confidence: 85,
    playerId: '',
    playerName: '',
    context: ''
  });

  const [newStyle, setNewStyle] = useState({
    name: '',
    description: '',
    tone: 'professional' as CommentaryStyle['tone'],
    language: 'formal' as CommentaryStyle['language'],
    pace: 'moderate' as CommentaryStyle['pace'],
    focus: 'technical' as CommentaryStyle['focus'],
    enabled: true
  });

  const [newReaction, setNewReaction] = useState({
    userId: '',
    userName: '',
    type: 'like' as CommentaryReaction['type'],
    content: ''
  });

  useEffect(() => {
    loadData();
    setupEventListeners();

    return () => {
      service.removeAllListeners();
    };
  }, []);

  const loadData = () => {
    setEvents(service.getEvents());
    setStyles(service.getStyles());
    setConfig(service.getConfig());
    setMetrics(service.getMetrics());
    setIsConnected(service.getConnectionStatus());
  };

  const setupEventListeners = () => {
    service.on('commentaryGenerated', (event: CommentaryEvent) => {
      setEvents(service.getEvents());
      setMetrics(service.getMetrics());
    });

    service.on('commentaryUpdated', () => {
      setEvents(service.getEvents());
      setMetrics(service.getMetrics());
    });

    service.on('reactionAdded', () => {
      setEvents(service.getEvents());
    });

    service.on('styleAdded', (style: CommentaryStyle) => {
      setStyles(service.getStyles());
    });

    service.on('styleUpdated', () => {
      setStyles(service.getStyles());
    });

    service.on('styleRemoved', () => {
      setStyles(service.getStyles());
    });

    service.on('configUpdated', (newConfig: CommentaryConfig) => {
      setConfig(newConfig);
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateCommentary = async () => {
    try {
      await service.generateCommentary({
        matchId: newEvent.matchId,
        eventType: newEvent.eventType,
        description: newEvent.description,
        style: newEvent.style,
        confidence: newEvent.confidence,
        playerId: newEvent.playerId,
        playerName: newEvent.playerName,
        context: JSON.parse(newEvent.context || '{}')
      });
      setNewEventDialogOpen(false);
      setNewEvent({
        matchId: '',
        eventType: 'shot',
        description: '',
        style: 'professional',
        confidence: 85,
        playerId: '',
        playerName: '',
        context: ''
      });
    } catch (error) {
      console.error('Error generating commentary:', error);
    }
  };

  const handleAddStyle = async () => {
    try {
      await service.addStyle(newStyle);
      setStyleDialogOpen(false);
      setNewStyle({
        name: '',
        description: '',
        tone: 'professional',
        language: 'formal',
        pace: 'moderate',
        focus: 'technical',
        enabled: true
      });
    } catch (error) {
      console.error('Error adding style:', error);
    }
  };

  const handleAddReaction = async () => {
    try {
      await service.addReaction(selectedEventForReaction, newReaction);
      setReactionDialogOpen(false);
      setNewReaction({
        userId: '',
        userName: '',
        type: 'like',
        content: ''
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<CommentaryConfig>) => {
    try {
      await service.updateConfig(newConfig);
      setConfigDialogOpen(false);
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const getEventTypeIcon = (type: CommentaryEvent['eventType']) => {
    switch (type) {
      case 'shot': return <SportsEsports />;
      case 'foul': return <ThumbDown />;
      case 'score': return <EmojiEvents />;
      case 'turnover': return <Timeline />;
      case 'timeout': return <Stop />;
      case 'highlight': return <EmojiEvents />;
      case 'analysis': return <Psychology />;
      default: return <Mic />;
    }
  };

  const getToneColor = (tone: CommentaryStyle['tone']) => {
    switch (tone) {
      case 'enthusiastic': return 'success';
      case 'dramatic': return 'error';
      case 'humorous': return 'warning';
      case 'analytical': return 'info';
      case 'casual': return 'default';
      default: return 'primary';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const getReactionIcon = (type: CommentaryReaction['type']) => {
    switch (type) {
      case 'like': return <ThumbUp />;
      case 'dislike': return <ThumbDown />;
      case 'comment': return <Comment />;
      case 'share': return <Share />;
      default: return <ThumbUp />;
    }
  };

  const handleTriggerFlukeGod = async () => {
    // For demo, use the first matchId and player
    const matchId = events[0]?.matchId || 'demo_match';
    const playerId = events[0]?.playerId || 'demo_player';
    const playerName = events[0]?.playerName || 'Demo Player';
    await service.generateFlukeGodCommentary(matchId, playerId, playerName);
    setEvents(service.getEvents());
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <Mic sx={{ mr: 2, color: '#00ff9d' }} />
          Advanced Match Commentary System
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
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Commentary" icon={<Mic />} />
          <Tab label="Styles" icon={<Style />} />
          <Tab label="Metrics" icon={<Timeline />} />
          <Tab label="Real-time" icon={<PlayArrow />} />
        </Tabs>
      </Paper>

      {/* Commentary Tab */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Match Commentary Events</Typography>
            <Button
              variant="contained"
              startIcon={<Mic />}
              onClick={() => setNewEventDialogOpen(true)}
            >
              Generate Commentary
            </Button>
          </Box>

          <Grid container spacing={2}>
            {events.map((event) => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getEventTypeIcon(event.eventType)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {event.eventType.toUpperCase()}
                        </Typography>
                      </Box>
                      <Chip
                        label={event.style}
                        color={getToneColor(styles.find(s => s.id === event.style)?.tone || 'professional') as any}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                      "{event.commentary}"
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {event.description}
                    </Typography>

                    {event.playerName && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Player: {event.playerName}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {event.confidence}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimestamp(event.timestamp)}
                      </Typography>
                    </Box>

                    {event.highlights.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Highlights:</Typography>
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

                    {event.insights.length > 0 && (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle2">Insights</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {event.insights.map((insight, index) => (
                              <ListItem key={index}>
                                <ListItemText primary={insight} />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedEvent(event)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedEventForReaction(event.id);
                          setReactionDialogOpen(true);
                        }}
                      >
                        Add Reaction
                      </Button>
                    </Box>

                    {event.reactions.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Reactions:</Typography>
                        <List dense>
                          {event.reactions.map((reaction) => (
                            <ListItem key={reaction.id}>
                              <ListItemAvatar>
                                <Avatar sx={{ width: 24, height: 24 }}>
                                  {getReactionIcon(reaction.type)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={reaction.userName}
                                secondary={reaction.content || reaction.type}
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

      {/* Styles Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Commentary Styles</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setStyleDialogOpen(true)}
            >
              Add Style
            </Button>
          </Box>

          <Grid container spacing={2}>
            {styles.map((style) => (
              <Grid item xs={12} md={6} key={style.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6">{style.name}</Typography>
                      <Chip
                        label={style.enabled ? 'Enabled' : 'Disabled'}
                        color={style.enabled ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {style.description}
                    </Typography>

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Chip
                          label={`Tone: ${style.tone}`}
                          color={getToneColor(style.tone) as any}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip
                          label={`Language: ${style.language}`}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip
                          label={`Pace: ${style.pace}`}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip
                          label={`Focus: ${style.focus}`}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Metrics Tab */}
      {tabValue === 2 && metrics && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Commentary Performance Metrics</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Events
                  </Typography>
                  <Typography variant="h4">
                    {metrics.totalEvents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Average Confidence
                  </Typography>
                  <Typography variant="h4">
                    {metrics.averageConfidence.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Reaction Rate
                  </Typography>
                  <Typography variant="h4">
                    {(metrics.reactionRate * 100).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Response Time
                  </Typography>
                  <Typography variant="h4">
                    {metrics.responseTime}ms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Events by Type</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(metrics.eventsByType).map(([type, count]) => (
                      <Grid item xs={6} md={3} key={type}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5">{count}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.toUpperCase()}
                          </Typography>
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
                  <Typography variant="h6" sx={{ mb: 2 }}>Popular Styles</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(metrics.popularStyles).map(([style, count]) => (
                      <Grid item xs={6} md={3} key={style}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5">{count}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {style}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Real-time Tab */}
      {tabValue === 3 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Real-time Commentary Monitoring</Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            Real-time commentary is {config?.realTimeCommentary ? 'enabled' : 'disabled'}. 
            {config?.realTimeCommentary && ' AI is actively generating commentary for live matches.'}
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Live Match Commentary</Typography>
                  <Typography variant="body2" color="text.secondary">
                    No active matches with real-time commentary
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>System Status</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Connection:</Typography>
                      <Chip
                        label={isConnected ? 'Connected' : 'Disconnected'}
                        color={isConnected ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Real-time Commentary:</Typography>
                      <Chip
                        label={config?.realTimeCommentary ? 'Active' : 'Inactive'}
                        color={config?.realTimeCommentary ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Auto Commentary:</Typography>
                      <Chip
                        label={config?.autoCommentary ? 'Enabled' : 'Disabled'}
                        color={config?.autoCommentary ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Commentary Configuration</DialogTitle>
        <DialogContent>
          {config && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.enabled}
                        onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                      />
                    }
                    label="Enable Commentary"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.realTimeCommentary}
                        onChange={(e) => setConfig({ ...config, realTimeCommentary: e.target.checked })}
                      />
                    }
                    label="Real-time Commentary"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.autoCommentary}
                        onChange={(e) => setConfig({ ...config, autoCommentary: e.target.checked })}
                      />
                    }
                    label="Auto Commentary"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Commentary Delay (ms)"
                    type="number"
                    value={config.commentaryDelay}
                    onChange={(e) => setConfig({ ...config, commentaryDelay: Number(e.target.value) })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Commentary Length"
                    type="number"
                    value={config.maxCommentaryLength}
                    onChange={(e) => setConfig({ ...config, maxCommentaryLength: Number(e.target.value) })}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Default Style</InputLabel>
                    <Select
                      value={config.defaultStyle}
                      onChange={(e) => setConfig({ ...config, defaultStyle: e.target.value })}
                    >
                      {config.styles.map((style) => (
                        <MenuItem key={style.id} value={style.id}>
                          {style.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Features</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.enableReactions}
                            onChange={(e) => setConfig({ ...config, enableReactions: e.target.checked })}
                          />
                        }
                        label="Reactions"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.enableHighlights}
                            onChange={(e) => setConfig({ ...config, enableHighlights: e.target.checked })}
                          />
                        }
                        label="Highlights"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.enableInsights}
                            onChange={(e) => setConfig({ ...config, enableInsights: e.target.checked })}
                          />
                        }
                        label="Insights"
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
          <Button onClick={() => config && handleUpdateConfig(config)} variant="contained">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Event Dialog */}
      <Dialog open={newEventDialogOpen} onClose={() => setNewEventDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate New Commentary</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Match ID"
                value={newEvent.matchId}
                onChange={(e) => setNewEvent({ ...newEvent, matchId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value as any })}
                >
                  <MenuItem value="shot">Shot</MenuItem>
                  <MenuItem value="foul">Foul</MenuItem>
                  <MenuItem value="score">Score</MenuItem>
                  <MenuItem value="turnover">Turnover</MenuItem>
                  <MenuItem value="timeout">Timeout</MenuItem>
                  <MenuItem value="highlight">Highlight</MenuItem>
                  <MenuItem value="analysis">Analysis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Style</InputLabel>
                <Select
                  value={newEvent.style}
                  onChange={(e) => setNewEvent({ ...newEvent, style: e.target.value })}
                >
                  {styles.map((style) => (
                    <MenuItem key={style.id} value={style.id}>
                      {style.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confidence (%)"
                type="number"
                value={newEvent.confidence}
                onChange={(e) => setNewEvent({ ...newEvent, confidence: Number(e.target.value) })}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Player ID"
                value={newEvent.playerId}
                onChange={(e) => setNewEvent({ ...newEvent, playerId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Player Name"
                value={newEvent.playerName}
                onChange={(e) => setNewEvent({ ...newEvent, playerName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Context (JSON)"
                multiline
                rows={3}
                value={newEvent.context}
                onChange={(e) => setNewEvent({ ...newEvent, context: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateCommentary} variant="contained">
            Generate Commentary
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Style Dialog */}
      <Dialog open={styleDialogOpen} onClose={() => setStyleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Commentary Style</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Style Name"
                value={newStyle.name}
                onChange={(e) => setNewStyle({ ...newStyle, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                value={newStyle.description}
                onChange={(e) => setNewStyle({ ...newStyle, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tone</InputLabel>
                <Select
                  value={newStyle.tone}
                  onChange={(e) => setNewStyle({ ...newStyle, tone: e.target.value as any })}
                >
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="enthusiastic">Enthusiastic</MenuItem>
                  <MenuItem value="dramatic">Dramatic</MenuItem>
                  <MenuItem value="humorous">Humorous</MenuItem>
                  <MenuItem value="analytical">Analytical</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={newStyle.language}
                  onChange={(e) => setNewStyle({ ...newStyle, language: e.target.value as any })}
                >
                  <MenuItem value="formal">Formal</MenuItem>
                  <MenuItem value="informal">Informal</MenuItem>
                  <MenuItem value="technical">Technical</MenuItem>
                  <MenuItem value="colorful">Colorful</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Pace</InputLabel>
                <Select
                  value={newStyle.pace}
                  onChange={(e) => setNewStyle({ ...newStyle, pace: e.target.value as any })}
                >
                  <MenuItem value="slow">Slow</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="fast">Fast</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Focus</InputLabel>
                <Select
                  value={newStyle.focus}
                  onChange={(e) => setNewStyle({ ...newStyle, focus: e.target.value as any })}
                >
                  <MenuItem value="technical">Technical</MenuItem>
                  <MenuItem value="entertainment">Entertainment</MenuItem>
                  <MenuItem value="educational">Educational</MenuItem>
                  <MenuItem value="dramatic">Dramatic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newStyle.enabled}
                    onChange={(e) => setNewStyle({ ...newStyle, enabled: e.target.checked })}
                  />
                }
                label="Enabled"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStyleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddStyle} variant="contained">
            Add Style
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reaction Dialog */}
      <Dialog open={reactionDialogOpen} onClose={() => setReactionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Reaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="User ID"
                value={newReaction.userId}
                onChange={(e) => setNewReaction({ ...newReaction, userId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="User Name"
                value={newReaction.userName}
                onChange={(e) => setNewReaction({ ...newReaction, userName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Reaction Type</InputLabel>
                <Select
                  value={newReaction.type}
                  onChange={(e) => setNewReaction({ ...newReaction, type: e.target.value as any })}
                >
                  <MenuItem value="like">Like</MenuItem>
                  <MenuItem value="dislike">Dislike</MenuItem>
                  <MenuItem value="comment">Comment</MenuItem>
                  <MenuItem value="share">Share</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Content (optional)"
                multiline
                rows={2}
                value={newReaction.content}
                onChange={(e) => setNewReaction({ ...newReaction, content: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReactionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddReaction} variant="contained">
            Add Reaction
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)} maxWidth="md" fullWidth>
        <DialogTitle>Commentary Event Details</DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>"{selectedEvent.commentary}"</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedEvent.description}</Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Event Type: {selectedEvent.eventType}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Style: {selectedEvent.style}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Confidence: {selectedEvent.confidence}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {formatTimestamp(selectedEvent.timestamp)}
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

              {selectedEvent.highlights.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Highlights:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedEvent.highlights.map((highlight, index) => (
                      <Chip key={index} label={highlight} color="success" />
                    ))}
                  </Box>
                </Box>
              )}

              {selectedEvent.insights.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Insights:</Typography>
                  <List dense>
                    {selectedEvent.insights.map((insight, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={insight} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {selectedEvent.reactions.length > 0 && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>Reactions:</Typography>
                  <List dense>
                    {selectedEvent.reactions.map((reaction) => (
                      <ListItem key={reaction.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            {getReactionIcon(reaction.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={reaction.userName}
                          secondary={reaction.content || reaction.type}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(reaction.timestamp)}
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
          <Button onClick={() => setSelectedEvent(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Button variant="contained" color="warning" onClick={handleTriggerFlukeGod} sx={{ mb: 2 }}>
        Trigger Fluke God Event
      </Button>
    </Box>
  );
};

export default AdvancedMatchCommentary; 