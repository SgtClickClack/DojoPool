import { Add, FilterList } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
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
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  entryFee?: number;
  prizePool?: number;
  status: 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
        (tournament.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ??
          false);

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
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Box sx={{ flex: '1 1 300px' }}>
            <TextField
              fullWidth
              label="Search tournaments"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or description..."
            />
          </Box>

          <Box sx={{ flex: '1 1 220px' }}>
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
          </Box>

          <Box sx={{ flex: '1 1 220px' }}>
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
          </Box>

          <Box sx={{ flex: '1 1 160px' }}>
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
          </Box>
        </Box>
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
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredTournaments.map((tournament) => (
            <Box key={tournament.id}>
              <TournamentCard
                {...tournament}
                onJoin={onJoinTournament}
                onView={onViewTournament}
              />
            </Box>
          ))}
        </Box>
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
