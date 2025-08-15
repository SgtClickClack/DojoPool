import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Person,
  Group,
  SportsPool,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useTournamentAnalytics } from '../hooks/useTournamentAnalytics';

interface TournamentAnalyticsProps {
  tournamentId: string;
}

const TournamentAnalytics: React.FC<TournamentAnalyticsProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const { tournament, loading, error } = useTournament(tournamentId);
  const { analytics, loading: analyticsLoading, error: analyticsError } = useTournamentAnalytics(tournamentId);
  const [tab, setTab] = React.useState(0);

  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  if (loading || analyticsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || analyticsError) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">{error || analyticsError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Tournament Analytics
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tournament Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {analytics.totalParticipants}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Participants
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingDown color="success" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {analytics.averageScore.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Score
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Person color="info" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {analytics.topScorers.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Top Scorers
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Group color="warning" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {analytics.teamStats.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Teams
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ p: 2 }}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<BarChartIcon />} label="Score Distribution" />
          <Tab icon={<PieChartIcon />} label="Team Performance" />
          <Tab icon={<LineChartIcon />} label="Progression" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {tab === 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {tab === 1 && (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={analytics.teamPerformance}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="score"
                label
              />
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}

        {tab === 2 && (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analytics.progression}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="round" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke="#4CAF50"
                name="Average Score"
              />
              <Line
                type="monotone"
                dataKey="topScore"
                stroke="#F44336"
                name="Top Score"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Scorers
          </Typography>
          <Grid container spacing={2}>
            {analytics.topScorers.map((scorer, index) => (
              <Grid item xs={12} sm={6} md={4} key={scorer.userId}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="body1">
                      {scorer.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Score: {scorer.score}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="primary">
                    #{index + 1}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Team Statistics
          </Typography>
          <Grid container spacing={2}>
            {analytics.teamStats.map((team, index) => (
              <Grid item xs={12} sm={6} md={4} key={team.teamId}>
                <Paper
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="body1">
                      {team.teamName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Score: {team.totalScore}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Members: {team.memberCount}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="primary">
                    #{index + 1}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TournamentAnalytics;
