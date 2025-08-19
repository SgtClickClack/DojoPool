import axiosInstance from './axiosInstance';

export interface Wallet {
  id: string;
  balance: number;
  currency: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: string;
}

export const getWallet = async (): Promise<Wallet> => {
  try {
    const response = await axiosInstance.get('/api/wallet');
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet:', error);
    throw error;
  }
};

export const processPayment = async (
  amount: number,
  description: string
): Promise<boolean> => {
  try {
    await axiosInstance.post('/api/wallet/payment', { amount, description });
    return true;
  } catch (error) {
    console.error('Error processing payment:', error);
    return false;
  }
};
