import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Grid,
  CircularProgress,
  useTheme,
  alpha,
  IconButton,
  Divider,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from "@mui/material";
import {
  Close,
  EmojiEvents,
  Timeline,
  TrendingUp,
  TrendingDown,
  People,
  Speed,
  Assessment,
  Psychology,
} from "@mui/icons-material";
import { useQuery } from "react-query";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PlayerStatsModalProps {
  playerId: number;
  onClose: () => void;
}

interface TournamentPlacement {
  tournament_id: number;
  name: string;
  date: string;
  placement: number;
}

interface PlayerStats {
  user_id: number;
  username: string;
  rating: number;
  rank: number;
  tier: string;
  tier_color: string;
  total_games: number;
  games_won: number;
  win_rate: number;
  tournament_wins: number;
  tournament_placements: TournamentPlacement[];
  rank_movement: number;
  rank_streak: number;
  rank_streak_type: string;
  highest_rating: number;
  highest_rating_date: string;
  highest_rank: number;
  highest_rank_date: string;
  ranking_history: Array<{
    date: string;
    rank: number;
    rating: number;
    tier: string;
  }>;
  performance_metrics: {
    accuracy: number;
    consistency: number;
    speed: number;
    strategy: number;
  };
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: alpha(color, 0.1),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box
        sx={{
          backgroundColor: alpha(color, 0.2),
          borderRadius: "50%",
          p: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Typography variant="h5" sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {title}
      </Typography>
    </Box>
  );
};

const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({
  playerId,
  onClose,
}) => {
  const theme = useTheme();

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<PlayerStats>(
    ["playerStats", playerId],
    async () => {
      const response = await axios.get(`/api/rankings/player/${playerId}`);
      return response.data;
    },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPerformanceColor = (value: number, max: number) => {
    const percentage = value / max;
    if (percentage >= 0.8) return theme.palette.success.main;
    if (percentage >= 0.6) return theme.palette.info.main;
    if (percentage >= 0.4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (isLoading) {
    return (
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        </DialogTitle>
      </Dialog>
    );
  }

  if (error || !stats) {
    return (
      <Dialog
        open={true}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="center">
            <Alert severity="error">Error loading player statistics</Alert>
          </Box>
        </DialogTitle>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Player Statistics</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Player Info */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Typography variant="h4">{stats.username}</Typography>
              <Chip
                icon={<EmojiEvents />}
                label={stats.tier}
                sx={{
                  backgroundColor: alpha(stats.tier_color, 0.1),
                  color: stats.tier_color,
                  fontWeight: "bold",
                }}
              />
            </Box>
          </Grid>

          {/* Current Stats */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Current Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Global Rank</Typography>
                  <Typography variant="h5">
                    #{stats.rank}
                    <Typography
                      component="span"
                      color={
                        stats.rank_movement > 0 ? "success.main" : "error.main"
                      }
                    >
                      {stats.rank_movement > 0
                        ? " ↑"
                        : stats.rank_movement < 0
                          ? " ↓"
                          : ""}
                      {Math.abs(stats.rank_movement)}
                    </Typography>
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Rating</Typography>
                  <Typography variant="h5">
                    {Math.round(stats.rating)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Win Rate</Typography>
                  <Typography variant="h5">
                    {(stats.win_rate * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Total Games</Typography>
                  <Typography variant="h5">{stats.total_games}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Best Achievements */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Best Achievements
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Highest Rank</Typography>
                  <Typography variant="h5">#{stats.highest_rank}</Typography>
                  <Typography variant="caption">
                    {stats.highest_rank_date &&
                      `on ${formatDate(stats.highest_rank_date)}`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Highest Rating</Typography>
                  <Typography variant="h5">
                    {Math.round(stats.highest_rating)}
                  </Typography>
                  <Typography variant="caption">
                    {stats.highest_rating_date &&
                      `on ${formatDate(stats.highest_rating_date)}`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Tournament Wins</Typography>
                  <Typography variant="h5">{stats.tournament_wins}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography color="textSecondary">Current Streak</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {stats.rank_streak >= 3 && (
                      <Chip
                        size="small"
                        icon={
                          stats.rank_streak_type === "win" ? (
                            <TrendingUp />
                          ) : (
                            <TrendingDown />
                          )
                        }
                        label={`${stats.rank_streak} ${stats.rank_streak_type === "win" ? "Up" : "Down"}`}
                        color={
                          stats.rank_streak_type === "win" ? "success" : "error"
                        }
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Rating History Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Rating History
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.ranking_history}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip
                      labelFormatter={formatDate}
                      formatter={(value: any) => [Math.round(value), "Rating"]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke={theme.palette.primary.main}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Assessment />
                    <Typography>Accuracy</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={stats.win_rate * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        backgroundColor: getPerformanceColor(stats.win_rate, 1),
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Timeline />
                    <Typography>Consistency</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((stats.total_games / 100) * 100, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        backgroundColor: getPerformanceColor(
                          stats.total_games,
                          100,
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Speed />
                    <Typography>Progress</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(stats.rank_streak * 10, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        backgroundColor: getPerformanceColor(
                          stats.rank_streak,
                          10,
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Psychology />
                    <Typography>Tournament Performance</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(stats.tournament_wins * 20, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 4,
                        backgroundColor: getPerformanceColor(
                          stats.tournament_wins,
                          5,
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Recent Tournament Results */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Tournament Results
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tournament</TableCell>
                      <TableCell align="center">Place</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.tournament_placements.map((tournament) => (
                      <TableRow key={tournament.tournament_id}>
                        <TableCell>{tournament.name}</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={`${tournament.placement}${
                              tournament.placement === 1
                                ? "st"
                                : tournament.placement === 2
                                  ? "nd"
                                  : tournament.placement === 3
                                    ? "rd"
                                    : "th"
                            }`}
                            color={
                              tournament.placement === 1
                                ? "success"
                                : tournament.placement <= 3
                                  ? "primary"
                                  : "default"
                            }
                          />
                        </TableCell>
                        <TableCell>{formatDate(tournament.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerStatsModal;
