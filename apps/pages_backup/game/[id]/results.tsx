import React from 'react';
import { useRouter } from 'next/router'; // Assuming Next.js or similar for router
import { Box, Typography, Paper, Button, Divider, Grid } from '@mui/material';
import { GameResult, GameSpecificReward } from '../../../types/game'; // Updated import path
import useGameResults from '../../../frontend/hooks/services/useGameResultsService'; // Use the actual hook
import { useAuth } from '../../../contexts/AuthContext'; // Use the actual hook
import RewardsDisplayPanel from '../../../frontend/components/rewards/RewardsDisplayPanel'; // Re-use if applicable
import { AuthenticatedLayout } from '../../../components/layout/AuthenticatedLayout'; // Changed to named import
import ProtectedRoute from '../../../components/auth/ProtectedRoute'; // Changed to default import

const GameResultsPage: React.FC = () => {
  const router = useRouter();
  const { id: gameId } = router.query; // Get game ID from route

  const { user } = useAuth(); // Get user from auth context
  // Fetch game results and rewards for the current game and user
  const { gameResult, gameSpecificRewards, loading, error, fetchGameResults } =
    useGameResults();

  React.useEffect(() => {
    // Ensure gameId is a string before fetching
    if (typeof gameId === 'string' && user?.id) {
      fetchGameResults(gameId, user.id);
    }
    // TODO: Handle cases where gameId is not a string array or user is not logged in
  }, [gameId, user, fetchGameResults]);

  if (!gameId) {
    return (
      <ProtectedRoute>
        <AuthenticatedLayout>
          <Paper sx={{ padding: 2, margin: 2 }}>
            <Typography>No Game ID provided.</Typography>
          </Paper>
        </AuthenticatedLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <Paper sx={{ padding: 3, margin: 2 }}>
          <Typography variant="h4" gutterBottom>
            Game Results: #{gameId}
          </Typography>

          {loading && <Typography>Loading game results...</Typography>}
          {error && (
            <Typography color="error">
              Error loading results:{' '}
              {typeof error === 'string' ? error : 'An error occurred'}
            </Typography>
          )}

          {gameResult && !loading && !error && (
            <Box mb={3}>
              <Typography variant="h6">Match Summary</Typography>
              <Typography>Date: {gameResult.date}</Typography>
              <Typography>Winner: {gameResult.winner}</Typography>
              <Typography>Loser: {gameResult.loser}</Typography>
              <Typography>Final Score: {gameResult.score}</Typography>
            </Box>
          )}

          {gameSpecificRewards.length > 0 && !loading && !error && (
            <Box mb={3}>
              <Typography variant="h6">Rewards Earned This Game</Typography>
              <Grid container spacing={1}>
                {gameSpecificRewards.map((reward) => (
                  <Grid item xs={12} sm={6} key={reward.id}>
                    <Paper elevation={1} sx={{ padding: 1.5 }}>
                      <Typography variant="subtitle1">{reward.name}</Typography>
                      <Typography variant="body2">
                        {reward.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Divider sx={{ marginY: 2 }} />

          <Typography variant="h6" gutterBottom>
            Overall Rewards
          </Typography>
          {/* Option to show all rewards, or link to the main rewards panel */}
          {/* For simplicity, re-using the RewardsDisplayPanel. This could be a summary or specific panel */}
          <RewardsDisplayPanel />

          <Box mt={3} display="flex" justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push('/game/new')}
            >
              Play Again
            </Button>
          </Box>
        </Paper>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
};

export default GameResultsPage;
