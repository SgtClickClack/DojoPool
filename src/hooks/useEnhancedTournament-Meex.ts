import { useState, useEffect, useCallback } from 'react';
import { Tournament, TournamentParticipant, TournamentMatch } from '../types/tournament';
import { EnhancedTournamentService, TournamentReward, PoolGodInteraction, TournamentAIEvent } from '../services/tournament/EnhancedTournamentService';
import { useSocket } from './useSocket';

export interface TournamentMatchData {
  duration: number;
  totalShots: number;
  accuracy: number;
  specialShots: string[];
  comebacks: number;
}

export interface EnhancedTournamentState {
  tournament: Tournament | null;
  currentMatch: TournamentMatch | null;
  aiEvents: TournamentAIEvent[];
  poolGodInteractions: PoolGodInteraction[];
  rewards: TournamentReward[];
  isLoading: boolean;
  error: string | null;
}

export const useEnhancedTournament = (tournamentId: string) => {
  const [state, setState] = useState<EnhancedTournamentState>({
    tournament: null,
    currentMatch: null,
    aiEvents: [],
    poolGodInteractions: [],
    rewards: [],
    isLoading: true,
    error: null
  });

  const { socket } = useSocket();
  const tournamentService = new EnhancedTournamentService();

  // Load tournament data
  const loadTournament = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Fetch tournament data from API
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) {
        throw new Error('Failed to load tournament');
      }

      const tournament: Tournament = await response.json();
      
      // Load AI events
      const aiEvents = tournamentService.getTournamentAIEvents(tournamentId);
      
      // Extract Pool God interactions from AI events
      const poolGodInteractions = aiEvents
        .filter(event => event.type === 'pool_god_interaction')
        .map(event => event.data as PoolGodInteraction);

      setState(prev => ({
        ...prev,
        tournament,
        aiEvents,
        poolGodInteractions,
        isLoading: false
      }));

      // Start tournament with AI commentary if not already started
      if (tournament.status === 'registration' || tournament.status === 'pending') {
        await tournamentService.startTournament(tournament);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
    }
  }, [tournamentId, tournamentService]);

  // Process match completion
  const processMatch = useCallback(async (
    match: TournamentMatch,
    winner: TournamentParticipant,
    loser: TournamentParticipant,
    matchData: TournamentMatchData
  ) => {
    if (!state.tournament) return;

    try {
      await tournamentService.processMatch(
        state.tournament,
        match,
        winner,
        loser,
        matchData
      );

      // Update AI events
      const aiEvents = tournamentService.getTournamentAIEvents(tournamentId);
      const poolGodInteractions = aiEvents
        .filter(event => event.type === 'pool_god_interaction')
        .map(event => event.data as PoolGodInteraction);

      setState(prev => ({
        ...prev,
        aiEvents,
        poolGodInteractions
      }));

      // Emit socket event for real-time updates
      socket?.emit('tournament:match_completed', {
        tournamentId,
        matchId: match.id,
        winner: winner.id,
        loser: loser.id,
        matchData
      });
    } catch (error) {
      console.error('Error processing match:', error);
    }
  }, [state.tournament, tournamentService, socket, tournamentId]);

  // Complete tournament
  const completeTournament = useCallback(async (
    winner: TournamentParticipant,
    finalMatch: TournamentMatch
  ) => {
    if (!state.tournament) return;

    try {
      const rewards = await tournamentService.completeTournament(
        state.tournament,
        winner,
        finalMatch
      );

      // Update AI events
      const aiEvents = tournamentService.getTournamentAIEvents(tournamentId);
      const poolGodInteractions = aiEvents
        .filter(event => event.type === 'pool_god_interaction')
        .map(event => event.data as PoolGodInteraction);

      setState(prev => ({
        ...prev,
        rewards,
        aiEvents,
        poolGodInteractions
      }));

      // Emit socket event for tournament completion
      socket?.emit('tournament:completed', {
        tournamentId,
        winner: winner.id,
        rewards
      });
    } catch (error) {
      console.error('Error completing tournament:', error);
    }
  }, [state.tournament, tournamentService, socket, tournamentId]);

  // Get latest AI commentary
  const getLatestCommentary = useCallback(() => {
    const commentaryEvents = state.aiEvents
      .filter(event => event.type === 'commentary')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return commentaryEvents[0]?.data || null;
  }, [state.aiEvents]);

  // Get latest Pool God interaction
  const getLatestPoolGodInteraction = useCallback(() => {
    const poolGodEvents = state.aiEvents
      .filter(event => event.type === 'pool_god_interaction')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return poolGodEvents[0]?.data || null;
  }, [state.aiEvents]);

  // Clear AI events
  const clearAIEvents = useCallback(() => {
    tournamentService.clearTournamentAIEvents(tournamentId);
    setState(prev => ({
      ...prev,
      aiEvents: [],
      poolGodInteractions: []
    }));
  }, [tournamentService, tournamentId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMatchUpdate = (data: any) => {
      if (data.tournamentId === tournamentId) {
        setState(prev => ({
          ...prev,
          currentMatch: data.match
        }));
      }
    };

    const handleAIEvent = (data: any) => {
      if (data.tournamentId === tournamentId) {
        const aiEvents = tournamentService.getTournamentAIEvents(tournamentId);
        const poolGodInteractions = aiEvents
          .filter(event => event.type === 'pool_god_interaction')
          .map(event => event.data as PoolGodInteraction);

        setState(prev => ({
          ...prev,
          aiEvents,
          poolGodInteractions
        }));
      }
    };

    const handleTournamentUpdate = (data: any) => {
      if (data.tournamentId === tournamentId) {
        setState(prev => ({
          ...prev,
          tournament: data.tournament
        }));
      }
    };

    socket.on('tournament:match_updated', handleMatchUpdate);
    socket.on('tournament:ai_event', handleAIEvent);
    socket.on('tournament:updated', handleTournamentUpdate);

    return () => {
      socket.off('tournament:match_updated', handleMatchUpdate);
      socket.off('tournament:ai_event', handleAIEvent);
      socket.off('tournament:updated', handleTournamentUpdate);
    };
  }, [socket, tournamentId, tournamentService]);

  // Load tournament on mount
  useEffect(() => {
    loadTournament();
  }, [loadTournament]);

  return {
    ...state,
    processMatch,
    completeTournament,
    getLatestCommentary,
    getLatestPoolGodInteraction,
    clearAIEvents,
    reload: loadTournament
  };
}; 