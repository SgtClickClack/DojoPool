import { useAuth } from '@/hooks/useAuth';
import { useGameSession } from '@/hooks/useGameSession';
import { pauseMatch, resumeMatch } from '@/services/APIService';
import { websocketService } from '@/services/WebSocketService';
import { GameSessionStatus, GameType } from '@/types/gameSession';
import {
  Pause,
  PlayArrow,
  Refresh,
  Stop,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface GameSessionViewProps {
  sessionId: string;
  onSessionEnd?: (winnerId: string) => void;
}

const GameSessionView: React.FC<GameSessionViewProps> = ({
  sessionId,
  onSessionEnd,
}) => {
  const { user } = useAuth();
  const {
    gameSession,
    loading,
    error,
    updateSession: _updateSession,
    refreshSession,
    recordShot,
    recordFoul,
    endSession,
  } = useGameSession(sessionId);

  // Derive paused state from session status
  const isPaused = useMemo(
    () => gameSession?.status === GameSessionStatus.PAUSED,
    [gameSession?.status]
  );
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Pause/Resume via API; real-time sync via WebSocket event
  const handlePause = useCallback(async () => {
    if (!gameSession) return;
    try {
      await pauseMatch(gameSession.id);
    } catch (error) {
      console.error('Failed to pause match:', error);
    }
  }, [gameSession]);

  const handleResume = useCallback(async () => {
    if (!gameSession) return;
    try {
      await resumeMatch(gameSession.id);
    } catch (error) {
      console.error('Failed to resume match:', error);
    }
  }, [gameSession]);

  const handleEndSession = useCallback(async () => {
    if (!gameSession || !user) return;

    // For demo purposes, end with current player as winner
    // In real implementation, this would be determined by game logic
    const winnerId = gameSession.currentPlayerId || gameSession.playerIds[0];

    try {
      await endSession(winnerId);
      onSessionEnd?.(winnerId);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [gameSession, user, endSession, onSessionEnd]);
  // Real-time match status updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let joined = false;

    (async () => {
      try {
        await websocketService.connectToMatch(sessionId);
        websocketService.joinMatchRoom(sessionId);
        joined = true;
        unsubscribe = websocketService.subscribe(
          'match_status_update',
          (data: any) => {
            const targetId = data?.matchId || data?.id;
            if (targetId === sessionId) {
              // Refresh session to reflect latest status
              refreshSession().catch(() => {});
            }
          }
        );
      } catch (e) {
        console.error('WebSocket setup failed:', e);
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
      if (joined) websocketService.leaveMatchRoom(sessionId);
    };
  }, [sessionId, refreshSession]);

  const handleRecordShot = useCallback(async () => {
    if (!gameSession || !user) return;

    const shotData = {
      playerId: user.id,
      ballId: '1', // This would come from AI ball tracking
      velocity: 1.0,
      direction: { x: 0, y: 0 },
      timestamp: new Date(),
    };

    try {
      await recordShot(shotData);
    } catch (error) {
      console.error('Failed to record shot:', error);
    }
  }, [gameSession, user, recordShot]);

  const handleRecordFoul = useCallback(
    async (playerId: string, foulType: string) => {
      if (!gameSession) return;

      try {
        await recordFoul(playerId, foulType, 'Foul detected by AI referee');
      } catch (error) {
        console.error('Failed to record foul:', error);
      }
    },
    [gameSession, recordFoul]
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6">Session Error</Typography>
        <Typography>{error}</Typography>
      </Alert>
    );
  }

  if (!gameSession) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        <Typography variant="h6">No Session Data</Typography>
        <Typography>Game session not found or has ended.</Typography>
      </Alert>
    );
  }

  const isActive = gameSession.status === GameSessionStatus.ACTIVE;
  const isMyTurn = gameSession.currentPlayerId === user?.id;
  const currentPlayer = gameSession.playerIds.find(
    (id) => id === gameSession.currentPlayerId
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Session Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h5" component="h2">
              {GameType[gameSession.gameType]} Game Session
            </Typography>
            <Box>
              <Chip
                label={GameSessionStatus[gameSession.status]}
                color={
                  gameSession.status === GameSessionStatus.ACTIVE
                    ? 'success'
                    : 'default'
                }
                sx={{ mr: 1 }}
              />
              <Chip
                label={`${gameSession.totalShots} shots`}
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Chip
                label={`${gameSession.totalFouls} fouls`}
                variant="outlined"
                color="warning"
              />
            </Box>
          </Box>

          {/* Session Controls */}
          <Box display="flex" gap={1} mb={2}>
            {isActive && (
              <Button
                variant="contained"
                startIcon={<Pause />}
                onClick={handlePause}
              >
                Pause
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<Stop />}
              onClick={handleEndSession}
              disabled={gameSession.status !== GameSessionStatus.ACTIVE}
            >
              End Session
            </Button>
            <Button
              variant="outlined"
              startIcon={showAnalytics ? <VisibilityOff /> : <Visibility />}
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </Button>
          </Box>

          {/* Current Player Info */}
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">Current Player:</Typography>
            <Chip
              label={currentPlayer || 'Unknown'}
              color={isMyTurn ? 'primary' : 'default'}
              variant={isMyTurn ? 'filled' : 'outlined'}
            />
            {isMyTurn && (
              <Chip label="Your Turn" color="success" size="small" />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Game State Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        {/* Players Panel */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Players
              </Typography>
              {gameSession.playerIds.map((playerId) => (
                <Box
                  key={playerId}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={1}
                  border={1}
                  borderColor="divider"
                  borderRadius={1}
                  mb={1}
                >
                  <Typography>{playerId}</Typography>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={`Score: ${gameSession.score[playerId] || 0}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Fouls: ${gameSession.fouls[playerId] || 0}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>

        {/* Ball States Panel */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ball States
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Object.entries(gameSession.ballStates).map(
                  ([ballId, state]) => (
                    <Chip
                      key={ballId}
                      label={`${ballId}: ${state}`}
                      size="small"
                      color={state === 'on_table' ? 'primary' : 'default'}
                      variant={state === 'on_table' ? 'filled' : 'outlined'}
                    />
                  )
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Game Actions */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Game Actions
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={handleRecordShot}
                  disabled={!isActive || !isMyTurn}
                >
                  Record Shot
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => handleRecordFoul(user?.id || '', 'scratch')}
                  disabled={!isActive}
                >
                  Record Foul
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.reload()}
                >
                  <Refresh />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Analytics Panel */}
        {showAnalytics && (
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Analytics
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(2, 1fr)',
                      md: 'repeat(4, 1fr)',
                    },
                    gap: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Total Shots
                  </Typography>
                  <Typography variant="h4">{gameSession.totalShots}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Fouls
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {gameSession.totalFouls}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Frames
                  </Typography>
                  <Typography variant="h4">
                    {gameSession.totalFrames}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="h4">
                    {gameSession.duration
                      ? `${Math.floor(gameSession.duration / 60)}m ${
                          gameSession.duration % 60
                        }s`
                      : 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
      {/* Paused Overlay */}
      {isPaused && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            bgcolor: 'rgba(0,0,0,0.6)',
            zIndex: (theme) => theme.zIndex.modal + 1,
          }}
        >
          <Card>
            <CardContent>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
              >
                <Typography variant="h5">Match Paused</Typography>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleResume}
                >
                  Resume Match
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default GameSessionView;
