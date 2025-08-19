import {
  Star as AchievementIcon,
  Timeline as StatsIcon,
  Group as TeamIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import AchievementsList from '../../../apps/web/src/components/profile/AchievementsList';

interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  points: number;
  category?: string;
  criteria: string;
  rarity: number;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlayerAchievement {
  id: string;
  playerId: string;
  achievementId: string;
  achievement: Achievement;
  dateUnlocked: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  winRate: number;
  averageScore: number;
  highestScore: number;
  currentStreak: number;
  bestStreak: number;
  ranking: number;
  elo: number;
}

interface PlayerData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  achievements: PlayerAchievement[];
  stats: PlayerStats;
  teams: { id: string; name: string }[];
}

const PlayerProfile: React.FC<{ playerId: string }> = ({ playerId }) => {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const response = await fetch(`/api/players/${playerId}`);
        if (!response.ok) throw new Error('Failed to fetch player data');
        const data = await response.json();
        setPlayer(data);
      } catch (err) {
        setError('Error loading player profile');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  if (loading) return <LinearProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!player) return <Typography>Player not found</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={player.avatar} sx={{ width: 100, height: 100 }} />
            <Box>
              <Typography variant="h4">{player.name}</Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Level {player.level}
              </Typography>
              <Box sx={{ width: 200, mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={(player.xp / player.xpToNextLevel) * 100}
                />
                <Typography variant="caption">
                  {player.xp}/{player.xpToNextLevel} XP to next level
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Stats Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <StatsIcon sx={{ mr: 1 }} />
                Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Games Played</Typography>
                  <Typography variant="h6">
                    {player.stats.gamesPlayed}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Win Rate</Typography>
                  <Typography variant="h6">{player.stats.winRate}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Average Score</Typography>
                  <Typography variant="h6">
                    {player.stats.averageScore}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Current Streak</Typography>
                  <Typography variant="h6">
                    {player.stats.currentStreak}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Ranking</Typography>
                  <Typography variant="h6">#{player.stats.ranking}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">ELO Rating</Typography>
                  <Typography variant="h6">{player.stats.elo}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <AchievementIcon sx={{ mr: 1 }} />
                Achievements
              </Typography>
              <AchievementsList achievements={player.achievements} />
            </CardContent>
          </Card>
        </Grid>

        {/* Teams Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <TeamIcon sx={{ mr: 1 }} />
                Teams
              </Typography>
              <Grid container spacing={2}>
                {player.teams.map((team) => (
                  <Grid item key={team.id}>
                    <Chip
                      label={team.name}
                      color="primary"
                      variant="outlined"
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlayerProfile;
