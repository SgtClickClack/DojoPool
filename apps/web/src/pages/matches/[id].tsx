import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { Box, Container, Paper, Typography, CircularProgress, Divider } from '@mui/material';
import ChatBox from '@/../../components/live/ChatBox';

interface PlayerInfo { id: string; name: string; avatarUrl?: string }
interface MatchScore { player1: number; player2: number }
interface TournamentInfo { id: string; name: string; round?: number; stage?: string }
interface MatchDetail {
  id: string;
  status: 'PENDING' | 'LIVE' | 'COMPLETED' | string;
  players: { player1: PlayerInfo; player2: PlayerInfo };
  score: MatchScore;
  tournament: TournamentInfo;
  startTime?: string;
}

const wsUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const MatchPage: React.FC = () => {
  const { id: matchId } = useParams();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socket: Socket | null = useMemo(() => {
    try {
      const s = io(wsUrl, { withCredentials: true });
      return s;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/matches/${matchId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load match ${matchId}`);
        return r.json();
      })
      .then((data: any) => {
        if (!cancelled) {
          const mapped: MatchDetail = {
            id: data.id,
            status: (data.status as any) ?? 'LIVE',
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
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || 'Error loading match');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    if (!socket || !matchId) return;
    socket.emit('joinMatch', { matchId });
    return () => {
      socket.emit('leaveMatch', { matchId });
      socket.disconnect();
    };
  }, [socket, matchId]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Link to="/tournaments">← Back to Tournaments</Link>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : match ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {match.tournament.name} — {match.tournament.stage || 'Match'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Match ID: {match.id} • Status: {match.status}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1, pr: 2 }}>
                <Typography variant="h6">{match.players.player1.name}</Typography>
              </Box>
              <Box>
                <Typography variant="h4">{match.score.player1}</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1, pr: 2 }}>
                <Typography variant="h6">{match.players.player2.name}</Typography>
              </Box>
              <Box>
                <Typography variant="h4">{match.score.player2}</Typography>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 2, height: { md: '100%' } }}>
            {matchId && socket ? (
              <ChatBox socket={socket} matchId={matchId} />
            ) : (
              <Typography color="text.secondary">Connecting chat...</Typography>
            )}
          </Paper>
        </Box>
      ) : (
        <Typography>No match found.</Typography>
      )}
    </Container>
  );
};

export default MatchPage;
