import { useLiveCommentary } from '@/hooks/useLiveCommentary';
import { Refresh, VolumeOff, VolumeUp } from '@mui/icons-material';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

interface LiveCommentaryProps {
  gameId: string;
  playerId?: string;
}

const LiveCommentary: React.FC<LiveCommentaryProps> = ({
  gameId,
  playerId,
}) => {
  const { commentary, isConnected, error, loading, connectToMatch } =
    useLiveCommentary(gameId, playerId);

  const [audioEnabled, setAudioEnabled] = React.useState(true);

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={120}
        >
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Alert
          severity="error"
          action={
            <IconButton color="inherit" size="small" onClick={connectToMatch}>
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  if (commentary.length === 0) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="h6">🎤 Live AI Commentary</Typography>
          <Box display="flex" gap={1}>
            <Tooltip title={audioEnabled ? 'Disable Audio' : 'Enable Audio'}>
              <IconButton
                size="small"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <VolumeUp /> : <VolumeOff />}
              </IconButton>
            </Tooltip>
            <Chip
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          No commentary yet. Take a shot to hear from the AI referee!
        </Typography>
      </Paper>
    );
  }

  const latest = commentary[0];

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">🎤 Live AI Commentary</Typography>
        <Box display="flex" gap={1}>
          <Tooltip title={audioEnabled ? 'Disable Audio' : 'Enable Audio'}>
            <IconButton
              size="small"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
          </Tooltip>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'error'}
            size="small"
          />
        </Box>
      </Box>

      {/* Latest Commentary Highlight */}
      <Box
        sx={{
          p: 2,
          mb: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 1,
          border: '2px solid',
          borderColor: 'primary.dark',
        }}
      >
        <Typography variant="h6" gutterBottom>
          🎯 Latest Commentary
        </Typography>
        <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
          {latest.text}
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {latest.playerName && (
            <Chip
              label={`Player: ${latest.playerName}`}
              size="small"
              variant="outlined"
              sx={{ color: 'inherit', borderColor: 'inherit' }}
            />
          )}
          {latest.shotType && (
            <Chip
              label={`Type: ${latest.shotType}`}
              size="small"
              variant="outlined"
              sx={{ color: 'inherit', borderColor: 'inherit' }}
            />
          )}
          <Chip
            label={latest.ballSunk ? '✅ Ball Sunk' : '❌ Miss'}
            size="small"
            variant="outlined"
            sx={{ color: 'inherit', borderColor: 'inherit' }}
          />
          <Chip
            label={latest.wasFoul ? '🚨 FOUL' : '✅ Clean'}
            size="small"
            variant="outlined"
            sx={{ color: 'inherit', borderColor: 'inherit' }}
          />
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {latest.timestamp.toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Commentary History */}
      <Typography variant="subtitle2" gutterBottom>
        Commentary History
      </Typography>
      <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
        {commentary.slice(1).map((comment) => (
          <ListItem key={comment.id} sx={{ py: 0.5 }}>
            <ListItemText
              primary={comment.text}
              secondary={
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                  <span>{comment.timestamp.toLocaleTimeString()}</span>
                  {comment.playerName && (
                    <Chip
                      label={comment.playerName}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {comment.shotType && (
                    <Chip
                      label={comment.shotType}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default LiveCommentary;
