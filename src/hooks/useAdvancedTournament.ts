import { useState, useEffect, useCallback } from 'react';
import { Tournament, TournamentParticipant, TournamentMatch, TournamentFormat, TournamentStatus } from '../types/tournament';

export interface AdvancedTournamentConfig {
  id: string;
  name: string;
  format: TournamentFormat;
  venueId: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  entryFee: number;
  prizePool: number;
  seedingMethod: 'random' | 'rating' | 'manual' | 'performance';
  consolationRounds: boolean;
  autoStart: boolean;
  autoAdvance: boolean;
  timeLimit: number;
  breakTime: number;
  rules: string[];
  requirements: {
    minRating?: number;
    maxRating?: number;
    minMatches?: number;
    venueMembership?: boolean;
    clanMembership?: string;
  };
  analytics: {
    enabled: boolean;
    trackPerformance: boolean;
    trackEngagement: boolean;
    generateInsights: boolean;
    realTimeUpdates: boolean;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
}

export interface TournamentAnalytics {
  tournamentId: string;
  totalMatches: number;
  completedMatches: number;
  averageMatchDuration: number;
  totalPrizeMoney: number;
  participantEngagement: number;
  venueRevenue: number;
  spectatorCount: number;
  socialMediaEngagement: number;
  performanceMetrics: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    mostExcitingMatch: string;
    biggestUpset: string;
    longestMatch: string;
    shortestMatch: string;
  };
  playerInsights: {
    topPerformers: string[];
    mostImproved: string[];
    consistentPlayers: string[];
    clutchPlayers: string[];
  };
  venueInsights: {
    capacityUtilization: number;
    revenuePerMatch: number;
    averageAttendance: number;
    peakHours: string[];
  };
  predictions: {
    winnerProbability: Record<string, number>;
    finalFour: string[];
    darkHorses: string[];
    expectedDuration: number;
  };
  trends: {
    participationTrend: number;
    engagementTrend: number;
    revenueTrend: number;
    performanceTrend: number;
  };
}

export interface TournamentInsights {
  tournamentId: string;
  insights: {
    type: 'performance' | 'engagement' | 'revenue' | 'prediction' | 'trend';
    title: string;
    description: string;
    data: any;
    confidence: number;
    actionable: boolean;
    recommendations: string[];
  }[];
  generatedAt: Date;
}

export interface BracketNode {
  id: string;
  matchId?: string;
  player1Id?: string;
  player2Id?: string;
  winnerId?: string;
  round: number;
  position: number;
  status: 'pending' | 'active' | 'completed';
  score?: string;
  scheduledTime?: Date;
  completedTime?: Date;
  duration?: number;
  stats?: any;
}

export interface TournamentBracket {
  tournamentId: string;
  format: TournamentFormat;
  nodes: BracketNode[];
  rounds: number;
  currentRound: number;
  isComplete: boolean;
  winnerId?: string;
  finalStandings: string[];
}

export interface MatchAnalytics {
  matchId: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  duration: number;
  score: string;
  winnerId: string;
  excitementLevel: number;
  difficulty: number;
  impact: number;
  highlights: string[];
  insights: string[];
  performance: {
    player1: {
      accuracy: number;
      speed: number;
      strategy: number;
      consistency: number;
    };
    player2: {
      accuracy: number;
      speed: number;
      strategy: number;
      consistency: number;
    };
  };
  spectators: number;
  socialEngagement: number;
}

interface UseAdvancedTournamentReturn {
  // State
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  bracket: TournamentBracket | null;
  analytics: TournamentAnalytics | null;
  insights: TournamentInsights | null;
  matchAnalytics: MatchAnalytics | null;
  loading: boolean;
  error: string | null;

  // Actions
  createTournament: (config: AdvancedTournamentConfig) => Promise<Tournament>;
  getTournament: (id: string) => Promise<Tournament>;
  generateBracket: (tournamentId: string) => Promise<TournamentBracket>;
  registerPlayer: (tournamentId: string, playerId: string) => Promise<void>;
  withdrawPlayer: (tournamentId: string, playerId: string) => Promise<void>;
  updateMatch: (tournamentId: string, matchId: string, update: Partial<TournamentMatch>) => Promise<void>;
  startTournament: (tournamentId: string) => Promise<void>;
  completeTournament: (tournamentId: string) => Promise<void>;
  generateAnalytics: (tournamentId: string) => Promise<TournamentAnalytics>;
  generateInsights: (tournamentId: string) => Promise<TournamentInsights>;
  getMatchAnalytics: (matchId: string) => Promise<MatchAnalytics>;
  getAnalyticsOverview: () => Promise<any>;

