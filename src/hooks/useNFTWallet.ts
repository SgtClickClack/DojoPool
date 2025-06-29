import { useEffect, useState, useCallback } from 'react';
import { nftWalletService, WalletConnection, TrophyInfo } from '../services/wallet/NFTWalletService';

export interface UseNFTWalletReturn {
  // Connection state
  isConnected: boolean;
  connection: WalletConnection | null;
  
  // Wallet data
  dojoCoinBalance: string;
  userTrophies: TrophyInfo[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  connectMetaMask: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  refreshTrophies: () => Promise<void>;
  mintTerritoryTrophy: (territoryId: string, territoryName: string, rarity: number) => Promise<string>;
  
  // Events
  onConnected: (callback: (connection: WalletConnection) => void) => void;
  onDisconnected: (callback: () => void) => void;
  onAccountChanged: (callback: (address: string) => void) => void;
  onChainChanged: (callback: (chainId: number) => void) => void;
  onTrophyMinted: (callback: (data: any) => void) => void;
}

export const useNFTWallet = (): UseNFTWalletReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [dojoCoinBalance, setDojoCoinBalance] = useState('0');
  const [userTrophies, setUserTrophies] = useState<TrophyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize connection state
  useEffect(() => {
    const currentConnection = nftWalletService.getConnection();
    if (currentConnection) {
      setIsConnected(true);
      setConnection(currentConnection);
      refreshData();
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handleConnected = (conn: WalletConnection) => {
      setIsConnected(true);
      setConnection(conn);
      setError(null);
      refreshData();
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setConnection(null);
      setDojoCoinBalance('0');
      setUserTrophies([]);
      setError(null);
    };

    const handleAccountChanged = (address: string) => {
      if (connection) {
        setConnection({ ...connection, address });
        refreshData();
      }
    };

    const handleChainChanged = (chainId: number) => {
      if (connection) {
        setConnection({ ...connection, chainId });
        refreshData();
      }
    };

    const handleTrophyMinted = (data: any) => {
      refreshTrophies();
    };

    nftWalletService.on('connected', handleConnected);
    nftWalletService.on('disconnected', handleDisconnected);
    nftWalletService.on('accountChanged', handleAccountChanged);
    nftWalletService.on('chainChanged', handleChainChanged);
    nftWalletService.on('trophyMinted', handleTrophyMinted);

    return () => {
      nftWalletService.off('connected', handleConnected);
      nftWalletService.off('disconnected', handleDisconnected);
      nftWalletService.off('accountChanged', handleAccountChanged);
      nftWalletService.off('chainChanged', handleChainChanged);
      nftWalletService.off('trophyMinted', handleTrophyMinted);
    };
  }, [connection]);

  const refreshData = useCallback(async () => {
    if (!isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        refreshBalance(),
        refreshTrophies()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const refreshBalance = useCallback(async () => {
    if (!isConnected) return;

    try {
      const balance = await nftWalletService.getDojoCoinBalance();
      setDojoCoinBalance(balance);
    } catch (err) {
      console.error('Error refreshing balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh balance');
    }
  }, [isConnected]);

  const refreshTrophies = useCallback(async () => {
    if (!isConnected) return;

    try {
      const trophies = await nftWalletService.getUserTrophies();
      setUserTrophies(trophies);
    } catch (err) {
      console.error('Error refreshing trophies:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh trophies');
    }
  }, [isConnected]);

  const connectMetaMask = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await nftWalletService.connectMetaMask();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    nftWalletService.disconnect();
  }, []);

  const mintTerritoryTrophy = useCallback(async (
    territoryId: string,
    territoryName: string,
    rarity: number
  ): Promise<string> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const tokenId = await nftWalletService.mintTerritoryTrophy(territoryId, territoryName, rarity);
      await refreshTrophies(); // Refresh trophies after minting
      return tokenId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mint trophy');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, refreshTrophies]);

  // Event registration functions
  const onConnected = useCallback((callback: (connection: WalletConnection) => void) => {
    nftWalletService.on('connected', callback);
  }, []);

  const onDisconnected = useCallback((callback: () => void) => {
    nftWalletService.on('disconnected', callback);
  }, []);

  const onAccountChanged = useCallback((callback: (address: string) => void) => {
    nftWalletService.on('accountChanged', callback);
  }, []);

  const onChainChanged = useCallback((callback: (chainId: number) => void) => {
    nftWalletService.on('chainChanged', callback);
  }, []);

  const onTrophyMinted = useCallback((callback: (data: any) => void) => {
    nftWalletService.on('trophyMinted', callback);
  }, []);

  return {
    isConnected,
    connection,
    dojoCoinBalance,
    userTrophies,
    isLoading,
    error,
    connectMetaMask,
    disconnect,
    refreshBalance,
    refreshTrophies,
    mintTerritoryTrophy,
    onConnected,
    onDisconnected,
    onAccountChanged,
    onChainChanged,
    onTrophyMinted,
  };
}; 