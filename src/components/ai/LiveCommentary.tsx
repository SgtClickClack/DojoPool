import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
  LinearProgress,
  Fade,
  Zoom,
  Collapse,
  Switch,
  FormControlLabel,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  VolumeUp,
  VolumeOff,
  Mic,
  MicOff,
  RecordVoiceOver,
  SportsCricket,
  Psychology,
  Insights,
  Timeline,
  Settings,
  Language,
  Speed,
  EmojiEvents,
  LocalFireDepartment,
  Warning,
  PlayArrow,
  Pause,
  SkipNext,
  Mood,
  MoodBad,
  Celebration,
  AutoAwesome,
  GraphicEq,
} from '@mui/icons-material';
import { useGameState } from '../gameflow/GameStateManager';

interface LiveCommentaryProps {
  gameId: string;
  enableAudio?: boolean;
  style?: 'professional' | 'casual' | 'exciting' | 'humorous';
  language?: string;
  onCommentary?: (comment: Commentary) => void;
}

interface Commentary {
  id: string;
  text: string;
  emotion: 'neutral' | 'excited' | 'surprised' | 'disappointed' | 'celebratory';
  intensity: number; // 0-100
  timestamp: Date;
  audioUrl?: string;
  context: 'shot' | 'foul' | 'victory' | 'analysis' | 'color';
  player?: string;
  isHighlight: boolean;
}

interface CommentaryStyle {
  name: string;
  icon: React.ReactNode;
  description: string;
  voiceProfile: {
    pitch: number;
    speed: number;
    emotion: string;
  };
}

