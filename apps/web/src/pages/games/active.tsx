import ProtectedRoute from '@/components/Common/ProtectedRoute';
import { getActiveGames } from '@/services/APIService';
import type { GameSummary } from '@/types/game';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import Head from 'next/head';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

const ActiveGamesPage: React.FC = () => {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getActiveGames();
      setGames(response);
    } catch (err) {
      console.error('Failed to fetch active games', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch active games.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const renderContent = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {Array.from({ length: 3 })?.map((_, index) => (
            <Grid item xs={12} md={4} key={`skeleton-${index}`}>
              <Card elevation={1}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton
                    variant="rectangular"
                    height={80}
                    sx={{ mt: 2 }}
                  />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" width={120} height={36} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (error) {
      return (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void loadGames()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      );
    }

    if (games.length === 0) {
      return (
        <Box textAlign="center" py={6} data-testid="empty-active-games">
          <Typography variant="h5" gutterBottom>
            You have no active games.
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Ready to rack &apos;em up? Challenge a rival and start a match.
          </Typography>
          <Button
            component={Link}
            href="/games/new"
            variant="contained"
            startIcon={<PlayArrow />}
          >
            Create a New Game
          </Button>
        </Box>
      );
    }

    return (
      <Grid container spacing={3} data-testid="active-games-list">
        {games.map((game) => (
          <Grid item xs={12} md={4} key={game.id}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    vs. {game.opponentName || 'Unknown opponent'}
                  </Typography>
                  <Chip
                    label={game.status.toUpperCase()}
                    color="success"
                    size="small"
                  />
                </Box>

                {game.venueName && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Venue: {game.venueName}
                  </Typography>
                )}

                <Typography variant="body2" color="text.secondary">
                  Started: {new Date(game.startedAt).toLocaleString()}
                </Typography>

                {game.wager !== undefined && game.wager > 0 && (
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Wager: {game.wager} DojoCoins
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button
                  component={Link}
                  href={`/matches/${game.id}`}
                  variant="contained"
                  size="small"
                  startIcon={<PlayArrow />}
                  data-testid={`active-game-${game.id}`}
                >
                  Resume Match
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>Active Games — DojoPool</title>
      </Head>
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Active Games
            </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Jump back into your in-progress matches or open a fresh challenge.
          </Typography>
          </Box>
          <Button
            component={Link}
            href="/games/new"
            variant="outlined"
            startIcon={<PlayArrow />}
          >
            New Game
          </Button>
        </Box>

        {renderContent()}
      </Container>
    </ProtectedRoute>
  );
};

export default ActiveGamesPage;

