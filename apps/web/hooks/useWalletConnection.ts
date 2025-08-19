import { useState, useEffect, useCallback } from 'react';
import {
  walletConnectionService,
  type WalletConnection,
} from '../services/wallet/WalletConnectionService';

export interface UseWalletConnectionReturn {
  connection: WalletConnection | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectMetaMask: () => Promise<void>;
  disconnect: () => Promise<void>;
  getDojoCoinBalance: (address?: string) => Promise<string>;
  transferDojoCoin: (to: string, amount: string) => Promise<any>;
  addDojoCoinToWallet: () => Promise<void>;
  switchToEthereumMainnet: () => Promise<void>;
  switchToPolygon: () => Promise<void>;
}

export const useWalletConnection = (): UseWalletConnectionReturn => {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize connection state
  useEffect(() => {
    const currentConnection = walletConnectionService.getCurrentConnection();
    setConnection(currentConnection);
  }, []);

  const connectMetaMask = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newConnection = await walletConnectionService.connectMetaMask();
      setConnection(newConnection);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await walletConnectionService.disconnect();
      setConnection(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDojoCoinBalance = useCallback(async (address?: string) => {
    try {
      return await walletConnectionService.getDojoCoinBalance(address);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const transferDojoCoin = useCallback(async (to: string, amount: string) => {
    try {
      return await walletConnectionService.transferDojoCoin(to, amount);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const addDojoCoinToWallet = useCallback(async () => {
    try {
      await walletConnectionService.addDojoCoinToWallet();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const switchToEthereumMainnet = useCallback(async () => {
    try {
      await walletConnectionService.switchToEthereumMainnet();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const switchToPolygon = useCallback(async () => {
    try {
      await walletConnectionService.switchToPolygon();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    connection,
    isConnected: connection !== null,
    isLoading,
    error,
    connectMetaMask,
    disconnect,
    getDojoCoinBalance,
    transferDojoCoin,
    addDojoCoinToWallet,
    switchToEthereumMainnet,
    switchToPolygon,
  };
};
