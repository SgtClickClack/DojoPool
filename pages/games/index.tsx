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
  TextField,
  CircularProgress,
  Pagination,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  SportsEsports as GameIcon,
  Search as SearchIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Place as PlaceIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';

interface Game {
  id: string;
  game_type: 'casual' | 'ranked' | 'tournament';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  player1: {
    id: string;
    username: string;
    rating: number;
  };
  player2: {
    id: string;
    username: string;
    rating: number;
  };
  venue_name: string;
  start_time: string;
  score_player1: number;
  score_player2: number;
  winner_id?: string;
}

const ITEMS_PER_PAGE = 9;

export default function Games() {
  const { user } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
  });

  useEffect(() => {
    fetchGames();
  }, [page, search, filters]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: ((page - 1) * ITEMS_PER_PAGE).toString(),
        search: search,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.type !== 'all' && { type: filters.type }),
      });

      const response = await fetch(`/api/games/list?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch games');
      }

      setGames(data.games);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleFilterChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name as string]: value,
    }));
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getGameTypeIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <TrophyIcon />;
      default:
        return <GameIcon />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Games
        </Typography>
        <Typography color="textSecondary" paragraph>
          Browse and join pool games in your area.
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search games by player or venue..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filters.status}
              label="Status"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={filters.type}
              label="Type"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="casual">Casual</MenuItem>
              <MenuItem value="ranked">Ranked</MenuItem>
              <MenuItem value="tournament">Tournament</MenuItem>
            </Select>
          </FormControl>
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
          {/* Game Cards */}
          <Grid container spacing={3}>
            {games.map((game) => (
              <Grid item xs={12} sm={6} md={4} key={game.id}>
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getGameTypeIcon(game.game_type)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)}
                        </Typography>
                      </Box>
                      <Chip
                        label={game.status}
                        color={getStatusColor(game.status) as any}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon sx={{ mr: 1 }} color="action" />
                        <Typography>
                          {game.player1.username} vs {game.player2.username}
                        </Typography>
                      </Box>
                      {game.status === 'completed' && (
                        <Typography variant="body2" color="textSecondary">
                          Score: {game.score_player1} - {game.score_player2}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PlaceIcon sx={{ mr: 1 }} color="action" />
                      <Typography variant="body2">{game.venue_name}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimerIcon sx={{ mr: 1 }} color="action" />
                      <Typography variant="body2">{formatDate(game.start_time)}</Typography>
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => router.push(`/games/${game.id}`)}
                    >
                      {game.status === 'scheduled' ? 'Join Game' : 'View Details'}
                    </Button>
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

          {games.length === 0 && (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <GameIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No games found
              </Typography>
              <Typography color="textSecondary">
                Try adjusting your search or filters
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/games/create')}
                sx={{ mt: 2 }}
              >
                Create New Game
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Create Game Button */}
      {user && games.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: 32, right: 32 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => router.push('/games/create')}
            startIcon={<GameIcon />}
          >
            Create Game
          </Button>
        </Box>
      )}
    </Container>
  );
} 