import { Add, FilterList } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import TournamentCard from './TournamentCard';

interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizePool: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}

interface TournamentListProps {
  tournaments: Tournament[];
  onJoinTournament?: (tournamentId: string) => void;
  onViewTournament?: (tournamentId: string) => void;
  onCreateTournament?: () => void;
}

const TournamentList: React.FC<TournamentListProps> = ({
  tournaments,
  onJoinTournament,
  onViewTournament,
  onCreateTournament,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((tournament) => {
      const matchesSearch =
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || tournament.status === statusFilter;

      const matchesLocation =
        locationFilter === 'all' || tournament.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [tournaments, searchTerm, statusFilter, locationFilter]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set(tournaments.map((t) => t.location));
    return Array.from(locations).sort();
  }, [tournaments]);

  const getStatusCount = (status: string) => {
    return tournaments.filter((t) => status === 'all' || t.status === status)
      .length;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Tournaments
        </Typography>
        {onCreateTournament && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateTournament}
          >
            Create Tournament
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search tournaments"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All ({getStatusCount('all')})</MenuItem>
                <MenuItem value="upcoming">
                  Upcoming ({getStatusCount('upcoming')})
                </MenuItem>
                <MenuItem value="active">
                  Active ({getStatusCount('active')})
                </MenuItem>
                <MenuItem value="completed">
                  Completed ({getStatusCount('completed')})
                </MenuItem>
                <MenuItem value="cancelled">
                  Cancelled ({getStatusCount('cancelled')})
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationFilter}
                label="Location"
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <MenuItem value="all">All Locations</MenuItem>
                {uniqueLocations.map((location) => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setLocationFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Results count */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredTournaments.length} of {tournaments.length}{' '}
          tournaments
        </Typography>
      </Box>

      {/* Tournament grid */}
      {filteredTournaments.length > 0 ? (
        <Grid container spacing={3}>
          {filteredTournaments.map((tournament) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={tournament.id}>
              <TournamentCard
                {...tournament}
                onJoin={onJoinTournament}
                onView={onViewTournament}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tournaments found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TournamentList;
