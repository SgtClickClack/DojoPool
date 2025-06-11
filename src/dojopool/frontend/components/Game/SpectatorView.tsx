import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  SportsEsports,
  EmojiEvents,
  CheckCircle,
  Cancel,
  Visibility,
  Chat,
  Share,
} from "@mui/icons-material";
import { useGameSocket } from "../../hooks/useGameSocket";
import { useAuth } from "../../hooks/useAuth";

interface SpectatorViewProps {
  gameId: string;
}

const SpectatorView: React.FC<SpectatorViewProps> = ({ gameId }) => {
  const { user } = useAuth();
  const {
    gameState,
    loading,
    error,
    connected,
    leaveGame,
  } = useGameSocket(gameId);

  const [spectatorCount, setSpectatorCount] = useState(0);
  const [showChat, setShowChat] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveGame();
    };
  }, [leaveGame]);

  // Simulate spectator count (in real implementation, this would come from WebSocket)
  useEffect(() => {
    if (connected && gameState) {
      setSpectatorCount(Math.floor(Math.random() * 50) + 1);
    }
  }, [connected, gameState]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Connecting to game...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6">Connection Error</Typography>
        <Typography>{error}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Unable to join as spectator. Please try again later.
        </Typography>
      </Alert>
    );
  }

  if (!gameState) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        <Typography variant="h6">No Game Data</Typography>
        <Typography>Waiting for game state...</Typography>
      </Alert>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);

  return (
    <Box sx={{ p: 2 }}>
      {/* Spectator Header */}
      <Paper sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box display="flex" alignItems="center">
          <Chip
            icon={connected ? <CheckCircle /> : <Cancel />}
            label={connected ? "Connected" : "Disconnected"}
            color={connected ? "success" : "error"}
            sx={{ mr: 2 }}
          />
          <Typography variant="h6">Game #{gameId}</Typography>
          <Chip
            icon={<Visibility />}
            label={`${spectatorCount} watching`}
            color="info"
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>
        <Box display="flex" alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            Status: {gameState.status}
          </Typography>
          <Tooltip title="Toggle Chat">
            <IconButton
              onClick={() => setShowChat(!showChat)}
              color={showChat ? "primary" : "default"}
            >
              <Badge badgeContent={0} color="error">
                <Chat />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Share Game">
            <IconButton>
              <Share />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Game Visualization */}
        <Grid item xs={12} md={showChat ? 8 : 12}>
          <Paper sx={{ p: 3, height: 500, display: "flex", flexDirection: "column" }}>
            <Typography variant="h5" gutterBottom>
              Pool Table
            </Typography>
            
            {/* Placeholder for actual table visualization */}
            <Box
              sx={{
                flex: 1,
                bgcolor: "green.700",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                border: "8px solid #654321",
              }}
            >
              <Typography variant="h6" color="white">
                Table Visualization Coming Soon
              </Typography>
              
              {/* Ball positions overlay */}
              {Object.entries(gameState.ballPositions).map(([ballId, position]) => (
                <Box
                  key={ballId}
                  sx={{
                    position: "absolute",
                    left: `${(position.x / 100) * 100}%`,
                    top: `${(position.y / 100) * 100}%`,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    bgcolor: ballId === "0" ? "white" : "red",
                    border: "2px solid black",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </Box>

            {/* Last shot indicator */}
            {gameState.lastShot && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="subtitle2">
                  Last Shot: {gameState.lastShot.type} - {gameState.lastShot.success ? "Success" : "Miss"}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Game Info Panel */}
        <Grid item xs={12} md={showChat ? 4 : 12}>
          <Paper sx={{ p: 3, height: "fit-content" }}>
            <Typography variant="h5" gutterBottom>
              Game Info
            </Typography>

            {/* Current Player */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <SportsEsports sx={{ mr: 1 }} />
                  <Typography variant="h6">Current Turn</Typography>
                </Box>
                <Typography variant="h6" color="primary">
                  {currentPlayer?.name || "Unknown"}
                </Typography>
              </CardContent>
            </Card>

            {/* Players and Scores */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Players & Scores
                </Typography>
                {gameState.players.map((player) => (
                  <Box key={player.id} sx={{ mb: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1">
                        {player.name}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {player.score}
                      </Typography>
                    </Box>
                    
                    {/* Fouls */}
                    {gameState.fouls[player.id]?.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Fouls: {gameState.fouls[player.id].length}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Winner */}
            {gameState.winner && (
              <Card sx={{ mb: 2, bgcolor: "success.light" }}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <EmojiEvents sx={{ mr: 1, color: "gold" }} />
                    <Typography variant="h6" color="white">
                      Winner: {gameState.players.find(p => p.id === gameState.winner)?.name}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Spectator Notice */}
            <Card sx={{ bgcolor: "info.light" }}>
              <CardContent>
                <Typography variant="body2" color="white">
                  You are watching this game as a spectator. Game controls are not available.
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Grid>

        {/* Chat Panel */}
        {showChat && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: 500, display: "flex", flexDirection: "column" }}>
              <Typography variant="h5" gutterBottom>
                Spectator Chat
              </Typography>
              
              <Box sx={{ flex: 1, bgcolor: "grey.50", p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Chat functionality coming soon...
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Typography variant="body2" sx={{ flex: 1, p: 1, bgcolor: "white", borderRadius: 1, border: "1px solid #ccc" }}>
                  Type a message...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Send
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SpectatorView; 