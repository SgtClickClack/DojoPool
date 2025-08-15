import { useState, useEffect, useCallback } from 'react';

export interface HighlightGenerationRequest {
  matchId: string;
  tournamentId?: string;
  userId: string;
  gameType: string;
  highlights: string[];
  commentaryStyle?: 'professional' | 'casual' | 'excited' | 'analytical';
  includeAudio?: boolean;
  duration?: number;
  quality?: 'low' | 'medium' | 'high';
}

export interface GeneratedHighlight {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  audioUrl?: string;
  duration: number;
  thumbnailUrl?: string;
  createdAt: Date;
  matchId: string;
  tournamentId?: string;
  userId: string;
  highlights: string[];
  commentary: CommentaryEvent[];
  metadata: {
    quality: string;
    style: string;
    excitementLevel: number;
    difficulty: number;
    impact: number;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  };
  socialSharing: {
    shareUrl: string;
    downloadUrl: string;
    embedCode: string;
  };
}

export interface CommentaryEvent {
  id: string;
  timestamp: Date;
  type: 'shot' | 'foul' | 'score' | 'highlight' | 'analysis' | 'blessing' | 'fluke' | 'turnover' | 'timeout';
  content: string;
  audioUrl?: string;
  excitementLevel: number;
  confidence: number;
  context: any;
  poolGod?: string;
}

export interface AICommentaryConfig {
  enabled: boolean;
  realTimeCommentary: boolean;
  highlightGeneration: boolean;
  audioSynthesis: {
    enabled: boolean;
    voice: string;
    speed: number;
    pitch: number;
    volume: number;
    language: string;
  };
  videoGeneration: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    format: 'mp4' | 'webm' | 'mov';
    resolution: '720p' | '1080p' | '4k';
    fps: number;
    includeAudio: boolean;
    includeSubtitles: boolean;
  };
  socialSharing: {
    enabled: boolean;
    platforms: string[];
    autoShare: boolean;
    customMessage: boolean;
    includeHashtags: boolean;
  };
  commentaryStyles: string[];
  poolGods: string[];
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhook: boolean;
  };
}

export interface CommentaryHighlightsMetrics {
  totalHighlights: number;
  highlightsByMatch: Record<string, number>;
  averageGenerationTime: number;
  audioGenerated: number;
  videosGenerated: number;
  sharesGenerated: number;
  downloadsGenerated: number;
  popularStyles: Record<string, number>;
  poolGodUsage: Record<string, number>;
  lastActivity: Date;
}

interface UseAICommentaryHighlightsReturn {
  // Configuration
  config: AICommentaryConfig | null;
  updateConfig: (config: Partial<AICommentaryConfig>) => Promise<void>;
  
  // Highlight Generation
  generateHighlights: (request: HighlightGenerationRequest) => Promise<GeneratedHighlight>;
  isGenerating: boolean;
  generationError: string | null;
  
  // Highlight Retrieval
  highlights: GeneratedHighlight[];
  matchHighlights: (matchId: string) => GeneratedHighlight[];
  tournamentHighlights: (tournamentId: string) => GeneratedHighlight[];
  userHighlights: (userId: string) => GeneratedHighlight[];
  
  // Social Sharing
  shareHighlight: (highlightId: string, platforms: string[], message?: string) => Promise<void>;
  downloadHighlight: (highlightId: string) => Promise<string>;
  
  // Metrics
  metrics: CommentaryHighlightsMetrics | null;
  resetMetrics: () => Promise<void>;
  
  // Loading States
  isLoading: boolean;
  error: string | null;
}

const API_BASE = '/api/ai-commentary-highlights';

export const useAICommentaryHighlights = (): UseAICommentaryHighlightsReturn => {
  const [config, setConfig] = useState<AICommentaryConfig | null>(null);
  const [highlights, setHighlights] = useState<GeneratedHighlight[]>([]);
  const [metrics, setMetrics] = useState<CommentaryHighlightsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Load configuration
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/config`);
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      } else {
        setError('Failed to load configuration');
      }
    } catch (err) {
      setError('Error loading configuration');
      console.error('Error loading AI commentary config:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback(async (newConfig: Partial<AICommentaryConfig>) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadConfig(); // Reload config
      } else {
        setError('Failed to update configuration');
      }
    } catch (err) {
      setError('Error updating configuration');
      console.error('Error updating AI commentary config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadConfig]);

  // Generate highlights
  const generateHighlights = useCallback(async (request: HighlightGenerationRequest): Promise<GeneratedHighlight> => {
    try {
      setIsGenerating(true);
      setGenerationError(null);
      
      const response = await fetch(`${API_BASE}/highlights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newHighlight = data.highlight;
        setHighlights(prev => [newHighlight, ...prev]);
        return newHighlight;
      } else {
        throw new Error(data.error || 'Failed to generate highlights');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error generating highlights';
      setGenerationError(errorMessage);
      console.error('Error generating highlights:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Get match highlights
  const matchHighlights = useCallback((matchId: string): GeneratedHighlight[] => {
    return highlights.filter(h => h.matchId === matchId);
  }, [highlights]);

  // Get tournament highlights
  const tournamentHighlights = useCallback((tournamentId: string): GeneratedHighlight[] => {
    return highlights.filter(h => h.tournamentId === tournamentId);
  }, [highlights]);

  // Get user highlights
  const userHighlights = useCallback((userId: string): GeneratedHighlight[] => {
    return highlights.filter(h => h.userId === userId);
  }, [highlights]);

  // Share highlight
  const shareHighlight = useCallback(async (highlightId: string, platforms: string[], message?: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/highlights/${highlightId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platforms, message })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to share highlight');
      }
    } catch (err) {
      console.error('Error sharing highlight:', err);
      throw err;
    }
  }, []);

  // Download highlight
  const downloadHighlight = useCallback(async (highlightId: string): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/highlights/${highlightId}/download`);
      const data = await response.json();
      
      if (data.success) {
        return data.downloadUrl;
      } else {
        throw new Error(data.error || 'Failed to download highlight');
      }
    } catch (err) {
      console.error('Error downloading highlight:', err);
      throw err;
    }
  }, []);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/metrics`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error loading AI commentary metrics:', err);
    }
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/metrics/reset`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadMetrics(); // Reload metrics
      }
    } catch (err) {
      console.error('Error resetting AI commentary metrics:', err);
    }
  }, [loadMetrics]);

  // Initialize on mount
  useEffect(() => {
    loadConfig();
    loadMetrics();
  }, [loadConfig, loadMetrics]);

  return {
    // Configuration
    config,
    updateConfig,
    
    // Highlight Generation
    generateHighlights,
    isGenerating,
    generationError,
    
    // Highlight Retrieval
    highlights,
    matchHighlights,
    tournamentHighlights,
    userHighlights,
    
    // Social Sharing
    shareHighlight,
    downloadHighlight,
    
    // Metrics
    metrics,
    resetMetrics,
    
    // Loading States
    isLoading,
    error
  };
}; 