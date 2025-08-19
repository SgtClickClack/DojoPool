import { useState, useEffect, useCallback } from 'react';

export interface PlayerPerformance {
  playerId: string;
  playerName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  totalPoints: number;
  shotAccuracy: number;
  breakSuccessRate: number;
  safetyShotRate: number;
  averageMatchDuration: number;
  longestWinStreak: number;
  currentWinStreak: number;
  tournamentWins: number;
  tournamentFinals: number;
  territoryCaptures: number;
  territoryDefenses: number;
  reputation: number;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceMetric {
  id: string;
  playerId: string;
  metricType:
    | 'shot_accuracy'
    | 'break_success'
    | 'safety_shot'
    | 'match_duration'
    | 'win_rate'
    | 'tournament_performance';
  value: number;
  timestamp: Date;
  matchId?: string;
  tournamentId?: string;
  context?: any;
}

export interface SkillProgression {
  playerId: string;
  skillArea: 'accuracy' | 'power' | 'strategy' | 'consistency' | 'mental_game';
  currentLevel: number;
  maxLevel: number;
  experience: number;
  experienceToNext: number;
  improvements: SkillImprovement[];
  lastUpdated: Date;
}

export interface SkillImprovement {
  id: string;
  skillArea: string;
  improvement: number;
  reason: string;
  timestamp: Date;
  matchId?: string;
}

export interface MatchAnalysis {
  id: string;
  matchId: string;
  playerId: string;
  opponentId: string;
  result: 'win' | 'loss' | 'draw';
  score: string;
  duration: number;
  shots: ShotAnalysis[];
  highlights: string[];
  areasForImprovement: string[];
  strengths: string[];
  overallRating: number;
  timestamp: Date;
}

export interface ShotAnalysis {
  id: string;
  shotType: 'break' | 'pot' | 'safety' | 'defensive' | 'trick';
  success: boolean;
  difficulty: number;
  accuracy: number;
  power: number;
  position: { x: number; y: number };
  timestamp: Date;
  context?: any;
}

export interface PlayerInsights {
  playerId: string;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  recommendedDrills: string[];
  playingStyle: 'aggressive' | 'defensive' | 'balanced' | 'tactical';
  preferredShotTypes: string[];
  performanceTrends: PerformanceTrend[];
  predictions: PerformancePrediction[];
  lastUpdated: Date;
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  change: number;
  period: 'week' | 'month' | 'quarter' | 'year';
  confidence: number;
}

export interface PerformancePrediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: 'next_match' | 'next_week' | 'next_month' | 'next_tournament';
  factors: string[];
}

