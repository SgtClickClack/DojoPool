import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import useWebSocket from "react-use-websocket";

interface Shot {
  playerId: string;
  type: "pot" | "miss" | "foul";
  ballNumber?: number;
  timestamp: number;
}

interface GameState {
  gameId: string;
  player1: {
    id: string;
    name: string;
    score: number;
    remainingBalls: number[];
  };
  player2: {
    id: string;
    name: string;
    score: number;
    remainingBalls: number[];
  };
  currentPlayer: string;
  lastShot?: Shot;
  isGameOver: boolean;
}

const GameTracker: React.FC<{ gameId: string }> = ({ gameId }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { sendMessage, lastMessage } = useWebSocket(
            `/api/games/${gameId}/live`,
    {
      onError: () => setError("Connection lost. Trying to reconnect..."),
      shouldReconnect: () => true,
      reconnectInterval: 3000,
    },
  );

  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        setGameState(data);
      } catch (e) {
        setError("Invalid game data received");
      }
    }
  }, [lastMessage]);

  const handleShotRecorded = (shot: Shot) => {
    sendMessage(
      JSON.stringify({
        type: "SHOT_RECORDED",
        payload: shot,
      }),
    );
  };

  if (!gameState) {
    return <Typography>Loading game...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: "error.light" }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">
              {gameState.player1.name}
              {gameState.currentPlayer === gameState.player1.id &&
                " (Current Turn)"}
            </Typography>
            <Typography>Score: {gameState.player1.score}</Typography>
            <Typography>
              Remaining Balls: {gameState.player1.remainingBalls.join(", ")}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">
              {gameState.player2.name}
              {gameState.currentPlayer === gameState.player2.id &&
                " (Current Turn)"}
            </Typography>
            <Typography>Score: {gameState.player2.score}</Typography>
            <Typography>
              Remaining Balls: {gameState.player2.remainingBalls.join(", ")}
            </Typography>
          </Paper>
        </Grid>

        {gameState.lastShot && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">Last Shot</Typography>
              <Typography>
                Player:{" "}
                {gameState.lastShot.playerId === gameState.player1.id
                  ? gameState.player1.name
                  : gameState.player2.name}
              </Typography>
              <Typography>Type: {gameState.lastShot.type}</Typography>
              {gameState.lastShot.ballNumber && (
                <Typography>Ball: {gameState.lastShot.ballNumber}</Typography>
              )}
            </Paper>
          </Grid>
        )}

        {gameState.isGameOver && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: "success.light" }}>
              <Typography variant="h5">
                Game Over! Winner:{" "}
                {gameState.player1.score > gameState.player2.score
                  ? gameState.player1.name
                  : gameState.player2.name}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default GameTracker;
