import { Add as AddIcon } from '@mui/icons-material';
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
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import CreateTournamentForm from '../components/tournament/CreateTournamentForm';

type TournamentStatus = 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

type Tournament = {
  id: string;
  name: string;
  status: TournamentStatus;
  venue: {
    name: string;
  };
  startDate: string;
  endDate: string;
  format: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
};

const TournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('http://localhost:8080/v1/tournaments');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTournaments(data);
    } catch (err) {
      console.error('Failed to fetch tournaments:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleCreateSuccess = () => {
    // Refresh the tournament list after successful creation
    fetchTournaments();
  };

  const getStatusChipColor = (status: TournamentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'OPEN':
        return 'primary';
      case 'COMPLETED':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <>
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Tournaments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage pool tournaments across all dojos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreateFormOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #00ff9d 0%, #00a8ff 100%)',
            color: '#000',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            px: 3,
            py: 1.5,
            borderRadius: '8px',
            '&:hover': {
              background: 'linear-gradient(135deg, #00a8ff 0%, #00ff9d 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
            },
          }}
        >
          Create Tournament
        </Button>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error fetching tournaments: {error}
        </Alert>
      ) : tournaments.length === 0 ? (
        <Grid container justifyContent="center">
          <Grid item xs={12} md={6}>
            <Box textAlign="center" py={5}>
              <Typography
                variant="h1"
                color="text.secondary"
                sx={{ fontSize: '4rem' }}
              >
                🏆
              </Typography>
              <Typography
                variant="h4"
                component="h3"
                gutterBottom
                sx={{ mt: 3 }}
              >
                No Tournaments Found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Check back later for upcoming tournaments.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {tournaments.map((tournament) => (
            <Grid key={tournament.id} item xs={12} sm={6} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <Typography variant="h6" component="h2" gutterBottom>
                      {tournament.name}
                    </Typography>
                    <Chip
                      label={tournament.status}
                      color={getStatusChipColor(tournament.status)}
                      size="small"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    🏢 {tournament.venue?.name || 'Unknown Venue'}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    📅 {new Date(tournament.startDate).toLocaleDateString()}
                  </Typography>

                  {tournament.entryFee && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      💰 Entry: {tournament.entryFee} coins
                    </Typography>
                  )}

                  {tournament.prizePool && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      🏆 Prize Pool: {tournament.prizePool} coins
                    </Typography>
                  )}

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    👥 {tournament.currentParticipants || 0}/{tournament.maxParticipants} participants
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>

    <CreateTournamentForm
      open={isCreateFormOpen}
      onClose={() => setIsCreateFormOpen(false)}
      onSuccess={handleCreateSuccess}
    />
    </>
  );
};

export default TournamentsPage;
