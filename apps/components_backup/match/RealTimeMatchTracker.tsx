import React, { useState, useEffect, useRef } from 'react';
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
  DialogActions,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  FormControlLabel,
  Switch,
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
  Psychology,
  Analytics,
  Highlight,
  Replay,
  Videocam,
  Mic,
  Settings,
  ExpandMore,
  Timeline,
  Assessment,
  Star,
  Bolt,
  Target,
  PsychologyAlt,
} from '@mui/icons-material';
import RealTimeMatchTrackingService, {
  type MatchData,
  type MatchEvent,
  type MatchAnalytics,
  MatchHighlight,
  type MatchResult,
} from '../../services/RealTimeMatchTrackingService';

interface RealTimeMatchTrackerProps {
  challengeId?: string;
  matchId?: string;
  onMatchStart?: (match: MatchData) => void;
  onMatchEnd?: (result: MatchResult) => void;
  onClose?: () => void;
  isSpectator?: boolean;
}

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
      id={`match-tabpanel-${index}`}
      aria-labelledby={`match-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RealTimeMatchTracker: React.FC<RealTimeMatchTrackerProps> = ({
  challengeId,
  matchId,
  onMatchStart,
  onMatchEnd,
  onClose,
  isSpectator = false,
}) => {
  const [matchService] = useState(() => new RealTimeMatchTrackingService());
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [winner, setWinner] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [autoSimulate, setAutoSimulate] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize match service
    matchService.on('connected', () => setIsConnected(true));
    matchService.on('disconnected', () => setIsConnected(false));
    matchService.on('matchStarted', handleMatchStarted);
    matchService.on('matchCompleted', handleMatchCompleted);
    matchService.on('analyticsUpdated', handleAnalyticsUpdated);

    // If we have a challengeId, start match tracking
    if (challengeId && !matchId) {
      startMatchFromChallenge();
    }

    // If we have a matchId, load existing match
    if (matchId) {
      loadExistingMatch();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      matchService.disconnect();
    };
  }, [challengeId, matchId]);

  useEffect(() => {
    if (isTracking && matchData?.status === 'active') {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => prev + 1);
        if (autoSimulate) {
          simulateMatchProgress();
        }
      }, 1000 / simulationSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, matchData?.status, autoSimulate, simulationSpeed]);

  const startMatchFromChallenge = async () => {
    if (!challengeId) return;

    try {
      setError(null);
      const match = await matchService.startMatchTracking(challengeId);
      setMatchData(match);
      setIsTracking(true);
      onMatchStart?.(match);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to start match'
      );
    }
  };

  const loadExistingMatch = () => {
    if (!matchId) return;

    const match = matchService.getMatchData(matchId);
    if (match) {
      setMatchData(match);
      setIsTracking(match.status === 'active');
    }
  };

  const handleMatchStarted = (match: MatchData) => {
    setMatchData(match);
    setIsTracking(true);
    onMatchStart?.(match);
  };

  const handleMatchCompleted = ({
    matchResult,
  }: {
    matchResult: MatchResult;
  }) => {
    setIsTracking(false);
    setWinner(matchResult.winnerId);
    setShowEndDialog(true);
    onMatchEnd?.(matchResult);
  };

  const handleAnalyticsUpdated = ({
    matchId,
    analytics,
  }: {
    matchId: string;
    analytics: MatchAnalytics;
  }) => {
    if (matchData && matchData.id === matchId) {
      setMatchData((prev) =>
        prev ? { ...prev, matchAnalytics: analytics } : null
      );
    }
  };

  const activateMatch = () => {
    if (!matchData) return;

    try {
      matchService.activateMatch(matchData.id);
      setMatchData((prev) => (prev ? { ...prev, status: 'active' } : null));
      setIsTracking(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to activate match'
      );
    }
  };

  const pauseMatch = () => {
    if (!matchData) return;

    setMatchData((prev) => (prev ? { ...prev, status: 'paused' } : null));
    setIsTracking(false);
  };

  const resumeMatch = () => {
    if (!matchData) return;

    setMatchData((prev) => (prev ? { ...prev, status: 'active' } : null));
    setIsTracking(true);
  };

  const endMatch = async () => {
    if (!matchData) return;

    try {
      const winnerId =
        matchData.score.player1 > matchData.score.player2
          ? matchData.player1Id
          : matchData.player2Id;

      await matchService.completeMatch(matchData.id, winnerId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to end match');
    }
  };

  const simulateMatchProgress = () => {
    if (!matchData) return;

    // Simulate random events
    const eventTypes = ['shot', 'foul', 'break', 'safety'];
    const randomEvent =
      eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const randomPlayer =
      Math.random() > 0.5 ? matchData.player1Id : matchData.player2Id;

    if (Math.random() < 0.3) {
      // 30% chance of event
      simulateMatchEvent(randomEvent, randomPlayer);
    }

    // Simulate score updates
    if (Math.random() < 0.1) {
      // 10% chance of score
      simulateScoreUpdate(randomPlayer);
    }
  };

  const simulateMatchEvent = (type: string, playerId: string) => {
    if (!matchData) return;

    const event: MatchEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      timestamp: new Date(),
      playerId,
      description: getEventDescription(type, playerId),
      data: {
        shotType: type === 'shot' ? 'power' : undefined,
        success: type === 'shot' ? Math.random() > 0.3 : undefined,
        power: type === 'shot' ? Math.random() * 10 : undefined,
        spin: type === 'shot' ? Math.random() * 5 : undefined,
        accuracy: type === 'shot' ? Math.random() : undefined,
      },
    };

    setMatchData((prev) =>
      prev
        ? {
            ...prev,
            events: [...prev.events, event],
          }
        : null
    );
  };

  const simulateScoreUpdate = (playerId: string) => {
    if (!matchData) return;

    setMatchData((prev) => {
      if (!prev) return null;

      if (playerId === prev.player1Id) {
        return {
          ...prev,
          score: { ...prev.score, player1: prev.score.player1 + 1 },
        };
      } else {
        return {
          ...prev,
          score: { ...prev.score, player2: prev.score.player2 + 1 },
        };
      }
    });
  };

  const getEventDescription = (type: string, playerId: string): string => {
    const playerName =
      playerId === matchData?.player1Id ? 'Player 1' : 'Player 2';

    const descriptions = {
      shot: `${playerName} takes a shot`,
      foul: `${playerName} commits a foul`,
      break: `${playerName} makes a break`,
      safety: `${playerName} plays a safety`,
      timeout: `${playerName} calls a timeout`,
      game_end: `${playerName} wins the game`,
    };

    return (
      descriptions[type as keyof typeof descriptions] ||
      `${playerName} performs an action`
    );
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
      game_end: <EmojiEvents />,
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
      game_end: 'secondary',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!matchData) {
    return (
      <Card sx={{ maxWidth: 800, width: '100%' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 1000, width: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant="h5"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <SportsEsports color="primary" />
            Real-Time Match Tracker
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              size="small"
            />
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Match Status */}
        <Card variant="outlined" sx={{ mb: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Match Status: {matchData.status.toUpperCase()}
              </Typography>
              <Chip
                label={formatTime(currentTime)}
                icon={<Timer />}
                color="primary"
                variant="outlined"
              />
            </Box>
            {matchData.startTime && (
              <Typography variant="body2" color="text.secondary">
                Started: {matchData.startTime.toLocaleTimeString()}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Score Display */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1 }}>
                  <Person />
                </Avatar>
                <Typography variant="h6">Player 1</Typography>
                <Typography variant="h4" color="primary">
                  {matchData.score.player1}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1 }}>
                  <Person />
                </Avatar>
                <Typography variant="h6">Player 2</Typography>
                <Typography variant="h4" color="secondary">
                  {matchData.score.player2}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Control Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {matchData.status === 'preparing' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={activateMatch}
              disabled={!isConnected}
            >
              Start Match
            </Button>
          )}

          {matchData.status === 'active' && (
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

          {matchData.status === 'paused' && (
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

          {/* Simulation Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoSimulate}
                  onChange={(e) => setAutoSimulate(e.target.checked)}
                />
              }
              label="Auto Simulate"
            />
            <Typography variant="body2">Speed:</Typography>
            <Slider
              value={simulationSpeed}
              onChange={(e, value) => setSimulationSpeed(value as number)}
              min={0.5}
              max={3}
              step={0.5}
              sx={{ width: 100 }}
            />
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="match tabs"
          >
            <Tab label="Live Events" />
            <Tab label="Analytics" />
            <Tab label="Highlights" />
            <Tab label="Replay" />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Live Events
          </Typography>
          <List dense>
            {matchData.events
              .slice(-10)
              .reverse()
              .map((event) => (
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
            {matchData.events.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No events yet"
                  secondary="Match events will appear here as they happen"
                />
              </ListItem>
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Match Analytics
          </Typography>
          {matchData.matchAnalytics ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Overall Statistics
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Total Shots</TableCell>
                            <TableCell>
                              {matchData.matchAnalytics.totalShots}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Successful Shots</TableCell>
                            <TableCell>
                              {matchData.matchAnalytics.successfulShots}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Fouls</TableCell>
                            <TableCell>
                              {matchData.matchAnalytics.fouls}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Breaks</TableCell>
                            <TableCell>
                              {matchData.matchAnalytics.breaks}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Excitement Level</TableCell>
                            <TableCell>
                              <LinearProgress
                                variant="determinate"
                                value={
                                  matchData.matchAnalytics.excitementLevel * 100
                                }
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Player Performance
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Player 1</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          matchData.matchAnalytics.playerPerformance.player1
                            .accuracy * 100
                        }
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption">
                        Accuracy:{' '}
                        {Math.round(
                          matchData.matchAnalytics.playerPerformance.player1
                            .accuracy * 100
                        )}
                        %
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Player 2</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          matchData.matchAnalytics.playerPerformance.player2
                            .accuracy * 100
                        }
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption">
                        Accuracy:{' '}
                        {Math.round(
                          matchData.matchAnalytics.playerPerformance.player2
                            .accuracy * 100
                        )}
                        %
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">
              Analytics will appear here as the match progresses
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Match Highlights
          </Typography>
          {matchData.highlights && matchData.highlights.length > 0 ? (
            <List>
              {matchData.highlights.map((highlight) => (
                <ListItem key={highlight.id}>
                  <ListItemIcon>
                    <Star color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={highlight.description}
                    secondary={`${highlight.timestamp.toLocaleTimeString()} - Importance: ${Math.round(highlight.importance * 100)}%`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">
              Highlights will be generated when the match is completed
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Match Replay
          </Typography>
          <Typography color="text.secondary">
            Replay data will be available after the match is completed
          </Typography>
        </TabPanel>

        {/* End Match Dialog */}
        <Dialog open={showEndDialog} onClose={() => setShowEndDialog(false)}>
          <DialogTitle>End Match</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to end the match? This action cannot be
              undone.
            </Typography>
            {winner && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Winner: {winner}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEndDialog(false)}>Cancel</Button>
            <Button onClick={endMatch} color="error" variant="contained">
              End Match
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RealTimeMatchTracker;
