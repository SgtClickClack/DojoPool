import { renderHook, act } from '@testing-library/react';
import { useTournaments } from '../../../src/frontend/hooks/useTournaments';
import { Tournament, TournamentStatus, TournamentFormat } from '../../../src/types/tournament';

jest.mock('../../../src/frontend/api/tournaments', () => ({
  getTournaments: jest.fn(),
}));

jest.mock('../../../src/services/WebSocketService', () => {
  const listeners: Record<string, Function[]> = {};
  return {
    SocketIOService: {
      getInstance: () => ({
        connect: jest.fn(),
        on: (event: string, cb: Function) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(cb);
        },
        off: (event: string, cb: Function) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter(fn => fn !== cb);
          }
        },
        emit: (event: string, data: any) => {
          (listeners[event] || []).forEach(fn => fn(data));
        },
      }),
    },
    __listeners: listeners,
  };
});

const { getTournaments } = require('../../../src/frontend/api/tournaments');
const { SocketIOService, __listeners } = require('../../../src/services/WebSocketService');

describe('useTournaments', () => {
  const mockTournaments: Tournament[] = [
    {
      id: '1',
      name: 'T1',
      status: TournamentStatus.OPEN,
      participants: 2,
      maxParticipants: 8,
      startDate: new Date(),
      format: TournamentFormat.SINGLE_ELIMINATION,
      organizerId: 'org1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(__listeners).forEach(k => delete __listeners[k]);
  });

  it('fetches tournaments on mount', async () => {
    getTournaments.mockResolvedValueOnce(mockTournaments);
    const { result, rerender } = renderHook(() => useTournaments());
    await act(async () => {
      // Wait for state update
      await Promise.resolve();
      rerender();
    });
    expect(result.current.tournaments).toEqual(mockTournaments);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('updates tournaments on tournament_update event', async () => {
    getTournaments.mockResolvedValueOnce(mockTournaments);
    const { result, rerender } = renderHook(() => useTournaments());
    await act(async () => {
      await Promise.resolve();
      rerender();
    });
    // Simulate real-time update
    const updatedTournaments = [{ ...mockTournaments[0], name: 'T1 Updated' }];
    getTournaments.mockResolvedValueOnce(updatedTournaments);
    await act(async () => {
      SocketIOService.getInstance().emit('tournament_update', { type: 'update' });
      await Promise.resolve();
      rerender();
    });
    expect(result.current.tournaments).toEqual(updatedTournaments);
  });

  it('handles fetch error', async () => {
    getTournaments.mockRejectedValueOnce(new Error('fail'));
    const { result, rerender } = renderHook(() => useTournaments());
    await act(async () => {
      await Promise.resolve();
      rerender();
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.tournaments).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('cleans up event listeners on unmount', async () => {
    getTournaments.mockResolvedValueOnce(mockTournaments);
    const { unmount, rerender } = renderHook(() => useTournaments());
    await act(async () => {
      await Promise.resolve();
      rerender();
    });
    expect(__listeners['tournament_update'].length).toBe(1);
    unmount();
    expect(__listeners['tournament_update']?.length || 0).toBe(0);
  });
}); 