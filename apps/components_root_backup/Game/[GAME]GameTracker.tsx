import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import { useGameState } from '../../hooks/useGameState';
import { BallStatus } from '../../types/game';

interface GameTrackerProps {
  gameId: string;
  player1Id: string;
  player2Id: string;
}

export const GameTracker: React.FC<GameTrackerProps> = ({
  gameId,
  player1Id,
  player2Id,
}) => {
  const { gameState, updateBallStatus, endTurn, endGame } =
    useGameState(gameId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameState) {
      setLoading(false);
    }
  }, [gameState]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Player 1: {gameState?.player1.name}
            </Typography>
            <Typography>Score: {gameState?.player1.score}</Typography>
            <Typography>
              Balls Pocketed: {gameState?.player1.ballsPocketed.join(', ')}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Player 2: {gameState?.player2.name}
            </Typography>
            <Typography>Score: {gameState?.player2.score}</Typography>
            <Typography>
              Balls Pocketed: {gameState?.player2.ballsPocketed.join(', ')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Game Controls
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((ball) => (
                <Button
                  key={ball}
                  variant="outlined"
                  onClick={() => updateBallStatus(ball, BallStatus.POCKETED)}
                  disabled={
                    gameState?.ballStatuses[ball] === BallStatus.POCKETED
                  }
                >
                  {ball}
                </Button>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => endTurn()}
              >
                End Turn
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => endGame()}
              >
                End Game
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
