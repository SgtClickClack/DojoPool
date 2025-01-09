import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Drawer,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Timer as TimerIcon,
  MonitorChart,
} from '@mui/icons-material';
import { GameState } from '@/types/game';
import { gameApi } from '@/services/api';
import { gameSocket } from '@/services/websocket/gameSocket';
import GameMap from '@/components/map/GameMap';
import { useLocation } from '@/hooks/useLocation';
import { Location, formatTime } from '@/utils/location';
import { MonitoringDashboard } from '../monitoring/Dashboard';
import { gameMetricsMonitor } from '@/utils/monitoring';
import { locationValidator } from '@/utils/validation';

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
  const [otherPlayerLocations, setOtherPlayerLocations] = useState<Record<string, Location>>({});
  const [showDashboard, setShowDashboard] = useState(false);
  const [completedClues, setCompletedClues] = useState<ClueCompletion[]>([]);
  const [gameStartTime] = useState<number>(Date.now());

  // Use location hook for player position
  const { 
    location: currentLocation,
    error: locationError,
    isLoading: locationLoading
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
    
    setCompletedClues(prev => [...prev, completion]);
    
    if (gameState) {
      // Record clue completion with metrics
      gameMetricsMonitor.recordClueCompletion(
        gameState.playerId,
        gameState.totalClues
      );

      // Update game state
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          completedClues: [...prev.completedClues, clueId],
          score: prev.score + 100, // Basic scoring logic
        };
      });
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
        gameMetricsMonitor.recordPlayerJoin(state.playerId, gameId);
        
        // Initialize completed clues from saved state
        if (state.completedClues.length > 0) {
          state.completedClues.forEach(clueId => {
            gameMetricsMonitor.recordClueCompletion(
              state.playerId,
              state.totalClues
            );
          });
        }
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
          setGameState(prev => prev ? { 
            ...prev, 
            isComplete: true,
            sessionDuration,
          } : null);
          
          // Record final metrics
          if (gameState) {
            const finalProgress = (completedClues.length / gameState.totalClues) * 100;
            gameMetricsMonitor.recordGameCompletion(
              gameState.playerId,
              finalProgress,
              sessionDuration
            );
          }
        } else if (update.type === 'clue_completed') {
          handleClueCompletion(update.data.clueId, update.data.location);
        }
      });

      // Subscribe to player location updates
      const locationUpdateCleanup = gameSocket.onPlayerLocations((locations) => {
        setOtherPlayerLocations(locations);
      });

      return () => {
        gameUpdateCleanup?.();
        locationUpdateCleanup?.();
        gameSocket.disconnect();
        
        // Record player leave with final state
        if (gameState) {
          const sessionDuration = Date.now() - gameStartTime;
          gameMetricsMonitor.recordPlayerLeave(
            gameState.playerId,
            completedClues.length,
            sessionDuration
          );
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
    if (gameState?.boundaries) {
      // Clear any existing boundaries
      locationValidator.clearBoundaries();

      // Add safe play area
      if (gameState.boundaries.safeArea) {
        locationValidator.addBoundary({
          id: 'safe_play_area',
          type: 'safe',
          points: gameState.boundaries.safeArea,
        });
      }

      // Add unsafe areas
      gameState.boundaries.unsafeAreas?.forEach((area, index) => {
        locationValidator.addBoundary({
          id: `unsafe_area_${index}`,
          type: 'unsafe',
          points: area,
        });
      });
    }

    // Clean up boundaries when game ends
    return () => {
      locationValidator.clearBoundaries();
    };
  }, [gameState?.boundaries]);

  // Add boundary violation handling
  useEffect(() => {
    if (!currentLocation || !gameState) return;

    const locationValidation = locationValidator.validateLocation(currentLocation);
    if (!locationValidation.isValid) {
      // Show warning to player
      setError(`Warning: ${locationValidation.reason}`);
      
      // Record safety incident
      if (gameState) {
        gameMetricsMonitor.recordSafetyIncident(
          gameState.playerId,
          'boundary_violation',
          locationValidation.reason || 'Unknown reason'
        );
      }
    } else {
      // Clear error if location is valid
      setError(null);
    }
  }, [currentLocation, gameState]);

  if (loading || locationLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
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
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Box display="flex" alignItems="center">
                <TimerIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Time Remaining: {formatTime(gameState.timeRemaining)}
                </Typography>
              </Box>
              <Typography variant="h6">
                Progress: {((completedClues.length / gameState.totalClues) * 100).toFixed(1)}%
              </Typography>
            </Box>
            <Typography variant="h6">Score: {gameState.score}</Typography>
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
        <MonitorChart />
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