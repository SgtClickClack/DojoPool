import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GameProvider } from '@/contexts/GameContext';
import { TournamentProvider } from '@/contexts/TournamentContext';
import { PresenceProvider } from '@/contexts/PresenceContext';
import { GameTable } from '@/components/game/GameTable';
import { TournamentBracket } from '@/components/tournament/TournamentBracket';
import { PlayerList } from '@/components/players/PlayerList';
import { mockWebSocket, mockGameService, mockPresenceService } from '../game-test-utils';

describe('Real-time Updates Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocket.reset();
  });

  describe('Game State Synchronization', () => {
    it('should sync game state across clients', async () => {
      const mockGameState = {
        id: 'game-1',
        status: 'in_progress',
        currentPlayer: 'player-1',
        balls: [
          { number: 1, position: { x: 100, y: 100 }, pocketed: false },
          { number: 2, position: { x: 200, y: 200 }, pocketed: false },
        ],
      };

      mockGameService.getGameState.mockResolvedValueOnce(mockGameState);
      mockWebSocket.subscribe('game:game-1:state');

      render(
        <GameProvider>
          <GameTable gameId="game-1" />
        </GameProvider>
      );

      const stateUpdate = {
        ...mockGameState,
        balls: [
          { number: 1, position: { x: 150, y: 150 }, pocketed: false },
          { number: 2, position: { x: 250, y: 250 }, pocketed: true },
        ],
      };

      mockWebSocket.emit('game:state', stateUpdate);

      await waitFor(() => {
        expect(screen.getByText(/ball 2 pocketed/i)).toBeInTheDocument();
        expect(screen.getByTestId('ball-1')).toHaveStyle({
          transform: 'translate(150px, 150px)',
        });
      });
    });

    it('should handle shot updates in real-time', async () => {
      mockWebSocket.subscribe('game:game-1:shots');

      render(
        <GameProvider>
          <GameTable gameId="game-1" />
        </GameProvider>
      );

      const shotUpdate = {
        playerId: 'player-1',
        shotType: 'break',
        power: 0.8,
        angle: 45,
        result: 'success',
        ballsPocketed: [1, 2],
      };

      mockWebSocket.emit('game:shot', shotUpdate);

      await waitFor(() => {
        expect(screen.getByText(/break shot/i)).toBeInTheDocument();
        expect(screen.getByText(/balls pocketed: 1, 2/i)).toBeInTheDocument();
      });
    });

    it('should handle foul calls in real-time', async () => {
      mockWebSocket.subscribe('game:game-1:fouls');

      render(
        <GameProvider>
          <GameTable gameId="game-1" />
        </GameProvider>
      );

      const foulUpdate = {
        playerId: 'player-1',
        foulType: 'scratch',
        reason: 'cue ball pocketed',
        penalty: 'ball_in_hand',
      };

      mockWebSocket.emit('game:foul', foulUpdate);

      await waitFor(() => {
        expect(screen.getByText(/scratch/i)).toBeInTheDocument();
        expect(screen.getByText(/ball in hand/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tournament Real-time Updates', () => {
    it('should sync tournament bracket updates', async () => {
      mockWebSocket.subscribe('tournament:tournament-1:bracket');

      render(
        <TournamentProvider>
          <TournamentBracket tournamentId="tournament-1" />
        </TournamentProvider>
      );

      const bracketUpdate = {
        round: 1,
        matches: [
          {
            id: 'match-1',
            player1: { id: 'player-1', name: 'Player 1' },
            player2: { id: 'player-2', name: 'Player 2' },
            status: 'in_progress',
            score: '3-2',
          },
        ],
      };

      mockWebSocket.emit('tournament:bracket', bracketUpdate);

      await waitFor(() => {
        expect(screen.getByText(/match 1/i)).toBeInTheDocument();
        expect(screen.getByText(/score: 3-2/i)).toBeInTheDocument();
      });
    });

    it('should handle tournament chat messages', async () => {
      mockWebSocket.subscribe('tournament:tournament-1:chat');

      render(
        <TournamentProvider>
          <TournamentBracket tournamentId="tournament-1" />
        </TournamentProvider>
      );

      const chatMessage = {
        id: 'msg-1',
        playerId: 'player-1',
        playerName: 'Player 1',
        message: 'Good game!',
        timestamp: new Date().toISOString(),
      };

      mockWebSocket.emit('tournament:chat', chatMessage);

      await waitFor(() => {
        expect(screen.getByText(/player 1: good game!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Player Presence System', () => {
    it('should track player presence', async () => {
      mockWebSocket.subscribe('presence:venue-1');

      render(
        <PresenceProvider>
          <PlayerList venueId="venue-1" />
        </PresenceProvider>
      );

      const presenceUpdate = {
        playerId: 'player-1',
        playerName: 'Player 1',
        status: 'online',
        lastSeen: new Date().toISOString(),
        currentTable: 'table-1',
      };

      mockWebSocket.emit('presence:update', presenceUpdate);

      await waitFor(() => {
        expect(screen.getByText(/player 1/i)).toBeInTheDocument();
        expect(screen.getByText(/online/i)).toBeInTheDocument();
        expect(screen.getByText(/table 1/i)).toBeInTheDocument();
      });
    });

    it('should handle player disconnection', async () => {
      mockWebSocket.subscribe('presence:venue-1');

      render(
        <PresenceProvider>
          <PlayerList venueId="venue-1" />
        </PresenceProvider>
      );

      const disconnectUpdate = {
        playerId: 'player-1',
        playerName: 'Player 1',
        status: 'offline',
        lastSeen: new Date().toISOString(),
      };

      mockWebSocket.emit('presence:update', disconnectUpdate);

      await waitFor(() => {
        expect(screen.getByText(/player 1/i)).toBeInTheDocument();
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });

    it('should handle venue capacity updates', async () => {
      mockWebSocket.subscribe('presence:venue-1:capacity');

      render(
        <PresenceProvider>
          <PlayerList venueId="venue-1" />
        </PresenceProvider>
      );

      const capacityUpdate = {
        currentPlayers: 15,
        maxCapacity: 20,
        tablesInUse: 5,
        availableTables: 3,
      };

      mockWebSocket.emit('presence:capacity', capacityUpdate);

      await waitFor(() => {
        expect(screen.getByText(/15\/20 players/i)).toBeInTheDocument();
        expect(screen.getByText(/3 tables available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle WebSocket disconnection', async () => {
      mockWebSocket.subscribe('game:game-1:state');
      mockWebSocket.simulateDisconnect();

      render(
        <GameProvider>
          <GameTable gameId="game-1" />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/connection lost/i)).toBeInTheDocument();
        expect(screen.getByText(/reconnecting/i)).toBeInTheDocument();
      });

      mockWebSocket.simulateReconnect();

      await waitFor(() => {
        expect(screen.getByText(/reconnected/i)).toBeInTheDocument();
      });
    });

    it('should handle state sync conflicts', async () => {
      mockWebSocket.subscribe('game:game-1:state');

      render(
        <GameProvider>
          <GameTable gameId="game-1" />
        </GameProvider>
      );

      const conflictUpdate = {
        type: 'conflict',
        localState: { version: 1 },
        remoteState: { version: 2 },
        resolution: 'use_remote',
      };

      mockWebSocket.emit('game:conflict', conflictUpdate);

      await waitFor(() => {
        expect(screen.getByText(/state conflict detected/i)).toBeInTheDocument();
        expect(screen.getByText(/using remote state/i)).toBeInTheDocument();
      });
    });

    it('should handle reconnection with missed updates', async () => {
      mockWebSocket.subscribe('game:game-1:state');
      mockWebSocket.simulateDisconnect();

      const missedUpdates = [
        { type: 'shot', playerId: 'player-1', result: 'success' },
        { type: 'foul', playerId: 'player-2', foulType: 'scratch' },
      ];

      mockGameService.getMissedUpdates.mockResolvedValueOnce(missedUpdates);

      render(
        <GameProvider>
          <GameTable gameId="game-1" />
        </GameProvider>
      );

      mockWebSocket.simulateReconnect();

      await waitFor(() => {
        expect(screen.getByText(/syncing missed updates/i)).toBeInTheDocument();
        expect(screen.getByText(/update 1 of 2/i)).toBeInTheDocument();
        expect(screen.getByText(/update 2 of 2/i)).toBeInTheDocument();
      });
    });
  });
}); 