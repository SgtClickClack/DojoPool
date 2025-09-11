import {
  useTournamentParticipation,
  useWebSocketConnection,
} from '@/hooks/useWebSocket';
import {
  People as PeopleIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as TrophyIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

interface LiveTournamentViewerProps {
  tournamentId: string;
  tournamentName: string;
}

interface Player {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  status: 'waiting' | 'playing' | 'eliminated' | 'winner';
}

interface Match {
  id: string;
  player1: Player;
  player2: Player;
  status: 'upcoming' | 'in_progress' | 'completed';
  winner?: string;
  currentScore?: { player1: number; player2: number };
}

const LiveTournamentViewer: React.FC<LiveTournamentViewerProps> = ({
  tournamentId,
  tournamentName,
}) => {
  const theme = useTheme();
  const { isConnected, connectionState } = useWebSocketConnection();
  const {
    tournamentUpdates,
    matchUpdates,
    chat,
    notifications,
    isActive,
    recentActivity,
  } = useTournamentParticipation(tournamentId);

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [tournamentStatus, setTournamentStatus] = useState<
    'waiting' | 'in_progress' | 'completed'
  >('waiting');
  const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');

  // Simulate tournament data (replace with real API calls)
  useEffect(() => {
    // Mock players
    setPlayers([
      { id: '1', username: 'PlayerOne', score: 1500, status: 'playing' },
      { id: '2', username: 'PlayerTwo', score: 1450, status: 'playing' },
      { id: '3', username: 'PlayerThree', score: 1400, status: 'waiting' },
      { id: '4', username: 'PlayerFour', score: 1350, status: 'eliminated' },
    ]);

    // Mock current match
    setCurrentMatch({
      id: 'match-1',
      player1: {
        id: '1',
        username: 'PlayerOne',
        score: 1500,
        status: 'playing',
      },
      player2: {
        id: '2',
        username: 'PlayerTwo',
        score: 1450,
        status: 'playing',
      },
      status: 'in_progress',
      currentScore: { player1: 3, player2: 2 },
    });

    setTournamentStatus('in_progress');
  }, []);

  // Handle real-time updates
  useEffect(() => {
    tournamentUpdates.updates.forEach((update) => {
      switch (update.event) {
        case 'player_joined':
          setPlayers((prev) => [...prev, update.data.player]);
          break;
        case 'player_left':
          setPlayers((prev) =>
            prev.filter((p) => p.id !== update.data.playerId)
          );
          break;
        case 'match_started':
          setCurrentMatch(update.data.match);
          setTournamentStatus('in_progress');
          break;
        case 'match_ended':
          if (update.data.winner) {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === update.data.winner
                  ? { ...p, status: 'winner' as const }
                  : p
              )
            );
          }
          break;
        case 'tournament_ended':
          setTournamentStatus('completed');
          break;
      }
    });
  }, [tournamentUpdates.updates]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing':
        return theme.palette.primary.main;
      case 'waiting':
        return theme.palette.warning.main;
      case 'eliminated':
        return theme.palette.error.main;
      case 'winner':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'playing':
        return 'Playing';
      case 'waiting':
        return 'Waiting';
      case 'eliminated':
        return 'Eliminated';
      case 'winner':
        return 'Winner';
      default:
        return status;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ color: theme.palette.text.primary }}
          >
            {tournamentName}
          </Typography>
          <Chip
            label={getStatusText(tournamentStatus)}
            sx={{
              backgroundColor: getStatusColor(tournamentStatus),
              color: theme.palette.primary.contrastText,
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isConnected ? (
              <WifiIcon sx={{ color: theme.palette.success.main }} />
            ) : (
              <WifiOffIcon sx={{ color: theme.palette.error.main }} />
            )}
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              {connectionState}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon
              sx={{ color: theme.palette.text.secondary, fontSize: 16 }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              {timeRemaining}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon
              sx={{ color: theme.palette.text.secondary, fontSize: 16 }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              {players.length} players
            </Typography>
          </Box>
        </Box>
      </Box>

      {!isConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Real-time updates are currently unavailable. Some features may not
          work properly.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Match */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: theme.cyberpunk.gradients.card,
              border: `1px solid ${theme.palette.primary.main}`,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: theme.palette.primary.main }}
              >
                Current Match
              </Typography>

              {currentMatch ? (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>{currentMatch.player1.username.charAt(0)}</Avatar>
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{ color: theme.palette.text.primary }}
                        >
                          {currentMatch.player1.username}
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ color: theme.palette.primary.main }}
                        >
                          {currentMatch.currentScore?.player1 || 0}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      VS
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="body1"
                          sx={{ color: theme.palette.text.primary }}
                        >
                          {currentMatch.player2.username}
                        </Typography>
                        <Typography
                          variant="h4"
                          sx={{ color: theme.palette.secondary.main }}
                        >
                          {currentMatch.currentScore?.player2 || 0}
                        </Typography>
                      </Box>
                      <Avatar>{currentMatch.player2.username.charAt(0)}</Avatar>
                    </Box>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={60}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.palette.background.paper,
                      '& .MuiLinearProgress-bar': {
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        borderRadius: 4,
                      },
                    }}
                  />

                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      mt: 1,
                      display: 'block',
                    }}
                  >
                    Match in progress - Table: 2
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <PlayIcon
                    sx={{
                      fontSize: 48,
                      color: theme.palette.text.secondary,
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Waiting for next match...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Leaderboard */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: theme.cyberpunk.gradients.card,
              border: `1px solid ${theme.palette.secondary.main}`,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: theme.palette.secondary.main }}
              >
                Leaderboard
              </Typography>

              <List sx={{ py: 0 }}>
                {players
                  .sort((a, b) => b.score - a.score)
                  .map((player, index) => (
                    <React.Fragment key={player.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Box sx={{ position: 'relative' }}>
                            <Avatar
                              sx={{
                                bgcolor: getStatusColor(player.status),
                                width: 40,
                                height: 40,
                              }}
                            >
                              {player.username.charAt(0)}
                            </Avatar>
                            {index === 0 && (
                              <TrophyIcon
                                sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  color: theme.palette.warning.main,
                                  fontSize: 20,
                                  backgroundColor:
                                    theme.palette.background.paper,
                                  borderRadius: '50%',
                                  p: 0.5,
                                }}
                              />
                            )}
                          </Box>
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
                                sx={{ color: theme.palette.text.primary }}
                              >
                                {player.username}
                              </Typography>
                              <Chip
                                label={getStatusText(player.status)}
                                size="small"
                                sx={{
                                  backgroundColor: getStatusColor(
                                    player.status
                                  ),
                                  color: theme.palette.primary.contrastText,
                                  fontSize: '0.7rem',
                                }}
                              />
                            </Box>
                          }
                          secondary={`Score: ${player.score}`}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          #{index + 1}
                        </Typography>
                      </ListItem>
                      {index < players.length - 1 && (
                        <Divider
                          sx={{ bgcolor: `${theme.palette.divider}50` }}
                        />
                      )}
                    </React.Fragment>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              background: theme.cyberpunk.gradients.card,
              border: `1px solid ${theme.palette.info.main}`,
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: theme.palette.info.main }}
            >
              Live Activity Feed
            </Typography>

            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {recentActivity.length > 0 ? (
                recentActivity.slice(-10).map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      p: 2,
                      backgroundColor: `${theme.palette.background.paper}50`,
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      {activity.message || activity.event || 'Activity update'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {new Date(
                        activity.timestamp || Date.now()
                      ).toLocaleTimeString()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    No recent activity
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LiveTournamentViewer;
