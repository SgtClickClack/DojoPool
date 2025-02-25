import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  SportsEsports as GameIcon,
  EmojiEvents as TrophyIcon,
  Timeline as StatsIcon,
  Star as RatingIcon,
  Schedule as ScheduleIcon,
  Place as VenueIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  avgShotAccuracy: number;
  skillRating: number;
}

interface RecentGame {
  id: string;
  date: string;
  opponent: string;
  result: 'win' | 'loss';
  score: string;
  venue: string;
}

interface UpcomingEvent {
  id: string;
  type: 'game' | 'tournament';
  title: string;
  date: string;
  venue: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch player stats
      const statsResponse = await fetch('/api/game-analysis/player-stats');
      const statsData = await statsResponse.json();
      setStats({
        gamesPlayed: statsData.games_played,
        gamesWon: statsData.games_won,
        winRate: statsData.win_rate,
        avgShotAccuracy: statsData.avg_shot_accuracy,
        skillRating: statsData.skill_rating,
      });

      // Fetch recent games
      const gamesResponse = await fetch('/api/game/list?limit=5');
      const gamesData = await gamesResponse.json();
      setRecentGames(gamesData.games.map((game: any) => ({
        id: game.id,
        date: new Date(game.start_time).toLocaleDateString(),
        opponent: game.player1_id === user.id ? game.player2_username : game.player1_username,
        result: game.winner_id === user.id ? 'win' : 'loss',
        score: `${game.score_player1}-${game.score_player2}`,
        venue: game.venue_name,
      })));

      // Fetch upcoming events
      const eventsResponse = await fetch('/api/tournament/list?status=upcoming&limit=5');
      const eventsData = await eventsResponse.json();
      setUpcomingEvents(eventsData.tournaments.map((tournament: any) => ({
        id: tournament.id,
        type: 'tournament',
        title: tournament.name,
        date: new Date(tournament.start_date).toLocaleDateString(),
        venue: tournament.venue_name,
      })));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              Welcome back, {user?.username}!
            </Typography>
            <Typography color="textSecondary">
              Here's your gaming overview and recent activity.
            </Typography>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GameIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Games Played</Typography>
                  </Box>
                  <Typography variant="h4">{stats?.gamesPlayed || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrophyIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Win Rate</Typography>
                  </Box>
                  <Typography variant="h4">{stats?.winRate || 0}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <RatingIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Skill Rating</Typography>
                  </Box>
                  <Typography variant="h4">{stats?.skillRating || 1000}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                component={Link}
                href="/games/new"
                startIcon={<GameIcon />}
              >
                New Game
              </Button>
              <Button
                variant="contained"
                component={Link}
                href="/tournaments"
                startIcon={<TrophyIcon />}
              >
                Join Tournament
              </Button>
              <Button
                variant="contained"
                component={Link}
                href="/venues"
                startIcon={<VenueIcon />}
              >
                Find Venue
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Games */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Games
            </Typography>
            <List>
              {recentGames.map((game, index) => (
                <React.Fragment key={game.id}>
                  <ListItem>
                    <ListItemIcon>
                      <GameIcon color={game.result === 'win' ? 'success' : 'error'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`vs ${game.opponent}`}
                      secondary={`${game.date} • ${game.venue} • Score: ${game.score}`}
                    />
                  </ListItem>
                  {index < recentGames.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {recentGames.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No recent games"
                    secondary="Start playing to see your game history"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Events
            </Typography>
            <List>
              {upcomingEvents.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={event.title}
                      secondary={`${event.date} • ${event.venue}`}
                    />
                  </ListItem>
                  {index < upcomingEvents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {upcomingEvents.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No upcoming events"
                    secondary="Check the tournaments page for new events"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 