export const LiveCommentary: React.FC<LiveCommentaryProps> = ({
  gameId,
  enableAudio = true,
  style = 'professional',
  language = 'en',
  onCommentary,
}) => {
  const theme = useTheme();
  const { gameState } = useGameState();
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [currentComment, setCurrentComment] = useState<Commentary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(enableAudio);
  const [volume, setVolume] = useState(70);
  const [selectedStyle, setSelectedStyle] = useState(style);
  const [isPaused, setIsPaused] = useState(false);
  const [intensity, setIntensity] = useState(50);
  const [showHistory, setShowHistory] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const speechQueue = useRef<Commentary[]>([]);

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
    purple: '#8b00ff',
    orange: '#ff6600',
  };

  const commentaryStyles: Record<string, CommentaryStyle> = {
    professional: {
      name: 'Professional',
      icon: <RecordVoiceOver />,
      description: 'Classic sports commentary',
      voiceProfile: {
        pitch: 1.0,
        speed: 1.0,
        emotion: 'neutral',
      },
    },
    casual: {
      name: 'Casual',
      icon: <Mood />,
      description: 'Relaxed and friendly',
      voiceProfile: {
        pitch: 1.1,
        speed: 0.95,
        emotion: 'friendly',
      },
    },
    exciting: {
      name: 'Exciting',
      icon: <LocalFireDepartment />,
      description: 'High energy and enthusiastic',
      voiceProfile: {
        pitch: 1.2,
        speed: 1.1,
        emotion: 'excited',
      },
    },
    humorous: {
      name: 'Humorous',
      icon: <Celebration />,
      description: 'Fun and entertaining',
      voiceProfile: {
        pitch: 1.15,
        speed: 1.05,
        emotion: 'playful',
      },
    },
  };

  // Generate commentary based on game events
  useEffect(() => {
    if (!gameState || isPaused) return;

    const generateInterval = setInterval(() => {
      if (gameState.status === 'in-progress') {
        generateCommentary();
      }
    }, 3000); // Generate every 3 seconds

    return () => clearInterval(generateInterval);
  }, [gameState, isPaused, selectedStyle]);

  const generateCommentary = useCallback(async () => {
    if (!gameState || gameState.shots.length === 0) return;
    
    setIsGenerating(true);
    
    // Analyze recent game events
    const lastShot = gameState.shots[gameState.shots.length - 1];
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
    
    // Generate contextual commentary
    const comment = await generateContextualComment(lastShot, currentPlayer);
    
    if (comment) {
      const newCommentary: Commentary = {
        id: `comm_${Date.now()}`,
        text: comment.text,
        emotion: comment.emotion,
        intensity: comment.intensity,
        timestamp: new Date(),
        context: comment.context,
        player: currentPlayer?.name,
        isHighlight: comment.intensity > 70,
      };
      
      setCommentary(prev => [newCommentary, ...prev].slice(0, 50));
      setCurrentComment(newCommentary);
      
      // Add to speech queue if audio is enabled
      if (audioEnabled) {
        speechQueue.current.push(newCommentary);
        processAudioQueue();
      }
      
      onCommentary?.(newCommentary);
    }
    
    setIsGenerating(false);
  }, [gameState, audioEnabled, selectedStyle, onCommentary]);

  const generateContextualComment = async (shot: any, player: any) => {
    const templates = {
      professional: {
        goodShot: [
          "Excellent positioning by {player}. That's a textbook shot.",
          "{player} demonstrates perfect cue ball control there.",
          "Beautifully executed by {player}. The crowd appreciates that one.",
        ],
        missedShot: [
          "{player} just misses the pocket. Difficult angle on that one.",
          "That's a tough break for {player}. The shot had potential.",
          "Close attempt by {player}, but the angle was challenging.",
        ],
        foul: [
          "That's a foul by {player}. Ball in hand for the opponent.",
          "Referee calls a foul on {player}. Let's see the replay.",
          "{player} commits a foul there. Costly mistake at this stage.",
        ],
      },
      exciting: {
        goodShot: [
          "WOW! {player} absolutely NAILS that shot! Incredible!",
          "BOOM! {player} is ON FIRE! What a shot!",
          "UNBELIEVABLE! {player} makes it look so easy!",
        ],
        missedShot: [
          "OH NO! {player} just misses! So close!",
          "Heartbreaker! {player} was inches away from glory!",
          "Can you believe it?! {player} just misses by a hair!",
        ],
        foul: [
          "DISASTER! {player} commits a foul! This changes everything!",
          "Oh my! That's a crucial foul by {player}!",
          "Unbelievable! {player} makes a critical error!",
        ],
      },
      casual: {
        goodShot: [
          "Nice one, {player}. That's how it's done.",
          "{player} makes it look easy with that shot.",
          "Smooth move by {player}. Looking good out there.",
        ],
        missedShot: [
          "Ah, {player} just misses that one. Happens to the best of us.",
          "Not quite for {player}. Still in good position though.",
          "{player} comes up short there. No worries, plenty of game left.",
        ],
        foul: [
          "Oops, that's a foul by {player}. Gotta be careful.",
          "{player} makes a mistake there. Time to reset.",
          "Foul called on {player}. These things happen.",
        ],
      },
      humorous: {
        goodShot: [
          "{player} just sent that ball to the shadow realm! Bye bye!",
          "Did {player} just break the laws of physics? That was magical!",
          "{player} channeling their inner wizard with that shot!",
        ],
        missedShot: [
          "The pocket said 'not today' to {player}'s shot!",
          "{player}'s ball took a detour to nowhere-ville!",
          "That ball had other plans! {player} will need a GPS next time!",
        ],
        foul: [
          "Whoopsie daisy! {player} just gave their opponent a gift!",
          "{player} just pressed the self-destruct button!",
          "Plot twist! {player} decides to help the opponent!",
        ],
      },
    };
    
    // Determine shot outcome
    let category = 'missedShot';
    let emotion: Commentary['emotion'] = 'neutral';
    let intensityLevel = 50;
    let context: Commentary['context'] = 'shot';
    
    if (shot.success) {
      category = 'goodShot';
      emotion = 'excited';
      intensityLevel = 70 + Math.random() * 30;
    } else if (shot.foul) {
      category = 'foul';
      emotion = 'surprised';
      intensityLevel = 80;
      context = 'foul';
    } else {
      emotion = 'disappointed';
      intensityLevel = 40 + Math.random() * 20;
    }
    
    // Get random template
    const styleTemplates = templates[selectedStyle][category];
    const template = styleTemplates[Math.floor(Math.random() * styleTemplates.length)];
    const text = template.replace('{player}', player?.name || 'Player');
    
    // Add some color commentary occasionally
    if (Math.random() > 0.7) {
      const colorCommentary = generateColorCommentary();
      return {
        text: text + ' ' + colorCommentary,
        emotion,
        intensity: intensityLevel,
        context: 'color' as Commentary['context'],
      };
    }
    
    return {
      text,
      emotion,
      intensity: intensityLevel,
      context,
    };
  };

  const generateColorCommentary = () => {
    const colorComments = [
      "The tension in the room is palpable.",
      "You can feel the concentration from here.",
      "This match is really heating up.",
      "Both players showing incredible skill today.",
      "The crowd is absolutely loving this.",
      "What a display of precision and control.",
      "This is pool at its finest, folks.",
      "The momentum is shifting.",
    ];
    
    return colorComments[Math.floor(Math.random() * colorComments.length)];
  };

  const processAudioQueue = async () => {
    if (speechQueue.current.length === 0 || !audioEnabled) return;
    
    const comment = speechQueue.current.shift();
    if (!comment) return;
    
    // Simulate AudioCraft API call
    // In production, this would call the actual AudioCraft service
    await simulateAudioGeneration(comment);
    
    // Process next in queue
    setTimeout(() => processAudioQueue(), 2000);
  };

  const simulateAudioGeneration = async (comment: Commentary) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In production, this would play the generated audio
    console.log('Playing audio:', comment.text);
  };

  const handleStyleChange = (event: React.MouseEvent<HTMLElement>, newStyle: string | null) => {
    if (newStyle !== null) {
      setSelectedStyle(newStyle);
    }
  };

  const getEmotionIcon = (emotion: Commentary['emotion']) => {
    switch (emotion) {
      case 'excited':
        return <AutoAwesome sx={{ color: neonColors.warning }} />;
      case 'surprised':
        return <Warning sx={{ color: neonColors.orange }} />;
      case 'disappointed':
        return <MoodBad sx={{ color: neonColors.info }} />;
      case 'celebratory':
        return <Celebration sx={{ color: neonColors.secondary }} />;
      default:
        return <RecordVoiceOver sx={{ color: neonColors.primary }} />;
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity > 80) return neonColors.error;
    if (intensity > 60) return neonColors.warning;
    if (intensity > 40) return neonColors.primary;
    return neonColors.info;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Mic sx={{ fontSize: 32 }} />
          Live Commentary
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => setIsPaused(!isPaused)}
            sx={{
              color: isPaused ? neonColors.warning : neonColors.primary,
              border: `1px solid ${alpha(isPaused ? neonColors.warning : neonColors.primary, 0.3)}`,
            }}
          >
            {isPaused ? <PlayArrow /> : <Pause />}
          </IconButton>
          
          <IconButton
            onClick={() => setShowHistory(!showHistory)}
            sx={{
              color: showHistory ? neonColors.info : theme.palette.text.secondary,
              border: `1px solid ${alpha(showHistory ? neonColors.info : theme.palette.text.secondary, 0.3)}`,
            }}
          >
            <Timeline />
          </IconButton>
        </Box>
      </Box>

      {/* Current Commentary */}
      {currentComment && (
        <Zoom in>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${alpha(getIntensityColor(currentComment.intensity), 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
              border: `2px solid ${alpha(getIntensityColor(currentComment.intensity), 0.5)}`,
              borderRadius: 2,
              mb: 3,
              boxShadow: `0 0 30px ${alpha(getIntensityColor(currentComment.intensity), 0.3)}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    fontSize: 48,
                    color: getIntensityColor(currentComment.intensity),
                    filter: `drop-shadow(0 0 10px ${getIntensityColor(currentComment.intensity)})`,
                  }}
                >
                  {getEmotionIcon(currentComment.emotion)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: currentComment.intensity > 70 ? 'bold' : 'normal',
                      mb: 1,
                    }}
                  >
                    {currentComment.text}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {currentComment.player && (
                      <Chip
                        label={currentComment.player}
                        size="small"
                        sx={{
                          background: alpha(neonColors.info, 0.2),
                          color: neonColors.info,
                          border: `1px solid ${neonColors.info}`,
                        }}
                      />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <GraphicEq sx={{ fontSize: 16, color: getIntensityColor(currentComment.intensity) }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Intensity: {currentComment.intensity}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              
              {audioEnabled && (
                <LinearProgress
                  variant="indeterminate"
                  sx={{
                    mt: 2,
                    height: 2,
                    backgroundColor: alpha(getIntensityColor(currentComment.intensity), 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getIntensityColor(currentComment.intensity),
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Zoom>
      )}

      {/* Controls */}
      <Card
        sx={{
          background: alpha(theme.palette.background.paper, 0.95),
          border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ color: neonColors.primary, mb: 2 }}>
            Commentary Settings
          </Typography>
          
          {/* Style Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
              Commentary Style
            </Typography>
            <ToggleButtonGroup
              value={selectedStyle}
              exclusive
              onChange={handleStyleChange}
              sx={{
                '& .MuiToggleButton-root': {
                  color: theme.palette.text.secondary,
                  borderColor: alpha(theme.palette.text.secondary, 0.3),
                  '&.Mui-selected': {
                    color: neonColors.primary,
                    backgroundColor: alpha(neonColors.primary, 0.1),
                    borderColor: neonColors.primary,
                  },
                },
              }}
            >
              {Object.entries(commentaryStyles).map(([key, style]) => (
                <ToggleButton key={key} value={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {style.icon}
                    <Typography variant="caption">{style.name}</Typography>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          
          {/* Audio Controls */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={audioEnabled}
                    onChange={(e) => setAudioEnabled(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: neonColors.primary,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: neonColors.primary,
                      },
                    }}
                  />
                }
                label="Enable Audio"
                sx={{ color: theme.palette.text.secondary }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VolumeOff sx={{ color: theme.palette.text.secondary }} />
                <Slider
                  value={volume}
                  onChange={(e, newValue) => setVolume(newValue as number)}
                  disabled={!audioEnabled}
                  sx={{
                    width: 100,
                    color: neonColors.primary,
                    '& .MuiSlider-thumb': {
                      boxShadow: `0 0 10px ${neonColors.primary}`,
                    },
                  }}
                />
                <VolumeUp sx={{ color: theme.palette.text.secondary }} />
              </Box>
            </Box>
          </Box>
          
          {/* Intensity Control */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
              Commentary Intensity
            </Typography>
            <Slider
              value={intensity}
              onChange={(e, newValue) => setIntensity(newValue as number)}
              marks={[
                { value: 0, label: 'Calm' },
                { value: 50, label: 'Normal' },
                { value: 100, label: 'Intense' },
              ]}
              sx={{
                color: neonColors.warning,
                '& .MuiSlider-thumb': {
                  boxShadow: `0 0 10px ${neonColors.warning}`,
                },
                '& .MuiSlider-mark': {
                  backgroundColor: alpha(neonColors.warning, 0.5),
                },
                '& .MuiSlider-markLabel': {
                  color: theme.palette.text.secondary,
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Commentary History */}
      <Collapse in={showHistory}>
        <Card
          sx={{
            background: alpha(theme.palette.background.paper, 0.95),
            border: `1px solid ${alpha(neonColors.info, 0.3)}`,
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ color: neonColors.info, mb: 2 }}>
              Commentary History
            </Typography>
            
            {commentary.length === 0 ? (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: 'center', py: 4 }}>
                No commentary history yet...
              </Typography>
            ) : (
              <List>
                {commentary.slice(0, 10).map((comment, index) => (
                  <Fade in key={comment.id} timeout={300 * (index + 1)}>
                    <ListItem
                      sx={{
                        background: alpha(theme.palette.background.default, 0.5),
                        borderRadius: 1,
                        mb: 1,
                        opacity: 1 - (index * 0.08),
                      }}
                    >
                      <ListItemIcon>
                        {getEmotionIcon(comment.emotion)}
                      </ListItemIcon>
                      <ListItemText
                        primary={comment.text}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              {moment(comment.timestamp).fromNow()}
                            </Typography>
                            {comment.isHighlight && (
                              <Chip
                                icon={<EmojiEvents sx={{ fontSize: 14 }} />}
                                label="Highlight"
                                size="small"
                                sx={{
                                  height: 20,
                                  background: alpha(neonColors.warning, 0.2),
                                  color: neonColors.warning,
                                  border: `1px solid ${neonColors.warning}`,
                                  '& .MuiChip-icon': {
                                    color: neonColors.warning,
                                  },
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Fade>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Collapse>
    </Box>
  );
};

// Add moment import
import moment from 'moment';

export default LiveCommentary;