  // Utilities
  refreshTournament: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useAdvancedTournament = (): UseAdvancedTournamentReturn => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<TournamentBracket | null>(null);
  const [analytics, setAnalytics] = useState<TournamentAnalytics | null>(null);
  const [insights, setInsights] = useState<TournamentInsights | null>(null);
  const [matchAnalytics, setMatchAnalytics] = useState<MatchAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/advanced-tournaments${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tournaments on mount
  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = useCallback(async () => {
    try {
      const data = await apiCall<{ tournaments: Tournament[] }>('');
      setTournaments(data.tournaments);
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    }
  }, [apiCall]);

  const createTournament = useCallback(async (config: AdvancedTournamentConfig): Promise<Tournament> => {
    const data = await apiCall<{ tournament: Tournament }>('', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    
    const newTournament = data.tournament;
    setTournaments(prev => [...prev, newTournament]);
    return newTournament;
  }, [apiCall]);

  const getTournament = useCallback(async (id: string): Promise<Tournament> => {
    const data = await apiCall<{ tournament: Tournament; bracket: TournamentBracket; analytics: TournamentAnalytics; insights: TournamentInsights }>(`/${id}`);
    
    setCurrentTournament(data.tournament);
    setBracket(data.bracket);
    setAnalytics(data.analytics);
    setInsights(data.insights);
    
    return data.tournament;
  }, [apiCall]);

  const generateBracket = useCallback(async (tournamentId: string): Promise<TournamentBracket> => {
    const data = await apiCall<{ bracket: TournamentBracket }>(`/${tournamentId}/generate-bracket`, {
      method: 'POST',
    });
    
    setBracket(data.bracket);
    return data.bracket;
  }, [apiCall]);

  const registerPlayer = useCallback(async (tournamentId: string, playerId: string): Promise<void> => {
    await apiCall(`/${tournamentId}/register`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
    
    // Refresh tournament data
    await refreshTournament(tournamentId);
  }, [apiCall]);

  const withdrawPlayer = useCallback(async (tournamentId: string, playerId: string): Promise<void> => {
    await apiCall(`/${tournamentId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
    
    // Refresh tournament data
    await refreshTournament(tournamentId);
  }, [apiCall]);

  const updateMatch = useCallback(async (tournamentId: string, matchId: string, update: Partial<TournamentMatch>): Promise<void> => {
    await apiCall(`/${tournamentId}/matches/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify(update),
    });
    
    // Refresh tournament data
    await refreshTournament(tournamentId);
  }, [apiCall]);

  const startTournament = useCallback(async (tournamentId: string): Promise<void> => {
    await apiCall(`/${tournamentId}/start`, {
      method: 'POST',
    });
    
    // Refresh tournament data
    await refreshTournament(tournamentId);
  }, [apiCall]);

  const completeTournament = useCallback(async (tournamentId: string): Promise<void> => {
    await apiCall(`/${tournamentId}/complete`, {
      method: 'POST',
    });
    
    // Refresh tournament data
    await refreshTournament(tournamentId);
  }, [apiCall]);

  const generateAnalytics = useCallback(async (tournamentId: string): Promise<TournamentAnalytics> => {
    const data = await apiCall<{ analytics: TournamentAnalytics }>(`/${tournamentId}/analytics`);
    
    setAnalytics(data.analytics);
    return data.analytics;
  }, [apiCall]);

  const generateInsights = useCallback(async (tournamentId: string): Promise<TournamentInsights> => {
    const data = await apiCall<{ insights: TournamentInsights }>(`/${tournamentId}/insights`);
    
    setInsights(data.insights);
    return data.insights;
  }, [apiCall]);

  const getMatchAnalytics = useCallback(async (matchId: string): Promise<MatchAnalytics> => {
    const data = await apiCall<{ analytics: MatchAnalytics }>(`/matches/${matchId}/analytics`);
    
    setMatchAnalytics(data.analytics);
    return data.analytics;
  }, [apiCall]);

  const getAnalyticsOverview = useCallback(async (): Promise<any> => {
    const data = await apiCall<{ overview: any }>('/analytics/overview');
    return data.overview;
  }, [apiCall]);

  const refreshTournament = useCallback(async (id: string): Promise<void> => {
    if (currentTournament?.id === id) {
      await getTournament(id);
    }
    await loadTournaments();
  }, [currentTournament?.id, getTournament, loadTournaments]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    tournaments,
    currentTournament,
    bracket,
    analytics,
    insights,
    matchAnalytics,
    loading,
    error,

    // Actions
    createTournament,
    getTournament,
    generateBracket,
    registerPlayer,
    withdrawPlayer,
    updateMatch,
    startTournament,
    completeTournament,
    generateAnalytics,
    generateInsights,
    getMatchAnalytics,
    getAnalyticsOverview,

    // Utilities
    refreshTournament,
    clearError,
  };
}; 