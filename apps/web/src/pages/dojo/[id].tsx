import DojoMasterDisplay, {
  type DojoMaster,
} from '@/components/dojo/DojoMasterDisplay';
import { type Dojo } from '@/services/dojoService';
import {
  LocationOn as LocationIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  styled,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatCard = styled(Card)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}));

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  score: number;
  rank: number;
  gamesPlayed: number;
  winRate: number;
}

interface RecentMatch {
  id: string;
  player1: string;
  player2: string;
  winner: string;
  score: string;
  date: string;
  duration: string;
}

const DojoDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;

  const [dojo, setDojo] = useState<Dojo | null>(null);
  const [master, setMaster] = useState<DojoMaster | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockMaster: DojoMaster = {
    id: '1',
    username: 'RyuKlaw',
    avatar: '/images/avatars/ryuklaw.jpg',
    title: 'The Undefeated',
    winCount: 47,
    lossCount: 3,
    winRate: 94,
    totalGames: 50,
    currentStreak: 12,
    bestStreak: 15,
    dojoControlDays: 28,
    achievements: [
      'Undefeated for 30 days',
      'Perfect Game Master',
      'Dojo Defender Elite',
    ],
  };

  const mockLeaderboard: LeaderboardEntry[] = [
    {
      id: '1',
      username: 'RyuKlaw',
      avatar: '/images/avatars/ryuklaw.jpg',
      score: 2847,
      rank: 1,
      gamesPlayed: 50,
      winRate: 94,
    },
    {
      id: '2',
      username: 'ShadowStriker',
      avatar: '/images/avatars/shadow.jpg',
      score: 2654,
      rank: 2,
      gamesPlayed: 42,
      winRate: 88,
    },
    {
      id: '3',
      username: 'CrimsonQueen',
      avatar: '/images/avatars/crimson.jpg',
      score: 2489,
      rank: 3,
      gamesPlayed: 38,
      winRate: 82,
    },
    {
      id: '4',
      username: 'NeonNinja',
      avatar: '/images/avatars/neon.jpg',
      score: 2312,
      rank: 4,
      gamesPlayed: 35,
      winRate: 77,
    },
    {
      id: '5',
      username: 'VoidWalker',
      avatar: '/images/avatars/void.jpg',
      score: 2187,
      rank: 5,
      gamesPlayed: 31,
      winRate: 74,
    },
  ];

  const mockRecentMatches: RecentMatch[] = [
    {
      id: '1',
      player1: 'RyuKlaw',
      player2: 'ShadowStriker',
      winner: 'RyuKlaw',
      score: '7-3',
      date: '2024-01-15',
      duration: '45 min',
    },
    {
      id: '2',
      player1: 'CrimsonQueen',
      player2: 'NeonNinja',
      winner: 'CrimsonQueen',
      score: '7-5',
      date: '2024-01-14',
      duration: '52 min',
    },
    {
      id: '3',
      player1: 'VoidWalker',
      player2: 'RyuKlaw',
      winner: 'RyuKlaw',
      score: '7-1',
      date: '2024-01-13',
      duration: '38 min',
    },
  ];

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        setDojo({
          id: id as string,
          name: 'The Jade Tiger',
          location: 'Brisbane, QLD',
          status: 'active',
          owner: 'JadeTigerCorp',
          createdAt: '2024-01-15',
        });
        setMaster(mockMaster);
        setLeaderboard(mockLeaderboard);
        setRecentMatches(mockRecentMatches);
        setLoading(false);
      }, 1000);
    }
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" py={5}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Dojo Information...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !dojo) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Failed to load dojo information'}
        </Alert>
        <Button onClick={() => router.back()}>Go Back</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          {dojo.name}
        </Typography>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Chip
            label={dojo.status}
            color={getStatusColor(dojo.status)}
            size="small"
          />
          <Box display="flex" alignItems="center" gap={1}>
            <LocationIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {dojo.location}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Established {new Date(dojo.createdAt).toLocaleDateString()}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
        {/* Dojo Master Display - Full Width */}
        <Box>
          {master && <DojoMasterDisplay master={master} dojoName={dojo.name} />}
        </Box>

        {/* Stats Overview */}
        <Box>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dojo Statistics
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 2,
                }}
              >
                <StatCard>
                  <Typography variant="h4" color="primary">
                    {leaderboard.length}
                  </Typography>
                  <Typography variant="caption">Active Players</Typography>
                </StatCard>
                <StatCard>
                  <Typography variant="h4" color="success.main">
                    {recentMatches.length}
                  </Typography>
                  <Typography variant="caption">Recent Matches</Typography>
                </StatCard>
                <StatCard>
                  <Typography variant="h4" color="warning.main">
                    {master?.dojoControlDays || 0}
                  </Typography>
                  <Typography variant="caption">Days Controlled</Typography>
                </StatCard>
                <StatCard>
                  <Typography variant="h4" color="info.main">
                    {master?.currentStreak || 0}
                  </Typography>
                  <Typography variant="caption">Current Streak</Typography>
                </StatCard>
              </Box>
            </CardContent>
          </StyledCard>
        </Box>

        {/* Leaderboard */}
        <Box>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrophyIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Leaderboard</Typography>
              </Box>
              <List>
                {leaderboard.map((entry, index) => (
                  <React.Fragment key={entry.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar src={entry.avatar} alt={entry.username}>
                          {entry.username.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight="bold">
                              #{entry.rank} {entry.username}
                            </Typography>
                            {entry.rank === 1 && (
                              <StarIcon
                                sx={{ color: '#ffd700', fontSize: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={`${entry.gamesPlayed} games • ${entry.winRate}% win rate`}
                      />
                      <Typography variant="h6" color="primary">
                        {entry.score}
                      </Typography>
                    </ListItem>
                    {index < leaderboard.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </StyledCard>
        </Box>

        {/* Recent Matches */}
        <Box>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Recent Matches</Typography>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 2,
                }}
              >
                {recentMatches.map((match) => (
                  <Box key={match.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <Typography variant="subtitle2" fontWeight="bold">
                            {match.player1} vs {match.player2}
                          </Typography>
                          <Chip
                            label={
                              match.winner === match.player1
                                ? 'P1 Win'
                                : 'P2 Win'
                            }
                            color={
                              match.winner === match.player1
                                ? 'success'
                                : 'error'
                            }
                            size="small"
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={1}
                        >
                          Score: {match.score} • Duration: {match.duration}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(match.date).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </StyledCard>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mt={4} justifyContent="center">
        <Button variant="contained" size="large" color="primary">
          Challenge Dojo Master
        </Button>
        <Button variant="outlined" size="large">
          View Tournament Schedule
        </Button>
        <Button variant="outlined" size="large">
          Join Dojo
        </Button>
      </Box>
    </Container>
  );
};

export default DojoDetailPage;
