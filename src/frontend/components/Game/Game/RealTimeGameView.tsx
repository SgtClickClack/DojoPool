import { LiveCommentaryPanel } from '@/components/ai/LiveCommentaryPanel';
import { websocketService } from '@/services/services/network/WebSocketService';
import {
  Cancel,
  CheckCircle,
  CheckCircleOutline,
  EmojiEvents,
  Error,
  Flag,
  GolfCourse,
  Remove,
  SportsEsports,
  SportsScore,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
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

  const [shotReportDialog, setShotReportDialog] = useState(false);
  const [shotReportData, setShotReportData] = useState({
    shotType: 'successful_pot' as
      | 'successful_pot'
      | 'missed_shot'
      | 'foul'
      | 'scratch',
    ballId: '',
    pocketId: '',
    notes: '',
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveGame();
      websocketService.leaveGameRoom(gameId);
    };
  }, [leaveGame, gameId]);

  // Join game room for commentary
  useEffect(() => {
    if (connected && gameId) {
      websocketService.joinGameRoom(gameId);
    }
  }, [connected, gameId]);

  const handleShotReport = () => {
    setShotReportDialog(true);
  };

  const handleShotReportSubmit = () => {
    if (user?.id) {
      websocketService.emitShotEvent({
        gameId,
        playerId: user.id,
        shotType: shotReportData.shotType,
        ballId: shotReportData.ballId || undefined,
        pocketId: shotReportData.pocketId || undefined,
      });

      // Reset form
      setShotReportData({
        shotType: 'successful_pot',
        ballId: '',
        pocketId: '',
        notes: '',
      });
      setShotReportDialog(false);
    }
  };

  const handleShotReportCancel = () => {
    setShotReportDialog(false);
    setShotReportData({
      shotType: 'successful_pot',
      ballId: '',
      pocketId: '',
      notes: '',
    });
  };

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
      <Grid container spacing={3}>
        {/* Left Column - Game Status and Controls */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {/* Game Status Header */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={3}
            >
              <Typography variant="h4" sx={{ color: 'primary.main' }}>
                Live Match
              </Typography>
              <Chip
                label={connected ? 'Connected' : 'Disconnected'}
                color={connected ? 'success' : 'error'}
                icon={connected ? <CheckCircle /> : <Cancel />}
              />
            </Box>

            {/* Current Turn */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
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
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <SportsScore sx={{ mr: 1 }} />
                  <Typography variant="h6">Score</Typography>
                </Box>
                <Grid container spacing={2}>
                  {gameState.players.map((player) => (
                    <Grid item xs={6} key={player.id}>
                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          textAlign: 'center',
                          bgcolor:
                            player.id === gameState.currentPlayer
                              ? 'action.selected'
                              : 'background.paper',
                        }}
                      >
                        <Typography variant="h6" color="primary">
                          {player.name}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                          {player.score}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Shot Reporting Section */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <GolfCourse sx={{ mr: 1 }} />
                  <Typography variant="h6">Shot Reporting</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Report your shot outcome to generate AI commentary
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<CheckCircleOutline />}
                      onClick={() => {
                        setShotReportData((prev) => ({
                          ...prev,
                          shotType: 'successful_pot',
                        }));
                        handleShotReport();
                      }}
                      sx={{ mb: 1 }}
                    >
                      Successful Pot
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      color="warning"
                      fullWidth
                      startIcon={<Remove />}
                      onClick={() => {
                        setShotReportData((prev) => ({
                          ...prev,
                          shotType: 'missed_shot',
                        }));
                        handleShotReport();
                      }}
                      sx={{ mb: 1 }}
                    >
                      Missed Shot
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      startIcon={<Error />}
                      onClick={() => {
                        setShotReportData((prev) => ({
                          ...prev,
                          shotType: 'foul',
                        }));
                        handleShotReport();
                      }}
                      sx={{ mb: 1 }}
                    >
                      Foul
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      startIcon={<Flag />}
                      onClick={() => {
                        setShotReportData((prev) => ({
                          ...prev,
                          shotType: 'scratch',
                        }));
                        handleShotReport();
                      }}
                      sx={{ mb: 1 }}
                    >
                      Scratch
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Game Actions */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <EmojiEvents sx={{ mr: 1 }} />
                  <Typography variant="h6">Game Actions</Typography>
                </Box>
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      // Handle game actions
                    }}
                  >
                    Take Shot
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => {
                      // Handle foul reporting
                    }}
                  >
                    Report Foul
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      // Handle game end
                    }}
                  >
                    End Game
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Paper>
        </Grid>

        {/* Right Column - Live Commentary */}
        <Grid item xs={12} md={4}>
          <LiveCommentaryPanel gameId={gameId} isActive={connected} />
        </Grid>
      </Grid>

      {/* Shot Report Dialog */}
      <Dialog
        open={shotReportDialog}
        onClose={handleShotReportCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Shot Outcome</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Shot Type</InputLabel>
              <Select
                value={shotReportData.shotType}
                label="Shot Type"
                onChange={(e) =>
                  setShotReportData((prev) => ({
                    ...prev,
                    shotType: e.target.value as any,
                  }))
                }
              >
                <MenuItem value="successful_pot">Successful Pot</MenuItem>
                <MenuItem value="missed_shot">Missed Shot</MenuItem>
                <MenuItem value="foul">Foul</MenuItem>
                <MenuItem value="scratch">Scratch</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Ball ID (optional)"
              value={shotReportData.ballId}
              onChange={(e) =>
                setShotReportData((prev) => ({
                  ...prev,
                  ballId: e.target.value,
                }))
              }
              sx={{ mb: 2 }}
              placeholder="e.g., 8-ball, 9-ball"
            />

            <TextField
              fullWidth
              label="Pocket ID (optional)"
              value={shotReportData.pocketId}
              onChange={(e) =>
                setShotReportData((prev) => ({
                  ...prev,
                  pocketId: e.target.value,
                }))
              }
              sx={{ mb: 2 }}
              placeholder="e.g., corner, side"
            />

            <TextField
              fullWidth
              label="Notes (optional)"
              value={shotReportData.notes}
              onChange={(e) =>
                setShotReportData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              multiline
              rows={3}
              placeholder="Additional details about the shot..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShotReportCancel}>Cancel</Button>
          <Button onClick={handleShotReportSubmit} variant="contained">
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RealTimeGameView;
