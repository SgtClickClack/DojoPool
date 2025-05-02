import { useState, useEffect } from 'react';
import { getWallet, processPayment } from '../api/wallet';

interface Wallet {
  id: string;
  balance: number;
  transactions: {
    id: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'payment';
    description: string;
    timestamp: string;
  }[];
}

interface PaymentResult {
  success: boolean;
  message?: string;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await getWallet();
        setWallet(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch wallet'));
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const processPayment = async (payment: {
    amount: number;
    description: string;
  }): Promise<PaymentResult> => {
    try {
      const result = await processPayment(payment);
      if (result.success) {
        // Update local wallet state
        setWallet((prev) => ({
          ...prev!,
          balance: prev!.balance - payment.amount,
          transactions: [
            ...prev!.transactions,
            {
              id: Date.now().toString(),
              amount: payment.amount,
              type: 'payment',
              description: payment.description,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      }
      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Payment failed',
      };
    }
  };

  return {
    wallet: wallet || {
      id: '',
      balance: 0,
      transactions: [],
    },
    loading,
    error,
    processPayment,
  };
};
