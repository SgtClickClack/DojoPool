import { useState, useEffect, useCallback } from 'react';
import { passiveIncomeService, TerritoryIncome, IncomePayout, PassiveIncomeConfig } from '../services/economy/PassiveIncomeService';

export interface UsePassiveIncomeReturn {
  // State
  territoryIncomes: TerritoryIncome[];
  payoutHistory: Map<string, IncomePayout[]>;
  config: PassiveIncomeConfig | null;
  stats: {
    totalTerritories: number;
    totalActiveTerritories: number;
    totalIncomePerHour: number;
    totalEarned: number;
    averageIncomePerTerritory: number;
    clanControlledTerritories: number;
  } | null;
  loading: {
    territories: boolean;
    payouts: boolean;
    config: boolean;
    stats: boolean;
  };
  error: string | null;

  // Actions
  registerTerritory: (territoryId: string, ownerId: string, clanId?: string) => Promise<TerritoryIncome>;
  updateVenueActivity: (territoryId: string, activity: any) => Promise<void>;
  getTerritoryIncome: (territoryId: string) => TerritoryIncome | null;
  getPayoutHistory: (territoryId: string) => IncomePayout[];
  getUserTotalEarnings: (userId: string) => number;
  updateConfig: (newConfig: Partial<PassiveIncomeConfig>) => Promise<void>;
  startSystem: () => Promise<void>;
  stopSystem: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const usePassiveIncome = (): UsePassiveIncomeReturn => {
  const [territoryIncomes, setTerritoryIncomes] = useState<TerritoryIncome[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<Map<string, IncomePayout[]>>(new Map());
  const [config, setConfig] = useState<PassiveIncomeConfig | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState({
    territories: false,
    payouts: false,
    config: false,
    stats: false
  });
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadTerritoryIncomes();
    loadConfig();
    loadStats();
    setupEventListeners();
  }, []);

  const setupEventListeners = () => {
    // Listen for passive income events
    passiveIncomeService.on('payoutCreated', (payout: IncomePayout) => {
      setPayoutHistory(prev => {
        const newHistory = new Map(prev);
        const territoryHistory = newHistory.get(payout.territoryId) || [];
        territoryHistory.push(payout);
        newHistory.set(payout.territoryId, territoryHistory);
        return newHistory;
      });
    });

    passiveIncomeService.on('payoutsProcessed', (payouts: IncomePayout[]) => {
      // Refresh territory incomes after payouts
      loadTerritoryIncomes();
      loadStats();
    });
  };

  const loadTerritoryIncomes = useCallback(async () => {
    setLoading(prev => ({ ...prev, territories: true }));
    setError(null);
    
    try {
      const response = await fetch('/api/passive-income/territories');
      if (!response.ok) throw new Error('Failed to load territory incomes');
      
      const data = await response.json();
      if (data.success) {
        setTerritoryIncomes(data.data);
      } else {
        throw new Error(data.message || 'Failed to load territory incomes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load territory incomes';
      setError(errorMessage);
      console.error('Error loading territory incomes:', err);
    } finally {
      setLoading(prev => ({ ...prev, territories: false }));
    }
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(prev => ({ ...prev, config: true }));
    setError(null);
    
    try {
      const response = await fetch('/api/passive-income/config');
      if (!response.ok) throw new Error('Failed to load configuration');
      
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        throw new Error(data.message || 'Failed to load configuration');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
      console.error('Error loading configuration:', err);
    } finally {
      setLoading(prev => ({ ...prev, config: false }));
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    setError(null);
    
    try {
      const response = await fetch('/api/passive-income/stats');
      if (!response.ok) throw new Error('Failed to load statistics');
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to load statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(errorMessage);
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  const registerTerritory = useCallback(async (
    territoryId: string,
    ownerId: string,
    clanId?: string
  ): Promise<TerritoryIncome> => {
    setError(null);
    
    try {
      const response = await fetch('/api/passive-income/territories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ territoryId, ownerId, clanId })
      });
      
      if (!response.ok) throw new Error('Failed to register territory');
      
      const data = await response.json();
      if (data.success) {
        // Add to local state
        setTerritoryIncomes(prev => [...prev, data.data]);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to register territory');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register territory';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateVenueActivity = useCallback(async (territoryId: string, activity: any): Promise<void> => {
    setError(null);
    
    try {
      const response = await fetch(`/api/passive-income/territories/${territoryId}/activity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity })
      });
      
      if (!response.ok) throw new Error('Failed to update venue activity');
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to update venue activity');
      }
      
      // Refresh territory incomes to get updated data
      await loadTerritoryIncomes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update venue activity';
      setError(errorMessage);
      throw err;
    }
  }, [loadTerritoryIncomes]);

  const getTerritoryIncome = useCallback((territoryId: string): TerritoryIncome | null => {
    return territoryIncomes.find(t => t.territoryId === territoryId) || null;
  }, [territoryIncomes]);

  const getPayoutHistory = useCallback((territoryId: string): IncomePayout[] => {
    return payoutHistory.get(territoryId) || [];
  }, [payoutHistory]);

  const getUserTotalEarnings = useCallback((userId: string): number => {
    return territoryIncomes
      .filter(t => t.ownerId === userId)
      .reduce((sum, t) => sum + t.totalEarned, 0);
  }, [territoryIncomes]);

  const updateConfig = useCallback(async (newConfig: Partial<PassiveIncomeConfig>): Promise<void> => {
    setError(null);
    
    try {
      const response = await fetch('/api/passive-income/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      
      if (!response.ok) throw new Error('Failed to update configuration');
      
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        throw new Error(data.message || 'Failed to update configuration');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const startSystem = useCallback(async (): Promise<void> => {
    setError(null);
    
    try {
      const response = await fetch('/api/passive-income/start', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to start passive income system');
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to start passive income system');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start passive income system';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const stopSystem = useCallback(async (): Promise<void> => {
    setError(null);
    
    try {
      const response = await fetch('/api/passive-income/stop', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to stop passive income system');
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to stop passive income system');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop passive income system';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshData = useCallback(async (): Promise<void> => {
    await Promise.all([
      loadTerritoryIncomes(),
      loadConfig(),
      loadStats()
    ]);
  }, [loadTerritoryIncomes, loadConfig, loadStats]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    territoryIncomes,
    payoutHistory,
    config,
    stats,
    loading,
    error,

    // Actions
    registerTerritory,
    updateVenueActivity,
    getTerritoryIncome,
    getPayoutHistory,
    getUserTotalEarnings,
    updateConfig,
    startSystem,
    stopSystem,
    refreshData,
    clearError
  };
}; 