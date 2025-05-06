import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, Alert } from "@mui/material";
import GameTracker from "./GameTracker";
import { ShotTracker } from "../../components/shot-analysis/ShotTracker";
import LiveCommentary from "./LiveCommentary";
// Import types if available
// import { GameState, Shot } from "../../types/game";

interface RealTimeGameViewProps {
  gameId: string;
}

const RealTimeGameView: React.FC<RealTimeGameViewProps> = ({ gameId }) => {
  const [gameState, setGameState] = useState<any>(null); // Replace 'any' with GameState if available
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time game state using GameTracker's logic
  useEffect(() => {
    let ws: WebSocket | null = null;
    setLoading(true);
    setError(null);
    setGameState(null);
    try {
      ws = new WebSocket(`ws://localhost:3000/api/games/${gameId}/live`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setGameState(data);
          setLoading(false);
        } catch (e) {
          setError("Invalid game data received");
        }
      };
      ws.onerror = () => setError("Connection error");
      ws.onclose = () => setError("Connection closed");
    } catch (e) {
      setError("Failed to connect to game server");
    }
    return () => {
      if (ws) ws.close();
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
    return <Typography>No game data available.</Typography>;
  }

  // Extract relevant info from gameState
  const { scores, fouls, currentPlayer, shotClock, shots } = gameState;

  return (
    <>
      <LiveCommentary gameId={gameId} />
      <Paper sx={{ p: 3, m: 2 }}>
        <Typography variant="h5" gutterBottom>Live Game Tracker</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography>Current Player: {currentPlayer?.name || "-"}</Typography>
          <Typography>Scores: {scores ? JSON.stringify(scores) : "-"}</Typography>
          <Typography>Fouls: {fouls ? JSON.stringify(fouls) : "-"}</Typography>
          <Typography>Shot Clock: {shotClock ? `${shotClock}s` : "-"}</Typography>
        </Box>
        <ShotTracker onShotComplete={() => {}} />
        {/* Optionally pass latest shot data to ShotTracker if needed */}
        {/* <ShotTracker shot={shots?.[shots.length - 1]} /> */}
      </Paper>
    </>
  );
};

export default RealTimeGameView; 