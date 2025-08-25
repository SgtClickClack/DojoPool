import {
  Cancel,
  CheckCircle,
  EmojiEvents,
  SportsEsports,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGameSocket } from '../../hooks/useGameSocket';

interface RealTimeGameViewProps {
  gameId: string;
}

const RealTimeGameView: React.FC<RealTimeGameViewProps> = ({ gameId }) => {
  const { user } = useAuth();
  const {
    gameState,
    loading,
    error,
    connected,
    takeShot,
    reportFoul,
    leaveGame,
  } = useGameSocket(gameId);

  const [shotData, setShotData] = useState({
    ballId: '1',
    velocity: 1.0,
    direction: { x: 0, y: 0 },
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveGame();
    };
  }, [leaveGame]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Connecting to game...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6">Connection Error</Typography>
        <Typography>{error}</Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 1 }}
        >
          Retry Connection
        </Button>
      </Alert>
    );
  }

  if (!gameState) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        <Typography variant="h6">No Game Data</Typography>
        <Typography>Waiting for game state...</Typography>
      </Alert>
    );
  }

  const isMyTurn = gameState.currentPlayer === user?.id;
  const currentPlayer = gameState.players.find(
    (p) => p.id === gameState.currentPlayer
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Connection Status */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" alignItems="center">
          <Chip
            icon={connected ? <CheckCircle /> : <Cancel />}
            label={connected ? 'Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
            sx={{ mr: 2 }}
          />
          <Typography variant="h6">Game #{gameId}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Status: {gameState.status}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Game Visualization */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{ p: 3, height: 500, display: 'flex', flexDirection: 'column' }}
          >
            <Typography variant="h5" gutterBottom>
              Pool Table
            </Typography>

            {/* Placeholder for actual table visualization */}
            <Box
              sx={{
                flex: 1,
                bgcolor: 'green.700',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: '8px solid #654321',
              }}
            >
              <Typography variant="h6" color="white">
                Table Visualization Coming Soon
              </Typography>

              {/* Ball positions overlay */}
              {Object.entries(gameState.ballPositions).map(
                ([ballId, position]) => (
                  <Box
                    key={ballId}
                    sx={{
                      position: 'absolute',
                      left: `${(position.x / 100) * 100}%`,
                      top: `${(position.y / 100) * 100}%`,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: ballId === '0' ? 'white' : 'red',
                      border: '2px solid black',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )
              )}
            </Box>

            {/* Last shot indicator */}
            {gameState.lastShot && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2">
                  Last Shot: {gameState.lastShot.type} -{' '}
                  {gameState.lastShot.success ? 'Success' : 'Miss'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Game Info Panel */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h5" gutterBottom>
              Game Info
            </Typography>

            {/* Current Player */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <SportsEsports sx={{ mr: 1 }} />
                  <Typography variant="h6">Current Turn</Typography>
                </Box>
                <Typography variant="h6" color="primary">
                  {currentPlayer?.name || 'Unknown'}
                </Typography>
                {isMyTurn && (
                  <Chip
                    label="Your Turn"
                    color="success"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Players and Scores */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Players & Scores
                </Typography>
                {gameState.players.map((player) => (
                  <Box key={player.id} sx={{ mb: 1 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="body1">{player.name}</Typography>
                      <Typography variant="h6" color="primary">
                        {player.score}
                      </Typography>
                    </Box>

                    {/* Fouls */}
                    {gameState.fouls[player.id]?.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Fouls: {gameState.fouls[player.id].length}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Winner */}
            {gameState.winner && (
              <Card sx={{ mb: 2, bgcolor: 'success.light' }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <EmojiEvents sx={{ mr: 1, color: 'gold' }} />
                    <Typography variant="h6" color="white">
                      Winner:{' '}
                      {
                        gameState.players.find((p) => p.id === gameState.winner)
                          ?.name
                      }
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Game Controls */}
            {!gameState.winner && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Game Controls
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Shot Velocity: {shotData.velocity}
                    </Typography>
                    <label htmlFor={`shot-velocity-${gameId}`}>
                      Shot Velocity
                    </label>
                    <input
                      id={`shot-velocity-${gameId}`}
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={shotData.velocity}
                      onChange={(e) =>
                        setShotData((prev) => ({
                          ...prev,
                          velocity: parseFloat(e.target.value),
                        }))
                      }
                      aria-label="Shot velocity"
                      title="Shot velocity"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => takeShot(shotData)}
                      disabled={!isMyTurn || !connected}
                      fullWidth
                    >
                      Take Shot
                    </Button>

                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => reportFoul({ type: 'scratch' })}
                      disabled={!isMyTurn || !connected}
                      fullWidth
                    >
                      Report Foul
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimeGameView;
