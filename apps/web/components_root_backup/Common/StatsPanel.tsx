import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
} from '@mui/material';
import { useUserStats } from '../../hooks/useUserStats';

const StatsPanel: React.FC = () => {
  const { stats, loading } = useUserStats();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Game Statistics
            </Typography>
            <Typography variant="body1">
              Total Games: {stats.totalGames}
            </Typography>
            <Typography variant="body1">
              Wins: {stats.wins} | Losses: {stats.losses}
            </Typography>
            <Typography variant="body1">
              Win Rate: {stats.winRate.toFixed(1)}%
            </Typography>
            <Typography variant="body1">
              Average Score: {stats.averageScore.toFixed(1)}
            </Typography>
            <Typography variant="body1">
              Total Points: {stats.totalPoints}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Typography variant="body1">
              Win Rate: {stats.winRate.toFixed(1)}%
            </Typography>
            <Typography variant="body1">
              Average Score: {stats.averageScore.toFixed(1)}
            </Typography>
            <Typography variant="body1">
              Total Points: {stats.totalPoints}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Game Summary
            </Typography>
            <Typography variant="body1">
              You have played {stats.totalGames} games with a win rate of {stats.winRate.toFixed(1)}%.
            </Typography>
            <Typography variant="body1">
              Your average score is {stats.averageScore.toFixed(1)} points per game.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StatsPanel;
