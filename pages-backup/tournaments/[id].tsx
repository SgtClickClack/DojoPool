import {
  ArrowBack,
  AttachMoney,
  CalendarToday,
  DeleteForever,
  EmojiEvents,
  LocationOn,
  People,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Snackbar,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import {
  deleteTournament,
  getTournament,
  submitMatchResult,
} from '../../src/api/tournaments';
import PageBackground from '../../src/components/Common/PageBackground';
import TournamentBracket from '../../src/components/Tournament/TournamentBracket';
import MatchResultDialog from '../../src/components/tournament/MatchResultDialog';
import {
  Tournament,
  TournamentBracket as TournamentBracketType,
  TournamentMatch,
} from '../../src/types/tournament';

// Add a function to fetch tournament bracket data
const fetchTournamentBracket = async (
  tournamentId: string
): Promise<TournamentBracketType> => {
  try {
    const response = await fetch(`/v1/tournaments/${tournamentId}/bracket`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.bracket || data;
  } catch (error) {
    console.error('Error fetching tournament bracket:', error);
    throw error;
  }
};

const TournamentDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<TournamentBracketType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Match result reporting state
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  // Delete confirmation state
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Handler for opening the match result dialog
  const handleReportResult = (match: TournamentMatch) => {
    setSelectedMatch(match);
    setIsDialogOpen(true);
  };

  // Handler for closing the match result dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Handler for submitting match results
  const handleSubmitResult = async (matchId: string, winnerId: number) => {
    try {
      await submitMatchResult(matchId, winnerId);

      // Refresh bracket data after successful submission
      if (id) {
        const bracketData = await fetchTournamentBracket(id as string);
        setBracket(bracketData);
      }

      // Show success message
      setSnackbarMessage('Match result reported successfully!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error submitting match result:', err);
      throw err; // Re-throw to be handled by the dialog
    }
  };

  // Confirm deletion handler
  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteTournament(id as string);
      // Redirect to tournaments list after successful deletion
      await router.push('/tournaments');
    } catch (err) {
      console.error('Error deleting tournament:', err);
      setSnackbarMessage('Failed to delete tournament.');
      setSnackbarOpen(true);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch tournament details
        const tournamentData = await getTournament(id as string);
        setTournament(tournamentData);

        // Fetch tournament bracket
        const bracketData = await fetchTournamentBracket(id as string);
        setBracket(bracketData);
      } catch (err) {
        console.error('Error fetching tournament data:', err);
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return '#00ff9d';
      case 'active':
        return '#00a8ff';
      case 'full':
        return '#ff00ff';
      case 'completed':
        return '#ffff00';
      case 'cancelled':
        return '#ff4444';
      default:
        return '#888888';
    }
  };

  // Cyberpunk styling
  const cyberCardStyle = {
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid #00ff9d',
    borderRadius: '15px',
    padding: '1.5rem',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    transition: 'all 0.4s ease',
    transformStyle: 'preserve-3d' as const,
    perspective: '1000px' as const,
    boxShadow:
      '0 0 30px rgba(0, 255, 157, 0.1), inset 0 0 30px rgba(0, 255, 157, 0.05)',
    clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)',
    '&:hover': {
      transform: 'translateY(-5px) scale(1.02)',
      borderColor: '#00a8ff',
      boxShadow:
        '0 15px 40px rgba(0, 168, 255, 0.3), inset 0 0 40px rgba(0, 168, 255, 0.2)',
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background:
        'linear-gradient(45deg, transparent, rgba(0, 255, 157, 0.1), transparent)',
      transform: 'translateZ(-1px)',
    },
  };

  const neonTextStyle = {
    color: '#fff',
    textShadow:
      '0 0 10px rgba(0, 255, 157, 0.8), 0 0 20px rgba(0, 255, 157, 0.4), 0 0 30px rgba(0, 255, 157, 0.2)',
    fontWeight: 700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  };

  return (
    <PageBackground variant="tournaments">
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        {/* Back button */}
        <Box sx={{ mb: 3 }}>
          <Link href="/tournaments" passHref>
            <Button
              startIcon={<ArrowBack />}
              sx={{
                color: '#00ff9d',
                '&:hover': {
                  color: '#00a8ff',
                  background: 'rgba(0, 168, 255, 0.1)',
                },
              }}
            >
              Back to Tournaments
            </Button>
          </Link>
        </Box>

        {isLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
            sx={{
              background: 'rgba(10, 10, 10, 0.95)',
              borderRadius: 2,
              border: '1px solid rgba(0, 255, 157, 0.2)',
              boxShadow: '0 0 20px rgba(0, 255, 157, 0.1)',
            }}
          >
            <CircularProgress
              sx={{
                color: '#00ff9d',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid #ff4444',
              color: '#ff4444',
              '& .MuiAlert-icon': { color: '#ff4444' },
            }}
          >
            Error fetching tournament data: {error}
          </Alert>
        ) : tournament ? (
          <>
            {/* Tournament Header */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h3"
                sx={{
                  color: '#fff',
                  textShadow: '0 0 20px rgba(0, 255, 157, 0.8)',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  mb: 1,
                }}
              >
                {tournament.name}
              </Typography>

              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                <Chip
                  label={tournament.format}
                  size="medium"
                  sx={{
                    background: 'rgba(0, 168, 255, 0.2)',
                    border: '1px solid #00a8ff',
                    color: '#00a8ff',
                    textShadow: '0 0 5px #00a8ff',
                    fontWeight: 600,
                  }}
                />

                <Chip
                  label={tournament.status}
                  size="medium"
                  sx={{
                    background: `rgba(${
                      tournament.status === 'open'
                        ? '0, 255, 157'
                        : tournament.status === 'active'
                          ? '0, 168, 255'
                          : tournament.status === 'full'
                            ? '255, 0, 255'
                            : tournament.status === 'completed'
                              ? '255, 255, 0'
                              : tournament.status === 'cancelled'
                                ? '255, 68, 68'
                                : '136, 136, 136'
                    }, 0.2)`,
                    border: `1px solid ${getStatusColor(tournament.status)}`,
                    color: getStatusColor(tournament.status),
                    textShadow: `0 0 5px ${getStatusColor(tournament.status)}`,
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Box
                sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}
              >
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteForever />}
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete Tournament
                </Button>
              </Box>
            </Box>

            {/* Tournament Info and Bracket */}
            <Grid container spacing={4}>
              {/* Tournament Info */}
              <Grid item xs={12} md={4}>
                <Card sx={cyberCardStyle}>
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ ...neonTextStyle, mb: 3, fontSize: '1.2rem' }}
                    >
                      Tournament Details
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <CalendarToday sx={{ color: '#00ff9d', mr: 1 }} />
                        <Typography sx={{ color: '#888', fontWeight: 600 }}>
                          Start Date:
                        </Typography>
                      </Box>
                      <Typography sx={{ color: '#fff', ml: 4 }}>
                        {formatDate(tournament.startDate)}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <CalendarToday sx={{ color: '#00ff9d', mr: 1 }} />
                        <Typography sx={{ color: '#888', fontWeight: 600 }}>
                          End Date:
                        </Typography>
                      </Box>
                      <Typography sx={{ color: '#fff', ml: 4 }}>
                        {formatDate(tournament.endDate)}
                      </Typography>
                    </Box>

                    <Divider
                      sx={{ my: 2, borderColor: 'rgba(0, 255, 157, 0.2)' }}
                    />

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <People sx={{ color: '#00ff9d', mr: 1 }} />
                        <Typography sx={{ color: '#888', fontWeight: 600 }}>
                          Participants:
                        </Typography>
                      </Box>
                      <Typography sx={{ color: '#fff', ml: 4 }}>
                        {tournament.participantCount || 0}/
                        {tournament.maxParticipants}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <AttachMoney sx={{ color: '#00ff9d', mr: 1 }} />
                        <Typography sx={{ color: '#888', fontWeight: 600 }}>
                          Entry Fee:
                        </Typography>
                      </Box>
                      <Typography sx={{ color: '#fff', ml: 4 }}>
                        {tournament.entryFee} coins
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                      >
                        <EmojiEvents sx={{ color: '#00ff9d', mr: 1 }} />
                        <Typography sx={{ color: '#888', fontWeight: 600 }}>
                          Prize Pool:
                        </Typography>
                      </Box>
                      <Typography sx={{ color: '#fff', ml: 4 }}>
                        {tournament.prizePool} coins
                      </Typography>
                    </Box>

                    {tournament.venue && (
                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <LocationOn sx={{ color: '#00ff9d', mr: 1 }} />
                          <Typography sx={{ color: '#888', fontWeight: 600 }}>
                            Venue:
                          </Typography>
                        </Box>
                        <Typography sx={{ color: '#fff', ml: 4 }}>
                          {tournament.venue.name}
                        </Typography>
                      </Box>
                    )}

                    {tournament.rules && (
                      <Box sx={{ mt: 3 }}>
                        <Typography
                          sx={{ color: '#888', fontWeight: 600, mb: 1 }}
                        >
                          Rules:
                        </Typography>
                        <Typography sx={{ color: '#fff', fontSize: '0.9rem' }}>
                          {tournament.rules}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Tournament Bracket */}
              <Grid item xs={12} md={8}>
                <Card sx={cyberCardStyle}>
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{ ...neonTextStyle, mb: 3, fontSize: '1.2rem' }}
                    >
                      Tournament Bracket
                    </Typography>

                    {bracket ? (
                      <TournamentBracket
                        bracket={bracket}
                        onReportResult={handleReportResult}
                      />
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: '300px',
                          background: 'rgba(26, 26, 46, 0.6)',
                          border: '1px solid rgba(0, 255, 255, 0.2)',
                          borderRadius: 3,
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: '#888888',
                            textAlign: 'center',
                            background:
                              'linear-gradient(45deg, #00ffff, #ff00ff)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          Bracket information not available
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        ) : (
          <Alert
            severity="info"
            sx={{
              background: 'rgba(0, 168, 255, 0.1)',
              border: '1px solid #00a8ff',
              color: '#00a8ff',
              '& .MuiAlert-icon': { color: '#00a8ff' },
            }}
          >
            Tournament not found
          </Alert>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={confirmOpen}
          onClose={() => (!isDeleting ? setConfirmOpen(false) : undefined)}
        >
          <DialogTitle>Delete Tournament</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this tournament? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              startIcon={<DeleteForever />}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Match Result Dialog */}
        <MatchResultDialog
          open={isDialogOpen}
          match={selectedMatch}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitResult}
        />

        {/* Success Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
          ContentProps={{
            sx: {
              background: 'rgba(0, 255, 157, 0.9)',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 255, 157, 0.4)',
            },
          }}
        />
      </Container>
    </PageBackground>
  );
};

export default TournamentDetailPage;
