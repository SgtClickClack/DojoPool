import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShotReplayData,
  CinematicShot,
  PlayerPattern,
  MatchCommentary,
  AdvancedCommentaryEvent,
  AdvancedCommentaryConfig,
  AdvancedCommentaryMetrics
} from '../services/ai/AdvancedAIMatchCommentaryHighlightsService';

// Types
export interface AdvancedHighlightRequest {
  matchId: string;
  tournamentId?: string;
  userId: string;
  gameType: string;
  highlights: any[];
  commentaryStyle?: 'professional' | 'casual' | 'excited' | 'analytical' | 'dramatic' | 'technical';
  includeAudio?: boolean;
  includeVideo?: boolean;
  duration?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  customization?: any;
}

export interface AdvancedCommentaryRequest {
  matchId: string;
  type: 'shot' | 'foul' | 'score' | 'turnover' | 'timeout' | 'highlight' | 'analysis' | 'blessing' | 'fluke' | 'strategy' | 'prediction';
  playerId?: string;
  playerName?: string;
  description: string;
  context?: any;
}

export interface AdvancedHighlight {
  id: string;
  matchId: string;
  tournamentId?: string;
  userId: string;
  gameType: string;
  title: string;
  description: string;
  duration: number;
  quality: string;
  commentaryStyle: string;
  audioUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  highlights: any[];
  commentary: any[];
  reactions: any[];
  shares: number;
  views: number;
  likes: number;
  customization: any;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

// Using imported types from service instead of local definitions

export interface ReactionRequest {
  commentaryId: string;
  userId: string;
  userName: string;
  type: 'like' | 'love' | 'wow' | 'insightful' | 'funny' | 'disagree';
  comment?: string;
}

export interface ShareRequest {
  highlightId: string;
  platform: 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'tiktok';
  message?: string;
}

// API functions
const API_BASE = '/api/advanced-ai-match-commentary-highlights';

const generateAdvancedHighlights = async (request: AdvancedHighlightRequest): Promise<AdvancedHighlight> => {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate advanced highlights: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const generateAdvancedCommentary = async (request: AdvancedCommentaryRequest): Promise<AdvancedCommentaryEvent> => {
  const response = await fetch(`${API_BASE}/commentary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate advanced commentary: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const fetchMatchHighlights = async (matchId: string): Promise<{ highlights: AdvancedHighlight[], commentary: AdvancedCommentaryEvent[], count: number }> => {
  const response = await fetch(`${API_BASE}/match/${matchId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch match highlights: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const fetchMatchCommentary = async (matchId: string): Promise<AdvancedCommentaryEvent[]> => {
  const response = await fetch(`${API_BASE}/commentary/${matchId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch match commentary: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const fetchAllHighlights = async (): Promise<AdvancedHighlight[]> => {
  const response = await fetch(`${API_BASE}/all`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch all highlights: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const fetchHighlight = async (highlightId: string): Promise<AdvancedHighlight> => {
  const response = await fetch(`${API_BASE}/highlight/${highlightId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch highlight: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const updateConfig = async (config: Partial<AdvancedCommentaryConfig>): Promise<AdvancedCommentaryConfig> => {
  const response = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update config: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const fetchConfig = async (): Promise<AdvancedCommentaryConfig> => {
  const response = await fetch(`${API_BASE}/config`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch config: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const fetchMetrics = async (): Promise<AdvancedCommentaryMetrics> => {
  const response = await fetch(`${API_BASE}/metrics`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const addReaction = async (reaction: ReactionRequest): Promise<any> => {
  const response = await fetch(`${API_BASE}/reaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reaction),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add reaction: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const shareHighlight = async (share: ShareRequest): Promise<any> => {
  const response = await fetch(`${API_BASE}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(share),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to share highlight: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

const deleteHighlight = async (highlightId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/highlight/${highlightId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete highlight: ${response.statusText}`);
  }
};

const checkHealth = async (): Promise<any> => {
  const response = await fetch(`${API_BASE}/health`);
  
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
};

// React Query Keys
export const advancedCommentaryKeys = {
  all: ['advanced-ai-match-commentary-highlights'] as const,
  match: (matchId: string) => [...advancedCommentaryKeys.all, 'match', matchId] as const,
  commentary: (matchId: string) => [...advancedCommentaryKeys.all, 'commentary', matchId] as const,
  highlight: (highlightId: string) => [...advancedCommentaryKeys.all, 'highlight', highlightId] as const,
  config: () => [...advancedCommentaryKeys.all, 'config'] as const,
  metrics: () => [...advancedCommentaryKeys.all, 'metrics'] as const,
  health: () => [...advancedCommentaryKeys.all, 'health'] as const,
};

interface UseAdvancedAIMatchCommentaryHighlightsReturn {
  // Core Features
  calculateShotScore: (shot: ShotReplayData) => Promise<number>;
  generateCinematicReplay: (shot: ShotReplayData) => Promise<CinematicShot>;
  analyzePlayerPatterns: (playerId: string, recentShots: ShotReplayData[]) => Promise<PlayerPattern>;
  generateCoachingAdvice: (playerId: string) => Promise<string[]>;
  generateLiveCommentary: (shot: ShotReplayData, gameContext?: any) => Promise<MatchCommentary[]>;
  
  // Match Management
  addShotToMatch: (shot: ShotReplayData) => Promise<void>;
  getCurrentMatchShots: () => Promise<ShotReplayData[]>;
  getMatchHighlights: () => Promise<CinematicShot[]>;
  clearMatchData: () => Promise<void>;
  
  // Player Patterns
  getPlayerPattern: (playerId: string) => Promise<PlayerPattern | null>;
  
  // Configuration & Metrics
  getConfig: () => Promise<AdvancedCommentaryConfig>;
  getMetrics: () => Promise<AdvancedCommentaryMetrics>;
  getCommentaryEvents: (matchId: string) => Promise<AdvancedCommentaryEvent[]>;
  
  // State
  loading: boolean;
  error: string | null;
  currentShots: ShotReplayData[];
  highlights: CinematicShot[];
  playerPatterns: Map<string, PlayerPattern>;
  liveCommentary: MatchCommentary[];
  config: AdvancedCommentaryConfig | null;
  metrics: AdvancedCommentaryMetrics | null;
}

export const useAdvancedAIMatchCommentaryHighlights = (): UseAdvancedAIMatchCommentaryHighlightsReturn => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Generate Advanced Highlights Mutation
  const generateHighlightsMutation = useMutation({
    mutationFn: generateAdvancedHighlights,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: advancedCommentaryKeys.match(data.matchId) });
      queryClient.invalidateQueries({ queryKey: advancedCommentaryKeys.all });
      setIsGenerating(false);
      setGenerationProgress(0);
    },
    onError: (error) => {
      setIsGenerating(false);
      setGenerationProgress(0);
      console.error('Failed to generate advanced highlights:', error);
    },
  });

  // Generate Advanced Commentary Mutation
  const generateCommentaryMutation = useMutation({
    mutationFn: generateAdvancedCommentary,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: advancedCommentaryKeys.commentary(data.matchId) });
      queryClient.invalidateQueries({ queryKey: advancedCommentaryKeys.match(data.matchId) });
    },
    onError: (error) => {
      console.error('Failed to generate advanced commentary:', error);
    },
  });

  // Add Reaction Mutation
  const addReactionMutation = useMutation({
    mutationFn: addReaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advancedCommentaryKeys.all });
    },
  });

  // Share Highlight Mutation
  const shareHighlightMutation = useMutation({
    mutationFn: shareHighlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advancedCommentaryKeys.all });
    },
  });

  // Delete Highlight Mutation
  const deleteHighlightMutation = useMutation({
    mutationFn: deleteHighlight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advancedCommentaryKeys.all });
    },
  });

  // Update Config Mutation
  const updateConfigMutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advancedCommentaryKeys.config() });
    },
  });

  // Generate highlights with progress simulation
  const generateHighlights = useCallback(async (request: AdvancedHighlightRequest) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const result = await generateHighlightsMutation.mutateAsync(request);
      setGenerationProgress(100);
      return result;
    } finally {
      clearInterval(progressInterval);
    }
  }, [generateHighlightsMutation]);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentShots, setCurrentShots] = useState<ShotReplayData[]>([]);
  const [highlights, setHighlights] = useState<CinematicShot[]>([]);
  const [playerPatterns, setPlayerPatterns] = useState<Map<string, PlayerPattern>>(new Map());
  const [liveCommentary, setLiveCommentary] = useState<MatchCommentary[]>([]);
  const [config, setConfig] = useState<AdvancedCommentaryConfig | null>(null);
  const [metrics, setMetrics] = useState<AdvancedCommentaryMetrics | null>(null);

  // Helper function for API calls
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Core Features
  const calculateShotScore = useCallback(async (shot: ShotReplayData): Promise<number> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/shot-score', {
        method: 'POST',
        body: JSON.stringify({ shot }),
      });
      
      return response.data.score;
    } catch (err) {
      console.error('Error calculating shot score:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const generateCinematicReplay = useCallback(async (shot: ShotReplayData): Promise<CinematicShot> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/cinematic-replay', {
        method: 'POST',
        body: JSON.stringify({ shot }),
      });
      
      return response.data;
    } catch (err) {
      console.error('Error generating cinematic replay:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const analyzePlayerPatterns = useCallback(async (playerId: string, recentShots: ShotReplayData[]): Promise<PlayerPattern> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/analyze-patterns', {
        method: 'POST',
        body: JSON.stringify({ playerId, recentShots }),
      });
      
      const pattern = response.data;
      setPlayerPatterns(prev => new Map(prev.set(playerId, pattern)));
      return pattern;
    } catch (err) {
      console.error('Error analyzing player patterns:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const generateCoachingAdvice = useCallback(async (playerId: string): Promise<string[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(`/coaching-advice/${playerId}`);
      return response.data.advice;
    } catch (err) {
      console.error('Error generating coaching advice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const generateLiveCommentary = useCallback(async (shot: ShotReplayData, gameContext: any = {}): Promise<MatchCommentary[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/live-commentary', {
        method: 'POST',
        body: JSON.stringify({ shot, gameContext }),
      });
      
      const commentary = response.data;
      setLiveCommentary(prev => [...prev, ...commentary]);
      return commentary;
    } catch (err) {
      console.error('Error generating live commentary:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Match Management
  const addShotToMatch = useCallback(async (shot: ShotReplayData): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await apiCall('/add-shot', {
        method: 'POST',
        body: JSON.stringify({ shot }),
      });
      
      setCurrentShots(prev => [...prev, shot]);
    } catch (err) {
      console.error('Error adding shot to match:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const getCurrentMatchShots = useCallback(async (): Promise<ShotReplayData[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/current-shots');
      const shots = response.data.shots;
      setCurrentShots(shots);
      return shots;
    } catch (err) {
      console.error('Error getting current match shots:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const getMatchHighlights = useCallback(async (): Promise<CinematicShot[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/match-highlights');
      const matchHighlights = response.data.highlights;
      setHighlights(matchHighlights);
      return matchHighlights;
    } catch (err) {
      console.error('Error getting match highlights:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const clearMatchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await apiCall('/clear-match', {
        method: 'POST',
      });
      
      setCurrentShots([]);
      setHighlights([]);
      setLiveCommentary([]);
    } catch (err) {
      console.error('Error clearing match data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Player Patterns
  const getPlayerPattern = useCallback(async (playerId: string): Promise<PlayerPattern | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(`/player-pattern/${playerId}`);
      const pattern = response.data;
      setPlayerPatterns(prev => new Map(prev.set(playerId, pattern)));
      return pattern;
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        return null;
      }
      console.error('Error getting player pattern:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Configuration & Metrics
  const getConfig = useCallback(async (): Promise<AdvancedCommentaryConfig> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/config');
      const configData = response.data;
      setConfig(configData);
      return configData;
    } catch (err) {
      console.error('Error getting config:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const getMetrics = useCallback(async (): Promise<AdvancedCommentaryMetrics> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall('/metrics');
      const metricsData = response.data;
      setMetrics(metricsData);
      return metricsData;
    } catch (err) {
      console.error('Error getting metrics:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const getCommentaryEvents = useCallback(async (matchId: string): Promise<AdvancedCommentaryEvent[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall(`/commentary-events/${matchId}`);
      return response.data.events;
    } catch (err) {
      console.error('Error getting commentary events:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          getConfig(),
          getMetrics(),
          getCurrentMatchShots(),
        ]);
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };

    loadInitialData();
  }, [getConfig, getMetrics, getCurrentMatchShots]);

  return {
    // Core Features
    calculateShotScore,
    generateCinematicReplay,
    analyzePlayerPatterns,
    generateCoachingAdvice,
    generateLiveCommentary,
    
    // Match Management
    addShotToMatch,
    getCurrentMatchShots,
    getMatchHighlights,
    clearMatchData,
    
    // Player Patterns
    getPlayerPattern,
    
    // Configuration & Metrics
    getConfig,
    getMetrics,
    getCommentaryEvents,
    
    // State
    loading,
    error,
    currentShots,
    highlights,
    playerPatterns,
    liveCommentary,
    config,
    metrics,
  };
};

export default useAdvancedAIMatchCommentaryHighlights;

// Query Hooks
export const useMatchHighlights = (matchId: string) => {
  return useQuery({
    queryKey: advancedCommentaryKeys.match(matchId),
    queryFn: () => fetchMatchHighlights(matchId),
    enabled: !!matchId,
    staleTime: 30000, // 30 seconds
  });
};

export const useMatchCommentary = (matchId: string) => {
  return useQuery({
    queryKey: advancedCommentaryKeys.commentary(matchId),
    queryFn: () => fetchMatchCommentary(matchId),
    enabled: !!matchId,
    staleTime: 10000, // 10 seconds
  });
};

export const useAllHighlights = () => {
  return useQuery({
    queryKey: advancedCommentaryKeys.all,
    queryFn: fetchAllHighlights,
    staleTime: 60000, // 1 minute
  });
};

export const useHighlight = (highlightId: string) => {
  return useQuery({
    queryKey: advancedCommentaryKeys.highlight(highlightId),
    queryFn: () => fetchHighlight(highlightId),
    enabled: !!highlightId,
  });
};

export const useAdvancedCommentaryConfig = () => {
  return useQuery({
    queryKey: advancedCommentaryKeys.config(),
    queryFn: fetchConfig,
    staleTime: 300000, // 5 minutes
  });
};

export const useAdvancedCommentaryMetrics = () => {
  return useQuery({
    queryKey: advancedCommentaryKeys.metrics(),
    queryFn: fetchMetrics,
    staleTime: 60000, // 1 minute
  });
};

export const useAdvancedCommentaryHealth = () => {
  return useQuery({
    queryKey: advancedCommentaryKeys.health(),
    queryFn: checkHealth,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Utility Hook for Real-time Updates
export const useAdvancedCommentaryRealTime = (matchId: string) => {
  const { data: matchData, refetch: refetchMatch } = useMatchHighlights(matchId);
  const { data: commentaryData, refetch: refetchCommentary } = useMatchCommentary(matchId);

  useEffect(() => {
    if (!matchId) return;

    const interval = setInterval(() => {
      refetchMatch();
      refetchCommentary();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [matchId, refetchMatch, refetchCommentary]);

  return {
    highlights: matchData?.highlights || [],
    commentary: commentaryData || [],
    count: matchData?.count || 0,
    isLoading: !matchData && !commentaryData,
  };
}; 