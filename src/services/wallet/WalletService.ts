import axiosInstance from '../../frontend/api/axiosInstance'; // Corrected path
import { Wallet, Transaction, WalletStats } from '../../types/wallet';

export class WalletService {
    // Fetches the current logged-in user's wallet details
    async getWallet(): Promise<Wallet> {
        try {
            const response = await axiosInstance.get<Wallet>('/api/marketplace/wallet');
            return response.data;
        } catch (error) {
            console.error("Error fetching wallet:", error);
            // Consider returning a default/empty wallet or re-throwing a specific error
            throw error;
        }
    }

    // Fetches transaction history for a given wallet ID
    // TODO: Implement pagination/filtering parameters if needed by API
    async getTransactionHistory(walletId: number, limit: number = 20, offset: number = 0): Promise<Transaction[]> {
         try {
             // Adjust endpoint and params based on the actual backend implementation if needed
             const response = await axiosInstance.get<Transaction[]>('/api/marketplace/transactions', {
                 params: { wallet_id: walletId, limit, offset } // Pass wallet_id if required by backend
             });
             return response.data;
         } catch (error) {
             console.error("Error fetching transaction history:", error);
             throw error;
         }
    }

    // Fetches wallet statistics for a given wallet ID
    async getWalletStats(walletId: number): Promise<WalletStats> {
         try {
             // Assuming a /wallet/stats endpoint exists or needs creation
             // Adjust endpoint based on actual backend implementation
             // For now, using a placeholder endpoint - THIS NEEDS VERIFICATION/IMPLEMENTATION ON BACKEND
             const response = await axiosInstance.get<WalletStats>(`/api/marketplace/wallet/stats`, {
                params: { wallet_id: walletId } // Assuming wallet_id is needed
             }); 
             // Adapt parsing based on actual WalletStats structure returned by backend
             return response.data;
         } catch (error) {
             console.error("Error fetching wallet stats:", error);
             // Return default/empty stats on error?
             return {}; // Return empty object as placeholder
             // throw error; 
         }
    }

    // Transfers Dojo Points to another user
    // Backend endpoint needs verification - assuming /wallet/transfer exists
    async transferCoins(recipientUserId: number, amount: number, description: string): Promise<any> {
        try {
            // Verify backend endpoint and payload structure
            const response = await axiosInstance.post('/api/marketplace/wallet/transfer', { // Placeholder endpoint
                recipient_user_id: recipientUserId,
                amount: amount,
                description: description,
            });
            return response.data; // Should return success status or updated wallet info
        } catch (error) {
            console.error("Error transferring coins:", error);
            throw error; // Re-throw to be handled by the calling component
        }
    }
} 