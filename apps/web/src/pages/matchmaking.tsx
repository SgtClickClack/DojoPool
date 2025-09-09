import ProtectedRoute from '@/components/Common/ProtectedRoute';
import {
  People as PeopleIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  AccessTime as TimeIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface QueueStatus {
  inQueue: boolean;
  estimatedWaitTime?: number;
  position?: number;
}

interface MatchmakingStats {
  queueSize: number;
  averageWaitTime: number;
  matchesCreated: number;
  activeMatches: number;
}

interface MatchFound {
  id: string;
  playerA: {
    id: string;
    username: string;
    profile?: {
      avatarUrl?: string;
      skillRating?: number;
    };
  };
  playerB: {
    id: string;
    username: string;
    profile?: {
      avatarUrl?: string;
      skillRating?: number;
    };
  };
}

const MatchmakingPage: React.FC = () => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    inQueue: false,
  });
  const [stats, setStats] = useState<MatchmakingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchFound, setMatchFound] = useState<MatchFound | null>(null);
  const [timeInQueue, setTimeInQueue] = useState(0);
  const [queueStartTime, setQueueStartTime] = useState<number | null>(null);

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch('/api/tournaments/matchmaking/status');
      if (!response.ok) {
        throw new Error('Failed to fetch queue status');
      }

      const data = await response.json();
      setQueueStatus(data);
    } catch (err) {
      console.error('Error fetching queue status:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tournaments/matchmaking/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch matchmaking statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching matchmaking stats:', err);
    }
  };

  const joinQueue = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/tournaments/matchmaking/join', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join queue');
      }

      const data = await response.json();

      if (data.success) {
        setQueueStatus({
          inQueue: true,
          estimatedWaitTime: data.estimatedWaitTime,
        });
        setQueueStartTime(Date.now());
        await fetchQueueStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join queue');
      console.error('Error joining queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/tournaments/matchmaking/leave', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to leave queue');
      }

      setQueueStatus({ inQueue: false });
      setQueueStartTime(null);
      setTimeInQueue(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave queue');
      console.error('Error leaving queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptMatch = async () => {
    if (!matchFound) return;

    try {
      // Navigate to match page or start match
      window.location.href = `/matches/${matchFound.id}`;
    } catch (err) {
      console.error('Error accepting match:', err);
    }
  };

  const declineMatch = () => {
    setMatchFound(null);
    // Optionally rejoin queue
    joinQueue();
  };

  // Update time in queue
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (queueStartTime && queueStatus.inQueue) {
      interval = setInterval(() => {
        setTimeInQueue(Math.floor((Date.now() - queueStartTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [queueStartTime, queueStatus.inQueue]);

  // Poll for queue status and match updates
  useEffect(() => {
    if (queueStatus.inQueue) {
      const interval = setInterval(() => {
        fetchQueueStatus();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [queueStatus.inQueue]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatEstimatedTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      return `${Math.ceil(seconds / 60)} minutes`;
    } else {
      return `${Math.ceil(seconds / 3600)} hours`;
    }
  };

  return (
    <ProtectedRoute>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Matchmaking
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Find opponents and start playing
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Queue Status Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box textAlign="center">
              {queueStatus.inQueue ? (
                <>
                  <Box mb={3}>
                    <CircularProgress size={80} thickness={4} />
                  </Box>

                  <Typography variant="h5" gutterBottom>
                    Searching for Opponent...
                  </Typography>

                  <Typography variant="body1" color="text.secondary" mb={2}>
                    Time in queue: {formatTime(timeInQueue)}
                  </Typography>

                  {queueStatus.estimatedWaitTime && (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Estimated wait time:{' '}
                      {formatEstimatedTime(queueStatus.estimatedWaitTime)}
                    </Typography>
                  )}

                  {queueStatus.position && (
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Position in queue: {queueStatus.position}
                    </Typography>
                  )}

                  <Box mb={2}>
                    <LinearProgress
                      variant="indeterminate"
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<StopIcon />}
                    onClick={leaveQueue}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Leaving...' : 'Leave Queue'}
                  </Button>
                </>
              ) : (
                <>
                  <PlayIcon
                    sx={{ fontSize: 80, color: 'primary.main', mb: 3 }}
                  />

                  <Typography variant="h5" gutterBottom>
                    Ready to Play?
                  </Typography>

                  <Typography variant="body1" color="text.secondary" mb={3}>
                    Join the matchmaking queue to find an opponent and start a
                    ranked match.
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={joinQueue}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Joining...' : 'Find Match'}
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <PeopleIcon
                    sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}
                  />
                  <Typography variant="h6">Queue Size</Typography>
                  <Typography variant="h4" color="primary">
                    {stats.queueSize}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Players waiting
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TimeIcon
                    sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }}
                  />
                  <Typography variant="h6">Avg Wait Time</Typography>
                  <Typography variant="h4" color="secondary">
                    {formatEstimatedTime(stats.averageWaitTime)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current average
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <PlayIcon
                    sx={{ fontSize: 40, color: 'success.main', mb: 1 }}
                  />
                  <Typography variant="h6">Matches Today</Typography>
                  <Typography variant="h4" color="success">
                    {stats.matchesCreated}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Matches created
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrophyIcon
                    sx={{ fontSize: 40, color: 'warning.main', mb: 1 }}
                  />
                  <Typography variant="h6">Active Matches</Typography>
                  <Typography variant="h4" color="warning">
                    {stats.activeMatches}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently playing
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* How It Works */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How Matchmaking Works
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <PeopleIcon />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Skill-Based Matching
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Our ELO-based algorithm pairs you with players of similar
                    skill level for fair and competitive matches.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Avatar
                    sx={{
                      bgcolor: 'secondary.main',
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <TimeIcon />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Dynamic Search Range
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    If no perfect match is found, the search range expands over
                    time to find you an opponent faster.
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box textAlign="center">
                  <Avatar
                    sx={{
                      bgcolor: 'success.main',
                      width: 56,
                      height: 56,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <TrophyIcon />
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    Rank Progression
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Win matches to increase your ELO rating and climb the global
                    rankings.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Match Found Dialog */}
        <Dialog
          open={!!matchFound}
          onClose={declineMatch}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: 'center' }}>
            🎯 Match Found!
          </DialogTitle>
          <DialogContent>
            {matchFound && (
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>
                  You've been matched with:
                </Typography>

                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  gap={3}
                  my={3}
                >
                  <Box textAlign="center">
                    <Avatar
                      src={matchFound.playerA.profile?.avatarUrl}
                      sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
                    >
                      {matchFound.playerA.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" fontWeight="medium">
                      {matchFound.playerA.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rating:{' '}
                      {matchFound.playerA.profile?.skillRating || 'Unrated'}
                    </Typography>
                  </Box>

                  <Typography variant="h4" color="primary">
                    VS
                  </Typography>

                  <Box textAlign="center">
                    <Avatar
                      src={matchFound.playerB.profile?.avatarUrl}
                      sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
                    >
                      {matchFound.playerB.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body1" fontWeight="medium">
                      {matchFound.playerB.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rating:{' '}
                      {matchFound.playerB.profile?.skillRating || 'Unrated'}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Accept this match to start playing
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={declineMatch} color="error">
              Decline
            </Button>
            <Button onClick={acceptMatch} variant="contained">
              Accept Match
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </ProtectedRoute>
  );
};

export default MatchmakingPage;
