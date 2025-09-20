import { apiClient } from '@/services/APIService';
import {
  Box,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import io, { type Socket } from 'socket.io-client';

interface PlayerInfo {
  id: string;
  name: string;
  avatarUrl?: string;
}
interface MatchScore {
  player1: number;
  player2: number;
}
interface TournamentInfo {
  id: string;
  name: string;
  round?: number;
  stage?: string;
}
interface MatchDetail {
  id: string;
  status: 'PENDING' | 'LIVE' | 'COMPLETED';
  players: { player1: PlayerInfo; player2: PlayerInfo };
  score: MatchScore;
  tournament: TournamentInfo;
  startTime?: string;
}

const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3002';

export default function LiveMatchPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Establish socket connection once
  const socket: Socket | null = useMemo(() => {
    try {
      const s = io(wsUrl, { withCredentials: true });
      return s;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);

    apiClient
      .get(`/matches/${id}`)
      .then((response) => {
        if (!cancelled) {
          const data = response.data;
          // Map backend response (playerA/playerB, scoreA/scoreB) to UI shape
          const mapped: MatchDetail = {
            id: data.id,
            status: (data.status as MatchDetail['status']) ?? 'LIVE',
            players: {
              player1: { id: data.playerA?.id, name: data.playerA?.username },
              player2: { id: data.playerB?.id, name: data.playerB?.username },
            },
            score: {
              player1: data.scoreA ?? 0,
              player2: data.scoreB ?? 0,
            },
            tournament: {
              id: data.tournament?.id,
              name: data.tournament?.name ?? 'Tournament',
              stage: data.round ? `Round ${data.round}` : undefined,
            },
            startTime: data.startTime ?? undefined,
          };
          setMatch(mapped);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const errorMessage =
            err instanceof Error ? err.message : 'Error loading match';
          setError(errorMessage);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('joinMatch', { matchId: id });
    return () => {
      socket.emit('leaveMatch', { matchId: id });
      socket.disconnect();
    };
  }, [socket, id]);

  return (
    <>
      <Head>
        <title>Live Match {id ? `#${id}` : ''} — DojoPool</title>
      </Head>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : match ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 3,
            }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                {match.tournament.name} — {match.tournament.stage || 'Match'}
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Match ID: {match.id} • Status: {match.status}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ flex: 1, pr: 2 }}>
                  <Typography variant="h6">
                    <Link
                      href={`/players/${encodeURIComponent(
                        match.players.player1.id || match.players.player1.name
                      )}`}
                    >
                      {match.players.player1.name}
                    </Link>
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4">{match.score.player1}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ flex: 1, pr: 2 }}>
                  <Typography variant="h6">
                    <Link
                      href={`/players/${encodeURIComponent(
                        match.players.player2.id || match.players.player2.name
                      )}`}
                    >
                      {match.players.player2.name}
                    </Link>
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4">{match.score.player2}</Typography>
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 2, height: { md: '100%' } }}>
              {id && socket ? (
                <Box
                  sx={{ p: 2, border: '1px dashed #ccc', textAlign: 'center' }}
                >
                  Chat feature coming soon
                </Box>
              ) : (
                <Typography color="text.secondary">
                  Connecting chat...
                </Typography>
              )}
            </Paper>
          </Box>
        ) : (
          <Typography>No match found.</Typography>
        )}
      </Container>
    </>
  );
}
