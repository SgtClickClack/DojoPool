import React, { useState, useEffect, useRef } from 'react';
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
  Button,
  Badge
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StreamIcon from '@mui/icons-material/Stream';
import PauseIcon from '@mui/icons-material/Pause';
import leaderboardService, { TournamentLeaderboardEntry } from '../../services/leaderboardService';
import { useTheme } from '@mui/material/styles';

// Define ranking medal colors
const MEDAL_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

interface TournamentLeaderboardProps {
  tournamentId: string;
  title?: string;
  limit?: number;
  showTitle?: boolean;
  className?: string;
  enableLiveUpdates?: boolean;
}

export const TournamentLeaderboard: React.FC<TournamentLeaderboardProps> = ({
  tournamentId,
  title,
  limit = 10,
  showTitle = true,
  className,
  enableLiveUpdates = true // Default to true for live tournaments
}) => {
  const theme = useTheme();
  
  // State variables
  const [leaderboardEntries, setLeaderboardEntries] = useState<TournamentLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [tournamentName, setTournamentName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(false);
  const [liveUpdatesAvailable, setLiveUpdatesAvailable] = useState(enableLiveUpdates);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  
  // Ref to store the unsubscribe function for websocket updates
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load tournament leaderboard data
  const loadLeaderboardData = async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);

      const data = await leaderboardService.getTournamentLeaderboard(tournamentId, { limit });

      setLeaderboardEntries(data.entries);
      setLastUpdated(data.lastUpdated);
      setTournamentName(data.tournamentName || 'Tournament Leaderboard');
      
      // If we got data back, enable live updates if it's allowed by props
      if (data.entries.length > 0 && enableLiveUpdates) {
        setLiveUpdatesAvailable(true);
      }
    } catch (err) {
      console.error('Failed to load tournament leaderboard:', err);
      setError('Failed to load tournament leaderboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (tournamentId) {
      loadLeaderboardData();
    }
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [tournamentId]);

  // Effect to manage WebSocket subscription
  useEffect(() => {
    // Clean up previous subscription if it exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // If live updates are enabled and available, subscribe to updates
    if (liveUpdatesEnabled && liveUpdatesAvailable && tournamentId) {
      unsubscribeRef.current = leaderboardService.subscribeToLeaderboardUpdates(
        tournamentId,
        (updatedEntries) => {
          setLeaderboardEntries(updatedEntries);
          setLastUpdated(new Date().toISOString());
          setHasNewUpdate(true);
          
          // Reset the new update indicator after 2 seconds
          setTimeout(() => {
            setHasNewUpdate(false);
          }, 2000);
        }
      );
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [liveUpdatesEnabled, liveUpdatesAvailable, tournamentId]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboardData();
  };

  // Toggle live updates
  const toggleLiveUpdates = () => {
    setLiveUpdatesEnabled(prev => !prev);
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

  // Display tournament title - use custom title if provided, otherwise use the retrieved tournament name
  const displayTitle = title || tournamentName;

  // Render loading state
  if (loading && !refreshing) {
    return (
      <Box sx={{ width: '100%' }} className={className}>
        {showTitle && (
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width="60%" height={40} />
          </Box>
        )}
        <TableContainer component={Paper} elevation={2}>
          <Table aria-label="tournament leaderboard loading">
            <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Player</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Score</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Matches</TableCell>
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
      {showTitle && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EmojiEventsIcon sx={{ 
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
              {displayTitle}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {liveUpdatesAvailable && (
              <Tooltip title={liveUpdatesEnabled ? "Pause live updates" : "Enable live updates"}>
                <Button
                  variant="outlined"
                  color={liveUpdatesEnabled ? "primary" : "inherit"}
                  onClick={toggleLiveUpdates}
                  startIcon={liveUpdatesEnabled ? <StreamIcon /> : <PauseIcon />}
                  size="small"
                  sx={{ 
                    borderRadius: '20px',
                    ...(liveUpdatesEnabled && {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    })
                  }}
                >
                  {liveUpdatesEnabled ? "Live" : "Paused"}
                </Button>
              </Tooltip>
            )}
            
            <Tooltip title="Refresh leaderboard">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

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
          Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
          {liveUpdatesEnabled && (
            <Badge
              variant="dot"
              color="primary"
              sx={{ 
                ml: 1,
                '& .MuiBadge-dot': {
                  backgroundColor: hasNewUpdate ? theme.palette.success.main : theme.palette.primary.main,
                  transition: 'background-color 0.3s ease',
                  animation: hasNewUpdate ? 'pulse 1s' : 'none'
                },
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.5)' },
                  '100%': { transform: 'scale(1)' }
                }
              }}
            />
          )}
        </Box>
      </Box>

      {/* Leaderboard table */}
      <TableContainer component={Paper} elevation={2}>
        <Table aria-label="tournament leaderboard table">
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Player</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Score</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Matches</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'error.main' }}>
                  {error}
                </TableCell>
              </TableRow>
            ) : leaderboardEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  No players have joined this tournament yet. Be the first to join!
                </TableCell>
              </TableRow>
            ) : (
              leaderboardEntries.map((entry) => (
                <TableRow 
                  key={entry.id}
                  sx={{ 
                    bgcolor: entry.isCurrentUser ? alpha(theme.palette.primary.light, 0.15) : 'inherit',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.light, 0.1),
                    },
                    // Add animation for updated entries
                    ...(entry.gainedPoints && entry.gainedPoints > 0 && {
                      animation: hasNewUpdate ? 'highlight 2s ease-out' : 'none',
                    }),
                    '@keyframes highlight': {
                      '0%': { backgroundColor: alpha(theme.palette.success.light, 0.6) },
                      '100%': { backgroundColor: 'inherit' }
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
                    {entry.gainedPoints !== undefined && entry.gainedPoints > 0 && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                        +{entry.gainedPoints}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {entry.matchesPlayed !== undefined ? entry.matchesPlayed : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            )}
            {refreshing && (
              <TableRow>
                <TableCell colSpan={4} sx={{ p: 1, borderBottom: 'none' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={24} />
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// Helper function to create rgba color
function alpha(color: string, opacity: number): string {
  return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`;
}

export default TournamentLeaderboard; 