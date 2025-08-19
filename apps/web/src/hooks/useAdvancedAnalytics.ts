import { useState, useEffect, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

export interface PerformanceTrend {
  playerId: string;
  playerName: string;
  metric: string;
  values: number[];
  dates: Date[];
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  prediction: number;
}

export interface VenueOptimization {
  venueId: string;
  venueName: string;
  currentScore: number;
  recommendations: string[];
  potentialImprovements: {
    category: string;
    currentValue: number;
    targetValue: number;
    impact: 'high' | 'medium' | 'low';
    estimatedRevenueIncrease: number;
  }[];
  optimizationScore: number;
}

export interface RevenueForecast {
  venueId: string;
  venueName: string;
  currentRevenue: number;
  forecastedRevenue: number;
  confidence: number;
  factors: {
    factor: string;
    impact: number;
    trend: 'positive' | 'negative' | 'neutral';
  }[];
  timeframes: {
    timeframe: string;
    revenue: number;
    confidence: number;
  }[];
}

export interface TournamentPrediction {
  tournamentId: string;
  tournamentName: string;
  participants: {
    playerId: string;
    playerName: string;
    winProbability: number;
    expectedFinish: number;
    keyFactors: string[];
  }[];
  predictedWinner: {
    playerId: string;
    playerName: string;
    probability: number;
  };
  tournamentMetrics: {
    expectedDuration: number;
    expectedRevenue: number;
    expectedParticipants: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
}

export interface PlayerInsights {
  playerId: string;
  playerName: string;
  strengths: string[];
  weaknesses: string[];
  improvementAreas: string[];
  performanceMetrics: {
    winRate: number;
    averageRating: number;
    tournamentPerformance: number;
    consistency: number;
    clutchFactor: number;
  };
  recommendations: string[];
  potentialRating: number;
}

export interface VenueAnalytics {
  venueId: string;
  venueName: string;
  performanceMetrics: {
    totalRevenue: number;
    averageRating: number;
    playerRetention: number;
    tournamentSuccess: number;
    activityLevel: number;
  };
  trends: {
    revenue: PerformanceTrend;
    players: PerformanceTrend;
    tournaments: PerformanceTrend;
  };
  insights: string[];
  recommendations: string[];
}

interface UseAdvancedAnalyticsReturn {
  trends: PerformanceTrend[];
  optimizations: VenueOptimization[];
  forecasts: RevenueForecast[];
  predictions: TournamentPrediction[];
  insights: PlayerInsights[];
  analytics: VenueAnalytics[];
  loading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
  getPlayerInsight: (playerId: string) => Promise<PlayerInsights | null>;
  getVenueAnalytic: (venueId: string) => Promise<VenueAnalytics | null>;
  getTournamentPrediction: (
    tournamentId: string
  ) => Promise<TournamentPrediction | null>;
  getVenueOptimization: (venueId: string) => Promise<VenueOptimization | null>;
  getRevenueForecast: (venueId: string) => Promise<RevenueForecast | null>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const useAdvancedAnalytics = (): UseAdvancedAnalyticsReturn => {
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [optimizations, setOptimizations] = useState<VenueOptimization[]>([]);
  const [forecasts, setForecasts] = useState<RevenueForecast[]>([]);
  const [predictions, setPredictions] = useState<TournamentPrediction[]>([]);
  const [insights, setInsights] = useState<PlayerInsights[]>([]);
  const [analytics, setAnalytics] = useState<VenueAnalytics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.on('analytics:updated', (data: any) => {
      console.log('Analytics updated:', data);
      refreshAnalytics();
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to analytics service');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/advanced-analytics/dashboard`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      if (result.success) {
        setTrends(result.data.trends || []);
        setOptimizations(result.data.optimizations || []);
        setForecasts(result.data.forecasts || []);
        setPredictions(result.data.predictions || []);
        setInsights(result.data.insights || []);
        setAnalytics(result.data.analytics || []);
      } else {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Refresh analytics
  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics();
  }, [fetchAnalytics]);

  // Get specific player insight
  const getPlayerInsight = useCallback(
    async (playerId: string): Promise<PlayerInsights | null> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/advanced-analytics/player-insight/${playerId}`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to fetch player insight');
        }

        const result = await response.json();
        return result.success ? result.data : null;
      } catch (err) {
        console.error('Error fetching player insight:', err);
        return null;
      }
    },
    []
  );

  // Get specific venue analytics
  const getVenueAnalytic = useCallback(
    async (venueId: string): Promise<VenueAnalytics | null> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/advanced-analytics/venue-analytic/${venueId}`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to fetch venue analytics');
        }

        const result = await response.json();
        return result.success ? result.data : null;
      } catch (err) {
        console.error('Error fetching venue analytics:', err);
        return null;
      }
    },
    []
  );

  // Get specific tournament prediction
  const getTournamentPrediction = useCallback(
    async (tournamentId: string): Promise<TournamentPrediction | null> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/advanced-analytics/tournament-prediction/${tournamentId}`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to fetch tournament prediction');
        }

        const result = await response.json();
        return result.success ? result.data : null;
      } catch (err) {
        console.error('Error fetching tournament prediction:', err);
        return null;
      }
    },
    []
  );

  // Get specific venue optimization
  const getVenueOptimization = useCallback(
    async (venueId: string): Promise<VenueOptimization | null> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/advanced-analytics/venue-optimization/${venueId}`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to fetch venue optimization');
        }

        const result = await response.json();
        return result.success ? result.data : null;
      } catch (err) {
        console.error('Error fetching venue optimization:', err);
        return null;
      }
    },
    []
  );

  // Get specific revenue forecast
  const getRevenueForecast = useCallback(
    async (venueId: string): Promise<RevenueForecast | null> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/advanced-analytics/revenue-forecast/${venueId}`
        );
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to fetch revenue forecast');
        }

        const result = await response.json();
        return result.success ? result.data : null;
      } catch (err) {
        console.error('Error fetching revenue forecast:', err);
        return null;
      }
    },
    []
  );

  return {
    trends,
    optimizations,
    forecasts,
    predictions,
    insights,
    analytics,
    loading,
    error,
    refreshAnalytics,
    getPlayerInsight,
    getVenueAnalytic,
    getTournamentPrediction,
    getVenueOptimization,
    getRevenueForecast,
  };
};
