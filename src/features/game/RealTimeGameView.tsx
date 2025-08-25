import { getWebSocketBaseUrl } from '@/config/urls';
import { useLiveCommentary } from '@/hooks/useLiveCommentary';
import { Add, Close, SportsScore, Warning } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import LiveCommentary from './LiveCommentary';

// Define a basic GameState interface based on accessed properties
interface GameState {
  scores: { [playerId: string]: number };
  fouls: { [playerId: string]: any[] }; // Define a proper Foul interface later if needed
  currentPlayer: { id: string; name: string } | null;
  shotClock: number | null;
  shots?: any[]; // Define a proper Shot interface later if needed
  players: { id: string; name: string }[]; // Assuming players are part of the state for iteration
  ruleViolations?: { type: string; description?: string }[]; // Added field for rule violations
  foul?: string;
  foulReason?: string;
  isBallInHand?: boolean;
  nextPlayerId?: string;
  // Add other game state properties as needed (e.g., game status, rules, ball positions)
}

interface RealTimeGameViewProps {
  gameId: string;
  playerId?: string; // Add playerId prop for shot reporting
}

const RealTimeGameView: React.FC<RealTimeGameViewProps> = ({
  gameId,
  playerId,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null); // Use GameState interface
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shotReportDialog, setShotReportDialog] = useState(false);
  const [shotReportData, setShotReportData] = useState({
    shotType: 'successful_pot' as
      | 'successful_pot'
      | 'missed_shot'
      | 'foul'
      | 'scratch',
    ballSunk: false,
    wasFoul: false,
    notes: '',
  });

  // Use the live commentary hook
  const { emitShotTaken, isConnected: commentaryConnected } = useLiveCommentary(
    gameId,
    playerId
  );

  // Subscribe to real-time game state
  useEffect(() => {
    let ws: WebSocket | null = null;
    setLoading(true);
    setError(null);
    setGameState(null);
    try {
      // Derive WS base from centralized config
      const normalized = getWebSocketBaseUrl();
      ws = new WebSocket(`${normalized}/api/games/${gameId}/live`);

      ws.onopen = () => {
        console.log('WebSocket connection opened');
        // Maybe fetch initial game state via HTTP here if needed
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Assuming data directly matches GameState interface structure
          setGameState(data as GameState); // Cast to GameState
          setLoading(false);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
          setError('Invalid game data received');
          setLoading(false);
        }
      };
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setLoading(false);
      };
      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        // setError("WebSocket connection closed"); // Maybe only set error on abnormal closure
        setLoading(false);
      };
    } catch (e) {
      console.error('Error creating WebSocket:', e);
      setError('Failed to connect to game server');
      setLoading(false);
    }
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [gameId]);

  // Handle shot reporting
  const handleShotReport = () => {
    setShotReportDialog(true);
  };

  const handleShotReportSubmit = () => {
    if (playerId) {
      // Emit shot taken event for live commentary
      emitShotTaken({
        ballSunk: shotReportData.ballSunk,
        wasFoul: shotReportData.wasFoul,
        shotType: shotReportData.shotType,
      });

      // Reset form
      setShotReportData({
        shotType: 'successful_pot',
        ballSunk: false,
        wasFoul: false,
        notes: '',
      });
      setShotReportDialog(false);
    } else {
      console.warn('Player ID not available for shot reporting');
    }
  };

  const handleShotReportCancel = () => {
    setShotReportDialog(false);
    setShotReportData({
      shotType: 'successful_pot',
      ballSunk: false,
      wasFoul: false,
      notes: '',
    });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={300}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!gameState) {
    return <Typography>Waiting for game data...</Typography>; // More specific message
  }

  // Extract relevant info from gameState
  const {
    scores,
    fouls,
    currentPlayer,
    shotClock,
    players,
    ruleViolations,
    foul,
    foulReason,
    isBallInHand,
    nextPlayerId,
  } = gameState ?? ({} as Partial<GameState>);

  // Referee Decision Banner
  const showRefereeDecision =
    foul !== undefined ||
    foulReason !== undefined ||
    isBallInHand !== undefined ||
    nextPlayerId !== undefined;

  return (
    <>
      <LiveCommentary gameId={gameId} playerId={playerId} />

      {/* Shot Reporting Section */}
      {playerId && (
        <Paper sx={{ p: 3, m: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            🎯 Shot Reporting
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Report the outcome of your shot for AI commentary and game tracking
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<Add />}
              onClick={handleShotReport}
              disabled={!commentaryConnected}
            >
              Report Shot
            </Button>

            <Button
              variant="outlined"
              color="info"
              startIcon={<SportsScore />}
              onClick={() => {
                setShotReportData((prev) => ({
                  ...prev,
                  shotType: 'successful_pot',
                  ballSunk: true,
                  wasFoul: false,
                }));
                handleShotReportSubmit();
              }}
              disabled={!commentaryConnected}
            >
              Successful Pot
            </Button>

            <Button
              variant="outlined"
              color="warning"
              startIcon={<Warning />}
              onClick={() => {
                setShotReportData((prev) => ({
                  ...prev,
                  shotType: 'foul',
                  ballSunk: false,
                  wasFoul: true,
                }));
                handleShotReportSubmit();
              }}
              disabled={!commentaryConnected}
            >
              Report Foul
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Chip
              label={
                commentaryConnected
                  ? 'Connected to AI Commentary'
                  : 'Disconnected'
              }
              color={commentaryConnected ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Paper>
      )}

      {showRefereeDecision && (
        <Box sx={{ mb: 2 }}>
          <Alert severity={foul ? 'error' : 'info'} variant="filled">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Referee Decision
            </Typography>
            {foul && (
              <Typography>
                <strong>Foul:</strong> {foul}
              </Typography>
            )}
            {foulReason && (
              <Typography>
                <strong>Explanation:</strong> {foulReason}
              </Typography>
            )}
            {typeof isBallInHand === 'boolean' && (
              <Typography>
                <strong>Ball-in-Hand:</strong> {isBallInHand ? 'Yes' : 'No'}
              </Typography>
            )}
            {nextPlayerId && (
              <Typography>
                <strong>Next Player:</strong>{' '}
                {(players || []).find((p) => p.id === nextPlayerId)?.name ||
                  nextPlayerId}
              </Typography>
            )}
          </Alert>
        </Box>
      )}

      <Paper sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>
          Live Game Tracker
        </Typography>

        {/* Display Game Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">
            Current Player: {currentPlayer?.name || '-'}
          </Typography>
          <Typography variant="subtitle1">
            Shot Clock: {shotClock !== null ? `${shotClock}s` : '-'}
          </Typography>
        </Box>

        {/* Display Scores and Fouls using Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {(players || []).map((player) => (
            <Grid item xs={12} sm={6} key={player.id}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6">{player.name}</Typography>
                <Typography variant="body1">
                  Score: {scores?.[player.id] ?? 0}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body1">Fouls:</Typography>
                  {fouls?.[player.id]?.length > 0 ? (
                    (fouls?.[player.id] || []).map((foul, index) => (
                      <Chip
                        key={index}
                        label={`Foul ${index + 1}: ${foul.type || 'Unknown'}`}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No fouls yet.
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Display for Rule Violations */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Rule Violations</Typography>
          {ruleViolations && ruleViolations.length > 0 ? (
            <List dense={true}>
              {ruleViolations.map((violation, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={`Violation: ${violation.type}`}
                    secondary={violation.description}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No rule violations detected yet.
            </Typography>
          )}
        </Box>

        {/* Placeholder for Rules Display */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Game Rules</Typography>
          <Typography variant="body2">Rules display coming soon...</Typography>
          {/* Implement display of current game rules or rule violations here */}
        </Box>
      </Paper>

      {/* Shot Report Dialog */}
      <Dialog
        open={shotReportDialog}
        onClose={handleShotReportCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report Shot Outcome</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
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

            <Box sx={{ mb: 2 }}>
              <Button
                variant={shotReportData.ballSunk ? 'contained' : 'outlined'}
                color="success"
                onClick={() =>
                  setShotReportData((prev) => ({
                    ...prev,
                    ballSunk: !prev.ballSunk,
                  }))
                }
                sx={{ mr: 1 }}
              >
                {shotReportData.ballSunk ? '✅ Ball Sunk' : 'Ball Sunk'}
              </Button>
              <Button
                variant={shotReportData.wasFoul ? 'contained' : 'outlined'}
                color="warning"
                onClick={() =>
                  setShotReportData((prev) => ({
                    ...prev,
                    wasFoul: !prev.wasFoul,
                  }))
                }
              >
                {shotReportData.wasFoul ? '🚨 Foul' : 'Foul'}
              </Button>
            </Box>

            <TextField
              fullWidth
              label="Additional Notes (Optional)"
              multiline
              rows={3}
              value={shotReportData.notes}
              onChange={(e) =>
                setShotReportData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShotReportCancel} startIcon={<Close />}>
            Cancel
          </Button>
          <Button
            onClick={handleShotReportSubmit}
            variant="contained"
            color="primary"
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RealTimeGameView;
