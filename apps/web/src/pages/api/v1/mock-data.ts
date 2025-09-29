export interface MockPlayer {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface MockGameSummary {
  id: string;
  opponentId: string;
  opponentName: string;
  opponentAvatarUrl?: string;
  status: 'pending' | 'active' | 'completed';
  startedAt: string;
  wager?: number;
  venueName?: string;
  gameType?: string;
  notes?: string;
}

const PLAYERS_KEY = '__dojopool_mock_players';
const GAMES_KEY = '__dojopool_mock_games';

const seedPlayers = (): MockPlayer[] => [
  {
    id: 'player-1',
    username: 'cueMaster',
    displayName: 'Cue Master',
    avatarUrl: 'https://avatars.dicebear.com/api/identicon/cue-master.svg',
  },
  {
    id: 'player-2',
    username: 'neonNinja',
    displayName: 'Neon Ninja',
    avatarUrl: 'https://avatars.dicebear.com/api/identicon/neon-ninja.svg',
  },
  {
    id: 'player-3',
    username: 'railRunner',
    displayName: 'Rail Runner',
    avatarUrl: 'https://avatars.dicebear.com/api/identicon/rail-runner.svg',
  },
  {
    id: 'player-4',
    username: 'hologramHustler',
    displayName: 'Hologram Hustler',
    avatarUrl: 'https://avatars.dicebear.com/api/identicon/hologram-hustler.svg',
  },
];

const seedGames = (players: MockPlayer[]): MockGameSummary[] => [
  {
    id: 'game-1',
    opponentId: players[0].id,
    opponentName: players[0].displayName,
    opponentAvatarUrl: players[0].avatarUrl,
    status: 'active',
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    wager: 25,
    gameType: 'EIGHT_BALL',
    venueName: 'Neon Galaxy Lounge',
  },
  {
    id: 'game-2',
    opponentId: players[1].id,
    opponentName: players[1].displayName,
    opponentAvatarUrl: players[1].avatarUrl,
    status: 'active',
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    wager: 0,
    gameType: 'NINE_BALL',
    venueName: 'Synthwave Billiards',
  },
];

export const getMockPlayers = (): MockPlayer[] => {
  const existing = (globalThis as any)[PLAYERS_KEY];
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }

  const seeded = seedPlayers();
  (globalThis as any)[PLAYERS_KEY] = seeded;
  return seeded;
};

export const getMockActiveGames = (): MockGameSummary[] => {
  const existing = (globalThis as any)[GAMES_KEY];
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }

  const seeded = seedGames(getMockPlayers());
  (globalThis as any)[GAMES_KEY] = seeded;
  return seeded;
};

export const addMockGame = (payload: {
  opponentId: string;
  gameType?: string;
  wager?: number;
  venueId?: string;
  notes?: string;
}): MockGameSummary => {
  const players = getMockPlayers();
  const opponent =
    players.find((player) => player.id === payload.opponentId) ?? players[0];

  const parsedWager = Number.isFinite(payload.wager)
    ? Math.max(0, Number(payload.wager))
    : undefined;

  const newGame: MockGameSummary = {
    id: `game-${Date.now()}`,
    opponentId: opponent.id,
    opponentName: opponent.displayName,
    opponentAvatarUrl: opponent.avatarUrl,
    status: 'active',
    startedAt: new Date().toISOString(),
    wager: parsedWager && parsedWager > 0 ? parsedWager : undefined,
    venueName: payload.venueId || 'Neon Galaxy Lounge',
    gameType: payload.gameType || 'EIGHT_BALL',
    notes: payload.notes,
  };

  const games = getMockActiveGames();
  (globalThis as any)[GAMES_KEY] = [newGame, ...games.slice(0, 9)];
  return newGame;
};

