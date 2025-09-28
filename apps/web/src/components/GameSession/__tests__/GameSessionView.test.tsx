import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GameSessionView from '../GameSessionView';
import type { GameSessionViewProps } from '../GameSessionView';
import { GameSessionStatus, GameType } from '@/types/gameSession';

const theme = createTheme();
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const mockRecordShot = vi.fn();
const mockRecordFoul = vi.fn();
const mockEndSession = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', username: 'cyber-player' },
  }),
}));

const baseSession = {
  id: 'session-1',
  gameId: 'game-1',
  status: GameSessionStatus.ACTIVE,
  gameType: GameType.EIGHT_BALL,
  rules: {},
  startTime: '2024-01-01T00:00:00Z',
  lastUpdated: '2024-01-01T00:10:00Z',
  playerIds: ['user-1', 'user-2'],
  currentPlayerId: 'user-1',
  ballStates: { cue: 'on_table' },
  fouls: { 'user-1': 0, 'user-2': 1 },
  score: { 'user-1': 3, 'user-2': 2 },
  events: [],
  totalShots: 12,
  totalFouls: 1,
  totalFrames: 1,
  peakViewers: 20,
  latencyStats: {},
  droppedFrames: 0,
};

vi.mock('@/hooks/useGameSession', () => ({
  useGameSession: () => ({
    gameSession: baseSession,
    loading: false,
    error: null,
    updateSession: vi.fn(),
    recordShot: mockRecordShot,
    recordFoul: mockRecordFoul,
    endSession: mockEndSession,
    refreshSession: vi.fn(),
  }),
}));

vi.mock('@/services/APIService', () => ({
  pauseMatch: vi.fn(),
  resumeMatch: vi.fn(),
}));

vi.mock('@/services/WebSocketService', () => ({
  websocketService: {
    connectToMatch: vi.fn(),
    joinMatchRoom: vi.fn(),
    leaveMatchRoom: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  },
}));

describe('GameSessionView', () => {
  const defaultProps: GameSessionViewProps = {
    sessionId: 'session-1',
    match: {
      id: 'match-1',
      player1Id: 'user-1',
      player2Id: 'user-2',
      status: 'ACTIVE',
      score1: 3,
      score2: 2,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:10:00Z',
    },
    currentUser: {
      id: 'user-1',
      email: 'player@example.com',
      username: 'cyber-player',
      profile: { displayName: 'Cyber Player' },
    },
    onShot: vi.fn(),
    onEndGame: vi.fn(),
    onLeave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders session summary', () => {
    renderWithTheme(<GameSessionView {...defaultProps} />);

    expect(screen.getByText('EIGHT_BALL Game Session')).toBeInTheDocument();
    expect(screen.getByText('12 shots')).toBeInTheDocument();
    expect(screen.getByText('1 fouls')).toBeInTheDocument();
  });

  it('shows player information cards', () => {
    renderWithTheme(<GameSessionView {...defaultProps} />);

    const playerChips = screen.getAllByText('user-1');
    const opponentChips = screen.getAllByText('user-2');

    expect(playerChips.length).toBeGreaterThan(0);
    expect(opponentChips.length).toBeGreaterThan(0);
    expect(screen.getByText(/Score: 3/)).toBeInTheDocument();
  });

  it('toggles analytics visibility', () => {
    renderWithTheme(<GameSessionView {...defaultProps} />);

    const toggleButton = screen.getByRole('button', {
      name: /show analytics/i,
    });
    fireEvent.click(toggleButton);

    expect(screen.getByText('Session Analytics')).toBeInTheDocument();
  });

  it('calls recordShot through the hook', () => {
    renderWithTheme(<GameSessionView {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /record shot/i }));
    expect(mockRecordShot).toHaveBeenCalled();
  });

  it('calls endSession through the hook', () => {
    renderWithTheme(<GameSessionView {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /end session/i }));
    expect(mockEndSession).toHaveBeenCalled();
  });
});
