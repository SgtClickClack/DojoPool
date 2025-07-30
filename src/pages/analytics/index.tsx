import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from '@mui/material';
import Layout from '../../components/layout/Layout';
import { useAdvancedPlayerAnalytics } from '../../hooks/useAdvancedPlayerAnalytics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const PlayerAnalyticsDashboard: React.FC = () => {
  const {
    getPlayerPerformance,
    getPerformanceMetrics,
    getMatchAnalyses,
    isLoading,
    error
  } = useAdvancedPlayerAnalytics();

  const [playerPerformance, setPlayerPerformance] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [matchAnalyses, setMatchAnalyses] = useState<any[]>([]);
  const [tournamentHistory, setTournamentHistory] = useState<any[]>([]);

  // Mock player ID - in a real app, this would come from authentication or URL params
  const playerId = "current-user";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch player performance data
        const performance = await getPlayerPerformance(playerId);
        if (performance) {
          setPlayerPerformance(performance);
        }

        // Fetch performance metrics for the chart
        const metrics = await getPerformanceMetrics(playerId, 'win_rate');
        if (metrics && metrics.length > 0) {
          // Format data for the chart
          const formattedMetrics = metrics.map((metric: any) => ({
            date: new Date(metric.timestamp).toLocaleDateString(),
            value: metric.value
          }));
          setPerformanceMetrics(formattedMetrics);
        }

        // Fetch match analyses for recent matches
        const analyses = await getMatchAnalyses(playerId);
        if (analyses && analyses.length > 0) {
          // Sort by timestamp (most recent first) and take the last 10
          const sortedAnalyses = [...analyses]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
          setMatchAnalyses(sortedAnalyses);
        }

        // Mock tournament history data
        // In a real app, this would come from a tournament API endpoint
        setTournamentHistory([
          { id: 1, name: "Summer Championship", date: "2025-07-15", finalRanking: 2 },
          { id: 2, name: "Regional Qualifier", date: "2025-06-28", finalRanking: 1 },
          { id: 3, name: "City Tournament", date: "2025-06-10", finalRanking: 3 },
          { id: 4, name: "Weekly Challenge", date: "2025-05-22", finalRanking: 1 },
          { id: 5, name: "Spring Open", date: "2025-05-05", finalRanking: 5 }
        ]);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [getPlayerPerformance, getPerformanceMetrics, getMatchAnalyses, playerId]);

  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Player Analytics Dashboard
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <>
            {/* Overall Stats Card */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Overall Stats
                    </Typography>
                    {playerPerformance ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4} md={3}>
                          <Typography variant="subtitle2">Total Games Played</Typography>
                          <Typography variant="h5">{playerPerformance.totalMatches}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                          <Typography variant="subtitle2">Win Rate</Typography>
                          <Typography variant="h5">{(playerPerformance.winRate * 100).toFixed(1)}%</Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                          <Typography variant="subtitle2">Current Rank</Typography>
                          <Typography variant="h5">{playerPerformance.skillLevel}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} md={3}>
                          <Typography variant="subtitle2">Tournament Wins</Typography>
                          <Typography variant="h5">{playerPerformance.tournamentWins}</Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography>No performance data available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Performance Over Time Chart */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Over Time
                    </Typography>
                    {performanceMetrics.length > 0 ? (
                      <Box sx={{ height: 300, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={performanceMetrics}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              name="Win Rate" 
                              stroke="#00ff9d" 
                              activeDot={{ r: 8 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    ) : (
                      <Typography>No performance metrics available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tournament History */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tournament History
                    </Typography>
                    {tournamentHistory.length > 0 ? (
                      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader aria-label="tournament history table">
                          <TableHead>
                            <TableRow>
                              <TableCell>Tournament</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell align="right">Final Ranking</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {tournamentHistory.map((tournament) => (
                              <TableRow key={tournament.id}>
                                <TableCell>{tournament.name}</TableCell>
                                <TableCell>{new Date(tournament.date).toLocaleDateString()}</TableCell>
                                <TableCell align="right">{tournament.finalRanking}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography>No tournament history available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Matches */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Matches
                    </Typography>
                    {matchAnalyses.length > 0 ? (
                      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader aria-label="recent matches table">
                          <TableHead>
                            <TableRow>
                              <TableCell>Opponent</TableCell>
                              <TableCell>Result</TableCell>
                              <TableCell>Score</TableCell>
                              <TableCell>Date</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {matchAnalyses.map((match) => (
                              <TableRow key={match.id}>
                                <TableCell>{match.opponentId}</TableCell>
                                <TableCell>
                                  <Box 
                                    sx={{ 
                                      color: match.result === 'win' 
                                        ? 'success.main' 
                                        : match.result === 'loss' 
                                          ? 'error.main' 
                                          : 'text.primary'
                                    }}
                                  >
                                    {match.result.toUpperCase()}
                                  </Box>
                                </TableCell>
                                <TableCell>{match.score}</TableCell>
                                <TableCell>{new Date(match.timestamp).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography>No recent matches available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Layout>
  );
};

export default PlayerAnalyticsDashboard;