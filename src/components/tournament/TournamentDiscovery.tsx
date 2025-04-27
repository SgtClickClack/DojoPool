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
} from '@mui/material';
import { Tournament, TournamentState, TournamentType } from '../../types/tournament';
import { useAuth } from '../../hooks/useAuth';
import { getTournaments } from '../../services/tournament';
import { TournamentRegistration } from './TournamentRegistration';

interface TournamentCardProps {
  tournament: Tournament;
  onRegister: (tournament: Tournament) => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onRegister }) => {
  const theme = useTheme();
  
  const getStateColor = (state: TournamentState) => {
    switch (state) {
      case TournamentState.REGISTRATION:
        return theme.palette.success.main;
      case TournamentState.IN_PROGRESS:
        return theme.palette.warning.main;
      case TournamentState.COMPLETED:
        return theme.palette.error.main;
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
        background: theme.palette.background.paper,
        borderRadius: 2,
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {tournament.name}
        </Typography>
        <Box display="flex" gap={1} mb={2}>
          <Chip 
            label={tournament.type} 
            size="small" 
            color="primary"
          />
          <Chip 
            label={tournament.state} 
            size="small"
            sx={{ backgroundColor: getStateColor(tournament.state) }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Start Date: {new Date(tournament.startDate).toLocaleDateString()}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Entry Fee: ${tournament.entryFee}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Participants: {tournament.maxParticipants}
        </Typography>
      </CardContent>
      <Box p={2} pt={0}>
        <Button 
          variant="contained" 
          fullWidth
          onClick={() => onRegister(tournament)}
          disabled={tournament.state !== TournamentState.REGISTRATION}
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
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const { user } = useAuth();

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

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || tournament.type === typeFilter;
    const matchesState = !stateFilter || tournament.state === stateFilter;
    return matchesSearch && matchesType && matchesState;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Discover Tournaments
      </Typography>
      
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search Tournaments"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Tournament Type</InputLabel>
          <Select
            value={typeFilter}
            label="Tournament Type"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            {Object.values(TournamentType).map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={stateFilter}
            label="Status"
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.values(TournamentState).map((state) => (
              <MenuItem key={state} value={state}>{state}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredTournaments.map((tournament) => (
          <Grid item key={tournament.id} xs={12} sm={6} md={4}>
            <TournamentCard
              tournament={tournament}
              onRegister={handleRegisterClick}
            />
          </Grid>
        ))}
      </Grid>

      {filteredTournaments.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No tournaments found matching your criteria
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