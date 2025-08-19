import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTournament,
  deleteTournament,
  getTournament,
  getTournamentMatches,
  getTournaments,
  registerPlayer,
  startTournament,
  unregisterPlayer,
  updateMatch,
  updateTournament,
} from '../api/tournaments';
import { type Tournament } from '../types/tournament';

export interface TournamentAPIState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  matches: any[];
  loading: boolean;
  error: string | null;
}

export interface TournamentAPIActions {
  // Tournament management
  createTournament: (data: Partial<Tournament>) => Promise<Tournament>;
  updateTournament: (
    id: string,
    data: Partial<Tournament>
  ) => Promise<Tournament>;
  deleteTournament: (id: string) => Promise<void>;

  // Participant management
  registerPlayer: (
    tournamentId: string,
    playerId: string
  ) => Promise<Tournament>;
  unregisterPlayer: (
    tournamentId: string,
    playerId: string
  ) => Promise<Tournament>;

  // Tournament lifecycle
  startTournament: (tournamentId: string) => Promise<Tournament>;

  // Match operations
  loadMatches: (tournamentId: string) => Promise<void>;
  updateMatchResult: (
    matchId: string,
    scoreA: number,
    scoreB: number,
    winnerId: string
  ) => Promise<any>;

  // Data loading
  loadTournaments: () => Promise<void>;
  loadTournament: (id: string) => Promise<void>;

  // State management
  clearError: () => void;
  setCurrentTournament: (tournament: Tournament | null) => void;
}

export const useTournamentAPI = (): TournamentAPIState &
  TournamentAPIActions => {
  const [state, setState] = useState<TournamentAPIState>({
    tournaments: [],
    currentTournament: null,
    matches: [],
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear error state
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Set current tournament
  const setCurrentTournament = useCallback((tournament: Tournament | null) => {
    setState((prev) => ({ ...prev, currentTournament: tournament }));
  }, []);

  // Load all tournaments
  const loadTournaments = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const tournaments = await getTournaments();
      setState((prev) => ({
        ...prev,
        tournaments,
        loading: false,
      }));
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to load tournaments',
          loading: false,
        }));
      }
    }
  }, []);

  // Load specific tournament
  const loadTournament = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const tournament = await getTournament(id);
      setState((prev) => ({
        ...prev,
        currentTournament: tournament,
        loading: false,
      }));
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to load tournament',
          loading: false,
        }));
      }
    }
  }, []);

  // Load tournament matches
  const loadMatches = useCallback(async (tournamentId: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const matches = await getTournamentMatches(tournamentId);
      setState((prev) => ({
        ...prev,
        matches,
        loading: false,
      }));
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setState((prev) => ({
          ...prev,
          error: error.message || 'Failed to load matches',
          loading: false,
        }));
      }
    }
  }, []);

  // Create tournament
  const createTournamentAction = useCallback(
    async (data: Partial<Tournament>): Promise<Tournament> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const tournament = await createTournament(data);

        // Refresh tournaments list
        await loadTournaments();

        setState((prev) => ({ ...prev, loading: false }));
        return tournament;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create tournament';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [loadTournaments]
  );

  // Update tournament
  const updateTournamentAction = useCallback(
    async (id: string, data: Partial<Tournament>): Promise<Tournament> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const tournament = await updateTournament(id, data);

        // Update current tournament if it's the one being updated
        setState((prev) => ({
          ...prev,
          currentTournament:
            prev.currentTournament?.id === id
              ? tournament
              : prev.currentTournament,
          loading: false,
        }));

        // Refresh tournaments list
        await loadTournaments();

        return tournament;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update tournament';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [loadTournaments]
  );

  // Delete tournament
  const deleteTournamentAction = useCallback(
    async (id: string): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        await deleteTournament(id);

        // Remove from current tournament if it's the one being deleted
        setState((prev) => ({
          ...prev,
          currentTournament:
            prev.currentTournament?.id === id ? null : prev.currentTournament,
          loading: false,
        }));

        // Refresh tournaments list
        await loadTournaments();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to delete tournament';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [loadTournaments]
  );

  // Register player
  const registerPlayerAction = useCallback(
    async (tournamentId: string, playerId: string): Promise<Tournament> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const tournament = await registerPlayer(tournamentId, playerId);

        // Update current tournament if it's the one being updated
        setState((prev) => ({
          ...prev,
          currentTournament:
            prev.currentTournament?.id === tournamentId
              ? tournament
              : prev.currentTournament,
          loading: false,
        }));

        // Refresh tournaments list
        await loadTournaments();

        return tournament;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to register player';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [loadTournaments]
  );

  // Unregister player
  const unregisterPlayerAction = useCallback(
    async (tournamentId: string, playerId: string): Promise<Tournament> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const tournament = await unregisterPlayer(tournamentId, playerId);

        // Update current tournament if it's the one being updated
        setState((prev) => ({
          ...prev,
          currentTournament:
            prev.currentTournament?.id === tournamentId
              ? tournament
              : prev.currentTournament,
          loading: false,
        }));

        // Refresh tournaments list
        await loadTournaments();

        return tournament;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to unregister player';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [loadTournaments]
  );

  // Start tournament
  const startTournamentAction = useCallback(
    async (tournamentId: string): Promise<Tournament> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const tournament = await startTournament(tournamentId);

        // Update current tournament if it's the one being updated
        setState((prev) => ({
          ...prev,
          currentTournament:
            prev.currentTournament?.id === tournamentId
              ? tournament
              : prev.currentTournament,
          loading: false,
        }));

        // Refresh tournaments list
        await loadTournaments();

        return tournament;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to start tournament';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [loadTournaments]
  );

  // Update match result
  const updateMatchResult = useCallback(
    async (
      matchId: string,
      scoreA: number,
      scoreB: number,
      winnerId: string
    ): Promise<any> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const match = await updateMatch(matchId, { scoreA, scoreB, winnerId });

        // Refresh matches if we have a current tournament
        if (state.currentTournament) {
          await loadMatches(state.currentTournament.id);
        }

        setState((prev) => ({ ...prev, loading: false }));
        return match;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update match';
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [state.currentTournament, loadMatches]
  );

  // Load tournaments on mount
  useEffect(() => {
    loadTournaments();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadTournaments]);

  return {
    ...state,
    createTournament: createTournamentAction,
    updateTournament: updateTournamentAction,
    deleteTournament: deleteTournamentAction,
    registerPlayer: registerPlayerAction,
    unregisterPlayer: unregisterPlayerAction,
    startTournament: startTournamentAction,
    loadMatches,
    updateMatchResult,
    loadTournaments,
    loadTournament,
    clearError,
    setCurrentTournament,
  };
};
