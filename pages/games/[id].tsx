import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Person as PersonIcon,
  Timer as TimerIcon,
  LocationOn as LocationIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { io, Socket } from 'socket.io-client';

interface Player {
  id: string;
  username: string;
  rating: number;
  avatar_url?: string;
}

interface Shot {
  id: string;
  player_id: string;
  type: 'break' | 'pot' | 'foul' | 'safety';
  timestamp: string;
  points: number;
}

interface Game {
  id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  game_type: 'casual' | 'ranked' | 'tournament';
  player1: Player;
  player2: Player;
  venue_name: string;
  venue_id: string;
  start_time: string;
  end_time?: string;
  current_frame: number;
  frames: {
    player1_score: number;
    player2_score: number;
  }[];
  current_player_id: string;
  shots: Shot[];
}

export default function GameView() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [confirmEndDialog, setConfirmEndDialog] = useState(false);
  const [shotDialog, setShotDialog] = useState(false);
  const [shotType, setShotType] = useState<Shot['type']>('pot');
  const [points, setPoints] = useState(1);

  useEffect(() => {
    if (id) {
      fetchGameDetails();
      initializeSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [id]);

  const initializeSocket = () => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      query: { gameId: id },
    });

    newSocket.on('gameUpdate', (updatedGame: Game) => {
      setGame(updatedGame);
    });

    newSocket.on('shotRecorded', (shot: Shot) => {
      if (game) {
        setGame({
          ...game,
          shots: [...game.shots, shot],
        });
      }
    });

    setSocket(newSocket);
  };

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/games/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch game details');
      }

      setGame(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    try {
      const response = await fetch(`/api/games/${id}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start game');
      }

      fetchGameDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const handleEndGame = async () => {
    try {
      const response = await fetch(`/api/games/${id}/end`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to end game');
      }

      setConfirmEndDialog(false);
      fetchGameDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end game');
    }
  };

  const handleRecordShot = async () => {
    if (!socket || !game) return;

    socket.emit('recordShot', {
      gameId: game.id,
      playerId: game.current_player_id,
      type: shotType,
      points,
    });

    setShotDialog(false);
    setPoints(1);
    setShotType('pot');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const isPlayerTurn = () => {
    return game?.current_player_id === user?.id;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !game) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error || 'Game not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Game Header */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">
                {game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)} Game
              </Typography>
              <Chip
                label={game.status}
                color={
                  game.status === 'in_progress'
                    ? 'warning'
                    : game.status === 'completed'
                    ? 'success'
                    : 'default'
                }
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationIcon sx={{ mr: 1 }} color="action" />
              <Typography>{game.venue_name}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimerIcon sx={{ mr: 1 }} color="action" />
              <Typography>Started at {formatTime(game.start_time)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Scoreboard */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderLeft: 6,
              borderColor: game.current_player_id === game.player1.id ? 'primary.main' : 'transparent',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 1 }} color="action" />
              <Typography variant="h6">{game.player1.username}</Typography>
            </Box>
            <Typography variant="h3" align="center">
              {game.frames[game.current_frame - 1]?.player1_score || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              borderLeft: 6,
              borderColor: game.current_player_id === game.player2.id ? 'primary.main' : 'transparent',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ mr: 1 }} color="action" />
              <Typography variant="h6">{game.player2.username}</Typography>
            </Box>
            <Typography variant="h3" align="center">
              {game.frames[game.current_frame - 1]?.player2_score || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Game Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
        {game.status === 'scheduled' && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartGame}
            disabled={!user || (user.id !== game.player1.id && user.id !== game.player2.id)}
          >
            Start Game
          </Button>
        )}
        {game.status === 'in_progress' && (
          <>
            <Button
              variant="contained"
              onClick={() => setShotDialog(true)}
              disabled={!isPlayerTurn()}
              startIcon={<AddIcon />}
            >
              Record Shot
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setConfirmEndDialog(true)}
              startIcon={<FlagIcon />}
            >
              End Game
            </Button>
          </>
        )}
      </Box>

      {/* Shot History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Shot History
        </Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {game.shots.map((shot) => (
            <Box
              key={shot.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>
                  {game.player1.id === shot.player_id
                    ? game.player1.username
                    : game.player2.username}
                </Typography>
                <Chip
                  label={shot.type}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography>{shot.points} points</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Shot Dialog */}
      <Dialog open={shotDialog} onClose={() => setShotDialog(false)}>
        <DialogTitle>Record Shot</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Shot Type"
              value={shotType}
              onChange={(e) => setShotType(e.target.value as Shot['type'])}
              sx={{ mb: 2 }}
            >
              <MenuItem value="break">Break</MenuItem>
              <MenuItem value="pot">Pot</MenuItem>
              <MenuItem value="foul">Foul</MenuItem>
              <MenuItem value="safety">Safety</MenuItem>
            </TextField>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => setPoints(Math.max(0, points - 1))}
                disabled={points <= 0}
              >
                <RemoveIcon />
              </IconButton>
              <Typography variant="h6">{points} points</Typography>
              <IconButton
                onClick={() => setPoints(points + 1)}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShotDialog(false)}>Cancel</Button>
          <Button onClick={handleRecordShot} variant="contained">
            Record Shot
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm End Game Dialog */}
      <Dialog open={confirmEndDialog} onClose={() => setConfirmEndDialog(false)}>
        <DialogTitle>End Game</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end this game? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEndDialog(false)}>Cancel</Button>
          <Button onClick={handleEndGame} color="error" variant="contained">
            End Game
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 