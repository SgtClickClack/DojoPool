import {
    ArrowBack as ArrowBackIcon,
    AttachMoney,
    Delete as DeleteIcon,
    Edit as EditIcon,
    EmojiEvents,
    LocationOn,
    People,
    Schedule,
    SportsEsports,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Grid,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageBackground from '../../components/common/PageBackground';
import MatchList from '../../components/tournament/MatchList';
import TournamentForm from '../../components/tournament/TournamentForm';

interface Match {
  id: string;
  round: number;
  status: string;
  playerA: {
    id: string;
    username: string;
  };
  playerB: {
    id: string;
    username: string;
  };
  scoreA?: number;
  scoreB?: number;
  winner?: string;
  loser?: string;
}

interface Tournament {
  id: string;
  name: string;
  format: string;
  status: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  participants: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      username: string;
    };
  }>;
  venue: {
    id: string;
    name: string;
    description?: string;
  };
}

const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  // For now, using a mock player ID - in a real app this would come from auth context
  const currentPlayerId = 'player-123';

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      fetchVenues();
    }
  }, [isEditMode]);

  useEffect(() => {
    if (tournament && (tournament.status === 'ACTIVE' || tournament.status === 'COMPLETED')) {
      fetchMatches();
    }
  }, [tournament?.status]);

  const fetchVenues = async () => {
    setIsLoadingVenues(true);
    try {
      const response = await fetch('http://localhost:8080/v1/territories');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVenues(data);
    } catch (err) {
      console.error('Failed to fetch venues:', err);
      setEditError('Failed to load venues. Please try again.');
    } finally {
      setIsLoadingVenues(false);
    }
  };

  const handleEditSubmit = async (formData: any) => {
    if (!tournament) return;

    setIsSubmitting(true);
    setEditError(null);

    try {
      const response = await fetch(`http://localhost:8080/v1/tournaments/${tournament.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update tournament');
      }

      const updatedTournament = await response.json();
      setTournament(updatedTournament);
      setIsEditMode(false);
      setEditError(null);
    } catch (err) {
      console.error('Failed to update tournament:', err);
      setEditError(
        err instanceof Error ? err.message : 'Failed to update tournament'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!tournament) return;

    if (window.confirm(`Are you sure you want to delete "${tournament.name}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`http://localhost:8080/v1/tournaments/${tournament.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete tournament');
        }

        alert('Tournament deleted successfully!');
        navigate('/tournaments');
      } catch (err) {
        console.error('Failed to delete tournament:', err);
        alert(err instanceof Error ? err.message : 'Failed to delete tournament');
      }
    }
  };

  const handleRegister = async () => {
    if (!tournament) return;

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      const response = await fetch(`http://localhost:8080/v1/tournaments/${tournament.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register for tournament');
      }

      const updatedTournament = await response.json();
      setTournament(updatedTournament);
      setRegistrationError(null);
    } catch (err) {
      console.error('Failed to register for tournament:', err);
      setRegistrationError(
        err instanceof Error ? err.message : 'Failed to register for tournament'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!tournament) return;

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      const response = await fetch(`http://localhost:8080/v1/tournaments/${tournament.id}/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unregister from tournament');
      }

      const updatedTournament = await response.json();
      setTournament(updatedTournament);
      setRegistrationError(null);
    } catch (err) {
      console.error('Failed to unregister from tournament:', err);
      setRegistrationError(
        err instanceof Error ? err.message : 'Failed to unregister from tournament'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStartTournament = async () => {
    if (!tournament) return;

    setIsStarting(true);
    setStartError(null);

    try {
      const response = await fetch(`http://localhost:8080/v1/tournaments/${tournament.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start tournament');
      }

      const updatedTournament = await response.json();
      setTournament(updatedTournament);
      setStartError(null);

      // Fetch matches after tournament starts
      fetchMatches();
    } catch (err) {
      console.error('Failed to start tournament:', err);
      setStartError(
        err instanceof Error ? err.message : 'Failed to start tournament'
      );
    } finally {
      setIsStarting(false);
    }
  };

  const fetchMatches = async () => {
    if (!tournament || (tournament.status !== 'ACTIVE' && tournament.status !== 'COMPLETED')) {
      return;
    }

    setIsLoadingMatches(true);
    setMatchesError(null);

    try {
      const response = await fetch(`http://localhost:8080/v1/tournaments/${tournament.id}/matches`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch matches');
      }

      const matchesData = await response.json();
      setMatches(matchesData);
      setMatchesError(null);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setMatchesError(
        err instanceof Error ? err.message : 'Failed to fetch matches'
      );
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const fetchTournament = async () => {
    try {
      const response = await fetch(`http://localhost:8080/v1/tournaments/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tournament not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTournament(data);
    } catch (err) {
      console.error('Failed to fetch tournament:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'success';
      case 'ACTIVE':
        return 'primary';
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Registration Open';
      case 'ACTIVE':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} coins`;
  };

  if (isLoading) {
    return (
      <PageBackground variant="tournaments">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={60} sx={{ color: '#00ff9d' }} />
          </Box>
        </Container>
      </PageBackground>
    );
  }

  if (error || !tournament) {
    return (
      <PageBackground variant="tournaments">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Tournament not found'}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/tournaments')}
            sx={{ color: '#00ff9d', borderColor: '#00ff9d' }}
          >
            Back to Tournaments
          </Button>
        </Container>
      </PageBackground>
    );
  }

  return (
    <PageBackground variant="tournaments">
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/tournaments')}
            sx={{
              color: '#00ff9d',
              borderColor: '#00ff9d',
              mb: 3,
              '&:hover': {
                borderColor: '#00a8ff',
                color: '#00a8ff',
              },
            }}
          >
            Back to Tournaments
          </Button>

          <Typography
            variant="h2"
            sx={{
              color: '#fff',
              textShadow: '0 0 20px rgba(0, 255, 157, 0.8)',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              mb: 2,
            }}
          >
            {tournament.name}
          </Typography>

          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <Chip
              label={getStatusText(tournament.status)}
              color={getStatusColor(tournament.status)}
              size="medium"
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
                px: 2,
                py: 1,
              }}
            />
            <Chip
              icon={<SportsEsports />}
              label={tournament.format.replace(/_/g, ' ')}
              variant="outlined"
              sx={{
                color: '#00a8ff',
                borderColor: '#00a8ff',
                fontWeight: 600,
              }}
            />
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditMode(true)}
              sx={{
                color: '#00ff9d',
                borderColor: '#00ff9d',
                '&:hover': {
                  borderColor: '#00a8ff',
                  color: '#00a8ff',
                },
              }}
            >
              Edit Tournament
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteTournament}
              sx={{
                color: '#ff4444',
                borderColor: '#ff4444',
                '&:hover': {
                  borderColor: '#ff6666',
                  color: '#ff6666',
                },
              }}
            >
              Delete Tournament
            </Button>
          </Box>
        </Box>

        {/* Tournament Details Grid */}
        {isEditMode ? (
          <Card
            sx={{
              background: 'rgba(10, 10, 10, 0.95)',
              border: '1px solid #00ff9d',
              borderRadius: '15px',
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ color: '#00ff9d', mb: 3, fontWeight: 600 }}>
                Edit Tournament
              </Typography>
              <TournamentForm
                initialData={{
                  name: tournament.name,
                  format: tournament.format,
                  venueId: tournament.venue.id,
                  startDate: tournament.startDate.slice(0, 16), // Format for datetime-local input
                  endDate: tournament.endDate.slice(0, 16),
                  maxParticipants: tournament.maxParticipants,
                  entryFee: tournament.entryFee,
                  prizePool: tournament.prizePool,
                }}
                venues={venues}
                isLoadingVenues={isLoadingVenues}
                isSubmitting={isSubmitting}
                error={editError}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditMode(false)}
                mode="edit"
              />
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {/* Main Info Card */}
            <Grid item xs={12} lg={8}>
              <Card
                sx={{
                  background: 'rgba(10, 10, 10, 0.95)',
                  border: '1px solid #00ff9d',
                  borderRadius: '15px',
                  mb: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ color: '#00ff9d', mb: 3, fontWeight: 600 }}>
                    Tournament Information
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Schedule sx={{ color: '#00a8ff', fontSize: 24 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#888' }}>
                            Start Date
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                            {formatDate(tournament.startDate)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Schedule sx={{ color: '#ff00ff', fontSize: 24 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#888' }}>
                            End Date
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                            {formatDate(tournament.endDate)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <LocationOn sx={{ color: '#ffff00', fontSize: 24 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#888' }}>
                            Venue
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                            {tournament.venue.name}
                          </Typography>
                          {tournament.venue.description && (
                            <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
                              {tournament.venue.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <People sx={{ color: '#00ff9d', fontSize: 24 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: '#888' }}>
                            Participants
                          </Typography>
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                            {tournament.currentParticipants || 0} / {tournament.maxParticipants}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

          {/* Prize & Entry Info Card */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                background: 'rgba(10, 10, 10, 0.95)',
                border: '1px solid #00a8ff',
                borderRadius: '15px',
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ color: '#00a8ff', mb: 3, fontWeight: 600 }}>
                  Prize & Entry
                </Typography>

                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <AttachMoney sx={{ color: '#00ff9d', fontSize: 24 }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Entry Fee
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#00ff9d', fontWeight: 600 }}>
                      {formatCurrency(tournament.entryFee)}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={2}>
                  <EmojiEvents sx={{ color: '#ffff00', fontSize: 24 }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#888' }}>
                      Prize Pool
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#ffff00', fontWeight: 600 }}>
                      {formatCurrency(tournament.prizePool)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Box display="flex" flexDirection="column" gap={2}>
              {registrationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {registrationError}
                </Alert>
              )}

              {startError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {startError}
                </Alert>
              )}

              {tournament.status === 'OPEN' && (
                (() => {
                  const participants = tournament.participants || [];
                  const isRegistered = participants.some(p => p.userId === currentPlayerId);

                  return isRegistered ? (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={handleUnregister}
                      disabled={isRegistering}
                      sx={{
                        color: '#ff4444',
                        borderColor: '#ff4444',
                        py: 1.5,
                        '&:hover': {
                          borderColor: '#ff6666',
                          color: '#ff6666',
                        },
                      }}
                    >
                      {isRegistering ? 'Unregistering...' : 'Unregister'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleRegister}
                      disabled={isRegistering}
                      sx={{
                        background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
                        color: '#000',
                        fontWeight: 600,
                        py: 1.5,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
                        },
                      }}
                    >
                      {isRegistering ? 'Registering...' : 'Register for Tournament'}
                    </Button>
                  );
                })()
              )}

              {/* Start Tournament Button - Only show if tournament is OPEN and has enough participants */}
              {tournament.status === 'OPEN' && (() => {
                const participants = tournament.participants || [];
                const hasEnoughParticipants = participants.length >= 2;

                return hasEnoughParticipants ? (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleStartTournament}
                    disabled={isStarting}
                    sx={{
                      background: 'linear-gradient(135deg, #ff00ff 0%, #00a8ff 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      py: 1.5,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #00a8ff 0%, #ff00ff 100%)',
                      },
                    }}
                  >
                    {isStarting ? 'Starting Tournament...' : 'Start Tournament'}
                  </Button>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Need at least 2 participants to start tournament
                  </Alert>
                );
              })()}

              {tournament.status === 'ACTIVE' && (
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    background: 'linear-gradient(135deg, #00a8ff 0%, #ff00ff 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    py: 1.5,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ff00ff 0%, #00a8ff 100%)',
                    },
                  }}
                >
                  View Live Matches
                </Button>
              )}

              <Button
                variant="outlined"
                fullWidth
                sx={{
                  color: '#00ff9d',
                  borderColor: '#00ff9d',
                  py: 1.5,
                  '&:hover': {
                    borderColor: '#00a8ff',
                    color: '#00a8ff',
                  },
                }}
              >
                View Tournament Bracket
              </Button>
            </Box>
          </Grid>
        </Grid>
        )}

        {/* Tournament Matches */}
        {(tournament.status === 'ACTIVE' || tournament.status === 'COMPLETED') && (
          <MatchList
            matches={matches}
            isLoading={isLoadingMatches}
            onMatchUpdated={fetchMatches}
          />
        )}
      </Container>
    </PageBackground>
  );
};

export default TournamentDetailPage;
