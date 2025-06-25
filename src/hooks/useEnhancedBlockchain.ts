import { useState, useEffect, useCallback } from 'react';
import { enhancedBlockchainService, DojoCoinBalance, CrossChainTransaction, NFTMarketplaceItem } from '../services/blockchain/EnhancedBlockchainService';

export interface UseEnhancedBlockchainReturn {
  // Dojo Coin Operations
  balances: Map<string, DojoCoinBalance>;
  loadingBalances: boolean;
  getBalance: (userId: string, network?: string) => Promise<DojoCoinBalance>;
  transferCoins: (fromUserId: string, toUserId: string, amount: string, network?: string) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  
  // Cross-Chain Operations
  crossChainTransactions: Map<string, CrossChainTransaction>;
  loadingCrossChain: boolean;
  initiateCrossChainTransfer: (fromUserId: string, toUserId: string, amount: string, fromNetwork: string, toNetwork: string) => Promise<CrossChainTransaction>;
  getCrossChainTransaction: (transactionId: string) => Promise<CrossChainTransaction | null>;
  
  // NFT Marketplace Operations
  marketplaceItems: NFTMarketplaceItem[];
  loadingMarketplace: boolean;
  listNFT: (tokenId: string, contractAddress: string, network: string, seller: string, price: string, currency?: 'DOJO' | 'ETH' | 'SOL', metadata?: any) => Promise<NFTMarketplaceItem>;
  buyNFT: (itemId: string, buyer: string, paymentMethod?: 'DOJO' | 'ETH' | 'SOL') => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  getMarketplaceItems: (network?: string, currency?: string, minPrice?: string, maxPrice?: string) => Promise<NFTMarketplaceItem[]>;
  
  // Smart Contract Operations
  mintNFT: (to: string, tokenId: string, metadata: any, network?: string) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  deployContract: (network: string) => Promise<{ success: boolean; contractAddress?: string; error?: string }>;
  
  // Analytics
  analytics: {
    totalTransactions: number;
    totalVolume: string;
    activeUsers: number;
    crossChainTransfers: number;
    nftListings: number;
    networkDistribution: Record<string, number>;
  } | null;
  loadingAnalytics: boolean;
  refreshAnalytics: () => Promise<void>;
  
