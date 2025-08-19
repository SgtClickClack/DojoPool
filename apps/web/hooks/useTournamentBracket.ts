import { useCallback, useMemo, useState } from 'react';
import { Tournament, TournamentPlayer } from '../types/tournament';
import {
  BracketGenerationOptions,
  TournamentBracketGenerator,
} from '../utils/tournamentBracketGenerator';

export interface UseTournamentBracketReturn {
  tournament: Tournament | null;
  players: TournamentPlayer[];
  bracketOptions: BracketGenerationOptions;
  isGenerating: boolean;
  generateBracket: (
    tournament: Tournament,
    players: TournamentPlayer[]
  ) => void;
  updateBracketOptions: (options: Partial<BracketGenerationOptions>) => void;
  resetBracket: () => void;
  addPlayer: (player: TournamentPlayer) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<TournamentPlayer>) => void;
  reorderPlayers: (playerIds: string[]) => void;
}

export const useTournamentBracket = (): UseTournamentBracketReturn => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [bracketOptions, setBracketOptions] =
    useState<BracketGenerationOptions>({
      seedPlayers: true,
      randomizeSeeds: false,
      groupSize: 4,
    });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateBracket = useCallback(
    (tournament: Tournament, players: TournamentPlayer[]) => {
      if (players.length < 2) {
        throw new Error('Need at least 2 players to generate a bracket');
      }

      setIsGenerating(true);

      try {
        const generatedTournament = TournamentBracketGenerator.generateBracket(
          tournament,
          players,
          bracketOptions
        );

        setTournament(generatedTournament);
        setPlayers(generatedTournament.players);
      } catch (error) {
        console.error('Error generating bracket:', error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    },
    [bracketOptions]
  );

  const updateBracketOptions = useCallback(
    (options: Partial<BracketGenerationOptions>) => {
      setBracketOptions((prev) => ({ ...prev, ...options }));
    },
    []
  );

  const resetBracket = useCallback(() => {
    setTournament(null);
    setPlayers([]);
  }, []);

  const addPlayer = useCallback((player: TournamentPlayer) => {
    setPlayers((prev) => {
      const exists = prev.find((p) => p.id === player.id);
      if (exists) {
        return prev.map((p) => (p.id === player.id ? { ...p, ...player } : p));
      }
      return [...prev, { ...player, rank: prev.length + 1 }];
    });
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }, []);

  const updatePlayer = useCallback(
    (playerId: string, updates: Partial<TournamentPlayer>) => {
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const reorderPlayers = useCallback((playerIds: string[]) => {
    setPlayers((prev) => {
      const playerMap = new Map(prev.map((p) => [p.id, p]));
      return playerIds
        .map((id, index) => {
          const player = playerMap.get(id);
          return player ? { ...player, rank: index + 1 } : player;
        })
        .filter(Boolean) as TournamentPlayer[];
    });
  }, []);

  // Memoized calculations
  const tournamentStats = useMemo(() => {
    if (!tournament || !players.length) return null;

    return {
      totalRounds: TournamentBracketGenerator.calculateRounds(
        tournament.format,
        players.length
      ),
      totalMatches: TournamentBracketGenerator.calculateTotalMatches(
        tournament.format,
        players.length
      ),
      estimatedDuration:
        TournamentBracketGenerator.calculateTotalMatches(
          tournament.format,
          players.length
        ) * 30, // 30 min per match
      format: tournament.format,
    };
  }, [tournament, players]);

  return {
    tournament,
    players,
    bracketOptions,
    isGenerating,
    generateBracket,
    updateBracketOptions,
    resetBracket,
    addPlayer,
    removePlayer,
    updatePlayer,
    reorderPlayers,
  };
};
