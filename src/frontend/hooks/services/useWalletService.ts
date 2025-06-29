import { useState, useEffect, useCallback } from 'react';
// import { apiClient } from '../../api/apiClient'; // Assuming an axios instance or similar
// import { User } from '../../types/user'; // Assuming a User type

// Define more specific types as needed, mirroring backend models
interface WalletData {
  balance: number;
  currency: string;
  lastTransactionDate?: string;
  // ... other wallet details
}

interface UseWalletServiceReturn {
  walletData: WalletData | null;
  loading: boolean;
  error: string | null;
  fetchWalletData: (userId: string) => Promise<void>; // Or however you identify the wallet
}

const useWalletService = (/* initialUserId?: string */): UseWalletServiceReturn => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Set to true initially if auto-fetching
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async (userId: string) => {
    if (!userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/wallet/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch wallet data: ${response.statusText}`);
      }
      const data: WalletData = await response.json();
      setWalletData(data);
    } catch (err: any) {
      console.error("Error fetching wallet data:", err);
      setError(err.message || 'Failed to fetch wallet data');
      setWalletData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Optional: Auto-fetch if initialUserId is provided
  // useEffect(() => {
  //   if (initialUserId) {
  //     fetchWalletData(initialUserId);
  //   }
  // }, [initialUserId, fetchWalletData]);

  return { walletData, loading, error, fetchWalletData };
};

export default useWalletService; 