export interface PlayerComparison {
  playerId: string;
  comparisonPlayerId: string;
  metrics: {
    [key: string]: {
      player: number;
      comparison: number;
      difference: number;
      percentage: number;
    };
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  timestamp: Date;
}

export interface PlayerAnalyticsConfig {
  enabled: boolean;
  realTimeTracking: boolean;
  performancePrediction: boolean;
  skillProgression: boolean;
  matchAnalysis: boolean;
  playerInsights: boolean;
  comparisonAnalytics: boolean;
  updateInterval: number;
  retentionPeriod: number;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
}

export interface PlayerAnalyticsMetrics {
  totalPlayers: number;
  activePlayers: number;
  averageSkillLevel: number;
  totalMatches: number;
  averageMatchDuration: number;
  topPerformers: string[];
  mostImproved: string[];
  averageWinRate: number;
  lastActivity: Date;
}

export const useAdvancedPlayerAnalytics = () => {
  const [config, setConfig] = useState<PlayerAnalyticsConfig | null>(null);
  const [metrics, setMetrics] = useState<PlayerAnalyticsMetrics | null>(null);
  const [performances, setPerformances] = useState<PlayerPerformance[]>([]);
  const [topPerformers, setTopPerformers] = useState<PlayerPerformance[]>([]);
  const [mostImproved, setMostImproved] = useState<PlayerPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration Management
  const getConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/advanced-player-analytics/config');
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      } else {
        setError(data.error || 'Failed to get configuration');
      }
    } catch (err) {
      setError('Failed to get configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(
    async (newConfig: Partial<PlayerAnalyticsConfig>) => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/advanced-player-analytics/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ config: newConfig }),
        });
        const data = await response.json();

        if (data.success) {
          await getConfig(); // Refresh config
        } else {
          setError(data.error || 'Failed to update configuration');
        }
      } catch (err) {
        setError('Failed to update configuration');
      } finally {
        setIsLoading(false);
      }
    },
    [getConfig]
  );

  // Metrics Management
  const getMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/advanced-player-analytics/metrics');
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
      } else {
        setError(data.error || 'Failed to get metrics');
      }
    } catch (err) {
      setError('Failed to get metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Player Performance Management
  const getAllPerformances = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        '/api/advanced-player-analytics/performances'
      );
      const data = await response.json();

      if (data.success) {
        setPerformances(data.performances);
      } else {
        setError(data.error || 'Failed to get performances');
      }
    } catch (err) {
      setError('Failed to get performances');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPlayerPerformance = useCallback(async (playerId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/advanced-player-analytics/performances/${playerId}`
      );
      const data = await response.json();

      if (data.success) {
        return data.performance;
      } else {
        setError(data.error || 'Failed to get player performance');
        return null;
      }
    } catch (err) {
      setError('Failed to get player performance');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePlayerPerformance = useCallback(
    async (playerId: string, matchData: any) => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/advanced-player-analytics/performances/${playerId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchData }),
          }
        );
        const data = await response.json();

        if (data.success) {
          await getAllPerformances(); // Refresh performances
          return data.performance;
        } else {
          setError(data.error || 'Failed to update player performance');
          return null;
        }
      } catch (err) {
        setError('Failed to update player performance');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getAllPerformances]
  );

  const getTopPerformers = useCallback(async (limit: number = 10) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/advanced-player-analytics/performances/top/${limit}`
      );
      const data = await response.json();

      if (data.success) {
        setTopPerformers(data.topPerformers);
        return data.topPerformers;
      } else {
        setError(data.error || 'Failed to get top performers');
        return [];
      }
    } catch (err) {
      setError('Failed to get top performers');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMostImproved = useCallback(async (limit: number = 10) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/advanced-player-analytics/performances/improved/${limit}`
      );
      const data = await response.json();

      if (data.success) {
        setMostImproved(data.mostImproved);
        return data.mostImproved;
      } else {
        setError(data.error || 'Failed to get most improved players');
        return [];
      }
    } catch (err) {
      setError('Failed to get most improved players');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Performance Metrics
  const addPerformanceMetric = useCallback(
    async (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/advanced-player-analytics/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metric }),
        });
        const data = await response.json();

        if (data.success) {
          return data.metric;
        } else {
          setError(data.error || 'Failed to add performance metric');
          return null;
        }
      } catch (err) {
        setError('Failed to add performance metric');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPerformanceMetrics = useCallback(
    async (playerId: string, metricType?: string) => {
      try {
        setIsLoading(true);
        const url = metricType
          ? `/api/advanced-player-analytics/metrics/${playerId}?metricType=${metricType}`
          : `/api/advanced-player-analytics/metrics/${playerId}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          return data.metrics;
        } else {
          setError(data.error || 'Failed to get performance metrics');
          return [];
        }
      } catch (err) {
        setError('Failed to get performance metrics');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Skill Progression
  const updateSkillProgression = useCallback(
    async (
      playerId: string,
      skillArea: string,
      improvement: number,
      reason: string,
      matchId?: string
    ) => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/advanced-player-analytics/skills/${playerId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skillArea, improvement, reason, matchId }),
          }
        );
        const data = await response.json();

        if (data.success) {
          return data.progression;
        } else {
          setError(data.error || 'Failed to update skill progression');
          return null;
        }
      } catch (err) {
        setError('Failed to update skill progression');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getSkillProgression = useCallback(async (playerId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/advanced-player-analytics/skills/${playerId}`
      );
      const data = await response.json();

      if (data.success) {
        return data.progressions;
      } else {
        setError(data.error || 'Failed to get skill progression');
        return [];
      }
    } catch (err) {
      setError('Failed to get skill progression');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Match Analysis
  const analyzeMatch = useCallback(async (matchData: any) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        '/api/advanced-player-analytics/matches/analyze',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchData }),
        }
      );
      const data = await response.json();

      if (data.success) {
        return data.analysis;
      } else {
        setError(data.error || 'Failed to analyze match');
        return null;
      }
    } catch (err) {
      setError('Failed to analyze match');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getMatchAnalyses = useCallback(async (playerId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/advanced-player-analytics/matches/${playerId}`
      );
      const data = await response.json();

      if (data.success) {
        return data.analyses;
      } else {
        setError(data.error || 'Failed to get match analyses');
        return [];
      }
    } catch (err) {
      setError('Failed to get match analyses');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Player Insights
  const generatePlayerInsights = useCallback(async (playerId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/advanced-player-analytics/insights/${playerId}`,
        {
          method: 'POST',
        }
      );
      const data = await response.json();

      if (data.success) {
        return data.insights;
      } else {
        setError(data.error || 'Failed to generate player insights');
        return null;
      }
    } catch (err) {
      setError('Failed to generate player insights');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getPlayerInsights = useCallback(async (playerId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/advanced-player-analytics/insights/${playerId}`
      );
      const data = await response.json();

      if (data.success) {
        return data.insights;
      } else {
        setError(data.error || 'Failed to get player insights');
        return null;
      }
    } catch (err) {
      setError('Failed to get player insights');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Player Comparison
  const comparePlayers = useCallback(
    async (playerId: string, comparisonPlayerId: string) => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/advanced-player-analytics/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, comparisonPlayerId }),
        });
        const data = await response.json();

        if (data.success) {
          return data.comparison;
        } else {
          setError(data.error || 'Failed to compare players');
          return null;
        }
      } catch (err) {
        setError('Failed to compare players');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPlayerComparisons = useCallback(async (playerId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/advanced-player-analytics/compare/${playerId}`
      );
      const data = await response.json();

      if (data.success) {
        return data.comparisons;
      } else {
        setError(data.error || 'Failed to get player comparisons');
        return [];
      }
    } catch (err) {
      setError('Failed to get player comparisons');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    getConfig();
    getMetrics();
    getAllPerformances();
    getTopPerformers();
    getMostImproved();
  }, [
    getConfig,
    getMetrics,
    getAllPerformances,
    getTopPerformers,
    getMostImproved,
  ]);

  return {
    // State
    config,
    metrics,
    performances,
    topPerformers,
    mostImproved,
    isLoading,
    error,

    // Configuration
    getConfig,
    updateConfig,

    // Metrics
    getMetrics,

    // Player Performance
    getAllPerformances,
    getPlayerPerformance,
    updatePlayerPerformance,
    getTopPerformers,
    getMostImproved,

    // Performance Metrics
    addPerformanceMetric,
    getPerformanceMetrics,

    // Skill Progression
    updateSkillProgression,
    getSkillProgression,

    // Match Analysis
    analyzeMatch,
    getMatchAnalyses,

    // Player Insights
    generatePlayerInsights,
    getPlayerInsights,

    // Player Comparison
    comparePlayers,
    getPlayerComparisons,

    // Utility
    clearError: () => setError(null),
  };
};
