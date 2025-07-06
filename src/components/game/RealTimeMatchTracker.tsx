import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Timer,
  EmojiEvents,
  Person,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Close,
  SportsEsports,
  Speed,
  Psychology
} from '@mui/icons-material';

interface RealTimeMatchTrackerProps {
  matchId?: string;
  onMatchStart?: (match: any) => void;
  onMatchEnd?: (match: any) => void;
  onClose?: () => void;
}

interface MatchState {
  id: string;
  player1: {
    id: string;
    name: string;
    score: number;
    avatar?: string;
  };
  player2: {
    id: string;
    name: string;
    score: number;
    avatar?: string;
  };
  status: 'preparing' | 'active' | 'paused' | 'completed';
  startTime?: Date;
  endTime?: Date;
  duration: number; // seconds
  currentFrame: number;
  totalFrames: number;
  events: MatchEvent[];
  winner?: string;
}

interface MatchEvent {
  id: string;
  type: 'shot' | 'foul' | 'timeout' | 'game_end' | 'break' | 'safety';
  timestamp: Date;
  playerId: string;
  description: string;
  data?: any;
}

const RealTimeMatchTracker: React.FC<RealTimeMatchTrackerProps> = ({
  matchId,
  onMatchStart,
  onMatchEnd,
  onClose
}) => {
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [winner, setWinner] = useState<string>('');

  // Mock match data
  const mockMatch: MatchState = {
    id: matchId || 'match-1',
    player1: {
      id: 'player-1',
      name: 'Kicky Breaks',
      score: 0,
      avatar: '/images/avatars/player1.jpg'
    },
    player2: {
      id: 'player-2',
      name: 'ShadowStriker',
      score: 0,
      avatar: '/images/avatars/player2.jpg'
    },
    status: 'preparing',
    duration: 0,
    currentFrame: 0,
    totalFrames: 0,
    events: []
  };

  useEffect(() => {
    setMatchState(mockMatch);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && matchState?.status === 'active') {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
        simulateMatchProgress();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, matchState?.status]);

  const simulateMatchProgress = () => {
    if (!matchState) return;

    // Simulate random events
    const eventTypes = ['shot', 'foul', 'break', 'safety'];
    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const randomPlayer = Math.random() > 0.5 ? matchState.player1.id : matchState.player2.id;

    if (Math.random() < 0.3) { // 30% chance of event
      addMatchEvent(randomEvent, randomPlayer);
    }

    // Simulate score updates
    if (Math.random() < 0.1) { // 10% chance of score
      updateScore(randomPlayer);
    }
  };

  const addMatchEvent = (type: string, playerId: string) => {
    if (!matchState) return;

    const event: MatchEvent = {
      id: `event-${Date.now()}`,
      type: type as any,
      timestamp: new Date(),
      playerId,
      description: getEventDescription(type, playerId),
      data: {}
    };

    setMatchState(prev => prev ? {
      ...prev,
      events: [...prev.events, event]
    } : null);
  };

  const getEventDescription = (type: string, playerId: string): string => {
    const playerName = playerId === matchState?.player1.id ? matchState.player1.name : matchState?.player2.name;
    
    const descriptions = {
      shot: `${playerName} takes a shot`,
      foul: `${playerName} commits a foul`,
      break: `${playerName} makes a break`,
      safety: `${playerName} plays a safety`,
      timeout: `${playerName} calls a timeout`,
      game_end: `${playerName} wins the game`
    };

    return descriptions[type as keyof typeof descriptions] || `${playerName} performs an action`;
  };

  const updateScore = (playerId: string) => {
    if (!matchState) return;

    setMatchState(prev => {
      if (!prev) return null;

      if (playerId === prev.player1.id) {
        return {
          ...prev,
          player1: { ...prev.player1, score: prev.player1.score + 1 }
        };
      } else {
        return {
          ...prev,
          player2: { ...prev.player2, score: prev.player2.score + 1 }
        };
      }
    });
  };

  const startMatch = () => {
    if (!matchState) return;

    const updatedMatch = {
      ...matchState,
      status: 'active' as const,
      startTime: new Date(),
      duration: 0
    };

    setMatchState(updatedMatch);
    setIsTracking(true);
    onMatchStart?.(updatedMatch);
  };

  const pauseMatch = () => {
    if (!matchState) return;

    setMatchState(prev => prev ? { ...prev, status: 'paused' } : null);
    setIsTracking(false);
  };

  const resumeMatch = () => {
    if (!matchState) return;

    setMatchState(prev => prev ? { ...prev, status: 'active' } : null);
    setIsTracking(true);
  };

  const endMatch = () => {
    if (!matchState) return;

    const finalScore = {
      player1: matchState.player1.score,
      player2: matchState.player2.score
    };

    const matchWinner = finalScore.player1 > finalScore.player2 ? matchState.player1.id : matchState.player2.id;
    const winnerName = matchWinner === matchState.player1.id ? matchState.player1.name : matchState.player2.name;

    const completedMatch = {
      ...matchState,
      status: 'completed' as const,
      endTime: new Date(),
      winner: matchWinner
    };

    setMatchState(completedMatch);
    setIsTracking(false);
    setWinner(winnerName);
    setShowEndDialog(true);
    onMatchEnd?.(completedMatch);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEventIcon = (type: string) => {
    const icons = {
      shot: <SportsEsports />,
      foul: <Warning />,
      break: <TrendingUp />,
      safety: <Psychology />,
      timeout: <Timer />,
      game_end: <EmojiEvents />
    };
    return icons[type as keyof typeof icons] || <CheckCircle />;
  };

  const getEventColor = (type: string) => {
    const colors = {
      shot: 'primary',
      foul: 'error',
      break: 'success',
      safety: 'warning',
      timeout: 'info',
      game_end: 'secondary'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  if (!matchState) {
    return (
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 800, width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SportsEsports color="primary" />
            Live Match Tracker
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {/* Match Status */}
        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Match Status: {matchState.status.toUpperCase()}
              </Typography>
              <Chip 
                label={formatTime(currentTime)} 
                icon={<Timer />} 
                color="primary" 
                variant="outlined"
              />
            </Box>
            {matchState.startTime && (
              <Typography variant="body2" color="text.secondary">
                Started: {matchState.startTime.toLocaleTimeString()}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Score Display */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ textAlign: 'center' }}>
              <CardContent>
                <Avatar 
                  src={matchState.player1.avatar}
                  sx={{ width: 60, height: 60, mx: 'auto', mb: 1 }}
                >
                  {matchState.player1.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {matchState.player1.name}
                </Typography>
                <Typography variant="h3" color="primary">
                  {matchState.player1.score}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ textAlign: 'center' }}>
              <CardContent>
                <Avatar 
                  src={matchState.player2.avatar}
                  sx={{ width: 60, height: 60, mx: 'auto', mb: 1 }}
                >
                  {matchState.player2.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {matchState.player2.name}
                </Typography>
                <Typography variant="h3" color="secondary">
                  {matchState.player2.score}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Control Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, justifyContent: 'center' }}>
          {matchState.status === 'preparing' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={startMatch}
            >
              Start Match
            </Button>
          )}
          
          {matchState.status === 'active' && (
            <>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Pause />}
                onClick={pauseMatch}
              >
                Pause
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={() => setShowEndDialog(true)}
              >
                End Match
              </Button>
            </>
          )}
          
          {matchState.status === 'paused' && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={resumeMatch}
              >
                Resume
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Stop />}
                onClick={() => setShowEndDialog(true)}
              >
                End Match
              </Button>
            </>
          )}
        </Box>

        {/* Live Events Feed */}
        <Typography variant="h6" gutterBottom>
          Live Events
        </Typography>
        
        <Card variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
          <List dense>
            {matchState.events.slice(-10).reverse().map((event) => (
              <ListItem key={event.id}>
                <ListItemIcon>
                  <Box sx={{ color: `${getEventColor(event.type)}.main` }}>
                    {getEventIcon(event.type)}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={event.description}
                  secondary={event.timestamp.toLocaleTimeString()}
                />
              </ListItem>
            ))}
            {matchState.events.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No events yet"
                  secondary="Match events will appear here as they happen"
                />
              </ListItem>
            )}
          </List>
        </Card>

        {/* Match Statistics */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Match Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {matchState.events.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Events
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {matchState.events.filter(e => e.type === 'shot').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Shots Taken
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning">
                  {matchState.events.filter(e => e.type === 'foul').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fouls Committed
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>

      {/* End Match Dialog */}
      <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
        <DialogTitle>End Match</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to end this match?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This action cannot be undone. The match will be recorded with the current scores.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={endMatch}
          >
            End Match
          </Button>
        </DialogActions>
      </Dialog>

      {/* Winner Dialog */}
      <Dialog open={showEndDialog && !!winner} onClose={() => setShowEndDialog(false)}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          <EmojiEvents color="primary" sx={{ fontSize: 40, mb: 1 }} />
          <Typography variant="h5">
            Match Complete!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="primary" gutterBottom>
              {winner} Wins!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Final Score: {matchState.player1.score} - {matchState.player2.score}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Match duration: {formatTime(currentTime)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default RealTimeMatchTracker; 