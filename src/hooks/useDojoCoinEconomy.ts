import { useState, useEffect, useCallback } from 'react';
import { dojoCoinEconomyService } from '../services/economy/DojoCoinEconomyService';
import { DojoCoinTransaction, UserEconomyProfile, TransactionCategory } from '../services/economy/DojoCoinEconomyService';

export interface EconomyState {
  balance: number;
  profile: UserEconomyProfile | null;
  transactions: DojoCoinTransaction[];
  categories: TransactionCategory[];
  isLoading: boolean;
  error: string | null;
}

export interface TransactionStats {
  totalTransactions: number;
  totalEarned: number;
  totalSpent: number;
  averageTransaction: number;
  mostUsedCategory: string;
}

export const useDojoCoinEconomy = (userId: string) => {
  const [state, setState] = useState<EconomyState>({
    balance: 0,
    profile: null,
    transactions: [],
    categories: [],
    isLoading: true,
    error: null
  });

  // Load initial data
  const loadEconomyData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const balance = dojoCoinEconomyService.getUserBalance(userId);
      const profile = dojoCoinEconomyService.getUserProfile(userId);
      const transactions = dojoCoinEconomyService.getUserTransactions(userId, 50);
      const categories = dojoCoinEconomyService.getTransactionCategories();

      setState(prev => ({
        ...prev,
        balance,
        profile,
        transactions,
        categories,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      }));
    }
  }, [userId]);

  // Earn coins
  const earnCoins = useCallback(async (
    amount: number,
    categoryId: string,
    description: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const transaction = await dojoCoinEconomyService.earnCoins(
        userId,
        amount,
        categoryId,
        description,
        metadata
      );

      // Update state
      setState(prev => ({
        ...prev,
        balance: transaction.balance,
        profile: dojoCoinEconomyService.getUserProfile(userId),
        transactions: [transaction, ...prev.transactions.slice(0, 49)] // Keep latest 50
      }));

      return transaction;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to earn coins'
      }));
      throw error;
    }
  }, [userId]);

  // Spend coins
  const spendCoins = useCallback(async (
    amount: number,
    categoryId: string,
    description: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const transaction = await dojoCoinEconomyService.spendCoins(
        userId,
        amount,
        categoryId,
        description,
        metadata
      );

      // Update state
      setState(prev => ({
        ...prev,
        balance: transaction.balance,
        profile: dojoCoinEconomyService.getUserProfile(userId),
        transactions: [transaction, ...prev.transactions.slice(0, 49)] // Keep latest 50
      }));

      return transaction;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to spend coins'
      }));
      throw error;
    }
  }, [userId]);

  // Transfer coins
  const transferCoins = useCallback(async (
    toUserId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const result = await dojoCoinEconomyService.transferCoins(
        userId,
        toUserId,
        amount,
        description,
        metadata
      );

      // Update state
      setState(prev => ({
        ...prev,
        balance: result.fromTransaction.balance,
        profile: dojoCoinEconomyService.getUserProfile(userId),
        transactions: [result.fromTransaction, ...prev.transactions.slice(0, 49)] // Keep latest 50
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to transfer coins'
      }));
      throw error;
    }
  }, [userId]);

  // Get transaction statistics
  const getTransactionStats = useCallback((): TransactionStats => {
    return dojoCoinEconomyService.getTransactionStats(userId);
  }, [userId]);

  // Get leaderboard
  const getLeaderboard = useCallback((limit: number = 10) => {
    return dojoCoinEconomyService.getLeaderboard(limit);
  }, []);

  // Get earnings leaderboard
  const getEarningsLeaderboard = useCallback((limit: number = 10) => {
    return dojoCoinEconomyService.getEarningsLeaderboard(limit);
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    loadEconomyData();
  }, [loadEconomyData]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Event listeners for real-time updates
  useEffect(() => {
    const handleTransaction = (event: any) => {
      if (event.userId === userId) {
        // Update balance and profile
        setState(prev => ({
          ...prev,
          balance: dojoCoinEconomyService.getUserBalance(userId),
          profile: dojoCoinEconomyService.getUserProfile(userId)
        }));
      }
    };

    const handleRankUpgrade = (event: any) => {
      if (event.userId === userId) {
        // Update profile with new rank
        setState(prev => ({
          ...prev,
          profile: dojoCoinEconomyService.getUserProfile(userId)
        }));
      }
    };

    const handleTransfer = (event: any) => {
      if (event.fromUserId === userId || event.toUserId === userId) {
        // Update balance and profile
        setState(prev => ({
          ...prev,
          balance: dojoCoinEconomyService.getUserBalance(userId),
          profile: dojoCoinEconomyService.getUserProfile(userId)
        }));
      }
    };

    // Subscribe to events
    dojoCoinEconomyService.on('transaction', handleTransaction);
    dojoCoinEconomyService.on('rank_upgrade', handleRankUpgrade);
    dojoCoinEconomyService.on('transfer', handleTransfer);

    // Load initial data
    loadEconomyData();

    // Cleanup
    return () => {
      dojoCoinEconomyService.off('transaction', handleTransaction);
      dojoCoinEconomyService.off('rank_upgrade', handleRankUpgrade);
      dojoCoinEconomyService.off('transfer', handleTransfer);
    };
  }, [userId, loadEconomyData]);

  return {
    // State
    balance: state.balance,
    profile: state.profile,
    transactions: state.transactions,
    categories: state.categories,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    earnCoins,
    spendCoins,
    transferCoins,
    getTransactionStats,
    getLeaderboard,
    getEarningsLeaderboard,
    refresh,
    clearError
  };
}; 