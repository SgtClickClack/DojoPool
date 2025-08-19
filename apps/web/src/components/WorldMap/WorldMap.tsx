import { FilterList, List, Map, MyLocation, Search } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import DojoMarker from './DojoMarker';

interface DojoLocation {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  currentController?: {
    name: string;
    avatarUrl?: string;
    level: number;
  };
  memberCount: number;
  maxCapacity: number;
  status: 'available' | 'occupied' | 'at-war' | 'maintenance';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  specialFeatures: string[];
}

interface WorldMapProps {
  dojos: DojoLocation[];
  onChallengeDojo?: (dojoId: string) => void;
  onViewDojo?: (dojoId: string) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({
  dojos,
  onChallengeDojo,
  onViewDojo,
  onLocationUpdate,
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Filter dojos based on search and filters
  const filteredDojos = useMemo(() => {
    return dojos.filter((dojo) => {
      const matchesSearch =
        dojo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dojo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dojo.location.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || dojo.status === statusFilter;
      const matchesDifficulty =
        difficultyFilter === 'all' || dojo.difficulty === difficultyFilter;
      const matchesLocation =
        locationFilter === 'all' ||
        dojo.location.address.includes(locationFilter);

      return (
        matchesSearch && matchesStatus && matchesDifficulty && matchesLocation
      );
    });
  }, [dojos, searchTerm, statusFilter, difficultyFilter, locationFilter]);

  // Get unique locations and statuses for filters
  const uniqueLocations = useMemo(() => {
    const locations = new Set(
      dojos.map((d) => d.location.address.split(',')[0].trim())
    );
    return Array.from(locations).sort();
  }, [dojos]);

  const getStatusCount = (status: string) => {
    return dojos.filter((d) => status === 'all' || d.status === status).length;
  };

  const getDifficultyCount = (difficulty: string) => {
    return dojos.filter(
      (d) => difficulty === 'all' || d.difficulty === difficulty
    ).length;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDifficultyFilter('all');
    setLocationFilter('all');
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationUpdate?.(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
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
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            World Map
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore nearby Dojos and challenge rivals in your area
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Use Current Location">
            <IconButton onClick={handleUseCurrentLocation} color="primary">
              <MyLocation />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle View Mode">
            <IconButton
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              color="primary"
            >
              {viewMode === 'map' ? <List /> : <Map />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Dojos"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, description, or address..."
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'action.active' }} />
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All ({getStatusCount('all')})</MenuItem>
                <MenuItem value="available">
                  Available ({getStatusCount('available')})
                </MenuItem>
                <MenuItem value="occupied">
                  Occupied ({getStatusCount('occupied')})
                </MenuItem>
                <MenuItem value="at-war">
                  At War ({getStatusCount('at-war')})
                </MenuItem>
                <MenuItem value="maintenance">
                  Maintenance ({getStatusCount('maintenance')})
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficultyFilter}
                label="Difficulty"
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <MenuItem value="all">
                  All ({getDifficultyCount('all')})
                </MenuItem>
                <MenuItem value="beginner">
                  Beginner ({getDifficultyCount('beginner')})
                </MenuItem>
                <MenuItem value="intermediate">
                  Intermediate ({getDifficultyCount('intermediate')})
                </MenuItem>
                <MenuItem value="advanced">
                  Advanced ({getDifficultyCount('advanced')})
                </MenuItem>
                <MenuItem value="expert">
                  Expert ({getDifficultyCount('expert')})
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
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
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results count */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredDojos.length} of {dojos.length} Dojos
        </Typography>
      </Box>

      {/* Map/List View */}
      {viewMode === 'map' ? (
        <Paper sx={{ p: 2, minHeight: 600, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ py: 20 }}>
            🗺️ Interactive Map View
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Google Maps integration will be implemented here with Dojo markers
          </Typography>
        </Paper>
      ) : (
        /* List View */
        <Grid container spacing={3}>
          {filteredDojos.length > 0 ? (
            filteredDojos.map((dojo) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={dojo.id}>
                <DojoMarker
                  {...dojo}
                  onChallenge={onChallengeDojo}
                  onView={onViewDojo}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Map sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Dojos found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search criteria or filters
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default WorldMap;
