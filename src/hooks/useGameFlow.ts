import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useGameState } from '../components/gameflow/GameStateManager';

export interface GameFlowConfig {
  venueId?: string;
  tournamentId?: string;
  tableId?: string;
  gameType?: '8ball' | '9ball' | 'straight' | 'cutthroat';
  opponentId?: string;
  isAIOpponent?: boolean;
}

export interface GameFlowStatus {
  stage: 'not-started' | 'check-in' | 'table-selection' | 'game-setup' | 'in-game' | 'completed';
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export interface GameFlowActions {
  startFlow: () => void;
  completeCheckIn: (checkInData: any) => void;
  selectTable: (tableId: string) => void;
  setupGame: (config: GameFlowConfig) => void;
  startGame: () => void;
  endGame: () => void;
  resetFlow: () => void;
  skipToStage: (stage: GameFlowStatus['stage']) => void;
}

export const useGameFlow = (initialConfig?: GameFlowConfig) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const gameState = useGameState();
  
  const [config, setConfig] = useState<GameFlowConfig>(initialConfig || {});
  const [status, setStatus] = useState<GameFlowStatus>({
    stage: 'not-started',
    isLoading: false,
    error: null,
    progress: 0,
  });

  const [flowData, setFlowData] = useState({
    checkInData: null as any,
    tableData: null as any,
    gameSession: null as any,
    results: null as any,
  });

  // Calculate progress based on stage
  useEffect(() => {
    const stageProgress = {
      'not-started': 0,
      'check-in': 20,
      'table-selection': 40,
      'game-setup': 60,
      'in-game': 80,
      'completed': 100,
    };
    
    setStatus(prev => ({
      ...prev,
      progress: stageProgress[prev.stage],
    }));
  }, [status.stage]);

  // Monitor game state changes
  useEffect(() => {
    if (gameState?.gameState) {
      const { status: gameStatus } = gameState.gameState;
      
      if (gameStatus === 'in-progress' && status.stage !== 'in-game') {
        setStatus(prev => ({ ...prev, stage: 'in-game' }));
      } else if (gameStatus === 'completed' && status.stage !== 'completed') {
        setStatus(prev => ({ ...prev, stage: 'completed' }));
        setFlowData(prev => ({
          ...prev,
          results: {
            winner: gameState.gameState.winner,
            duration: gameState.gameState.endTime && gameState.gameState.startTime
              ? new Date(gameState.gameState.endTime).getTime() - new Date(gameState.gameState.startTime).getTime()
              : 0,
            shots: gameState.gameState.shots,
            finalScore: gameState.gameState.score,
          },
        }));
      }
    }
  }, [gameState?.gameState, status.stage]);

  // Start the game flow
  const startFlow = useCallback(() => {
    setStatus({
      stage: 'check-in',
      isLoading: false,
      error: null,
      progress: 20,
    });
  }, []);

  // Complete check-in
  const completeCheckIn = useCallback((checkInData: any) => {
    setFlowData(prev => ({ ...prev, checkInData }));
    setStatus(prev => ({
      ...prev,
      stage: 'table-selection',
      error: null,
    }));
  }, []);

  // Select table
  const selectTable = useCallback((tableId: string) => {
    setConfig(prev => ({ ...prev, tableId }));
    setFlowData(prev => ({
      ...prev,
      tableData: { id: tableId, number: tableId },
    }));
    setStatus(prev => ({
      ...prev,
      stage: 'game-setup',
      error: null,
    }));
  }, []);

  // Setup game configuration
  const setupGame = useCallback(async (gameConfig: GameFlowConfig) => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Merge with existing config
      const finalConfig = { ...config, ...gameConfig };
      setConfig(finalConfig);

      // Initialize game state
      if (gameState?.initGame) {
        gameState.initGame({
          type: finalConfig.gameType || '8ball',
          players: [
            { id: user?.uid || '', name: user?.displayName || 'Player 1' },
            { 
              id: finalConfig.opponentId || 'ai_opponent', 
              name: finalConfig.isAIOpponent ? 'AI Opponent' : 'Player 2',
              isAI: finalConfig.isAIOpponent,
            },
          ],
          currentPlayerId: user?.uid || '',
          tableId: finalConfig.tableId,
          venueId: finalConfig.venueId,
          aiTracking: {
            enabled: true,
            confidence: 0,
            lastUpdate: new Date(),
          },
        });
      }

      setFlowData(prev => ({
        ...prev,
        gameSession: {
          id: `game_${Date.now()}`,
          config: finalConfig,
          startTime: new Date(),
        },
      }));

      setStatus(prev => ({
        ...prev,
        stage: 'in-game',
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to setup game',
      }));
    }
  }, [config, user, gameState]);

  // Start the actual game
  const startGame = useCallback(() => {
    if (gameState?.startGame) {
      gameState.startGame();
    }
  }, [gameState]);

  // End the game
  const endGame = useCallback(() => {
    setStatus(prev => ({ ...prev, stage: 'completed' }));
    
    // Navigate to results or dashboard
    if (config.tournamentId) {
      navigate(`/tournaments/${config.tournamentId}/results`);
    } else {
      navigate('/dashboard');
    }
  }, [navigate, config.tournamentId]);

  // Reset the entire flow
  const resetFlow = useCallback(() => {
    setStatus({
      stage: 'not-started',
      isLoading: false,
      error: null,
      progress: 0,
    });
    setFlowData({
      checkInData: null,
      tableData: null,
      gameSession: null,
      results: null,
    });
    setConfig(initialConfig || {});
  }, [initialConfig]);

  // Skip to a specific stage (for development/testing)
  const skipToStage = useCallback((stage: GameFlowStatus['stage']) => {
    setStatus(prev => ({
      ...prev,
      stage,
      error: null,
    }));
  }, []);

  const actions: GameFlowActions = {
    startFlow,
    completeCheckIn,
    selectTable,
    setupGame,
    startGame,
    endGame,
    resetFlow,
    skipToStage,
  };

  return {
    status,
    config,
    flowData,
    actions,
    gameState: gameState?.gameState,
  };
};

// Helper hooks for specific flow stages
export const useCheckIn = (venueId: string) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInData, setCheckInData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIn = useCallback(async (method: 'qr' | 'geo', data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // API call would go here
      const response = await fetch(`/api/venues/${venueId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, ...data }),
      });

      if (!response.ok) throw new Error('Check-in failed');
      
      const result = await response.json();
      setCheckInData(result);
      setIsCheckedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  const checkOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/venues/${venueId}/check-out`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Check-out failed');
      
      setIsCheckedIn(false);
      setCheckInData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-out failed');
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  return {
    isCheckedIn,
    checkInData,
    loading,
    error,
    checkIn,
    checkOut,
  };
};

export const useTableSelection = (venueId: string) => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/venues/${venueId}/tables`);
        if (!response.ok) throw new Error('Failed to fetch tables');
        
        const data = await response.json();
        setTables(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tables');
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchTables();
    }
  }, [venueId]);

  const selectTable = useCallback((tableId: string) => {
    setSelectedTable(tableId);
  }, []);

  const reserveTable = useCallback(async (tableId: string, duration: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/venues/${venueId}/tables/${tableId}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration }),
      });

      if (!response.ok) throw new Error('Failed to reserve table');
      
      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reserve table');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  return {
    tables,
    selectedTable,
    loading,
    error,
    selectTable,
    reserveTable,
  };
};