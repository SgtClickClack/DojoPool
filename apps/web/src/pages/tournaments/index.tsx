import ProtectedRoute from '@/components/Common/ProtectedRoute';
import {
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  InputAdornment,
  Pagination,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  status:
    | 'UPCOMING'
    | 'REGISTRATION_OPEN'
    | 'REGISTRATION_CLOSED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';
  startTime: string;
  endTime?: string;
  maxPlayers: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  format: string;
  venue?: {
    id: string;
    name: string;
    lat: number;
    lng: number;
  };
  event?: {
    content: {
      title: string;
      description?: string;
    };
  };
  _count?: {
    participants: number;
    matches: number;
  };
}

const TournamentCard: React.FC<{ tournament: Tournament }> = ({
  tournament,
}) => {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
      case 'REGISTRATION_OPEN':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'Upcoming';
      case 'REGISTRATION_OPEN':
        return 'Registration Open';
      case 'REGISTRATION_CLOSED':
        return 'Registration Closed';
      case 'IN_PROGRESS':
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = () => {
    router.push(`/tournaments/${tournament.id}`);
  };

  const isRegistrationOpen =
    tournament.status === 'UPCOMING' ||
    tournament.status === 'REGISTRATION_OPEN';
  const isFull = tournament.currentParticipants >= tournament.maxPlayers;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
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
            label={getStatusText(tournament.status)}
            color={getStatusColor(tournament.status) as any}
            size="small"
          />
        </Box>

        {tournament.description && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            {tournament.description}
          </Typography>
        )}

        <Box display="flex" flexDirection="column" gap={1} mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {formatDate(tournament.startTime)}
            </Typography>
          </Box>

          {tournament.venue && (
            <Box display="flex" alignItems="center" gap={1}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2">{tournament.venue.name}</Typography>
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={1}>
            <PeopleIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {tournament.currentParticipants}/{tournament.maxPlayers} players
            </Typography>
          </Box>

          {tournament.entryFee > 0 && (
            <Box display="flex" alignItems="center" gap={1}>
              <MoneyIcon fontSize="small" color="action" />
              <Typography variant="body2">
                Entry: {tournament.entryFee} DojoCoins
              </Typography>
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={1}>
            <TrophyIcon fontSize="small" color="action" />
            <Typography variant="body2">
              Prize: {tournament.prizePool} DojoCoins
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={tournament.format.replace('_', ' ')}
            size="small"
            variant="outlined"
          />
          {tournament.event && (
            <Chip
              label="Event Linked"
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          variant="outlined"
          onClick={handleViewDetails}
          fullWidth
        >
          View Details
        </Button>
        {isRegistrationOpen && !isFull && (
          <Button
            size="small"
            variant="contained"
            onClick={handleViewDetails}
            fullWidth
          >
            Join Tournament
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const TournamentListPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTournaments = async (status?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (status && status !== 'ALL') {
        params.append('status', status);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/tournaments?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tournaments');
      }

      const data = await response.json();
      setTournaments(data.tournaments || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tournaments'
      );
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const status =
      activeTab === 0
        ? undefined
        : activeTab === 1
          ? 'UPCOMING'
          : activeTab === 2
            ? 'IN_PROGRESS'
            : 'COMPLETED';
    fetchTournaments(status);
  }, [activeTab, currentPage, searchQuery]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setCurrentPage(1);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
  };

  const tabLabels = ['All Tournaments', 'Upcoming', 'In Progress', 'Completed'];

  return (
    <ProtectedRoute>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            Tournaments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Compete in organized tournaments and climb the rankings
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="tournament status tabs"
          >
            {tabLabels.map((label, index) => (
              <Tab key={index} label={label} />
            ))}
          </Tabs>
        </Box>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <TextField
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300 }}
          />

          <Typography variant="body2" color="text.secondary">
            {tournaments.length} tournaments found
          </Typography>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" height={32} width="80%" />
                    <Skeleton variant="text" height={20} width="60%" />
                    <Skeleton variant="text" height={20} width="40%" />
                    <Skeleton variant="rectangular" height={80} />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="rectangular" height={36} width="100%" />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : tournaments.length === 0 ? (
          <Box textAlign="center" py={8}>
            <TrophyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No tournaments found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later for upcoming tournaments
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {tournaments.map((tournament) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={tournament.id}>
                  <TournamentCard tournament={tournament} />
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </ProtectedRoute>
  );
};

export default TournamentListPage;
