import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { environment as env } from '../config/environment.backend.js';

// Resolve ports and origins
const PORT = Number(process.env.API_PORT || process.env.PORT || 3002);
const CORS_ORIGIN =
  process.env.CORS_ORIGIN || env.CORS_ORIGIN || 'http://localhost:3000';

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
    tournament: {
      id: 't-1',
      name: 'DojoPool Open',
      round: 1,
      stage: 'Quarterfinal',
    },
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
        opponent: isP1
          ? sampleMatch.players.player2
          : sampleMatch.players.player1,
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

// In-memory challenge store (mock)
interface Challenge {
  id: string;
  challengerId: string;
  defenderId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  stakeCoins: number;
  createdAt: string;
  updatedAt: string;
}

const challenges = new Map<string, Challenge>();

function getOrCreateChallenge(id: string): Challenge {
  if (challenges.has(id)) return challenges.get(id)!;
  const challenge: Challenge = {
    id,
    challengerId: 'challenger-1',
    defenderId: 'defender-1',
    status: 'PENDING',
    stakeCoins: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  challenges.set(id, challenge);
  return challenge;
}

// Express app
const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Challenge endpoints
app.post('/api/v1/challenges', (req, res) => {
  try {
    const { challengerId, defenderId, stakeCoins = 0 } = req.body;

    if (!challengerId || !defenderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const challengeId = `challenge-${Date.now()}`;
    const challenge: Challenge = {
      id: challengeId,
      challengerId,
      defenderId,
      status: 'PENDING',
      stakeCoins,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    challenges.set(challengeId, challenge);

    // Emit real-time challenge notification only to the defender
    io.to(`user:${defenderId}`).emit('new_challenge', {
      challengeId,
      challengerId,
      defenderId,
      stakeCoins,
      createdAt: challenge.createdAt,
    });

    res.status(201).json(challenge);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/v1/challenges/:challengeId', (req, res) => {
  try {
    const { challengeId } = req.params;
    const { status } = req.body;

    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const challenge = challenges.get(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    challenge.status = status;
    challenge.updatedAt = new Date().toISOString();

    // Emit real-time challenge response only to the challenger
    io.to(`user:${challenge.challengerId}`).emit('challenge_response', {
      challengeId,
      status,
      updatedAt: challenge.updatedAt,
    });

    res.json(challenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/v1/challenges', (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const userChallenges = Array.from(challenges.values()).filter(
      (challenge) =>
        challenge.challengerId === userId || challenge.defenderId === userId
    );

    res.json(userChallenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
  console.log(`Client connected: ${socket.id}`);

  // Store user socket mapping for targeted notifications
  socket.on('register_user', (data: { userId: string }) => {
    const { userId } = data;
    if (userId) {
      socket.data.userId = userId;
      socket.join(`user:${userId}`);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    }
  });

  socket.on(
    'joinMatch',
    (payload: { matchId: string; user?: { id?: string; name?: string } }) => {
      const { matchId, user } = payload || ({} as any);
      if (!matchId) return;
      socket.join(`match:${matchId}`);
      const name = user?.name || 'Spectator';
      io.to(`match:${matchId}`).emit('system', {
        type: 'join',
        user: name,
        ts: Date.now(),
      });
    }
  );

  socket.on(
    'leaveMatch',
    (payload: { matchId: string; user?: { id?: string; name?: string } }) => {
      const { matchId, user } = payload || ({} as any);
      if (!matchId) return;
      socket.leave(`match:${matchId}`);
      const name = user?.name || 'Spectator';
      io.to(`match:${matchId}`).emit('system', {
        type: 'leave',
        user: name,
        ts: Date.now(),
      });
    }
  );

  socket.on(
    'sendMessage',
    (payload: {
      matchId: string;
      message: string;
      user?: { id?: string; name?: string };
    }) => {
      const { matchId, message, user } = payload || ({} as any);
      if (!matchId || !message) return;
      const msg = {
        matchId,
        message,
        user: user?.name || 'Anonymous',
        ts: Date.now(),
      };
      io.to(`match:${matchId}`).emit('message', msg);
    }
  );

  // Player position update events
  socket.on('join', (data: { room: string }) => {
    const { room } = data || {};
    if (room) {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
      socket.emit('room_joined', { room });
    }
  });

  socket.on('leave', (data: { room: string }) => {
    const { room } = data || {};
    if (room) {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
      socket.emit('room_left', { room });
    }
  });

  socket.on('request_player_positions', () => {
    // For now, emit mock player positions
    // In production, this would fetch from a database or cache
    const mockPositions = [
      {
        playerId: 'player-1',
        playerName: 'RyuKlaw',
        avatar: '👤',
        clan: 'Crimson Monkey',
        lat: -27.4698 + (Math.random() - 0.5) * 0.01,
        lng: 153.0251 + (Math.random() - 0.5) * 0.01,
        timestamp: Date.now(),
        isOnline: true,
      },
      {
        playerId: 'player-2',
        playerName: 'JadeTiger',
        avatar: '👤',
        clan: 'Emerald Dragon',
        lat: -27.4698 + (Math.random() - 0.5) * 0.01,
        lng: 153.0251 + (Math.random() - 0.5) * 0.01,
        timestamp: Date.now(),
        isOnline: true,
      },
      {
        playerId: 'player-3',
        playerName: 'ShadowStrike',
        avatar: '👤',
        clan: 'Night Wolf',
        lat: -27.4698 + (Math.random() - 0.5) * 0.01,
        lng: 153.0251 + (Math.random() - 0.5) * 0.01,
        timestamp: Date.now(),
        isOnline: true,
      },
    ];

    socket.emit('player_position_update', mockPositions);
  });

  socket.on('update_player_position', (position: any) => {
    console.log(`Player position update from ${socket.id}:`, position);

    // Broadcast the position update to all clients in the world_map room
    // In production, you might want to validate and store the position
    io.to('world_map').emit('player_position_update', [position]);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Add disconnect method to socket for cleanup
declare module 'socket.io' {
  interface Socket {
    disconnect(): void;
  }
}

// --- World Hub Map: Background broadcasters ---
// Simulate live player movement and dojo status updates

// Player position simulation state
interface SimPlayer {
  id: string;
  name: string;
  clan: string;
  avatar: string;
  lat: number;
  lng: number;
}

const WORLD_ROOM = 'world_map';
const BASE_LAT = -27.4698;
const BASE_LNG = 153.0251;

const simPlayers: SimPlayer[] = [
  {
    id: 'player-1',
    name: 'RyuKlaw',
    clan: 'Crimson Monkey',
    avatar: '👤',
    lat: BASE_LAT,
    lng: BASE_LNG,
  },
  {
    id: 'player-2',
    name: 'JadeTiger',
    clan: 'Emerald Dragon',
    avatar: '👤',
    lat: BASE_LAT + 0.001,
    lng: BASE_LNG - 0.001,
  },
  {
    id: 'player-3',
    name: 'ShadowStrike',
    clan: 'Night Wolf',
    avatar: '👤',
    lat: BASE_LAT - 0.001,
    lng: BASE_LNG + 0.001,
  },
];

function jitter(value: number, amount = 0.0015): number {
  return value + (Math.random() - 0.5) * amount;
}

function emitSimulatedPlayerPositions() {
  const positions = simPlayers.map((p) => {
    // Random walk around base
    p.lat = jitter(p.lat);
    p.lng = jitter(p.lng);
    return {
      playerId: p.id,
      playerName: p.name,
      avatar: p.avatar,
      clan: p.clan,
      lat: p.lat,
      lng: p.lng,
      timestamp: Date.now(),
      isOnline: true,
    };
  });
  // Broadcast to all clients to ensure reception even if not in world_map room
  io.emit('player_position_update', positions);
}

// Dojo status simulation state
interface DojoSimState {
  id: string;
  status: 'controlled' | 'rival' | 'neutral';
  controller: string;
  influence: number; // 0-100
  players: number;
}

const dojoControllers = [
  'Phoenix Warriors',
  'Shadow Clan',
  'Thunder Dragon',
  'Crimson Monkey',
];

const dojosState: DojoSimState[] = [
  {
    id: '1',
    status: 'controlled',
    controller: 'Phoenix Warriors',
    influence: 85,
    players: 12,
  },
  {
    id: '2',
    status: 'rival',
    controller: 'Shadow Clan',
    influence: 72,
    players: 8,
  },
  {
    id: '3',
    status: 'neutral',
    controller: 'None',
    influence: 45,
    players: 15,
  },
  {
    id: '4',
    status: 'controlled',
    controller: 'Phoenix Warriors',
    influence: 93,
    players: 6,
  },
];

function stepDojoState() {
  // Slightly adjust players and influence; occasionally flip control
  dojosState.forEach((d) => {
    // +/- small random change
    d.influence = Math.max(
      0,
      Math.min(100, d.influence + Math.floor((Math.random() - 0.5) * 6))
    );
    d.players = Math.max(0, d.players + Math.floor((Math.random() - 0.5) * 3));

    // 10% chance to flip control
    if (Math.random() < 0.1) {
      const oldController = d.controller;
      // Pick a new controller different from current, or set to None when neutral
      const newController =
        Math.random() < 0.2
          ? 'None'
          : dojoControllers[Math.floor(Math.random() * dojoControllers.length)];
      d.controller = newController;
      d.status =
        newController === 'None'
          ? 'neutral'
          : Math.random() < 0.5
          ? 'controlled'
          : 'rival';

      // If captured, also emit a general game_update for listeners (optional)
      io.to(WORLD_ROOM).emit('game_update', {
        type: 'dojo_captured',
        dojoId: d.id,
        newStatus: d.status,
        newController: d.controller,
        newInfluence: d.influence,
      });
    }
  });

  io.to(WORLD_ROOM).emit('dojo_status_update', {
    dojos: dojosState.map((d) => ({
      id: d.id,
      status: d.status,
      controller: d.controller,
      influence: d.influence,
      players: d.players,
    })),
  });
}

// Start background intervals
const PLAYER_BROADCAST_MS = Number(process.env.PLAYER_BROADCAST_MS || 4000);
const DOJO_BROADCAST_MS = Number(process.env.DOJO_BROADCAST_MS || 7000);

setInterval(emitSimulatedPlayerPositions, PLAYER_BROADCAST_MS);
setInterval(stepDojoState, DOJO_BROADCAST_MS);

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`DojoPool backend running on http://localhost:${PORT}`);
});
