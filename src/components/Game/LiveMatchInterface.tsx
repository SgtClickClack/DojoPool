import { Alert, Box, Grid, Typography } from '@mui/material';
import React from 'react';
import { useLiveCommentary } from '../../hooks/useLiveCommentary';
import LiveCommentaryPanel from './LiveCommentaryPanel';
import ShotReportingPanel from './ShotReportingPanel';

interface LiveMatchInterfaceProps {
  matchId: string;
  playerId: string;
  playerName?: string;
  isPlayerTurn?: boolean;
  matchStatus?: 'active' | 'paused' | 'finished';
}

const LiveMatchInterface: React.FC<LiveMatchInterfaceProps> = ({
  matchId,
  playerId,
  playerName,
  isPlayerTurn = false,
  matchStatus = 'active',
}) => {
  const { commentary, isConnected, error, loading, emitShotTaken } =
    useLiveCommentary(matchId, playerId);

  const handleShotReport = (shotData: {
    ballSunk: boolean;
    wasFoul: boolean;
    shotType: string;
    playerName?: string;
    notes?: string;
  }) => {
    emitShotTaken(shotData);
  };

  const isDisabled = !isPlayerTurn || matchStatus !== 'active' || !isConnected;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{
            color: '#00d4ff',
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            mb: 1,
          }}
        >
          Live Match
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            mb: 2,
          }}
        >
          Match ID: {matchId} • Player: {playerName || 'Unknown'}
        </Typography>

        {/* Status Indicators */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Alert
            severity={isConnected ? 'success' : 'error'}
            sx={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${isConnected ? '#4caf50' : '#f44336'}`,
            }}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Alert>

          <Alert
            severity={matchStatus === 'active' ? 'info' : 'warning'}
            sx={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: `1px solid ${
                matchStatus === 'active' ? '#2196f3' : '#ff9800'
              }`,
            }}
          >
            {matchStatus === 'active'
              ? 'Match Active'
              : matchStatus === 'paused'
                ? 'Match Paused'
                : 'Match Finished'}
          </Alert>

          {isPlayerTurn && (
            <Alert
              severity="success"
              sx={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid #4caf50',
              }}
            >
              Your Turn
            </Alert>
          )}
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Interface Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Shot Reporting */}
        <Grid item xs={12} md={6}>
          <ShotReportingPanel
            onShotReport={handleShotReport}
            isConnected={isConnected}
            playerName={playerName}
            disabled={isDisabled}
          />
        </Grid>

        {/* Right Column - Live Commentary */}
        <Grid item xs={12} md={6}>
          <LiveCommentaryPanel
            commentary={commentary}
            isConnected={isConnected}
            onRefresh={() => {
              // Reconnect to match if needed
              if (!isConnected) {
                // This would trigger a reconnection through the hook
                console.log('Attempting to reconnect...');
              }
            }}
          />
        </Grid>
      </Grid>

      {/* Loading State */}
      {loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography
            variant="body1"
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Connecting to match...
          </Typography>
        </Box>
      )}

      {/* Instructions */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          background: 'rgba(0, 212, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 212, 255, 0.3)',
        }}
      >
        <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
          How to Use
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}
        >
          • <strong>Shot Reporting:</strong> Use the quick buttons to report
          shot outcomes or create custom reports
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}
        >
          • <strong>Live Commentary:</strong> Watch as AI generates real-time
          commentary for each shot
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}
        >
          • <strong>Connection:</strong> Ensure you're connected to receive live
          updates and commentary
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          • <strong>Turn-based:</strong> Shot reporting is only available during
          your turn
        </Typography>
      </Box>
    </Box>
  );
};

export default LiveMatchInterface;
