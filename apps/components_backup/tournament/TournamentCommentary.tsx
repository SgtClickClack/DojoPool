import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Mic,
  MicOff,
  Settings,
  Refresh,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Speed,
  Tune,
  AutoAwesome,
  TrendingUp,
  Psychology,
  Analytics,
  SportsEsports,
  EmojiEvents,
  Timeline,
  Assessment,
} from '@mui/icons-material';
import TournamentCommentaryService, {
  type CommentaryEvent,
  type CommentaryConfig,
} from '../../services/ai/TournamentCommentaryService';

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
      id={`commentary-tabpanel-${index}`}
      aria-labelledby={`commentary-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TournamentCommentary: React.FC = () => {
  const service = TournamentCommentaryService.getInstance();
  const [tabValue, setTabValue] = useState(0);
  const [commentaryEvents, setCommentaryEvents] = useState<CommentaryEvent[]>(
    []
  );
  const [config, setConfig] = useState<CommentaryConfig | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    setCommentaryEvents(service.getCommentaryEvents());
    setConfig(service.getConfig());
    setIsConnected(service.isConnected());

    const handleCommentaryGenerated = (event: CommentaryEvent) => {
      setCommentaryEvents((prev) => [event, ...prev.slice(0, 49)]);
    };

    service.on('commentaryGenerated', handleCommentaryGenerated);

    return () => {
      service.off('commentaryGenerated', handleCommentaryGenerated);
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleToggleCommentary = () => {
    setIsEnabled(!isEnabled);
    service.updateConfig({ enabled: !isEnabled });
  };

  const handleStyleChange = (style: CommentaryConfig['style']) => {
    service.updateConfig({ style });
    setConfig((prev) => (prev ? { ...prev, style } : null));
  };

  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
  };

  const handleSpeedChange = (event: Event, newValue: number | number[]) => {
    setSpeed(newValue as number);
  };

  const getExcitementColor = (level: number) => {
    if (level >= 90) return '#ff0000';
    if (level >= 75) return '#ff6600';
    if (level >= 60) return '#ffcc00';
    return '#00ff00';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#ff0000';
      case 'high':
        return '#ff6600';
      case 'medium':
        return '#ffcc00';
      case 'low':
        return '#00ff00';
      default:
        return '#888888';
    }
  };

  const cyberpunkPaper = {
    background: 'rgba(20, 20, 40, 0.95)',
    border: '1.5px solid #00fff7',
    boxShadow: '0 0 24px #00fff7, 0 0 8px #ff00ea',
    borderRadius: 10,
    color: '#fff',
    margin: '1.5rem 0',
    padding: '1.5rem',
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow:
      '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  };

  const renderLiveCommentary = () => (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ ...neonTextStyle, color: '#ff00ea' }}>
          <Mic sx={{ mr: 1, color: '#ff00ea' }} />
          Live Commentary
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Toggle Commentary">
            <IconButton
              onClick={handleToggleCommentary}
              sx={{ color: isEnabled ? '#00ff9d' : '#ff6666' }}
            >
              {isEnabled ? <Mic /> : <MicOff />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton sx={{ color: '#00a8ff' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {commentaryEvents.map((event) => (
          <ListItem
            key={event.id}
            sx={{
              border: '1px solid rgba(0, 255, 157, 0.2)',
              borderRadius: 2,
              mb: 1,
              background: 'rgba(0, 255, 157, 0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(0, 255, 157, 0.1)',
                borderColor: 'rgba(0, 255, 157, 0.4)',
              },
            }}
          >
            <ListItemIcon>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  background: `linear-gradient(135deg, ${getExcitementColor(event.excitementLevel)} 0%, #00a8ff 100%)`,
                  color: '#000',
                  fontWeight: 'bold',
                }}
              >
                <AutoAwesome />
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box>
                  <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
                    {event.content}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={event.type.replace('_', ' ')}
                      size="small"
                      sx={{
                        bgcolor: '#ff00ea',
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={`Excitement: ${event.excitementLevel}%`}
                      size="small"
                      sx={{
                        bgcolor: getExcitementColor(event.excitementLevel),
                        color: '#000',
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={`Confidence: ${event.confidence}%`}
                      size="small"
                      sx={{
                        bgcolor: '#00a8ff',
                        color: '#000',
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={event.metadata.priority}
                      size="small"
                      sx={{
                        bgcolor: getPriorityColor(event.metadata.priority),
                        color: '#000',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>
              }
              secondary={
                <Typography variant="caption" sx={{ color: '#888', mt: 1 }}>
                  {event.timestamp.toLocaleTimeString()} •{' '}
                  {event.metadata.style} • {event.metadata.duration}s
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderAnalytics = () => (
    <Box>
      <Typography
        variant="h6"
        sx={{ ...neonTextStyle, color: '#ff00ea', mb: 2 }}
      >
        <Analytics sx={{ mr: 1, color: '#ff00ea' }} />
        Commentary Analytics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={cyberpunkPaper}>
            <Typography
              variant="subtitle1"
              sx={{ color: '#00fff7', fontWeight: 600, mb: 2 }}
            >
              Excitement Distribution
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                High Excitement (90-100%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  (commentaryEvents.filter((e) => e.excitementLevel >= 90)
                    .length /
                    Math.max(commentaryEvents.length, 1)) *
                  100
                }
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 0, 0, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background:
                      'linear-gradient(90deg, #ff0000 0%, #ff6600 100%)',
                  },
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                Medium Excitement (60-89%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={
                  (commentaryEvents.filter(
                    (e) => e.excitementLevel >= 60 && e.excitementLevel < 90
                  ).length /
                    Math.max(commentaryEvents.length, 1)) *
                  100
                }
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255, 204, 0, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background:
                      'linear-gradient(90deg, #ffcc00 0%, #ff6600 100%)',
                  },
                }}
              />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={cyberpunkPaper}>
            <Typography
              variant="subtitle1"
              sx={{ color: '#00fff7', fontWeight: 600, mb: 2 }}
            >
              Commentary Types
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                'shot_analysis',
                'match_update',
                'player_performance',
                'tournament_insight',
                'excitement_moment',
              ].map((type) => {
                const count = commentaryEvents.filter(
                  (e) => e.type === type
                ).length;
                const percentage =
                  commentaryEvents.length > 0
                    ? (count / commentaryEvents.length) * 100
                    : 0;
                return (
                  <Box
                    key={type}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: '#fff', textTransform: 'capitalize' }}
                    >
                      {type.replace('_', ' ')}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#00ff9d', fontWeight: 600 }}
                    >
                      {count} ({percentage.toFixed(1)}%)
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderSettings = () => (
    <Box>
      <Typography
        variant="h6"
        sx={{ ...neonTextStyle, color: '#ff00ea', mb: 2 }}
      >
        <Settings sx={{ mr: 1, color: '#ff00ea' }} />
        Commentary Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={cyberpunkPaper}>
            <Typography
              variant="subtitle1"
              sx={{ color: '#00fff7', fontWeight: 600, mb: 2 }}
            >
              General Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={handleToggleCommentary}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00ff9d',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00ff9d',
                    },
                  }}
                />
              }
              label="Enable AI Commentary"
              sx={{ color: '#fff', mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: '#fff' }}>Commentary Style</InputLabel>
              <Select
                value={config?.style || 'excited'}
                onChange={(e) =>
                  handleStyleChange(e.target.value as CommentaryConfig['style'])
                }
                sx={{
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00fff7',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ff00ea',
                  },
                }}
              >
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
                <MenuItem value="excited">Excited</MenuItem>
                <MenuItem value="analytical">Analytical</MenuItem>
              </Select>
            </FormControl>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={cyberpunkPaper}>
            <Typography
              variant="subtitle1"
              sx={{ color: '#00fff7', fontWeight: 600, mb: 2 }}
            >
              Audio Settings
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                Volume: {volume}%
              </Typography>
              <Slider
                value={volume}
                onChange={handleVolumeChange}
                sx={{
                  color: '#00ff9d',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#00ff9d',
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#fff', mb: 1 }}>
                Playback Speed: {speed}x
              </Typography>
              <Slider
                value={speed}
                onChange={handleSpeedChange}
                min={0.5}
                max={2}
                step={0.1}
                sx={{
                  color: '#00a8ff',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#00a8ff',
                  },
                }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#00a8ff',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#00a8ff',
                    },
                  }}
                />
              }
              label="Auto-scroll to latest"
              sx={{ color: '#fff' }}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', minHeight: '80vh', mt: 2 }}>
      <Paper sx={cyberpunkPaper}>
        <Typography variant="h4" sx={{ ...neonTextStyle, mb: 2 }}>
          AI Tournament Commentary & Analysis
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '2px solid #00fff7',
            mb: 2,
            '.MuiTab-root': { color: '#fff', fontWeight: 600 },
            '.Mui-selected': { color: '#ff00ea !important' },
            '.MuiTabs-indicator': {
              background: 'linear-gradient(90deg,#00fff7,#ff00ea)',
            },
          }}
        >
          <Tab icon={<Mic />} label="Live Commentary" />
          <Tab icon={<Analytics />} label="Analytics" />
          <Tab icon={<Settings />} label="Settings" />
        </Tabs>

        <Divider sx={{ mb: 2, borderColor: '#00fff7' }} />

        <TabPanel value={tabValue} index={0}>
          {renderLiveCommentary()}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderAnalytics()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {renderSettings()}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default TournamentCommentary;
