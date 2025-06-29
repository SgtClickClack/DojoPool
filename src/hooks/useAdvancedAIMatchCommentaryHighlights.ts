import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

export interface AdvancedCommentaryEvent {
  id: string;
  matchId: string;
  type: string;
  playerId?: string;
  playerName?: string;
  description: string;
  context: any;
  timestamp: Date;
  reactions: any[];
}

export interface AdvancedCommentaryConfig {
  enabled: boolean;
  realTimeCommentary: boolean;
  highlightGeneration: boolean;
  audioSynthesis: boolean;
  videoSynthesis: boolean;
  socialSharing: boolean;
  analytics: boolean;
  updateInterval: number;
  retentionPeriod: number;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
}

export interface AdvancedCommentaryMetrics {
  totalEvents: number;
  totalHighlights: number;
  averageGenerationTime: number;
  popularStyles: string[];
  topReactions: string[];
  shareRate: number;
  lastActivity: Date;
}

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

// Main Hook
export const useAdvancedAIMatchCommentaryHighlights = () => {
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

  return {
    // Mutations
    generateHighlights,
    generateCommentary: generateCommentaryMutation.mutateAsync,
    addReaction: addReactionMutation.mutateAsync,
    shareHighlight: shareHighlightMutation.mutateAsync,
    deleteHighlight: deleteHighlightMutation.mutateAsync,
    updateConfig: updateConfigMutation.mutateAsync,
    
    // Loading states
    isGenerating,
    generationProgress,
    isGeneratingCommentary: generateCommentaryMutation.isPending,
    isAddingReaction: addReactionMutation.isPending,
    isSharing: shareHighlightMutation.isPending,
    isDeleting: deleteHighlightMutation.isPending,
    isUpdatingConfig: updateConfigMutation.isPending,
    
    // Error states
    generateError: generateHighlightsMutation.error,
    commentaryError: generateCommentaryMutation.error,
    reactionError: addReactionMutation.error,
    shareError: shareHighlightMutation.error,
    deleteError: deleteHighlightMutation.error,
    configError: updateConfigMutation.error,
  };
};

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