import RealtimeChat from '@/components/Chat/RealtimeChat';
import ProtectedRoute from '@/components/Common/ProtectedRoute';
import WebSocketStatus from '@/components/Common/WebSocketStatus';
import {
  useNotifications,
  useTournamentParticipation,
  useWebSocket,
} from '@/hooks/useWebSocket';
import {
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

const WebSocketDemo: React.FC = () => {
  const theme = useTheme();
  const { isConnected, joinTournament, leaveTournament, sendChatMessage } =
    useWebSocket();
  const notifications = useNotifications();
  const [tournamentId, setTournamentId] = useState('demo-tournament-123');
  const [isJoined, setIsJoined] = useState(false);

  // Demo tournament participation
  const tournamentParticipation = useTournamentParticipation(
    isJoined ? tournamentId : undefined
  );

  const handleJoinTournament = () => {
    if (!isJoined) {
      joinTournament(tournamentId);
      setIsJoined(true);
    }
  };

  const handleLeaveTournament = () => {
    if (isJoined) {
      leaveTournament(tournamentId);
      setIsJoined(false);
    }
  };

  const handleSendDemoMessage = () => {
    if (isConnected && isJoined) {
      sendChatMessage(
        `tournament-${tournamentId}`,
        '🎯 WebSocket demo message!'
      );
    }
  };

  const demoEvents = [
    'tournament_update',
    'match_update',
    'chat_message',
    'notification',
    'battle_pass_progress',
    'system_message',
  ];

  return (
    <ProtectedRoute>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            WebSocket Live Demo
          </Typography>
          <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
            Real-time features demonstration for DojoPool
          </Typography>
        </Box>

        {/* Connection Status */}
        <Paper
          sx={{
            p: 3,
            mb: 4,
            background: theme.cyberpunk.gradients.card,
            border: `1px solid ${theme.palette.primary.main}`,
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
              WebSocket Connection
            </Typography>
            <WebSocketStatus showDetails />
          </Box>

          <Box display="flex" gap={2} alignItems="center">
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Status:
            </Typography>
            <Chip
              label={isConnected ? 'Connected' : 'Disconnected'}
              sx={{
                backgroundColor: isConnected
                  ? theme.palette.success.main
                  : theme.palette.error.main,
                color: 'white',
              }}
            />
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              Real-time updates: {isConnected ? 'Enabled' : 'Disabled'}
            </Typography>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Tournament Demo */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                background: theme.cyberpunk.gradients.card,
                border: `1px solid ${theme.palette.secondary.main}`,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: theme.palette.secondary.main }}
              >
                Tournament Participation Demo
              </Typography>

              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Tournament ID"
                  value={tournamentId}
                  onChange={(e) => setTournamentId(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={handleJoinTournament}
                    disabled={!isConnected || isJoined}
                    sx={{
                      background: theme.palette.success.main,
                      '&:hover': { background: theme.palette.success.dark },
                    }}
                  >
                    Join Tournament
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<StopIcon />}
                    onClick={handleLeaveTournament}
                    disabled={!isJoined}
                    sx={{
                      borderColor: theme.palette.error.main,
                      color: theme.palette.error.main,
                      '&:hover': {
                        borderColor: theme.palette.error.main,
                        backgroundColor: `${theme.palette.error.main}20`,
                      },
                    }}
                  >
                    Leave Tournament
                  </Button>
                </Box>
              </Box>

              {isJoined && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Successfully joined tournament! You will now receive real-time
                  updates.
                </Alert>
              )}

              {/* Tournament Activity */}
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 1 }}
              >
                Recent Tournament Activity:
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {tournamentParticipation.recentActivity.length > 0 ? (
                  <List dense>
                    {tournamentParticipation.recentActivity.map(
                      (activity, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{ color: theme.palette.text.primary }}
                              >
                                {activity.message ||
                                  activity.event ||
                                  'Activity'}
                              </Typography>
                            }
                            secondary={
                              <Typography
                                variant="caption"
                                sx={{ color: theme.palette.text.secondary }}
                              >
                                {new Date(
                                  activity.timestamp || Date.now()
                                ).toLocaleTimeString()}
                              </Typography>
                            }
                          />
                        </ListItem>
                      )
                    )}
                  </List>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontStyle: 'italic',
                    }}
                  >
                    No recent activity
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Chat Demo */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                background: theme.cyberpunk.gradients.card,
                border: `1px solid ${theme.palette.info.main}`,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: theme.palette.info.main }}
              >
                Real-time Chat Demo
              </Typography>

              <Box mb={2}>
                <Button
                  variant="contained"
                  startIcon={<MessageIcon />}
                  onClick={handleSendDemoMessage}
                  disabled={!isConnected || !isJoined}
                  sx={{
                    background: theme.palette.info.main,
                    '&:hover': { background: theme.palette.info.dark },
                  }}
                >
                  Send Demo Message
                </Button>
              </Box>

              <RealtimeChat
                roomId={`tournament-${tournamentId}`}
                roomName="Tournament Chat"
                maxHeight={300}
              />
            </Paper>
          </Grid>

          {/* Notifications Demo */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                background: theme.cyberpunk.gradients.card,
                border: `1px solid ${theme.palette.warning.main}`,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: theme.palette.warning.main }}
              >
                Real-time Notifications
              </Typography>

              <Box display="flex" gap={1} alignItems="center" mb={2}>
                <NotificationsIcon sx={{ color: theme.palette.warning.main }} />
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {notifications.unreadCount} unread notifications
                </Typography>
              </Box>

              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {notifications.notifications.length > 0 ? (
                  <List dense>
                    {notifications.notifications
                      .slice(0, 5)
                      .map((notification) => (
                        <ListItem key={notification.id}>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography
                                  variant="body2"
                                  sx={{ color: theme.palette.text.primary }}
                                >
                                  {notification.title}
                                </Typography>
                                {!notification.read && (
                                  <Chip
                                    label="New"
                                    size="small"
                                    sx={{
                                      backgroundColor:
                                        theme.palette.primary.main,
                                      color: 'white',
                                      fontSize: '0.7rem',
                                      height: 18,
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="caption"
                                sx={{ color: theme.palette.text.secondary }}
                              >
                                {notification.message} •{' '}
                                {new Date(
                                  notification.createdAt
                                ).toLocaleTimeString()}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontStyle: 'italic',
                    }}
                  >
                    No notifications yet
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Event Types */}
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                background: theme.cyberpunk.gradients.card,
                border: `1px solid ${theme.palette.success.main}`,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ color: theme.palette.success.main }}
              >
                Supported WebSocket Events
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary, mb: 2 }}
              >
                The following real-time events are supported:
              </Typography>

              <Box display="flex" flexWrap="wrap" gap={1}>
                {demoEvents.map((event) => (
                  <Chip
                    key={event}
                    label={event.replace('_', ' ')}
                    size="small"
                    sx={{
                      backgroundColor: `${theme.palette.primary.main}20`,
                      color: theme.palette.primary.main,
                      textTransform: 'capitalize',
                    }}
                  />
                ))}
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Demo Mode:</strong> This page demonstrates all
                  WebSocket features. In a real implementation, events would be
                  triggered by actual tournament matches, player actions, and
                  system notifications.
                </Typography>
              </Alert>
            </Paper>
          </Grid>
        </Grid>

        {/* Performance Info */}
        <Paper
          sx={{
            p: 3,
            mt: 4,
            background: theme.cyberpunk.gradients.card,
            border: `1px solid ${theme.palette.primary.main}`,
          }}
        >
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: theme.palette.primary.main }}
          >
            Performance & Reliability Features
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: `${theme.palette.success.main}10` }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.success.main }}
                  >
                    Auto-Reconnection
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Automatically reconnects on connection loss with exponential
                    backoff
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ background: `${theme.palette.warning.main}10` }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.warning.main }}
                  >
                    Connection Monitoring
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Real-time connection status and uptime tracking
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ background: `${theme.palette.info.main}10` }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ color: theme.palette.info.main }}
                  >
                    Event Buffering
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Buffers events during disconnection and syncs on
                    reconnection
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </ProtectedRoute>
  );
};

export default WebSocketDemo;
