'use client';

import {
  type AiHealthStatus,
  type AiServiceResponse,
  type MatchAnalysis,
  aiService,
} from '@/services/aiService';
import { useCallback, useEffect, useState } from 'react';

// Define types locally to avoid module import issues
interface TableBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

interface BallPosition {
  id: number | string;
  x: number;
  y: number;
  type: 'solid' | 'stripe' | '8-ball' | 'cue-ball' | 'unknown';
  confidence?: number;
  color?: string;
}

export interface UseAiReturn {
  // Health and status
  healthStatus: AiHealthStatus | null;
  isAiAvailable: boolean;
  preferredProvider: string | null;
  isLoading: boolean;
  error: string | null;

  // Analysis methods
  generateMatchAnalysis: (
    matchData: Parameters<typeof aiService.generateMatchAnalysis>[0]
  ) => Promise<AiServiceResponse<MatchAnalysis>>;
  generateLiveCommentary: (
    shotData: Parameters<typeof aiService.generateLiveCommentary>[0]
  ) => Promise<AiServiceResponse<string>>;
  analyzeTableImage: (
    imageFile: File
  ) => Promise<AiServiceResponse<{ tableBounds: TableBounds[]; balls: BallPosition[] }>>;

  // Utility methods
  refreshHealth: () => Promise<void>;
  clearError: () => void;
}

export function useAI(): UseAiReturn {
  const [healthStatus, setHealthStatus] = useState<AiHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check AI availability
  const isAiAvailable = healthStatus
    ? healthStatus.gemini.enabled || healthStatus.openai.enabled
    : false;

  // Get preferred provider
  const preferredProvider = healthStatus
    ? healthStatus.gemini.enabled && healthStatus.gemini.status === 'healthy'
      ? 'gemini'
      : healthStatus.openai.enabled && healthStatus.openai.status === 'healthy'
        ? 'openai'
        : null
    : null;

  // Refresh health status
  const refreshHealth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await aiService.getHealthStatus();
      setHealthStatus(status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to check AI status'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize health check on mount
  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  // Generate match analysis
  const generateMatchAnalysis = useCallback(
    async (
      matchData: Parameters<typeof aiService.generateMatchAnalysis>[0]
    ): Promise<AiServiceResponse<MatchAnalysis>> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await aiService.generateMatchAnalysis(matchData);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Analysis failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Generate live commentary
  const generateLiveCommentary = useCallback(
    async (
      shotData: Parameters<typeof aiService.generateLiveCommentary>[0]
    ): Promise<AiServiceResponse<string>> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await aiService.generateLiveCommentary(shotData);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Commentary generation failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Analyze table image
  const analyzeTableImage = useCallback(
    async (
      imageFile: File
    ): Promise<AiServiceResponse<{ tableBounds: TableBounds[]; balls: BallPosition[] }>> => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await aiService.analyzeTableImage(imageFile);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Image analysis failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    healthStatus,
    isAiAvailable,
    preferredProvider,
    isLoading,
    error,
    generateMatchAnalysis,
    generateLiveCommentary,
    analyzeTableImage,
    refreshHealth,
    clearError,
  };
}

// Specialized hook for match analysis
export function useMatchAnalysis() {
  const { generateMatchAnalysis, isLoading, error, clearError } = useAI();

  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const analyzeMatch = useCallback(
    async (matchData: Parameters<typeof generateMatchAnalysis>[0]) => {
      try {
        setAnalysisLoading(true);
        clearError();
        const result = await generateMatchAnalysis(matchData);

        if (result.success && result.data) {
          setAnalysis(result.data);
          return result.data;
        } else {
          throw new Error(result.error || 'Analysis failed');
        }
      } catch (err) {
        throw err;
      } finally {
        setAnalysisLoading(false);
      }
    },
    [generateMatchAnalysis, clearError]
  );

  return {
    analysis,
    analyzeMatch,
    isLoading: analysisLoading || isLoading,
    error,
    clearError: () => {
      setAnalysis(null);
      clearError();
    },
  };
}

// Specialized hook for live commentary
export function useLiveCommentary() {
  const { generateLiveCommentary, isLoading, error, clearError } = useAI();

  const [commentary, setCommentary] = useState<string>('');
  const [commentaryLoading, setCommentaryLoading] = useState(false);

  const generateCommentary = useCallback(
    async (shotData: Parameters<typeof generateLiveCommentary>[0]) => {
      try {
        setCommentaryLoading(true);
        clearError();
        const result = await generateLiveCommentary(shotData);

        if (result.success && result.data) {
          setCommentary(result.data);
          return result.data;
        } else {
          throw new Error(result.error || 'Commentary generation failed');
        }
      } catch (err) {
        throw err;
      } finally {
        setCommentaryLoading(false);
      }
    },
    [generateLiveCommentary, clearError]
  );

  return {
    commentary,
    generateCommentary,
    isLoading: commentaryLoading || isLoading,
    error,
    clearError: () => {
      setCommentary('');
      clearError();
    },
  };
}

// Specialized hook for table image analysis
export function useTableAnalysis() {
  const { analyzeTableImage, isLoading, error, clearError } = useAI();

  const [tableData, setTableData] = useState<{
    tableBounds: TableBounds[];
    balls: BallPosition[];
  } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const analyzeTable = useCallback(
    async (imageFile: File) => {
      try {
        setAnalysisLoading(true);
        clearError();
        const result = await analyzeTableImage(imageFile);

        if (result.success && result.data) {
          setTableData(result.data);
          return result.data;
        } else {
          throw new Error(result.error || 'Table analysis failed');
        }
      } catch (err) {
        throw err;
      } finally {
        setAnalysisLoading(false);
      }
    },
    [analyzeTableImage, clearError]
  );

  return {
    tableData,
    analyzeTable,
    isLoading: analysisLoading || isLoading,
    error,
    clearError: () => {
      setTableData(null);
      clearError();
    },
  };
}
