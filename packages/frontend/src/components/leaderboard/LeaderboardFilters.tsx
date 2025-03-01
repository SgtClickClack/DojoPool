import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Typography,
  Chip,
  Divider,
  useTheme,
  SelectChangeEvent,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import leaderboardService from '../../services/leaderboardService';

export interface LeaderboardFilterValue {
  timeFrame: 'daily' | 'weekly' | 'monthly' | 'allTime';
  gameType?: string;
  venueId?: string;
  searchTerm?: string;
  skillLevel?: number | null;
}

interface LeaderboardFiltersProps {
  initialFilters?: Partial<LeaderboardFilterValue>;
  onFiltersChange: (filters: LeaderboardFilterValue) => void;
  showGameTypeFilter?: boolean;
  showVenueFilter?: boolean;
  showSkillLevelFilter?: boolean;
  showSearchFilter?: boolean;
  compact?: boolean;
}

export const LeaderboardFilters: React.FC<LeaderboardFiltersProps> = ({
  initialFilters,
  onFiltersChange,
  showGameTypeFilter = true,
  showVenueFilter = true,
  showSkillLevelFilter = true,
  showSearchFilter = true,
  compact = false,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(!compact);
  
  // Filter values
  const [filters, setFilters] = useState<LeaderboardFilterValue>({
    timeFrame: initialFilters?.timeFrame || 'weekly',
    gameType: initialFilters?.gameType || undefined,
    venueId: initialFilters?.venueId || undefined,
    searchTerm: initialFilters?.searchTerm || undefined,
    skillLevel: initialFilters?.skillLevel || null,
  });
  
  // Filter options from API
  const [gameTypes, setGameTypes] = useState<Array<{ id: string, name: string }>>([]);
  const [venues, setVenues] = useState<Array<{ id: string, name: string, location: string }>>([]);
  const [loading, setLoading] = useState(false);
  
  // Load filter options from API
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        const options = await leaderboardService.getFilterOptions();
        setGameTypes(options.gameTypes || []);
        setVenues(options.venues || []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (showGameTypeFilter || showVenueFilter) {
      loadFilterOptions();
    }
  }, [showGameTypeFilter, showVenueFilter]);
  
  // Update parent component when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);
  
  // Handle filter changes
  const handleTimeFrameChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as 'daily' | 'weekly' | 'monthly' | 'allTime';
    setFilters(prev => ({ ...prev, timeFrame: value }));
  };
  
  const handleGameTypeChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, gameType: value === 'all' ? undefined : value }));
  };
  
  const handleVenueChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, venueId: value === 'all' ? undefined : value }));
  };
  
  const handleSkillLevelChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, skillLevel: value === 'all' ? null : Number(value) }));
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, searchTerm: value || undefined }));
  };
  
  const handleClearFilters = () => {
    setFilters({
      timeFrame: 'weekly',
      gameType: undefined,
      venueId: undefined,
      searchTerm: undefined,
      skillLevel: null,
    });
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Count active filters (excluding timeFrame which is always required)
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'timeFrame' && value !== undefined && value !== null
  ).length;
  
  // If compact mode and not expanded, show minimized version
  if (compact && !expanded) {
    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="timeFrame-select-label">Time Frame</InputLabel>
            <Select
              labelId="timeFrame-select-label"
              value={filters.timeFrame}
              label="Time Frame"
              onChange={handleTimeFrameChange}
            >
              <MenuItem value="daily">Today</MenuItem>
              <MenuItem value="weekly">This Week</MenuItem>
              <MenuItem value="monthly">This Month</MenuItem>
              <MenuItem value="allTime">All Time</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {activeFilterCount > 0 && (
              <Chip 
                label={`${activeFilterCount} ${activeFilterCount === 1 ? 'filter' : 'filters'} active`}
                color="primary"
                size="small"
              />
            )}
            
            <Tooltip title="Show more filters">
              <IconButton 
                onClick={toggleExpanded}
                color="primary"
                size="small"
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    );
  }
  
  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h3" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon /> Filters
        </Typography>
        
        {compact && (
          <Tooltip title="Minimize filters">
            <IconButton onClick={toggleExpanded} size="small">
              <ClearIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        {/* Time Frame Filter - Always shown */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="timeFrame-select-label">Time Frame</InputLabel>
            <Select
              labelId="timeFrame-select-label"
              value={filters.timeFrame}
              label="Time Frame"
              onChange={handleTimeFrameChange}
            >
              <MenuItem value="daily">Today</MenuItem>
              <MenuItem value="weekly">This Week</MenuItem>
              <MenuItem value="monthly">This Month</MenuItem>
              <MenuItem value="allTime">All Time</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Game Type Filter */}
        {showGameTypeFilter && (
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="gameType-select-label">Game Type</InputLabel>
              <Select
                labelId="gameType-select-label"
                value={filters.gameType || 'all'}
                label="Game Type"
                onChange={handleGameTypeChange}
                startAdornment={<SportsEsportsIcon sx={{ mr: 1, ml: -0.5, color: 'text.secondary' }} />}
                disabled={loading || gameTypes.length === 0}
              >
                <MenuItem value="all">All Game Types</MenuItem>
                {gameTypes.map((gameType) => (
                  <MenuItem key={gameType.id} value={gameType.id}>{gameType.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Venue Filter */}
        {showVenueFilter && (
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="venue-select-label">Venue</InputLabel>
              <Select
                labelId="venue-select-label"
                value={filters.venueId || 'all'}
                label="Venue"
                onChange={handleVenueChange}
                startAdornment={<LocationOnIcon sx={{ mr: 1, ml: -0.5, color: 'text.secondary' }} />}
                disabled={loading || venues.length === 0}
              >
                <MenuItem value="all">All Venues</MenuItem>
                {venues.map((venue) => (
                  <MenuItem key={venue.id} value={venue.id}>
                    {venue.name} 
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      ({venue.location})
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Skill Level Filter */}
        {showSkillLevelFilter && (
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="skillLevel-select-label">Skill Level</InputLabel>
              <Select
                labelId="skillLevel-select-label"
                value={filters.skillLevel === null || filters.skillLevel === undefined ? 'all' : filters.skillLevel.toString()}
                label="Skill Level"
                onChange={handleSkillLevelChange}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="1">Beginner</MenuItem>
                <MenuItem value="2">Intermediate</MenuItem>
                <MenuItem value="3">Advanced</MenuItem>
                <MenuItem value="4">Expert</MenuItem>
                <MenuItem value="5">Master</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Search Filter */}
        {showSearchFilter && (
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Search Players"
              value={filters.searchTerm || ''}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
        )}
      </Grid>
      
      {/* Action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button 
          variant="outlined"
          onClick={handleClearFilters}
          disabled={!activeFilterCount}
          sx={{ mr: 1 }}
          size="small"
        >
          Clear Filters
        </Button>
      </Box>
      
      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Active filters:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.gameType && (
              <Chip 
                label={`Game: ${gameTypes.find(g => g.id === filters.gameType)?.name || filters.gameType}`}
                onDelete={() => setFilters(prev => ({ ...prev, gameType: undefined }))}
                size="small"
              />
            )}
            {filters.venueId && (
              <Chip 
                label={`Venue: ${venues.find(v => v.id === filters.venueId)?.name || filters.venueId}`}
                onDelete={() => setFilters(prev => ({ ...prev, venueId: undefined }))}
                size="small"
              />
            )}
            {filters.skillLevel !== null && filters.skillLevel !== undefined && (
              <Chip 
                label={`Skill: ${['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'][filters.skillLevel - 1]}`}
                onDelete={() => setFilters(prev => ({ ...prev, skillLevel: null }))}
                size="small"
              />
            )}
            {filters.searchTerm && (
              <Chip 
                label={`Search: ${filters.searchTerm}`}
                onDelete={() => setFilters(prev => ({ ...prev, searchTerm: undefined }))}
                size="small"
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default LeaderboardFilters; 