import { jest } from '@jest/globals';
import { vi } from 'vitest';

interface MockResponse<T = unknown> {
  ok: boolean;
  status: number;
  json: () => Promise<T>;
  text: () => Promise<string>;
}

export const createMockResponse = <T>(
  data: T,
  status = 200
): MockResponse<T> => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

export const mockFetch = <T>(response: MockResponse<T>): jest.Mock => {
  return jest.fn().mockResolvedValue(response);
};

export const mockGameService = {
  getGameState: vi.fn().mockResolvedValue({
    id: 'game-1',
    status: 'in_progress',
    currentPlayer: 'player-1',
    balls: [
      { number: 1, position: { x: 100, y: 100 }, pocketed: false },
      { number: 2, position: { x: 200, y: 200 }, pocketed: false },
    ],
  }),
  updateGameState: vi.fn().mockResolvedValue(true),
  processUpdate: vi.fn().mockResolvedValue(true),
  getMissedUpdates: vi.fn().mockResolvedValue([]),
};

export const mockTournamentService = {
  getTournamentState: vi.fn().mockResolvedValue({
    id: 'tournament-1',
    status: 'in_progress',
    matches: [
      {
        id: 'match-1',
        player1: { id: 'player-1', name: 'Player 1' },
        player2: { id: 'player-2', name: 'Player 2' },
        status: 'in_progress',
        score: '3-2',
      },
    ],
  }),
  updateTournamentState: vi.fn().mockResolvedValue(true),
  processBatchUpdates: vi.fn().mockResolvedValue(true),
  batchUpdateMatches: vi.fn().mockResolvedValue(true),
  processTournamentData: vi.fn().mockResolvedValue(true),
};

export const mockWebSocket = {
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  reset: () => {
    vi.clearAllMocks();
  },
  simulateDisconnect: () => {
    mockWebSocket.emit('disconnect', { reason: 'network_error' });
  },
  simulateReconnect: () => {
    mockWebSocket.emit('connect');
  },
};

export const mockPresenceService = {
  getPlayerPresence: vi.fn().mockResolvedValue({
    playerId: 'player-1',
    playerName: 'Player 1',
    status: 'online',
    lastSeen: new Date().toISOString(),
    currentTable: 'table-1',
  }),
  updatePlayerPresence: vi.fn().mockResolvedValue(true),
  getVenueCapacity: vi.fn().mockResolvedValue({
    currentPlayers: 15,
    maxCapacity: 20,
    tablesInUse: 5,
    availableTables: 3,
  }),
};

export const mockGameState = {
  id: 'game-1',
  status: 'in_progress',
  currentPlayer: 'player-1',
  balls: [
    { number: 1, position: { x: 100, y: 100 }, pocketed: false },
    { number: 2, position: { x: 200, y: 200 }, pocketed: false },
  ],
  analyzeShot: vi.fn().mockResolvedValue({
    success: true,
    path: [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
    ],
    collisions: [],
  }),
  animateShot: vi.fn().mockResolvedValue(true),
  analyzeComplexShot: vi.fn().mockResolvedValue({
    success: true,
    paths: [
      [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
      ],
      [
        { x: 200, y: 200 },
        { x: 300, y: 300 },
      ],
    ],
    collisions: [],
  }),
  updateState: vi.fn().mockResolvedValue(true),
  processUpdate: vi.fn().mockResolvedValue(true),
  startGame: vi.fn().mockResolvedValue(true),
  endGame: vi.fn().mockResolvedValue(true),
  cleanup: vi.fn().mockResolvedValue(true),
  serializeState: vi.fn().mockReturnValue(
    JSON.stringify({
      id: 'game-1',
      status: 'in_progress',
      currentPlayer: 'player-1',
      balls: [
        { number: 1, position: { x: 100, y: 100 }, pocketed: false },
        { number: 2, position: { x: 200, y: 200 }, pocketed: false },
      ],
    })
  ),
};
