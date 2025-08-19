import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Star,
  EmojiEvents,
  Speed,
  Target,
  Timeline,
  Analytics,
  Person,
  Groups,
  Timer,
  AttachMoney,
  ShowChart,
  Refresh,
  FilterList,
  People,
  Psychology,
  SportsEsports,
  LocationOn,
  Schedule,
  Visibility,
  Memory,
  NetworkCheck,
  Storage,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import TournamentAnalyticsService, {
  type TournamentStatistics,
  type PlayerPerformance,
  type MatchAnalytics,
  type PerformanceTrends,
  type VenueAnalytics,
  type RealTimeMetrics,
} from '../../services/tournament/TournamentAnalyticsService';
import { type Tournament } from '../../types/tournament';

// Cyberpunk styled components
const CyberpunkCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  border: '2px solid #00d4ff',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
  backdropFilter: 'blur(10px)',
  '&:hover': {
    boxShadow: '0 12px 40px rgba(0, 212, 255, 0.5)',
    transform: 'translateY(-2px)',
  },
  transition: 'all 0.3s ease',
}));

const NeonText = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
  fontWeight: 'bold',
}));

const StatCard = styled(Box)(({ theme }) => ({
  background:
    'linear-gradient(135deg, rgba(26, 26, 46, 0.9) 0%, rgba(22, 33, 62, 0.9) 100%)',
  border: '1px solid #00d4ff',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #00d4ff, #ff00ff)',
  },
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: '8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(0, 212, 255, 0.2)',
  '& .MuiLinearProgress-bar': {
    background: 'linear-gradient(90deg, #00d4ff, #ff00ff)',
    borderRadius: '4px',
  },
}));

interface TournamentAnalyticsProps {
  tournament: Tournament;
  onRefresh?: () => void;
}

