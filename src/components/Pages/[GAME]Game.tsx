import { gameApi } from '@/services/api';
import { gameSocket } from '@/services/websocket/gameSocket';
import { type GameState } from '@/types/game';
import { MonitorHeart } from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Drawer,
  Grid,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLocation } from '../../hooks/[UTIL]useLocation';
import { type Location } from '../../utils/location';
import GameMap from '../Map/[MAP]GameMap';
import { Dashboard as MonitoringDashboard } from '../Monitoring/[MON]Dashboard';

interface ClueCompletion {
  clueId: string;
  timestamp: number;
  location: Location;
}

const Game = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherPlayerLocations, setOtherPlayerLocations] = useState<
    Record<string, Location>
  >({});
  const [showDashboard, setShowDashboard] = useState(false);
  // Track completed clues through the clues array
  const [gameStartTime] = useState<number>(Date.now());

  // Use location hook for player position
  const {
    location: currentLocation,
    error: locationError,
    isLoading: locationLoading,
  } = useLocation({
    onError: (err) => {
      console.error('Location error:', err);
    },
  });

  const handleClueCompletion = (clueId: string, location: Location) => {
    const completion: ClueCompletion = {
      clueId,
      timestamp: Date.now(),
      location,
    };

    // Note: Clue completion tracking not yet implemented

    if (gameState) {
      // Record clue completion with metrics
      // Note: Metrics recording not yet implemented
      // Update game state
      // Note: Game state update not yet implemented
    }
  };

  // Update WebSocket connection and game state
  useEffect(() => {
    const fetchGameState = async () => {
      if (!gameId) return;

      try {
        const state = await gameApi.getGameState(gameId);
        setGameState(state);
        setLoading(false);

        // Record player join with initial state
        // Note: Player join metrics not yet implemented

        // Initialize completed clues from saved state
        // Note: Clue completion tracking not yet implemented
      } catch (err) {
        setError('Failed to load game state');
        setLoading(false);
      }
    };

    fetchGameState();

    // Connect to WebSocket
    if (gameId) {
      gameSocket.connect(gameId);

      // Subscribe to game updates
      const gameUpdateCleanup = gameSocket.onGameUpdate((update) => {
        if (update.type === 'game_over') {
          const sessionDuration = Date.now() - gameStartTime;
          setGameState((prev) =>
            prev
              ? {
                  ...prev,
                  isComplete: true,
                  sessionDuration,
                }
              : null
          );

          // Record final metrics
          if (gameState) {
            const finalProgress = 0; // Progress calculation not yet implemented
            // Note: Game completion metrics not yet implemented
          }
        }
      });

      // Subscribe to player location updates
      const locationUpdateCleanup = gameSocket.onPlayerLocations(
        (locations) => {
          setOtherPlayerLocations(locations);
        }
      );

      return () => {
        gameUpdateCleanup?.();
        locationUpdateCleanup?.();
        gameSocket.disconnect();

        // Record player leave with final state
        if (gameState) {
          const sessionDuration = Date.now() - gameStartTime;
          // Note: Player leave metrics not yet implemented
        }
      };
    }
  }, [gameId, gameStartTime]);

  // Update location via WebSocket when it changes
  useEffect(() => {
    if (!gameId || !currentLocation) return;

    gameSocket.updateLocation(currentLocation);
  }, [gameId, currentLocation]);

  useEffect(() => {
    // Set up game boundaries when the game starts
    // Note: Game boundaries system not yet implemented

    // Clean up boundaries when game ends
    return () => {
      // Cleanup not yet implemented
    };
  }, []);

  // Add boundary violation handling
  useEffect(() => {
    if (!currentLocation || !gameState) return;

    // Location validation not yet implemented
    // For now, assume location is always valid
    setError(null);
  }, [currentLocation, gameState]);

  if (loading || locationLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !gameState || !currentLocation) {
    return (
      <Container>
        <Typography color="error" align="center">
          {error || 'Game not found'}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Game Status */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box display="flex" alignItems="center" gap={3}>
              <Box display="flex" alignItems="center">
                <Typography variant="h6">Game Status: Active</Typography>
              </Box>
              <Typography variant="h6">Progress: 0%</Typography>
            </Box>
            <Typography variant="h6">Score: 0</Typography>
          </Paper>
        </Grid>

        {locationError && (
          <Grid item xs={12}>
            <Alert severity="error">
              Failed to access location. Please enable location services.
            </Alert>
          </Grid>
        )}

        {/* Map Area */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '600px' }}>
            <GameMap
              currentLocation={currentLocation}
              otherPlayerLocations={otherPlayerLocations}
            />
          </Paper>
        </Grid>
      </Grid>
      <IconButton
        onClick={() => setShowDashboard(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          backgroundColor: 'background.paper',
          boxShadow: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <MonitorHeart />
      </IconButton>

      <Drawer
        anchor="right"
        open={showDashboard}
        onClose={() => setShowDashboard(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '100%',
            maxWidth: 1200,
          },
        }}
      >
        <MonitoringDashboard gameId={gameId} />
      </Drawer>
    </Container>
  );
};

export default Game;
