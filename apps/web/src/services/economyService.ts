import { apiClient } from './APIService';

export interface DojoCoinBalance {
  userId: string;
  balance: number;
  lastUpdated: Date;
}

export interface PurchaseRequest {
  amount: number;
  paymentMethod: string;
  paymentToken?: string;
}

export interface PurchaseResponse {
  transactionId: string;
  amount: number;
  newBalance: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface TransferRequest {
  toUserId: string;
  amount: number;
  reason: string;
}

class EconomyService {
  /**
   * Get user's DojoCoin balance
   */
  async getBalance(): Promise<DojoCoinBalance> {
    try {
      const response = await apiClient.get('/api/v1/economy/balance');
      return {
        userId: response.data.userId,
        balance: response.data.balance,
        lastUpdated: new Date(response.data.lastUpdated),
      };
    } catch (error) {
      console.error('Error fetching DojoCoin balance:', error);
      throw error;
    }
  }

  /**
   * Purchase DojoCoins
   */
  async purchaseDojoCoins(request: PurchaseRequest): Promise<PurchaseResponse> {
    try {
      const response = await apiClient.post(
        '/api/v1/economy/purchase',
        request
      );
      return {
        transactionId: response.data.transactionId,
        amount: response.data.amount,
        newBalance: response.data.newBalance,
        status: response.data.status,
      };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to purchase DojoCoins';
      throw new Error(message);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(limit = 50, offset = 0): Promise<Transaction[]> {
    try {
      const response = await apiClient.get('/api/v1/economy/transactions', {
        params: { limit, offset },
      });
      return response.data.map((tx: any) => ({
        id: tx.id,
        userId: tx.userId,
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        metadata: tx.metadata,
        createdAt: new Date(tx.createdAt),
      }));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Transfer DojoCoins to another user
   */
  async transferCoins(
    request: TransferRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(
        '/api/v1/economy/transfer/' + request.toUserId,
        {
          amount: request.amount,
          reason: request.reason,
        }
      );
      return {
        success: true,
        message: 'Transfer completed successfully',
      };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to transfer DojoCoins';
      throw new Error(message);
    }
  }
}

export const economyService = new EconomyService();
export default economyService;