const TournamentAnalytics: React.FC<TournamentAnalyticsProps> = ({
  tournament,
  onRefresh,
}) => {
  const [statistics, setStatistics] = useState<TournamentStatistics | null>(
    null
  );
  const [playerPerformance, setPlayerPerformance] = useState<
    PlayerPerformance[]
  >([]);
  const [matchAnalytics, setMatchAnalytics] = useState<MatchAnalytics[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<
    PerformanceTrends[]
  >([]);
  const [venueAnalytics, setVenueAnalytics] = useState<VenueAnalytics | null>(
    null
  );
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    activeMatches: 0,
    activePlayers: 0,
    totalViewers: 0,
    averageMatchDuration: 0,
    revenuePerHour: 0,
    systemPerformance: { cpu: 0, memory: 0, network: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const analyticsService = TournamentAnalyticsService.getInstance();

  useEffect(() => {
    loadAnalytics();
    setupSubscriptions();

    return () => {
      // Cleanup subscriptions
    };
  }, [tournament.id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboard =
        await analyticsService.generateAnalyticsDashboard(tournament);

      setStatistics(dashboard.statistics);
      setPlayerPerformance(dashboard.playerPerformance);
      setMatchAnalytics(dashboard.matchAnalytics);

      // Load additional analytics
      const trends = await Promise.all(
        dashboard.playerPerformance
          .slice(0, 5)
          .map((player) =>
            analyticsService.calculateHistoricalTrends(player.playerId, [
              tournament,
            ])
          )
      );
      setPerformanceTrends(trends);

      if (tournament.venueId) {
        const venueAnalytics = await analyticsService.calculateVenueAnalytics(
          tournament.venueId,
          [tournament]
        );
        setVenueAnalytics(venueAnalytics);
      }

      setRealTimeMetrics(analyticsService.getRealTimeMetrics());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const setupSubscriptions = () => {
    const unsubscribeStats = analyticsService.subscribe(
      'tournamentStatistics',
      (data) => {
        setStatistics(data);
      }
    );

    const unsubscribePerformance = analyticsService.subscribe(
      'playerPerformance',
      (data) => {
        setPlayerPerformance(data);
      }
    );

    const unsubscribeMatchAnalytics = analyticsService.subscribe(
      'matchAnalytics',
      (data) => {
        setMatchAnalytics((prev) => [...prev, data]);
      }
    );

    const unsubscribeRealTimeMetrics = analyticsService.subscribeToUpdates(
      (data) => {
        if (data.activeMatches !== undefined) {
          setRealTimeMetrics(data);
        }
      }
    );

    return () => {
      unsubscribeStats();
      unsubscribePerformance();
      unsubscribeMatchAnalytics();
      unsubscribeRealTimeMetrics();
    };
  };

  const handleRefresh = () => {
    loadAnalytics();
    onRefresh?.();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#00ff00';
      case 'in_progress':
        return '#ffaa00';
      case 'pending':
        return '#ff00ff';
      default:
        return '#666666';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 9.0) return '#00ff88';
    if (rating >= 8.0) return '#00d4ff';
    if (rating >= 7.0) return '#ffaa00';
    return '#ff4444';
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress sx={{ color: '#00d4ff' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          color: '#00d4ff',
          mb: 3,
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        Tournament Analytics Dashboard
      </Typography>

      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <NeonText variant="h4" component="h1">
          Tournament Analytics
        </NeonText>
        <Box>
          <Tooltip title="Refresh Analytics">
            <IconButton onClick={handleRefresh} sx={{ color: '#00d4ff' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Filter Options">
            <IconButton sx={{ color: '#00d4ff' }}>
              <FilterList />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tournament Overview Stats */}
      {statistics && (
        <CyberpunkCard sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
              Tournament Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard>
                  <Person sx={{ color: '#00d4ff', fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {statistics.totalPlayers}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    Total Players
                  </Typography>
                </StatCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard>
                  <Groups sx={{ color: '#ff00ff', fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {statistics.totalMatches}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    Total Matches
                  </Typography>
                </StatCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard>
                  <Timer sx={{ color: '#00ff00', fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    {formatDuration(statistics.averageMatchDuration)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    Avg Match Time
                  </Typography>
                </StatCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard>
                  <AttachMoney sx={{ color: '#ffaa00', fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" sx={{ color: '#ffffff' }}>
                    ${statistics.totalPrizePool}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    Prize Pool
                  </Typography>
                </StatCard>
              </Grid>
            </Grid>

            {/* Progress Indicators */}
            <Box sx={{ mt: 3 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="body2" sx={{ color: '#cccccc' }}>
                  Tournament Progress
                </Typography>
                <Typography variant="body2" sx={{ color: '#00d4ff' }}>
                  {statistics.completionRate.toFixed(1)}%
                </Typography>
              </Box>
              <ProgressBar
                variant="determinate"
                value={statistics.completionRate}
              />
            </Box>
          </CardContent>
        </CyberpunkCard>
      )}

      {/* Player Performance Rankings */}
      <CyberpunkCard sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
            Player Performance Rankings
          </Typography>
          <TableContainer component={Paper} sx={{ background: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                    Rank
                  </TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                    Player
                  </TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                    Matches
                  </TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                    Win Rate
                  </TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                    Avg Points
                  </TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                    Highest Break
                  </TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {playerPerformance.slice(0, 10).map((player, index) => (
                  <TableRow key={player.playerId} hover>
                    <TableCell sx={{ color: '#ffffff' }}>
                      <Box display="flex" alignItems="center">
                        {index < 3 ? (
                          <EmojiEvents sx={{ color: '#ffaa00', mr: 1 }} />
                        ) : (
                          <Typography variant="body2" sx={{ color: '#cccccc' }}>
                            #{player.tournamentRank}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      <Box display="flex" alignItems="center">
                        <Person sx={{ color: '#00d4ff', mr: 1 }} />
                        {player.playerName}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      {player.matchesPlayed}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      <Box display="flex" alignItems="center">
                        {player.winRate.toFixed(1)}%
                        {player.winRate > 60 ? (
                          <TrendingUp
                            sx={{ color: '#00ff00', ml: 1, fontSize: 16 }}
                          />
                        ) : (
                          <TrendingDown
                            sx={{ color: '#ff0000', ml: 1, fontSize: 16 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      {player.averagePoints.toFixed(1)}
                    </TableCell>
                    <TableCell sx={{ color: '#ffffff' }}>
                      <Chip
                        label={player.highestBreak}
                        size="small"
                        sx={{
                          background:
                            'linear-gradient(45deg, #00d4ff, #ff00ff)',
                          color: '#ffffff',
                          fontWeight: 'bold',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          player.eliminationRound
                            ? `Eliminated R${player.eliminationRound}`
                            : 'Active'
                        }
                        size="small"
                        sx={{
                          background: player.eliminationRound
                            ? '#ff0000'
                            : '#00ff00',
                          color: '#ffffff',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </CyberpunkCard>

      {/* Match Analytics */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <CyberpunkCard>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                Recent Matches
              </Typography>
              {matchAnalytics.slice(0, 5).map((match) => (
                <Box
                  key={match.matchId}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>
                      {match.player1Name} vs {match.player2Name}
                    </Typography>
                    <Chip
                      label={match.winnerId ? 'Completed' : 'In Progress'}
                      size="small"
                      sx={{
                        background: match.winnerId ? '#00ff00' : '#ffaa00',
                        color: '#ffffff',
                      }}
                    />
                  </Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    sx={{ color: '#cccccc' }}
                  >
                    <Typography variant="caption">
                      Duration: {formatDuration(match.duration)}
                    </Typography>
                    <Typography variant="caption">
                      Points: {match.totalPoints}
                    </Typography>
                    <Typography variant="caption">
                      Highest Break: {match.highestBreak}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </CyberpunkCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <CyberpunkCard>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                Performance Trends
              </Typography>
              {performanceTrends.slice(0, 3).map((trend) => (
                <Box key={trend.playerId} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#ffffff', mb: 1 }}>
                    {trend.playerName}
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <Typography
                      variant="caption"
                      sx={{ color: '#cccccc', mr: 1 }}
                    >
                      Win Rate Trend:
                    </Typography>
                    <Box display="flex" alignItems="center">
                      {trend.winRateTrend.slice(-3).map((rate, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: '20px',
                            height: '20px',
                            background: `linear-gradient(45deg, #00d4ff, #ff00ff)`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: '#ffffff',
                            mr: 0.5,
                          }}
                        >
                          {rate.toFixed(0)}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#cccccc' }}>
                    Improvement Rate: {trend.improvementRate.toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </CyberpunkCard>
        </Grid>
      </Grid>

      {/* Venue Analytics */}
      {venueAnalytics && (
        <CyberpunkCard sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
              Venue Analytics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard>
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    {venueAnalytics.tournamentsHosted}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    Tournaments Hosted
                  </Typography>
                </StatCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard>
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    {venueAnalytics.averageTournamentSize.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    Avg Tournament Size
                  </Typography>
                </StatCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard>
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    {venueAnalytics.completionRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    Completion Rate
                  </Typography>
                </StatCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard>
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>
                    ${venueAnalytics.averagePrizePool.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#cccccc' }}>
                    Avg Prize Pool
                  </Typography>
                </StatCard>
              </Grid>
            </Grid>
          </CardContent>
        </CyberpunkCard>
      )}

      {/* Real-Time Metrics */}
      <CyberpunkCard sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
            Real-Time Metrics
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard>
                <SportsEsports sx={{ color: '#00d4ff', fontSize: 32, mb: 1 }} />
                <Typography
                  variant="h4"
                  sx={{ color: '#ffffff', fontWeight: 'bold' }}
                >
                  {realTimeMetrics.activeMatches}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  Active Matches
                </Typography>
              </MetricCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard>
                <People sx={{ color: '#ff0080', fontSize: 32, mb: 1 }} />
                <Typography
                  variant="h4"
                  sx={{ color: '#ffffff', fontWeight: 'bold' }}
                >
                  {realTimeMetrics.activePlayers}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  Active Players
                </Typography>
              </MetricCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard>
                <Visibility sx={{ color: '#00ff88', fontSize: 32, mb: 1 }} />
                <Typography
                  variant="h4"
                  sx={{ color: '#ffffff', fontWeight: 'bold' }}
                >
                  {realTimeMetrics.totalViewers}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  Total Viewers
                </Typography>
              </MetricCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard>
                <AttachMoney sx={{ color: '#ffaa00', fontSize: 32, mb: 1 }} />
                <Typography
                  variant="h4"
                  sx={{ color: '#ffffff', fontWeight: 'bold' }}
                >
                  {formatCurrency(realTimeMetrics.revenuePerHour)}
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  Revenue/Hour
                </Typography>
              </MetricCard>
            </Grid>
          </Grid>
        </CardContent>
      </CyberpunkCard>

      {/* System Performance */}
      <CyberpunkCard sx={{ mt: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              color: '#00d4ff',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Memory sx={{ mr: 1 }} />
            System Performance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  CPU Usage
                </Typography>
                <PerformanceBar
                  variant="determinate"
                  value={realTimeMetrics.systemPerformance.cpu}
                />
                <Typography variant="caption" sx={{ color: '#00d4ff' }}>
                  {realTimeMetrics.systemPerformance.cpu.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Memory Usage
                </Typography>
                <PerformanceBar
                  variant="determinate"
                  value={realTimeMetrics.systemPerformance.memory}
                />
                <Typography variant="caption" sx={{ color: '#ff0080' }}>
                  {realTimeMetrics.systemPerformance.memory.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
                  Network Load
                </Typography>
                <PerformanceBar
                  variant="determinate"
                  value={realTimeMetrics.systemPerformance.network}
                />
                <Typography variant="caption" sx={{ color: '#00ff88' }}>
                  {realTimeMetrics.systemPerformance.network.toFixed(1)}%
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </CyberpunkCard>
    </Box>
  );
};

export default TournamentAnalytics;
