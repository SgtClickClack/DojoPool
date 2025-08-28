'use client';

import {
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  SportsBaseball as SportsIcon,
  Timer as TimerIcon,
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
  Container,
  Grid,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  getActiveSeason,
  getSeasonalClanLeaderboard,
  type Season,
  type SeasonalLeaderboard,
} from '../api/seasonsApi';
import { showError } from '../store';

const SeasonsPage: React.FC = () => {
  const [season, setSeason] = useState<Season | null>(null);
  const [leaderboard, setLeaderboard] = useState<SeasonalLeaderboard | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const loadSeasonData = async () => {
    try {
      setLoading(true);
      const [seasonData, leaderboardData] = await Promise.all([
        getActiveSeason(),
        getSeasonalClanLeaderboard(20), // Get top 20 clans
      ]);

      setSeason(seasonData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading season data:', error);
      showError('Failed to load season data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeasonData();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!season || season.status !== 'active') return;

    const calculateTimeLeft = () => {
      const endDate = new Date(season.endDate).getTime();
      const now = new Date().getTime();
      const difference = endDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [season]);

  const formatTimeLeft = () => {
    if (!timeLeft) return 'Ended';

    const { days, hours, minutes, seconds } = timeLeft;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const getSeasonStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'primary';
      case 'ended':
        return 'default';
      default:
        return 'default';
    }
  };

  const getSeasonStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <SportsIcon />;
      case 'upcoming':
        return <CalendarIcon />;
      case 'ended':
        return <TrophyIcon />;
      default:
        return <CalendarIcon />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="h6" gutterBottom align="center">
              Loading Season Data...
            </Typography>
            <LinearProgress />
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          🏆 Seasonal Championship
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Compete with clans for seasonal glory and exclusive rewards!
        </Typography>
      </Box>

      {/* Current Season Status */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        {season ? (
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box textAlign="center">
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontWeight: 'bold' }}
                >
                  {season.name}
                </Typography>
                <Typography variant="h6" color="primary" gutterBottom>
                  {season.theme}
                </Typography>
                {season.description && (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {season.description}
                  </Typography>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    mb: 2,
                  }}
                >
                  {getSeasonStatusIcon(season.status)}
                  <Chip
                    label={season.status.toUpperCase()}
                    color={getSeasonStatusColor(season.status) as any}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {new Date(season.startDate).toLocaleDateString()} -{' '}
                  {new Date(season.endDate).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  bgcolor:
                    season.status === 'active' ? 'success.main' : 'grey.100',
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <TimerIcon
                    sx={{
                      fontSize: 48,
                      mb: 2,
                      color:
                        season.status === 'active' ? 'white' : 'text.primary',
                    }}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 'bold',
                      color:
                        season.status === 'active' ? 'white' : 'text.primary',
                      mb: 1,
                    }}
                  >
                    {season.status === 'active'
                      ? formatTimeLeft()
                      : 'Season Complete'}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color:
                        season.status === 'active' ? 'white' : 'text.secondary',
                    }}
                  >
                    {season.status === 'active'
                      ? 'Until Season Ends'
                      : 'Check Back Next Season!'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            <Typography variant="h6">🏖️ Off-Season</Typography>
            <Typography>
              No active season currently. Check back later for the next seasonal
              championship!
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Clan Leaderboard */}
      {leaderboard && season && season.status === 'active' && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              🏅 Clan Leaderboard
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`Season: ${leaderboard.seasonName}`}
                color="primary"
                variant="outlined"
              />
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadSeasonData}
                variant="outlined"
                size="small"
              >
                Refresh
              </Button>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Last updated: {new Date(leaderboard.lastUpdated).toLocaleString()}
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Clan</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Seasonal Points
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Win Rate
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Territories
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Members
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.clans.map((clan, index) => (
                  <TableRow
                    key={clan.clanId}
                    sx={{
                      '&:nth-of-type(odd)': { bgcolor: 'grey.25' },
                      ...(index < 3 && {
                        bgcolor:
                          index === 0
                            ? 'gold'
                            : index === 1
                              ? 'silver'
                              : 'bronze',
                        '&:nth-of-type(odd)': {
                          bgcolor:
                            index === 0
                              ? 'gold'
                              : index === 1
                                ? 'silver'
                                : 'bronze',
                        },
                      }),
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {index < 3 && (
                          <TrophyIcon
                            sx={{
                              color:
                                index === 0
                                  ? 'gold'
                                  : index === 1
                                    ? 'silver'
                                    : '#CD7F32',
                            }}
                          />
                        )}
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          #{clan.rank}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Avatar
                          src={clan.avatarUrl}
                          sx={{ width: 40, height: 40 }}
                        >
                          <GroupIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 'medium' }}
                          >
                            {clan.clanName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            [{clan.clanTag}]
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 'bold', color: 'primary.main' }}
                      >
                        {clan.seasonalPoints.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1">
                        {clan.totalMatches > 0
                          ? `${Math.round((clan.wonMatches / clan.totalMatches) * 100)}%`
                          : '0%'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {clan.wonMatches}/{clan.totalMatches} wins
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1">
                        {clan.territoriesControlled}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1">{clan.members}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {leaderboard.clans.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No clans have earned seasonal points yet this season!
            </Alert>
          )}
        </Paper>
      )}

      {/* Off-season message when no leaderboard */}
      {(!leaderboard || !season || season.status !== 'active') && !loading && (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            🏖️ Seasonal Competition Paused
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Seasonal rankings and competitions are currently paused. Join
            tournaments and compete in matches to earn points when the next
            season begins!
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default SeasonsPage;
