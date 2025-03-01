import React, { useState, useEffect } from 'react';
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
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Tooltip,
  IconButton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import leaderboardService, { LeaderboardData, LeaderboardEntry, LeaderboardFilter } from '../../services/leaderboardService';
import { useTheme } from '@mui/material/styles';

// Define ranking medal colors
const MEDAL_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32', // Bronze
};

interface GlobalLeaderboardProps {
  title?: string;
  initialTimeFrame?: 'daily' | 'weekly' | 'monthly' | 'allTime';
  venueId?: string;
  gameType?: string;
  limit?: number;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  title = 'Global Leaderboard',
  initialTimeFrame = 'weekly',
  venueId,
  gameType,
  limit = 10
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(limit);
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly' | 'allTime'>(initialTimeFrame);
  const [refreshing, setRefreshing] = useState(false);

  // Load leaderboard data
  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: LeaderboardFilter = {
        timeFrame,
        venue: venueId,
        gameType,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      };

      const data = venueId 
        ? await leaderboardService.getVenueLeaderboard(venueId, filters)
        : await leaderboardService.getGlobalLeaderboard(filters);

      setLeaderboardData(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    loadLeaderboardData();
  }, [timeFrame, page, rowsPerPage, venueId, gameType]);

  // Handle page change
  const handleChangePage = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle time frame change
  const handleTimeFrameChange = (event: SelectChangeEvent) => {
    setTimeFrame(event.target.value as 'daily' | 'weekly' | 'monthly' | 'allTime');
    setPage(0);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboardData();
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
    switch (timeFrame) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'allTime': return 'All Time';
      default: return '';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        mb: 2 
      }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            fontWeight: 'bold',
            fontFamily: 'var(--martial-arts-font)',
            color: theme.palette.primary.main
          }}
        >
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-frame-label">Time Period</InputLabel>
            <Select
              labelId="time-frame-label"
              id="time-frame-select"
              value={timeFrame}
              label="Time Period"
              onChange={handleTimeFrameChange}
            >
              <MenuItem value="daily">Today</MenuItem>
              <MenuItem value="weekly">This Week</MenuItem>
              <MenuItem value="monthly">This Month</MenuItem>
              <MenuItem value="allTime">All Time</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh leaderboard">
            <IconButton onClick={handleRefresh} disabled={refreshing || loading}>
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
          Last updated: {new Date(leaderboardData.lastUpdated).toLocaleString()}
        </Box>
      </Box>

      {/* Leaderboard table */}
      <TableContainer component={Paper} elevation={2}>
        <Table aria-label="leaderboard table">
          <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Player</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Score</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">W/L</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Win Rate</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Games</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'error.main' }}>
                  {error}
                </TableCell>
              </TableRow>
            ) : leaderboardData.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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
                        {entry.venue && (
                          <Typography variant="caption" color="text.secondary">
                            {entry.venue}
                          </Typography>
                        )}
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
                    {(entry.winRate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell align="right">
                    {entry.totalGames}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={leaderboardData.totalEntries}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
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
              Your Rank: <strong>#{leaderboardData.userRank.rank}</strong>
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
            <Chip 
              label={`Win Rate: ${(leaderboardData.userRank.winRate * 100).toFixed(1)}%`} 
              color="primary" 
              variant="outlined"
              sx={{ 
                bgcolor: 'white',
                '& .MuiChip-label': {
                  fontWeight: 'bold'
                }
              }} 
            />
          </Box>
          <Button 
            variant="contained" 
            color="primary"
            component="a"
            href="/profile"
            sx={{ bgcolor: 'white', color: theme.palette.primary.main }}
          >
            View Profile
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Helper function to create rgba color
function alpha(color: string, opacity: number): string {
  return `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`;
}

export default GlobalLeaderboard; 