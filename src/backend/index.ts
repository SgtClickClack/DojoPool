import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { environment as env } from '../config/environment.backend.js';

// Resolve ports and origins
const PORT = Number(process.env.API_PORT || process.env.PORT || 3002);
const CORS_ORIGIN = process.env.CORS_ORIGIN || env.CORS_ORIGIN || 'http://localhost:3000';

// Minimal in-memory match store (mock)
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

const matches = new Map<string, MatchDetail>();

function getOrCreateMatch(id: string): MatchDetail {
  if (matches.has(id)) return matches.get(id)!;
  const match: MatchDetail = {
    id,
    status: 'LIVE',
    players: {
      player1: { id: `p1-${id}`, name: 'Player A' },
      player2: { id: `p2-${id}`, name: 'Player B' },
    },
    score: { player1: 0, player2: 0 },
    tournament: { id: 't-1', name: 'DojoPool Open', round: 1, stage: 'Quarterfinal' },
    startTime: new Date().toISOString(),
  };
  matches.set(id, match);
  return match;
}

// In-memory player profile store (mock)
interface Achievement {
  id: string;
  name: string;
  description?: string;
  unlockedAt: string;
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

const players = new Map<string, PlayerProfile>();

function getOrCreatePlayer(id: string): PlayerProfile {
  if (players.has(id)) return players.get(id)!;
  // Use match mock to build some history
  const sampleMatch = getOrCreateMatch('1');
  const isP1 = Math.random() > 0.5;
  const username = `User-${id}`;
  const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
    username
  )}`;

  const wins = Math.floor(Math.random() * 20) + 5;
  const losses = Math.floor(Math.random() * 20) + 3;

  const profile: PlayerProfile = {
    id,
    username,
    avatarUrl,
    tournaments: [sampleMatch.tournament],
    matches: [
      {
        id: 'm-1',
        opponent: isP1 ? sampleMatch.players.player2 : sampleMatch.players.player1,
        result: isP1 ? 'WIN' : 'LOSS',
        score: sampleMatch.score,
        tournament: sampleMatch.tournament,
        playedAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    achievements: [
      {
        id: 'a-1',
        name: 'First Win',
        description: 'Win your first match',
        unlockedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    ],
    stats: { wins, losses },
  };
  players.set(id, profile);
  return profile;
}

// Express app
const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/v1/matches/:id – return match details
app.get('/api/v1/matches/:id', (req, res) => {
  const { id } = req.params;
  const match = getOrCreateMatch(id);
  res.json(match);
});

// GET /api/v1/players/:id – return public player profile
app.get('/api/v1/players/:id', (req, res) => {
  const { id } = req.params;
  const profile = getOrCreatePlayer(id);
  res.json(profile);
});

// HTTP server + Socket.io
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io events for match rooms and chat
io.on('connection', (socket) => {
  socket.on('joinMatch', (payload: { matchId: string; user?: { id?: string; name?: string } }) => {
    const { matchId, user } = payload || ({} as any);
    if (!matchId) return;
    socket.join(`match:${matchId}`);
    const name = user?.name || 'Spectator';
    io.to(`match:${matchId}`).emit('system', { type: 'join', user: name, ts: Date.now() });
  });

  socket.on('leaveMatch', (payload: { matchId: string; user?: { id?: string; name?: string } }) => {
    const { matchId, user } = payload || ({} as any);
    if (!matchId) return;
    socket.leave(`match:${matchId}`);
    const name = user?.name || 'Spectator';
    io.to(`match:${matchId}`).emit('system', { type: 'leave', user: name, ts: Date.now() });
  });

  socket.on('sendMessage', (payload: { matchId: string; message: string; user?: { id?: string; name?: string } }) => {
    const { matchId, message, user } = payload || ({} as any);
    if (!matchId || !message) return;
    const msg = {
      matchId,
      message,
      user: user?.name || 'Anonymous',
      ts: Date.now(),
    };
    io.to(`match:${matchId}`).emit('message', msg);
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`DojoPool backend running on http://localhost:${PORT}`);
});
