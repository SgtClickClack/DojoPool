import { useAuth } from '@/hooks/useAuth';
import {
  AttachMoney,
  EmojiEvents,
  PlayArrow,
  Schedule,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

interface Tournament {
  id: string;
  name: string;
  description: string;
  gameType: string;
  tournamentType: string;
  bracketType: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  totalPrizePool: number;
  status: 'draft' | 'published' | 'in_progress' | 'completed';
  startDate: Date;
  endDate?: Date;
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
  isRegistered?: boolean;
  canRegister?: boolean;
}

interface TournamentListProps {
  onJoinTournament: (tournamentId: string) => void;
  onCreateTournament?: () => void;
  showCreateButton?: boolean;
}

export const TournamentList: React.FC<TournamentListProps> = ({
  onJoinTournament,
  onCreateTournament,
  showCreateButton = true,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTournaments();
  }, [user]);

  const loadTournaments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/tournaments/available?userId=${user.id}&limit=20`
      );
      if (!response.ok) {
        throw new Error('Failed to load tournaments');
      }

      const data = await response.json();
      setTournaments(data);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
      setError('Failed to load tournaments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (tournament: Tournament) => {
    try {
      if (!user) return;

      const response = await fetch('/api/tournaments/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: tournament.id,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join tournament');
      }

      // Refresh tournaments list
      await loadTournaments();

      // Call parent callback
      onJoinTournament(tournament.id);
    } catch (err) {
      console.error('Failed to join tournament:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to join tournament'
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'default';
      case 'draft':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Open for Registration';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getParticipantProgress = (current: number, max: number) => {
    return (current / max) * 100;
  };

  if (!user) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">Please log in to view tournaments.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <div>
          <Typography variant="h4" gutterBottom>
            🏆 Available Tournaments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Join competitive pool tournaments and win prizes
          </Typography>
        </div>
        {showCreateButton && (
          <Button
            variant="contained"
            onClick={onCreateTournament}
            startIcon={<EmojiEvents />}
            sx={{ minWidth: 200 }}
          >
            Create Tournament
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 200,
          }}
        >
          <Typography>Loading tournaments...</Typography>
        </Box>
      ) : tournaments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tournaments available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Be the first to create a tournament!
          </Typography>
          {showCreateButton && (
            <Button
              variant="contained"
              onClick={onCreateTournament}
              startIcon={<EmojiEvents />}
            >
              Create Tournament
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tournaments.map((tournament) => (
            <Grid item xs={12} md={6} lg={4} key={tournament.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Tournament Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" component="h2" gutterBottom>
                      {tournament.name}
                    </Typography>
                    <Chip
                      label={getStatusLabel(tournament.status)}
                      color={getStatusColor(tournament.status) as any}
                      size="small"
                    />
                  </Box>

                  {/* Creator Info */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      src={tournament.creator.avatar}
                      sx={{ width: 24, height: 24 }}
                    >
                      {tournament.creator.username[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      by {tournament.creator.username}
                    </Typography>
                  </Box>

                  {/* Tournament Details */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {tournament.description}
                  </Typography>

                  {/* Game Type and Format */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={tournament.gameType}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={tournament.tournamentType.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {/* Participants Progress */}
                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">
                        Participants: {tournament.currentParticipants}/
                        {tournament.maxParticipants}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(
                          getParticipantProgress(
                            tournament.currentParticipants,
                            tournament.maxParticipants
                          )
                        )}
                        %
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getParticipantProgress(
                        tournament.currentParticipants,
                        tournament.maxParticipants
                      )}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Tournament Info */}
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney
                        sx={{ fontSize: 16, color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        Entry: {tournament.entryFee} coins
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmojiEvents
                        sx={{ fontSize: 16, color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        Prize Pool: {tournament.totalPrizePool} coins
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule
                        sx={{ fontSize: 16, color: 'text.secondary' }}
                      />
                      <Typography variant="body2">
                        Starts: {formatDate(tournament.startDate)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  {tournament.isRegistered ? (
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled
                      startIcon={<PlayArrow />}
                    >
                      Already Registered
                    </Button>
                  ) : tournament.canRegister ? (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleJoinTournament(tournament)}
                      startIcon={<PlayArrow />}
                    >
                      Join Tournament ({tournament.entryFee} coins)
                    </Button>
                  ) : (
                    <Button variant="outlined" fullWidth disabled>
                      Registration Closed
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
