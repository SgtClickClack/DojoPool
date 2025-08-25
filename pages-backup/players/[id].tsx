import {
  Avatar,
  Box,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import AchievementsList from '../../src/components/Profile/AchievementsList';

interface TournamentInfo {
  id: string;
  name: string;
  round?: number;
  stage?: string;
}
interface MatchScore {
  player1: number;
  player2: number;
}
interface PlayerInfo {
  id: string;
  name?: string;
  avatarUrl?: string;
}
interface Achievement {
  id: string;
  dateUnlocked: string;
  achievement: { name: string; description?: string; icon?: string };
}
interface PlayerMatchSummary {
  id: string;
  opponent: PlayerInfo;
  result: 'WIN' | 'LOSS';
  score: MatchScore;
  tournament?: TournamentInfo;
  playedAt?: string;
}
interface PlayerProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  tournaments: TournamentInfo[];
  matches: PlayerMatchSummary[];
  achievements: Achievement[];
  stats: { wins: number; losses: number };
}

export default function PlayerProfilePage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${base}/api/v1/players/${encodeURIComponent(id)}`.replace(
      '//api',
      '/api'
    );
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load player ${id}`);
        return r.json();
      })
      .then((data: PlayerProfile) => {
        if (!cancelled) {
          setProfile(data);
          setError(null);
        }
      })
      .catch(
        (e) => !cancelled && setError(e?.message || 'Error loading player')
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const winRate = profile
    ? Math.round(
        (profile.stats.wins /
          Math.max(1, profile.stats.wins + profile.stats.losses)) *
          100
      )
    : 0;

  return (
    <>
      <Head>
        <title>
          {profile ? `${profile.username} — Profile` : 'Player Profile'} |
          DojoPool
        </title>
      </Head>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : !profile ? (
          <Typography>Player not found.</Typography>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
              gap: 3,
            }}
          >
            {/* Left column: Identity and stats */}
            <Box>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    src={profile.avatarUrl}
                    sx={{ width: 80, height: 80 }}
                  />
                  <Box>
                    <Typography variant="h5">{profile.username}</Typography>
                    <Typography color="text.secondary">
                      ID: {profile.id}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4">{profile.stats.wins}</Typography>
                      <Typography color="text.secondary">Wins</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box textAlign="center">
                      <Typography variant="h4">
                        {profile.stats.losses}
                      </Typography>
                      <Typography color="text.secondary">Losses</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box textAlign="center">
                      <Typography variant="h5">{winRate}%</Typography>
                      <Typography color="text.secondary">Win Rate</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Achievements
                </Typography>
                <AchievementsList achievements={profile.achievements} />
              </Paper>
            </Box>

            {/* Right column: Match history and tournaments */}
            <Box>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Match History
                </Typography>
                {profile.matches.length === 0 ? (
                  <Typography color="text.secondary">
                    No matches recorded.
                  </Typography>
                ) : (
                  <List>
                    {profile.matches.map((m) => (
                      <ListItem key={m.id} alignItems="flex-start" divider>
                        <ListItemAvatar>
                          <Avatar src={m.opponent.avatarUrl}>
                            {m.opponent.name?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Chip
                                size="small"
                                color={
                                  m.result === 'WIN' ? 'success' : 'default'
                                }
                                label={m.result}
                              />
                              <Typography>
                                {m.tournament?.name || 'Friendly Match'}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                component="span"
                                color="text.secondary"
                              >
                                vs{' '}
                                <Link
                                  href={`/players/${encodeURIComponent(
                                    m.opponent.id ||
                                      m.opponent.name ||
                                      'unknown'
                                  )}`}
                                >
                                  {m.opponent.name || m.opponent.id}
                                </Link>{' '}
                                • Score {m.score.player1} - {m.score.player2}
                              </Typography>
                              {m.playedAt && (
                                <Typography
                                  component="span"
                                  color="text.secondary"
                                >
                                  {' '}
                                  — {new Date(m.playedAt).toLocaleString()}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>

              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Tournaments
                </Typography>
                {profile.tournaments.length === 0 ? (
                  <Typography color="text.secondary">
                    No tournaments yet.
                  </Typography>
                ) : (
                  <List>
                    {profile.tournaments.map((t) => (
                      <ListItem key={t.id} divider>
                        <ListItemText
                          primary={t.name}
                          secondary={[
                            t.stage,
                            t.round ? `Round ${t.round}` : '',
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