  // Health Check
  healthStatus: {
    ethereum: boolean;
    polygon: boolean;
    solana: boolean;
    overall: boolean;
  } | null;
  loadingHealth: boolean;
  checkHealth: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useEnhancedBlockchain = (): UseEnhancedBlockchainReturn => {
  const [balances, setBalances] = useState<Map<string, DojoCoinBalance>>(new Map());
  const [crossChainTransactions, setCrossChainTransactions] = useState<Map<string, CrossChainTransaction>>(new Map());
  const [marketplaceItems, setMarketplaceItems] = useState<NFTMarketplaceItem[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [loadingCrossChain, setLoadingCrossChain] = useState(false);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Dojo Coin Operations
  const getBalance = useCallback(async (userId: string, network: string = 'ethereum'): Promise<DojoCoinBalance> => {
    setLoadingBalances(true);
    setError(null);
    
    try {
      const balance = await enhancedBlockchainService.getDojoCoinBalance(userId, network);
      setBalances(prev => new Map(prev).set(`${userId}-${network}`, balance));
      return balance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get balance';
      setError(errorMessage);
      throw err;
    } finally {
      setLoadingBalances(false);
    }
  }, []);

  const transferCoins = useCallback(async (
    fromUserId: string,
    toUserId: string,
    amount: string,
    network: string = 'ethereum'
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    setError(null);
    
    try {
      const result = await enhancedBlockchainService.transferDojoCoins(fromUserId, toUserId, amount, network);
      
      if (result.success) {
        // Refresh balances after successful transfer
        await getBalance(fromUserId, network);
        await getBalance(toUserId, network);
      } else {
        setError(result.error || 'Transfer failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transfer failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [getBalance]);

  // Cross-Chain Operations
  const initiateCrossChainTransfer = useCallback(async (
    fromUserId: string,
    toUserId: string,
    amount: string,
    fromNetwork: string,
    toNetwork: string
  ): Promise<CrossChainTransaction> => {
    setLoadingCrossChain(true);
    setError(null);
    
    try {
      const transaction = await enhancedBlockchainService.initiateCrossChainTransfer(
        fromUserId,
        toUserId,
        amount,
        fromNetwork,
        toNetwork
      );
      
      setCrossChainTransactions(prev => new Map(prev).set(transaction.id, transaction));
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Cross-chain transfer failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoadingCrossChain(false);
    }
  }, []);

  const getCrossChainTransaction = useCallback(async (transactionId: string): Promise<CrossChainTransaction | null> => {
    try {
      const transaction = await enhancedBlockchainService.getCrossChainTransaction(transactionId);
      if (transaction) {
        setCrossChainTransactions(prev => new Map(prev).set(transactionId, transaction));
      }
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get transaction';
      setError(errorMessage);
      return null;
    }
  }, []);

  // NFT Marketplace Operations
  const listNFT = useCallback(async (
    tokenId: string,
    contractAddress: string,
    network: string,
    seller: string,
    price: string,
    currency: 'DOJO' | 'ETH' | 'SOL' = 'DOJO',
    metadata?: any
  ): Promise<NFTMarketplaceItem> => {
    setLoadingMarketplace(true);
    setError(null);
    
    try {
      const item = await enhancedBlockchainService.listNFT(
        tokenId,
        contractAddress,
        network,
        seller,
        price,
        currency,
        metadata
      );
      
      setMarketplaceItems(prev => [item, ...prev]);
      return item;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list NFT';
      setError(errorMessage);
      throw err;
    } finally {
      setLoadingMarketplace(false);
    }
  }, []);

  const buyNFT = useCallback(async (
    itemId: string,
    buyer: string,
    paymentMethod: 'DOJO' | 'ETH' | 'SOL' = 'DOJO'
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    setError(null);
    
    try {
      const result = await enhancedBlockchainService.buyNFT(itemId, buyer, paymentMethod);
      
      if (result.success) {
        // Remove item from marketplace after successful purchase
        setMarketplaceItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        setError(result.error || 'Purchase failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const getMarketplaceItems = useCallback(async (
    network?: string,
    currency?: string,
    minPrice?: string,
    maxPrice?: string
  ): Promise<NFTMarketplaceItem[]> => {
    setLoadingMarketplace(true);
    setError(null);
    
    try {
      const items = await enhancedBlockchainService.getMarketplaceItems(network, currency, minPrice, maxPrice);
      setMarketplaceItems(items);
      return items;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get marketplace items';
      setError(errorMessage);
      return [];
    } finally {
      setLoadingMarketplace(false);
    }
  }, []);

  // Smart Contract Operations
  const mintNFT = useCallback(async (
    to: string,
    tokenId: string,
    metadata: any,
    network: string = 'ethereum'
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    setError(null);
    
    try {
      return await enhancedBlockchainService.mintNFT(to, tokenId, metadata, network);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'NFT minting failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const deployContract = useCallback(async (network: string): Promise<{ success: boolean; contractAddress?: string; error?: string }> => {
    setError(null);
    
    try {
      return await enhancedBlockchainService.deployDojoCoinContract(network);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Contract deployment failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Analytics
  const refreshAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setError(null);
    
    try {
      const analyticsData = await enhancedBlockchainService.getBlockchainAnalytics();
      setAnalytics(analyticsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get analytics';
      setError(errorMessage);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Health Check
  const checkHealth = useCallback(async () => {
    setLoadingHealth(true);
    setError(null);
    
    try {
      const health = await enhancedBlockchainService.healthCheck();
      setHealthStatus(health);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  // Error handling
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    refreshAnalytics();
    checkHealth();
    getMarketplaceItems();
  }, [refreshAnalytics, checkHealth, getMarketplaceItems]);

  return {
    // Dojo Coin Operations
    balances,
    loadingBalances,
    getBalance,
    transferCoins,
    
    // Cross-Chain Operations
    crossChainTransactions,
    loadingCrossChain,
    initiateCrossChainTransfer,
    getCrossChainTransaction,
    
    // NFT Marketplace Operations
    marketplaceItems,
    loadingMarketplace,
    listNFT,
    buyNFT,
    getMarketplaceItems,
    
    // Smart Contract Operations
    mintNFT,
    deployContract,
    
    // Analytics
    analytics,
    loadingAnalytics,
    refreshAnalytics,
    
    // Health Check
    healthStatus,
    loadingHealth,
    checkHealth,
    
    // Error handling
    error,
    clearError
  };
}; 