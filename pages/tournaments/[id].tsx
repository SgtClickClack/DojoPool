import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  People as PlayersIcon,
  Place as VenueIcon,
  CalendarToday as DateIcon,
  MonetizationOn as PrizeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';

interface Participant {
  id: string;
  username: string;
  avatar?: string;
  seed?: number;
}

interface Match {
  id: string;
  round: number;
  player1?: Participant;
  player2?: Participant;
  winner?: string;
  score?: string;
  nextMatchId?: string;
}

interface Tournament {
  id: string;
  name: string;
  venue_name: string;
  start_date: string;
  end_date: string | null;
  max_players: number;
  current_players: number;
  status: 'registration_open' | 'in_progress' | 'completed';
  prize_pool: number;
  organizer_id: string;
  participants: Participant[];
  matches: Match[];
}

export default function TournamentDetail() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTournamentDetails();
    }
  }, [id]);

  const fetchTournamentDetails = async () => {
    try {
      const response = await fetch(`/api/tournament/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tournament details');
      }

      setTournament(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/tournament/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tournamentId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join tournament');
      }

      fetchTournamentDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join tournament');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTournament = async () => {
    setConfirmDialog(false);
    setActionLoading(true);
    try {
      const response = await fetch(`/api/tournament/${id}/start`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start tournament');
      }

      fetchTournamentDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start tournament');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'registration_open':
        return 'Registration Open';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const renderBracket = (matches: Match[]) => {
    const roundsMap = matches.reduce((acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    }, {} as Record<number, Match[]>);

    const rounds = Object.entries(roundsMap).sort(([a], [b]) => Number(a) - Number(b));

    return (
      <Box sx={{ overflowX: 'auto', py: 4 }}>
        <Box sx={{ display: 'flex', gap: 4, minWidth: rounds.length * 250 }}>
          {rounds.map(([round, matches]) => (
            <Box key={round} sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Round {round}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {matches.map((match) => (
                  <Paper key={match.id} sx={{ p: 2 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Match {match.id}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: match.player1?.id === match.winner ? 'success.light' : 'inherit',
                        }}
                      >
                        <Typography>
                          {match.player1?.username || 'TBD'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: match.player2?.id === match.winner ? 'success.light' : 'inherit',
                        }}
                      >
                        <Typography>
                          {match.player2?.username || 'TBD'}
                        </Typography>
                      </Box>
                      {match.score && (
                        <Typography variant="body2" color="textSecondary">
                          Score: {match.score}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tournament) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Tournament not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Tournament Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Typography variant="h4" gutterBottom>
                {tournament.name}
              </Typography>
              <Chip
                label={getStatusText(tournament.status)}
                color={getStatusColor(tournament.status) as any}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VenueIcon sx={{ mr: 1 }} color="action" />
                  <Typography>{tournament.venue_name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DateIcon sx={{ mr: 1 }} color="action" />
                  <Typography>
                    {new Date(tournament.start_date).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PlayersIcon sx={{ mr: 1 }} color="action" />
                  <Typography>
                    {tournament.current_players} / {tournament.max_players} players
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PrizeIcon sx={{ mr: 1 }} color="action" />
                  <Typography>${tournament.prize_pool}</Typography>
                </Box>
              </Grid>
            </Grid>

            {tournament.status === 'registration_open' && (
              <Box sx={{ mt: 2 }}>
                {user?.id === tournament.organizer_id ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setConfirmDialog(true)}
                    disabled={actionLoading || tournament.current_players < 4}
                  >
                    Start Tournament
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleJoinTournament}
                    disabled={actionLoading || tournament.current_players >= tournament.max_players}
                  >
                    Join Tournament
                  </Button>
                )}
              </Box>
            )}
          </Paper>

          {/* Tournament Bracket */}
          {tournament.status !== 'registration_open' && (
            <Paper sx={{ mt: 4, p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Tournament Bracket
              </Typography>
              {renderBracket(tournament.matches)}
            </Paper>
          )}
        </Grid>

        {/* Participants List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Participants
            </Typography>
            <List>
              {tournament.participants.map((participant, index) => (
                <React.Fragment key={participant.id}>
                  <ListItem>
                    <ListItemAvatar>
                      {participant.avatar ? (
                        <Avatar src={participant.avatar} />
                      ) : (
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={participant.username}
                      secondary={participant.seed ? `Seed #${participant.seed}` : null}
                    />
                  </ListItem>
                  {index < tournament.participants.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {tournament.participants.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No participants yet"
                    secondary="Be the first to join!"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirm Start Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Start Tournament</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to start the tournament? This will generate the bracket and no more players will be able to join.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleStartTournament} variant="contained" color="primary">
            Start Tournament
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 