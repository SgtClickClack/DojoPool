import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, Alert, Grid, Chip, List, ListItem, ListItemText } from "@mui/material";
// import GameTracker from "./GameTracker"; // Keep if needed for other purposes, but RealTimeGameView handles real-time display
// import { ShotTracker } from "../../components/shot-analysis/ShotTracker";
import LiveCommentary from "./LiveCommentary";
// Import types if available
// import { GameState, Shot } from "../../types/game";

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
}

const RealTimeGameView: React.FC<RealTimeGameViewProps> = ({ gameId }) => {
  const [gameState, setGameState] = useState<GameState | null>(null); // Use GameState interface
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time game state
  useEffect(() => {
    let ws: WebSocket | null = null;
    setLoading(true);
    setError(null);
    setGameState(null);
    try {
      // Use the correct WebSocket URL for real-time game state
      // This might need to be a dynamic URL based on environment or configuration
      ws = new WebSocket(`http://localhost:3100/api/games/${gameId}/live`); // Example WebSocket URL, verify actual endpoint
      
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
          console.error("Error parsing WebSocket message:", e);
          setError("Invalid game data received");
          setLoading(false);
        }
      };
      ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          setError("WebSocket connection error");
          setLoading(false);
      };
      ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event);
          // setError("WebSocket connection closed"); // Maybe only set error on abnormal closure
          setLoading(false);
      };
    } catch (e) {
      console.error("Error creating WebSocket:", e);
      setError("Failed to connect to game server");
      setLoading(false);
    }
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
      }
    };
  }, [gameId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error">{error}</Alert>
    );
  }
  if (!gameState) {
    return <Typography>Waiting for game data...</Typography>; // More specific message
  }

  // Extract relevant info from gameState
  const { scores, fouls, currentPlayer, shotClock, players, ruleViolations, foul, foulReason, isBallInHand, nextPlayerId } = (gameState ?? {} as Partial<GameState>);

  // Referee Decision Banner
  const showRefereeDecision = foul !== undefined || foulReason !== undefined || isBallInHand !== undefined || nextPlayerId !== undefined;

  return (
    <>
      <LiveCommentary gameId={gameId} />
      {showRefereeDecision && (
        <Box sx={{ mb: 2 }}>
          <Alert severity={foul ? 'error' : 'info'} variant="filled">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Referee Decision
            </Typography>
            {foul && (
              <Typography><strong>Foul:</strong> {foul}</Typography>
            )}
            {foulReason && (
              <Typography><strong>Explanation:</strong> {foulReason}</Typography>
            )}
            {typeof isBallInHand === 'boolean' && (
              <Typography><strong>Ball-in-Hand:</strong> {isBallInHand ? 'Yes' : 'No'}</Typography>
            )}
            {nextPlayerId && (
              <Typography><strong>Next Player:</strong> {(players || []).find(p => p.id === nextPlayerId)?.name || nextPlayerId}</Typography>
            )}
          </Alert>
        </Box>
      )}
      <Paper sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>Live Game Tracker</Typography>
        
        {/* Display Game Info */}
        <Box sx={{ mb: 3 }}>
             <Typography variant="h6">Current Player: {currentPlayer?.name || "-"}</Typography>
             <Typography variant="subtitle1">Shot Clock: {shotClock !== null ? `${shotClock}s` : "-"}</Typography>
        </Box>

        {/* Display Scores and Fouls using Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
            {(players || []).map(player => (
                <Grid item xs={12} sm={6} key={player.id}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6">{player.name}</Typography>
                        <Typography variant="body1">Score: {scores?.[player.id] ?? 0}</Typography>
                        <Box sx={{ mt: 1 }}>
                           <Typography variant="body1">Fouls:</Typography>
                           {fouls?.[player.id]?.length > 0 ? (
                               (fouls?.[player.id] || []).map((foul, index) => (
                                    <Chip key={index} label={`Foul ${index + 1}: ${foul.type || 'Unknown'}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                               ))
                           ) : (
                               <Typography variant="body2" color="text.secondary">No fouls yet.</Typography>
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
                <Typography variant="body2" color="text.secondary">No rule violations detected yet.</Typography>
            )}
        </Box>

        {/* Placeholder for Rules Display */}
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Game Rules</Typography>
            <Typography variant="body2">Rules display coming soon...</Typography>
            {/* Implement display of current game rules or rule violations here */}
        </Box>

        {/* Shot Tracker - integrate if needed */}
        {/* <ShotTracker onShotComplete={() => {}} /> */}

      </Paper>
    </>
  );
};

export default RealTimeGameView; 