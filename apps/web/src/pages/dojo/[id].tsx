import {
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

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

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mockLeaderboard: LeaderboardEntry[] = [
    {
      id: '1',
      username: 'RyuKlaw',
      avatar: '/images/avatars/ryuklaw.jpg',
      score: 2850,
      rank: 1,
      gamesPlayed: 150,
      winRate: 94,
    },
    {
      id: '2',
      username: 'ShadowStriker',
      avatar: '/images/avatars/shadowstriker.jpg',
      score: 2720,
      rank: 2,
      gamesPlayed: 120,
      winRate: 88,
    },
  ];

  const mockRecentMatches: RecentMatch[] = [
    {
      id: '1',
      player1: 'RyuKlaw',
      player2: 'ShadowStriker',
      winner: 'RyuKlaw',
      score: '7-3',
      date: '2024-03-15',
      duration: '45 min',
    },
  ];

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLeaderboard(mockLeaderboard);
      setRecentMatches(mockRecentMatches);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Dojo #{id}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Pool Hall & Training Ground
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Leaderboard */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              transition:
                'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 8 },
            }}
          >
            <CardContent>
              <Typography variant="h5" gutterBottom>
                <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Leaderboard
              </Typography>
              <List>
                {leaderboard.map((entry) => (
                  <ListItem key={entry.id} divider>
                    <ListItemAvatar>
                      <Avatar src={entry.avatar}>{entry.username[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={entry.username}
                      secondary={`Rank ${entry.rank} • Score ${entry.score}`}
                    />
                    <Chip
                      label={`${entry.winRate}%`}
                      color="primary"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Matches */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              transition:
                'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 8 },
            }}
          >
            <CardContent>
              <Typography variant="h5" gutterBottom>
                <TrendingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Matches
              </Typography>
              <List>
                {recentMatches.map((match) => (
                  <ListItem key={match.id} divider>
                    <ListItemText
                      primary={`${match.player1} vs ${match.player2}`}
                      secondary={`${match.score} • ${match.date} • ${match.duration}`}
                    />
                    <Chip label={match.winner} color="success" size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DojoDetailPage;
