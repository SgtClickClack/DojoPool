import React from 'react';
import { Card, CardContent, Typography, Grid, Box, LinearProgress } from '@mui/material';
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
              Wins: {stats.wins} | Losses: {stats.losses}
            </Typography>
            <Typography variant="body1">
              Win Rate: {((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tournament Performance
            </Typography>
            <Typography variant="body1">
              Tournaments Joined: {stats.tournamentsJoined}
            </Typography>
            <Typography variant="body1">
              Tournament Wins: {stats.tournamentWins}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Achievement Progress
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(stats.achievementProgress).map(([achievement, progress]) => (
                <Grid item xs={12} sm={6} md={4} key={achievement}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" gutterBottom>
                      {achievement}
                    </Typography>
                    <Box sx={{ width: '100%', mb: 2 }}>
                      <LinearProgress variant="determinate" value={progress * 100} />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StatsPanel;
