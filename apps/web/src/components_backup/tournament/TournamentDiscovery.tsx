import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  SportsEsports as GameIcon,
} from '@mui/icons-material';
import {
  type Tournament,
  TournamentStatus,
  TournamentFormat,
} from '../../types/tournament';
import { useAuth } from '../../hooks/useAuth';
import { getTournaments } from '../../services/tournament/tournament';
import { TournamentRegistration } from './TournamentRegistration';
import '../styles/tournament.scss';

interface TournamentCardProps {
  tournament: Tournament;
  onRegister: (tournament: Tournament) => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onRegister,
}) => {
  const theme = useTheme();

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  const getStateColor = (state: TournamentStatus) => {
    switch (state) {
      case TournamentStatus.OPEN:
        return neonColors.primary;
      case TournamentStatus.ACTIVE:
        return neonColors.warning;
      case TournamentStatus.COMPLETED:
        return neonColors.error;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
        border: `2px solid ${alpha(neonColors.primary, 0.3)}`,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: `0 0 30px ${alpha(neonColors.secondary, 0.5)}`,
          transform: 'translateY(-5px) scale(1.02)',
          border: `2px solid ${alpha(neonColors.secondary, 0.5)}`,
        },
        animation: 'fadeIn 0.5s ease-in',
        '@keyframes fadeIn': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: neonColors.info,
            textShadow: `0 0 10px ${neonColors.info}`,
            fontWeight: 'bold',
          }}
        >
          {tournament.name}
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <Chip
            icon={<GameIcon />}
            label={tournament.format}
            size="small"
            sx={{
              background: alpha(neonColors.primary, 0.2),
              color: neonColors.primary,
              border: `1px solid ${neonColors.primary}`,
              '& .MuiChip-icon': { color: neonColors.primary },
            }}
          />
          <Chip
            label={tournament.status}
            size="small"
            sx={{
              backgroundColor: alpha(getStateColor(tournament.status), 0.2),
              color: getStateColor(tournament.status),
              border: `1px solid ${getStateColor(tournament.status)}`,
              fontWeight: 'bold',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalendarIcon
            sx={{ fontSize: 16, mr: 1, color: neonColors.warning }}
          />
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {new Date(tournament.startDate).toLocaleDateString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationIcon
            sx={{ fontSize: 16, mr: 1, color: neonColors.warning }}
          />
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {(tournament as any).venue || 'Online'}
          </Typography>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: neonColors.warning,
            fontWeight: 'bold',
            textShadow: `0 0 5px ${neonColors.warning}`,
          }}
        >
          Entry Fee: ${tournament.entryFee}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Participants: {(tournament as any).currentParticipants || 0}/
          {tournament.maxParticipants}
        </Typography>
      </CardContent>
      <Box p={2} pt={0}>
        <Button
          variant="contained"
          fullWidth
          onClick={() => onRegister(tournament)}
          disabled={tournament.status !== TournamentStatus.OPEN}
          sx={{
            background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.info} 90%)`,
            boxShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
            fontWeight: 'bold',
            '&:hover': {
              background: `linear-gradient(45deg, ${neonColors.primary} 10%, ${neonColors.info} 100%)`,
              boxShadow: `0 0 30px ${alpha(neonColors.primary, 0.7)}`,
            },
            '&:disabled': {
              background: theme.palette.action.disabledBackground,
            },
          }}
        >
          Register Now
        </Button>
      </Box>
    </Card>
  );
};

export const TournamentDiscovery: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [venueFilter, setVenueFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const { user } = useAuth();
  const theme = useTheme();

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
  };

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await getTournaments();
      setTournaments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tournaments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();

    // Set up real-time updates (simulated with polling)
    const interval = setInterval(() => {
      loadTournaments();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRegisterClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setRegistrationOpen(true);
  };

  const handleRegistrationClose = () => {
    setRegistrationOpen(false);
    setSelectedTournament(null);
  };

  const handleRegistrationSuccess = () => {
    // Refresh tournaments list to update registration status
    loadTournaments();
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || tournament.format === typeFilter;
    const matchesState = !stateFilter || tournament.status === stateFilter;
    const matchesVenue =
      !venueFilter ||
      (tournament as any).venue
        ?.toLowerCase()
        .includes(venueFilter.toLowerCase());
    const matchesDate =
      !dateFilter ||
      new Date(tournament.startDate).toISOString().split('T')[0] >= dateFilter;
    return (
      matchesSearch &&
      matchesType &&
      matchesState &&
      matchesVenue &&
      matchesDate
    );
  });

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress
          size={60}
          sx={{
            color: neonColors.primary,
            filter: `drop-shadow(0 0 10px ${neonColors.primary})`,
          }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography
          color="error"
          sx={{ textShadow: `0 0 10px ${neonColors.error}` }}
        >
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          background: `linear-gradient(45deg, ${neonColors.primary} 30%, ${neonColors.secondary} 90%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: `0 0 20px ${alpha(neonColors.primary, 0.5)}`,
          mb: 4,
          animation: 'glow 2s ease-in-out infinite alternate',
          '@keyframes glow': {
            '0%': { filter: `drop-shadow(0 0 10px ${neonColors.primary})` },
            '100%': { filter: `drop-shadow(0 0 20px ${neonColors.secondary})` },
          },
        }}
      >
        Discover Tournaments
      </Typography>

      <Box
        sx={{
          mb: 4,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          p: 3,
          background: alpha(theme.palette.background.paper, 0.5),
          borderRadius: 2,
          border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <TextField
          label="Search Tournaments"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            flexGrow: 1,
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: neonColors.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: neonColors.primary,
                boxShadow: `0 0 10px ${alpha(neonColors.primary, 0.5)}`,
              },
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: neonColors.primary,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: neonColors.primary }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Tournament Type</InputLabel>
          <Select
            value={typeFilter}
            label="Tournament Type"
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: neonColors.primary,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: neonColors.primary,
                boxShadow: `0 0 10px ${alpha(neonColors.primary, 0.5)}`,
              },
            }}
          >
            <MenuItem value="">All Types</MenuItem>
            {Object.values(TournamentFormat).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={stateFilter}
            label="Status"
            onChange={(e) => setStateFilter(e.target.value)}
            sx={{
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: neonColors.primary,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: neonColors.primary,
                boxShadow: `0 0 10px ${alpha(neonColors.primary, 0.5)}`,
              },
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.values(TournamentStatus).map((state) => (
              <MenuItem key={state} value={state}>
                {state}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Venue"
          variant="outlined"
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          sx={{
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: neonColors.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: neonColors.primary,
                boxShadow: `0 0 10px ${alpha(neonColors.primary, 0.5)}`,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationIcon sx={{ color: neonColors.primary }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Start Date"
          type="date"
          variant="outlined"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          sx={{
            minWidth: 200,
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: neonColors.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: neonColors.primary,
                boxShadow: `0 0 10px ${alpha(neonColors.primary, 0.5)}`,
              },
            },
          }}
          InputLabelProps={{
            shrink: true,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarIcon sx={{ color: neonColors.primary }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredTournaments.map((tournament, index) => (
          <Grid
            item
            key={tournament.id}
            xs={12}
            sm={6}
            md={4}
            sx={{
              animation: `slideIn 0.5s ease-out ${index * 0.1}s`,
              '@keyframes slideIn': {
                '0%': { opacity: 0, transform: 'translateX(-20px)' },
                '100%': { opacity: 1, transform: 'translateX(0)' },
              },
            }}
          >
            <TournamentCard
              tournament={tournament}
              onRegister={handleRegisterClick}
            />
          </Grid>
        ))}
      </Grid>

      {filteredTournaments.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography
            variant="h5"
            sx={{
              color: neonColors.secondary,
              textShadow: `0 0 10px ${neonColors.secondary}`,
            }}
          >
            No tournaments found matching your criteria
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Try adjusting your filters or check back later for new tournaments!
          </Typography>
        </Box>
      )}

      {selectedTournament && (
        <TournamentRegistration
          tournament={selectedTournament}
          open={registrationOpen}
          onClose={handleRegistrationClose}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </Box>
  );
};
