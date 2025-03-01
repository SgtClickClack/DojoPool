import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress,
  Avatar,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FilterListIcon from '@mui/icons-material/FilterList';
import leaderboardService, { LeaderboardData, LeaderboardFilter } from '../../services/leaderboardService';
import websocketService from '../../services/websocketService';
import { useTheme } from '@mui/material/styles';
import LeaderboardFilters, { LeaderboardFilterValue } from './LeaderboardFilters';

// Define ranking medal colors
const MEDAL_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

interface VenueLeaderboardProps {
  venueId: string;
  venueName?: string;
  limit?: number;
  className?: string;
}

export const VenueLeaderboard: React.FC<VenueLeaderboardProps> = ({
  venueId,
  venueName,
  limit = 10,
  className
}) => {
  const theme = useTheme();
  
  // State variables
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    entries: [],
    totalEntries: 0,
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>(venueName || 'Venue Leaderboard');
  const [refreshing, setRefreshing] = useState(false);
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false);
  const [newUpdateAvailable, setNewUpdateAvailable] = useState(false);
  const [filters, setFilters] = useState<LeaderboardFilterValue>({
    timeFrame: 'weekly',
    venueId: venueId
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Load venue leaderboard data
  const loadLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiFilters: LeaderboardFilter = {
        timeFrame: filters.timeFrame,
        limit,
        gameType: filters.gameType,
        venue: filters.venueId || venueId,
      };

      const data = await leaderboardService.getVenueLeaderboard(venueId, apiFilters);
      
      setLeaderboardData(data);
      setNewUpdateAvailable(false);
      
      // Set venue name if returned from API and not provided as prop
      if (!venueName && data.venueName) {
        setDisplayName(data.venueName);
      }
    } catch (err) {
      console.error('Failed to load venue leaderboard:', err);
      setError('Failed to load venue leaderboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [venueId, limit, filters, venueName]);

  // Initialize WebSocket for real-time updates
  useEffect(() => {
    // Clean up function that will be called when component unmounts
    let unsubscribe: (() => void) | undefined;
    
    // Only connect to WebSocket if we have a venue ID
    if (venueId) {
      // Subscribe to real-time updates
      unsubscribe = leaderboardService.subscribeToLeaderboardUpdates(venueId, (updatedData) => {
        // Check if the update matches our current filter
        if (updatedData && Array.isArray(updatedData)) {
          setNewUpdateAvailable(true);
        }
      });
      
      setHasRealTimeUpdates(true);
    }
    
    // Clean up subscription when component unmounts or venueId changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [venueId]);
  
  // Initial load and when filters change
  useEffect(() => {
    if (venueId) {
      loadLeaderboardData();
    }
  }, [venueId, loadLeaderboardData, filters]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboardData();
  };

  // Handle time frame tab change
  const handleTimeFrameChange = (_: React.SyntheticEvent, newTimeFrame: 'daily' | 'weekly' | 'monthly' | 'allTime') => {
    setFilters(prev => ({ ...prev, timeFrame: newTimeFrame }));
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: LeaderboardFilterValue) => {
    setFilters(newFilters);
  };

  // Apply real-time updates when user clicks on notification
  const handleApplyUpdates = () => {
    setRefreshing(true);
    loadLeaderboardData();
  };

  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Render rank with medal for top 3
  const renderRank = (rank: number) => {
    if (rank <= 3) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MilitaryTechIcon 
            sx={{ 
              color: MEDAL_COLORS[rank as keyof typeof MEDAL_COLORS], 
              mr: 1, 
              fontSize: '1.5rem' 
            }} 
          />
          {rank}
        </Box>
      );
    }
    return rank;
  };

  // Get localized time frame text
  const getTimeFrameText = () => {
    switch (filters.timeFrame) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'allTime': return 'All Time';
      default: return '';
    }
  };

  // Render loading state
  if (loading && !refreshing) {
    return (
      <Box sx={{ width: '100%' }} className={className}>
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="70%" height={40} />
          <Skeleton variant="text" width="40%" height={30} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 2 }} />
        <TableContainer component={Paper} elevation={2}>
          <Table aria-label="venue leaderboard loading">
            <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Player</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Score</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">W/L</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Games</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" /></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                      <Skeleton variant="text" width={150} />
                    </Box>
                  </TableCell>
                  <TableCell align="right"><Skeleton variant="text" /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }} className={className}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOnIcon sx={{ 
            color: theme.palette.primary.main, 
            mr: 1, 
            fontSize: '2rem'
          }} />
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 'bold',
              fontFamily: 'var(--martial-arts-font)',
              color: theme.palette.primary.main
            }}
          >
            {displayName}
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Players ranked by performance at this venue
        </Typography>
      </Box>

      {/* Filters toggle button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button 
          variant="outlined" 
          color="primary"
          startIcon={<FilterListIcon />}
          onClick={toggleFilters}
          size="small"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </Box>

      {/* Filters */}
      {showFilters && (
        <LeaderboardFilters
          initialFilters={filters}
          onFiltersChange={handleFiltersChange}
          showVenueFilter={false} // We already know the venue
        />
      )}

      {/* Time frame tabs */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs 
          value={filters.timeFrame} 
          onChange={handleTimeFrameChange}
          aria-label="time frame tabs"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Today" value="daily" />
          <Tab label="This Week" value="weekly" />
          <Tab label="This Month" value="monthly" />
          <Tab label="All Time" value="allTime" />
        </Tabs>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {newUpdateAvailable && (
            <Tooltip title="New rankings available">
              <IconButton onClick={handleApplyUpdates} color="primary">
                <Badge variant="dot" color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Refresh leaderboard">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Last updated info */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        mb: 1,
        color: theme.palette.text.secondary,
        fontSize: '0.8rem'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {hasRealTimeUpdates && (
            <Chip
              size="small"
              label="Live"
              color="success"
              variant="outlined"
              sx={{ mr: 1, height: 20 }}
            />
          )}
          Last updated: {new Date(leaderboardData.lastUpdated).toLocaleString()}
        </Box>
      </Box>

      {/* Leaderboard table */}
      <TableContainer component={Paper} elevation={2}>
        <Table aria-label="venue leaderboard table">
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Player</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Score</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">W/L</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Games</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'error.main' }}>
                  {error}
                </TableCell>
              </TableRow>
            ) : leaderboardData.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  No players found for {getTimeFrameText().toLowerCase()}. Be the first to join!
                </TableCell>
              </TableRow>
            ) : (
              leaderboardData.entries.map((entry) => (
                <TableRow 
                  key={entry.id}
                  sx={{ 
                    bgcolor: entry.isCurrentUser ? alpha(theme.palette.primary.light, 0.15) : 'inherit',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.light, 0.1),
                    }
                  }}
                >
                  <TableCell>{renderRank(entry.rank)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={entry.avatar} 
                        alt={entry.username}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {entry.username}
                          {entry.isCurrentUser && (
                            <Chip 
                              label="You" 
                              size="small" 
                              color="primary" 
                              sx={{ ml: 1, height: 20 }} 
                            />
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {entry.score.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box component="span" sx={{ color: 'success.main' }}>
                      {entry.wins}
                    </Box>
                    /
                    <Box component="span" sx={{ color: 'error.main' }}>
                      {entry.losses}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {entry.totalGames}
                  </TableCell>
                </TableRow>
              ))
            )}
            {refreshing && (
              <TableRow>
                <TableCell colSpan={5} sx={{ p: 1, borderBottom: 'none' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User rank display */}
      {leaderboardData.userRank && !loading && (
        <Box 
          sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" mr={2}>
              Your Rank: <strong>#{leaderboardData.userRank.rank}</strong> at {displayName}
            </Typography>
            <Chip 
              label={`Score: ${leaderboardData.userRank.score.toLocaleString()}`} 
              color="primary" 
              variant="outlined"
              sx={{ 
                bgcolor: 'white', 
                mr: 1,
                '& .MuiChip-label': {
                  fontWeight: 'bold'
                }
              }} 
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Helper function to create rgba color
function alpha(color: string, opacity: number): string {
  return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`;
}

export default VenueLeaderboard; 