import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Pagination,
  Alert,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  People as PlayersIcon,
  Place as VenueIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';

interface Tournament {
  id: string;
  name: string;
  venue_name: string;
  start_date: string;
  end_date: string | null;
  max_players: number;
  current_players: number;
  status: 'registration_open' | 'in_progress' | 'completed';
}

const ITEMS_PER_PAGE = 9;

export default function Tournaments() {
  const { user } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    venueId: '',
  });

  useEffect(() => {
    fetchTournaments();
  }, [page, filters]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: ((page - 1) * ITEMS_PER_PAGE).toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.venueId && { venueId: filters.venueId }),
      });

      const response = await fetch(`/api/tournament/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tournaments');
      }

      setTournaments(data.tournaments);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (tournamentId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/tournament/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tournamentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join tournament');
      }

      // Refresh tournaments list
      fetchTournaments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join tournament');
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Tournaments
        </Typography>
        <Typography color="textSecondary" paragraph>
          Join competitive tournaments and climb the rankings in your local venues.
        </Typography>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Search Tournaments"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="registration_open">Registration Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => router.push('/tournaments/create')}
            sx={{ height: '56px' }}
          >
            Create Tournament
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Tournament Cards */}
          <Grid container spacing={3}>
            {tournaments.map((tournament) => (
              <Grid item xs={12} sm={6} md={4} key={tournament.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {tournament.name}
                      </Typography>
                      <Chip
                        label={getStatusText(tournament.status)}
                        color={getStatusColor(tournament.status) as any}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <VenueIcon sx={{ mr: 1 }} color="action" />
                      <Typography variant="body2">{tournament.venue_name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <DateIcon sx={{ mr: 1 }} color="action" />
                      <Typography variant="body2">
                        {new Date(tournament.start_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PlayersIcon sx={{ mr: 1 }} color="action" />
                      <Typography variant="body2">
                        {tournament.current_players} / {tournament.max_players} players
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => router.push(`/tournaments/${tournament.id}`)}
                    >
                      View Details
                    </Button>
                    {tournament.status === 'registration_open' && (
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleJoinTournament(tournament.id)}
                      >
                        Join Tournament
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}

          {tournaments.length === 0 && (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <TrophyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No tournaments found
              </Typography>
              <Typography color="textSecondary">
                Try adjusting your filters or create a new tournament
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
} 