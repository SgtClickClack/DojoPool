import TournamentList from '@/components/Tournament/TournamentList';
import { useAuth } from '@/hooks/useAuth';
import { type Tournament, getTournaments } from '@/services/APIService';
import { Add as AddIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';

const TournamentDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTournament = () => {
    router.push('/tournaments/create');
  };

  const handleViewTournament = (tournamentId: string) => {
    router.push(`/tournaments/${tournamentId}`);
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTournaments();
      setTournaments(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load tournaments';
      setError(message);
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading tournaments...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" color="error" gutterBottom>
          Error Loading Tournaments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error}
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={fetchTournaments}>
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h3" gutterBottom>
            Tournament Hub
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Compete, Challenge, Conquer
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateTournament}
          >
            Create Tournament
          </Button>
        )}
      </Box>

      {/* Tournament List */}
      <TournamentList
        tournaments={tournaments}
        onViewTournament={handleViewTournament}
        onCreateTournament={handleCreateTournament}
      />
    </Container>
  );
};

export default TournamentDashboard;
