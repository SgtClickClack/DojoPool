import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TournamentProvider } from '@/contexts/TournamentContext';
import { TournamentBracket } from '@/components/tournament/TournamentBracket';
import { TournamentRegistration } from '@/components/tournament/TournamentRegistration';
import { TournamentStandings } from '@/components/tournament/TournamentStandings';
import { mockTournamentService, mockWebSocket } from '../game-test-utils';

describe('Tournament System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocket.reset();
  });

  describe('Tournament Creation and Registration', () => {
    it('should create and start a tournament', async () => {
      const mockTournament = {
        id: 'tournament-1',
        name: 'Test Tournament',
        format: 'single_elimination',
        status: 'registration_open',
        startDate: new Date().toISOString(),
        maxPlayers: 16,
      };

      mockTournamentService.createTournament.mockResolvedValueOnce(mockTournament);

      render(
        <TournamentProvider>
          <TournamentRegistration />
        </TournamentProvider>
      );

      fireEvent.change(screen.getByLabelText(/tournament name/i), {
        target: { value: 'Test Tournament' },
      });
      fireEvent.change(screen.getByLabelText(/format/i), {
        target: { value: 'single_elimination' },
      });
      fireEvent.change(screen.getByLabelText(/max players/i), {
        target: { value: '16' },
      });
      fireEvent.click(screen.getByRole('button', { name: /create tournament/i }));

      await waitFor(() => {
        expect(mockTournamentService.createTournament).toHaveBeenCalledWith({
          name: 'Test Tournament',
          format: 'single_elimination',
          maxPlayers: 16,
        });
        expect(screen.getByText(/tournament created successfully/i)).toBeInTheDocument();
      });
    });

    it('should handle player registration', async () => {
      const mockPlayer = {
        id: 'player-1',
        name: 'Test Player',
        rating: 1500,
      };

      mockTournamentService.registerPlayer.mockResolvedValueOnce(mockPlayer);

      render(
        <TournamentProvider>
          <TournamentRegistration tournamentId="tournament-1" />
        </TournamentProvider>
      );

      fireEvent.change(screen.getByLabelText(/player name/i), {
        target: { value: 'Test Player' },
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(mockTournamentService.registerPlayer).toHaveBeenCalledWith(
          'tournament-1',
          'Test Player'
        );
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tournament Bracket and Matches', () => {
    it('should display tournament bracket', async () => {
      const mockBracket = {
        rounds: [
          {
            round: 1,
            matches: [
              {
                id: 'match-1',
                player1: { id: 'player-1', name: 'Player 1' },
                player2: { id: 'player-2', name: 'Player 2' },
                status: 'scheduled',
              },
            ],
          },
        ],
      };

      mockTournamentService.getBracket.mockResolvedValueOnce(mockBracket);

      render(
        <TournamentProvider>
          <TournamentBracket tournamentId="tournament-1" />
        </TournamentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('Player 2')).toBeInTheDocument();
      });
    });

    it('should update match results in real-time', async () => {
      const mockMatch = {
        id: 'match-1',
        player1: { id: 'player-1', name: 'Player 1' },
        player2: { id: 'player-2', name: 'Player 2' },
        status: 'in_progress',
      };

      mockTournamentService.getMatch.mockResolvedValueOnce(mockMatch);
      mockWebSocket.subscribe('tournament:tournament-1:match-1');

      render(
        <TournamentProvider>
          <TournamentBracket tournamentId="tournament-1" />
        </TournamentProvider>
      );

      const matchUpdate = {
        id: 'match-1',
        status: 'completed',
        winner: 'player-1',
        score: '5-3',
      };

      mockWebSocket.emit('match:update', matchUpdate);

      await waitFor(() => {
        expect(screen.getByText(/winner: player 1/i)).toBeInTheDocument();
        expect(screen.getByText(/score: 5-3/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tournament Standings and Prize Distribution', () => {
    it('should display tournament standings', async () => {
      const mockStandings = [
        { player: { id: 'player-1', name: 'Player 1' }, wins: 3, losses: 0 },
        { player: { id: 'player-2', name: 'Player 2' }, wins: 2, losses: 1 },
      ];

      mockTournamentService.getStandings.mockResolvedValueOnce(mockStandings);

      render(
        <TournamentProvider>
          <TournamentStandings tournamentId="tournament-1" />
        </TournamentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('3-0')).toBeInTheDocument();
        expect(screen.getByText('Player 2')).toBeInTheDocument();
        expect(screen.getByText('2-1')).toBeInTheDocument();
      });
    });

    it('should distribute prizes when tournament completes', async () => {
      const mockTournament = {
        id: 'tournament-1',
        status: 'completed',
        prizePool: 1000,
        standings: [
          { player: { id: 'player-1', name: 'Player 1' }, position: 1 },
          { player: { id: 'player-2', name: 'Player 2' }, position: 2 },
        ],
      };

      mockTournamentService.getTournament.mockResolvedValueOnce(mockTournament);
      mockTournamentService.distributePrizes.mockResolvedValueOnce({
        success: true,
        transactions: [
          { playerId: 'player-1', amount: 600 },
          { playerId: 'player-2', amount: 400 },
        ],
      });

      render(
        <TournamentProvider>
          <TournamentStandings tournamentId="tournament-1" />
        </TournamentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/tournament completed/i)).toBeInTheDocument();
        expect(screen.getByText(/prizes distributed/i)).toBeInTheDocument();
        expect(screen.getByText(/player 1: 600/i)).toBeInTheDocument();
        expect(screen.getByText(/player 2: 400/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Tournament Updates', () => {
    it('should handle player check-in', async () => {
      mockWebSocket.subscribe('tournament:tournament-1:players');

      render(
        <TournamentProvider>
          <TournamentRegistration tournamentId="tournament-1" />
        </TournamentProvider>
      );

      const playerCheckIn = {
        playerId: 'player-1',
        name: 'Player 1',
        status: 'checked_in',
      };

      mockWebSocket.emit('player:check-in', playerCheckIn);

      await waitFor(() => {
        expect(screen.getByText(/player 1 checked in/i)).toBeInTheDocument();
      });
    });

    it('should handle tournament status updates', async () => {
      mockWebSocket.subscribe('tournament:tournament-1:status');

      render(
        <TournamentProvider>
          <TournamentBracket tournamentId="tournament-1" />
        </TournamentProvider>
      );

      const statusUpdate = {
        status: 'in_progress',
        currentRound: 1,
        activeMatches: ['match-1', 'match-2'],
      };

      mockWebSocket.emit('tournament:status', statusUpdate);

      await waitFor(() => {
        expect(screen.getByText(/tournament in progress/i)).toBeInTheDocument();
        expect(screen.getByText(/round 1/i)).toBeInTheDocument();
      });
    });

    it('should handle tournament cancellation', async () => {
      mockWebSocket.subscribe('tournament:tournament-1:status');

      render(
        <TournamentProvider>
          <TournamentBracket tournamentId="tournament-1" />
        </TournamentProvider>
      );

      const cancellationUpdate = {
        status: 'cancelled',
        reason: 'insufficient_players',
      };

      mockWebSocket.emit('tournament:status', cancellationUpdate);

      await waitFor(() => {
        expect(screen.getByText(/tournament cancelled/i)).toBeInTheDocument();
        expect(screen.getByText(/insufficient players/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tournament Error Handling', () => {
    it('should handle registration errors', async () => {
      mockTournamentService.registerPlayer.mockRejectedValueOnce(
        new Error('Tournament is full')
      );

      render(
        <TournamentProvider>
          <TournamentRegistration tournamentId="tournament-1" />
        </TournamentProvider>
      );

      fireEvent.change(screen.getByLabelText(/player name/i), {
        target: { value: 'Test Player' },
      });
      fireEvent.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/tournament is full/i)).toBeInTheDocument();
      });
    });

    it('should handle match update errors', async () => {
      mockTournamentService.updateMatch.mockRejectedValueOnce(
        new Error('Invalid match state')
      );

      render(
        <TournamentProvider>
          <TournamentBracket tournamentId="tournament-1" />
        </TournamentProvider>
      );

      const matchUpdate = {
        id: 'match-1',
        status: 'invalid_status',
      };

      mockWebSocket.emit('match:update', matchUpdate);

      await waitFor(() => {
        expect(screen.getByText(/invalid match state/i)).toBeInTheDocument();
      });
    });

    it('should handle prize distribution errors', async () => {
      mockTournamentService.distributePrizes.mockRejectedValueOnce(
        new Error('Prize distribution failed')
      );

      render(
        <TournamentProvider>
          <TournamentStandings tournamentId="tournament-1" />
        </TournamentProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/prize distribution failed/i)).toBeInTheDocument();
      });
    });
  });
}); 