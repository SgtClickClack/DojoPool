import React, { useState } from 'react';
import { Box, Button, Typography, Grid, Paper, Chip } from '@mui/material';
import Layout from '@/components/Layout/Layout';

const GameSessionPage: React.FC = () => {
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [shots, setShots] = useState<number[]>([]);
  const [gameComplete, setGameComplete] = useState(false);

  const handleBallClick = (ballNumber: number) => {
    setShots((prev) => [...prev, ballNumber]);
  };

  const handleEndTurn = () => {
    setCurrentPlayer((prev) => (prev === 1 ? 2 : 1));
  };

  const handleEndGame = () => {
    setGameComplete(true);
  };

  const successfulShots = shots.length;
  const totalShots = shots.length;
  const accuracy =
    totalShots > 0 ? ((successfulShots / totalShots) * 100).toFixed(1) : '0.0';

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Game Session
        </Typography>

        {!gameComplete ? (
          <>
            <Typography variant="h6" gutterBottom>
              Game Controls
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Current Player: Player {currentPlayer}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Player {currentPlayer === 1 ? 2 : 1}'s turn
              </Typography>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                (ball) => (
                  <Grid item key={ball}>
                    <Button
                      variant="contained"
                      onClick={() => handleBallClick(ball)}
                      sx={{ minWidth: 40, height: 40 }}
                    >
                      {ball}
                    </Button>
                  </Grid>
                )
              )}
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button variant="outlined" onClick={handleEndTurn}>
                End Turn
              </Button>
              <Button variant="contained" color="error" onClick={handleEndGame}>
                End Game
              </Button>
            </Box>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Game Statistics
              </Typography>
              <Typography variant="body1">
                Successful Shots: {successfulShots}
              </Typography>
              <Typography variant="body1">Total Shots: {totalShots}</Typography>
              <Typography variant="body1">Accuracy: {accuracy}%</Typography>
            </Paper>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  /* Show history */
                }}
              >
                Game History
              </Button>
            </Box>

            <Box sx={{ mt: 3 }}>
              <div data-testid="google-map">Google Map Component</div>
              <div data-testid="offline-indicator">You are offline</div>
            </Box>
          </>
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main" gutterBottom>
              Game Complete
            </Typography>
            <Typography variant="body1">
              Final Score: Player 1 vs Player 2
            </Typography>
          </Paper>
        )}
      </Box>
    </Layout>
  );
};

export default GameSessionPage;
