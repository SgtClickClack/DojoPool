import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Skeleton,
  Badge,
  Tooltip,
  Collapse,
  Paper
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Settings,
  ExpandMore,
  ExpandLess,
  Favorite,
  FavoriteBorder,
  Share,
  Comment,
  AutoAwesome,
  SportsEsports,
  Psychology,
  Casino
} from '@mui/icons-material';
import { useAICommentary } from '../../hooks/useAICommentary';
import { AICommentaryEvent, PoolGod } from '../../services/ai/RealTimeAICommentaryService';

interface AICommentaryPanelProps {
  matchId?: string;
  autoJoin?: boolean;
  showSettings?: boolean;
  maxEvents?: number;
  onEventClick?: (event: AICommentaryEvent) => void;
}

const godIcons = {
  'ai-umpire': <Psychology />,
  'match-commentator': <SportsEsports />,
  'fluke-god': <Casino />
};

const godColors = {
  'ai-umpire': '#2196F3',
  'match-commentator': '#4CAF50',
  'fluke-god': '#FF9800'
};

export const AICommentaryPanel: React.FC<AICommentaryPanelProps> = ({
  matchId,
  autoJoin = true,
  showSettings = true,
  maxEvents = 10,
  onEventClick
}) => {
  const {
    isConnected,
    currentMatchEvents,
    poolGods,
    isLoading,
    error,
    joinMatch,
    leaveMatch,
    addReaction
  } = useAICommentary(matchId);

  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(80);
  const [selectedGod, setSelectedGod] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Auto-join match when component mounts
  useEffect(() => {
    if (autoJoin && matchId) {
      joinMatch(matchId);
    }
  }, [matchId, autoJoin, joinMatch]);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMatchEvents, autoScroll]);

  // Play audio for new events
  useEffect(() => {
    if (audioEnabled && currentMatchEvents.length > 0) {
      const latestEvent = currentMatchEvents[0];
      if (latestEvent.audioUrl) {
        playAudio(latestEvent.audioUrl, latestEvent.id);
      }
    }
  }, [currentMatchEvents, audioEnabled]);

  const playAudio = (audioUrl: string, eventId: string) => {
    try {
      let audio = audioRefs.current.get(eventId);
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.volume = volume / 100;
        audioRefs.current.set(eventId, audio);
      }
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioRefs.current.forEach(audio => {
      audio.volume = newVolume / 100;
    });
  };

  const toggleFavorite = (eventId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(eventId)) {
      newFavorites.delete(eventId);
    } else {
      newFavorites.add(eventId);
    }
    setFavorites(newFavorites);
  };

  const handleShare = (event: AICommentaryEvent) => {
    if (navigator.share) {
      navigator.share({
        title: `${event.poolGod} Commentary`,
        text: event.commentary,
        url: `${window.location.origin}/commentary/${event.id}`
      });
    } else {
      navigator.clipboard.writeText(event.commentary);
    }
  };

  const getFilteredEvents = () => {
    let filtered = currentMatchEvents;
    
    if (selectedGod !== 'all') {
      filtered = filtered.filter(event => event.poolGod === selectedGod);
    }
    
    return filtered.slice(0, maxEvents);
  };

  const getGodName = (godId: string) => {
    const god = poolGods.find(g => g.id === godId);
    return god?.name || godId;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#FFD700';
      case 'epic': return '#9C27B0';
      case 'rare': return '#2196F3';
      case 'uncommon': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const renderEvent = (event: AICommentaryEvent) => (
    <ListItem
      key={event.id}
      sx={{
        mb: 1,
        borderRadius: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${godColors[event.poolGod as keyof typeof godColors] || '#666'}`,
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          cursor: 'pointer'
        }
      }}
      onClick={() => onEventClick?.(event)}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            backgroundColor: godColors[event.poolGod as keyof typeof godColors] || '#666',
            width: 40,
            height: 40
          }}
        >
          {godIcons[event.poolGod as keyof typeof godIcons] || <AutoAwesome />}
        </Avatar>
      </ListItemAvatar>
      
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" color="primary">
              {getGodName(event.poolGod || '')}
            </Typography>
            <Chip
              label={event.eventType}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            {event.metadata.rarity !== 'common' && (
              <Chip
                label={event.metadata.rarity}
                size="small"
                sx={{
                  backgroundColor: getRarityColor(event.metadata.rarity),
                  color: 'white',
                  fontSize: '0.7rem'
                }}
              />
            )}
            {event.metadata.blessingGranted && (
              <Tooltip title="Blessing Granted">
                <AutoAwesome sx={{ color: '#FFD700', fontSize: 16 }} />
              </Tooltip>
            )}
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {event.commentary}
            </Typography>
            
            {event.highlights.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                {event.highlights.map((highlight, index) => (
                  <Chip
                    key={index}
                    label={highlight}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem' }}
                  />
                ))}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {new Date(event.timestamp).toLocaleTimeString()}
              </Typography>
              
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(event.id);
                }}
              >
                {favorites.has(event.id) ? <Favorite color="error" /> : <FavoriteBorder />}
              </IconButton>
              
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(event);
                }}
              >
                <Share />
              </IconButton>
              
              {event.audioUrl && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(event.audioUrl!, event.id);
                  }}
                >
                  <PlayArrow />
                </IconButton>
              )}
            </Box>
          </Box>
        }
      />
    </ListItem>
  );

  if (!isConnected && !autoJoin) {
    return (
      <Card sx={{ minHeight: 200 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI Commentary
          </Typography>
          <Alert severity="info">
            Connect to a match to see AI commentary
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="primary" />
            <Typography variant="h6">
              Pool God Commentary
            </Typography>
            <Badge
              badgeContent={currentMatchEvents.length}
              color="primary"
              sx={{ ml: 1 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {showSettings && (
              <IconButton
                size="small"
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              >
                <Settings />
              </IconButton>
            )}
            
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Settings Panel */}
        <Collapse in={showSettingsPanel}>
          <Paper sx={{ p: 2, mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="subtitle2" gutterBottom>
              Commentary Settings
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Pool God</InputLabel>
                <Select
                  value={selectedGod}
                  onChange={(e) => setSelectedGod(e.target.value)}
                  label="Pool God"
                >
                  <MenuItem value="all">All Gods</MenuItem>
                  {poolGods.map(god => (
                    <MenuItem key={god.id} value={god.id}>
                      {god.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={audioEnabled}
                    onChange={(e) => setAudioEnabled(e.target.checked)}
                  />
                }
                label="Audio"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                  />
                }
                label="Auto-scroll"
              />
            </Box>
            
            {audioEnabled && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VolumeUp />
                <Slider
                  value={volume}
                  onChange={(_, value) => handleVolumeChange(value as number)}
                  min={0}
                  max={100}
                  sx={{ flexGrow: 1 }}
                />
                <Typography variant="caption">
                  {volume}%
                </Typography>
              </Box>
            )}
          </Paper>
        </Collapse>

        {/* Connection Status */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Events List */}
        <Collapse in={isExpanded}>
          <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} variant="rectangular" height={80} />
                ))}
              </Box>
            ) : getFilteredEvents().length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AutoAwesome sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No commentary yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pool Gods will appear when match events occur
                </Typography>
              </Box>
            ) : (
              <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                {getFilteredEvents().map(renderEvent)}
                <div ref={eventsEndRef} />
              </List>
            )}
          </Box>
        </Collapse>

        {/* Pool Gods Status */}
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Active Pool Gods
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {poolGods.map(god => (
              <Chip
                key={god.id}
                label={god.name}
                size="small"
                avatar={
                  <Avatar sx={{ backgroundColor: godColors[god.id as keyof typeof godColors] }}>
                    {godIcons[god.id as keyof typeof godIcons]}
                  </Avatar>
                }
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}; 