import React, { useState } from 'react';
// Import the hook and necessary UI components (assuming Material UI)
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
// Import Link from react-router-dom
import { Link as RouterLink } from 'react-router-dom';
import { useTournaments } from '@/frontend/hooks/useTournaments';
import { useAuth } from '../../hooks/useAuth';
import { joinTournament } from '@/frontend/api/tournaments';
import { type Tournament, TournamentStatus } from '@/types/tournament'; // Import the type if needed for rendering logic

// Helper function to determine Chip color based on status
const getStatusColor = (
  status: TournamentStatus
): 'success' | 'warning' | 'info' | 'error' | 'default' => {
  switch (status) {
    case TournamentStatus.OPEN:
      return 'success';
    case TournamentStatus.ACTIVE:
      return 'info';
    case TournamentStatus.UPCOMING:
    case TournamentStatus.CLOSED: // Grouping similar statuses
      return 'warning';
    case TournamentStatus.FULL:
    case TournamentStatus.CANCELLED:
      return 'error';
    case TournamentStatus.COMPLETED:
      return 'default';
    default:
      // Fallback for any unexpected status
      return 'default';
  }
};

const TournamentList: React.FC = () => {
  const { tournaments, loading, error } = useTournaments();
  const { isAuthenticated } = useAuth();
  const [registrationStatus, setRegistrationStatus] = useState<{
    [key: string]: { loading: boolean; error: string | null };
  }>({});

  const handleRegister = async (tournamentId: string) => {
    if (!isAuthenticated) {
      alert('Please log in to register for tournaments.');
      return;
    }

    setRegistrationStatus((prev) => ({
      ...prev,
      [tournamentId]: { loading: true, error: null },
    }));
    try {
      await joinTournament(tournamentId);
      alert('Successfully registered!');
      setRegistrationStatus((prev) => ({
        ...prev,
        [tournamentId]: { loading: false, error: null },
      }));
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to register.';
      setRegistrationStatus((prev) => ({
        ...prev,
        [tournamentId]: { loading: false, error: errorMessage },
      }));
      alert(`Registration failed: ${errorMessage}`);
    }
  };

  const renderActionButton = (tournament: Tournament) => {
    const regStatus = registrationStatus[tournament.id] || {
      loading: false,
      error: null,
    };

    switch (tournament.status) {
      case TournamentStatus.OPEN:
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleRegister(tournament.id)}
            disabled={!isAuthenticated || regStatus.loading}
            sx={{ ml: 1 }}
          >
            {regStatus.loading ? <CircularProgress size={20} /> : 'Register'}
          </Button>
        );
      case TournamentStatus.FULL:
        return (
          <Button variant="outlined" size="small" disabled sx={{ ml: 1 }}>
            Full
          </Button>
        );
      case TournamentStatus.ACTIVE:
      case TournamentStatus.COMPLETED:
      case TournamentStatus.CLOSED:
        return null;
      case TournamentStatus.CANCELLED:
        return (
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled
            sx={{ ml: 1 }}
          >
            Cancelled
          </Button>
        );
      case TournamentStatus.UPCOMING:
        return (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleRegister(tournament.id)}
            disabled={!isAuthenticated || regStatus.loading}
            sx={{ ml: 1 }}
          >
            {regStatus.loading ? <CircularProgress size={20} /> : 'Register'}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h4" gutterBottom>
        Available Tournaments
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error.message ||
            'Failed to load tournaments. Please try again later.'}
        </Alert>
      )}

      {!loading && !error && (
        <List>
          {tournaments.length === 0 ? (
            <ListItem>
              <ListItemText primary="No upcoming tournaments found." />
            </ListItem>
          ) : (
            tournaments.map((tournament: Tournament) => (
              <ListItem
                key={tournament.id}
                divider
                component={RouterLink}
                to={`/tournaments/${tournament.id}`}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ListItemText
                  primary={`${tournament.name}`}
                  secondary={`Format: ${tournament.format} | Starts: ${new Date(tournament.startDate).toLocaleDateString()} | Players: ${tournament.participants}/${tournament.maxParticipants}`}
                  sx={{ flexGrow: 1 }}
                />
                <Chip
                  label={tournament.status}
                  color={getStatusColor(tournament.status)}
                  size="small"
                  sx={{ ml: 2, mr: 1 }}
                />
                {renderActionButton(tournament)}
              </ListItem>
            ))
          )}
        </List>
      )}
    </Paper>
  );
};

export default TournamentList;
