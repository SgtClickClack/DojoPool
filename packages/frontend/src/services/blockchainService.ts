import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';

interface TransferOptions {
  metadata?: any;
}

class BlockchainService {
  /**
   * Check if a wallet is connected
   * @param chain Optional specific chain to check
   * @returns Whether the wallet is connected
   */
  public async isWalletConnected(chain?: 'ethereum' | 'solana'): Promise<boolean> {
    try {
      if (chain === 'ethereum') {
        return window.ethereum && window.ethereum.selectedAddress !== null;
      } else if (chain === 'solana') {
        return window.solana && window.solana.isConnected;
      }
      
      // If no specific chain is specified, check if any wallet is connected
      const ethConnected = window.ethereum && window.ethereum.selectedAddress !== null;
      const solConnected = window.solana && window.solana.isConnected;
      
      return ethConnected || solConnected;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }
  
  /**
   * Transfer tokens from user's wallet to a recipient
   * @param recipient Recipient address
   * @param amount Amount to transfer
   * @param options Additional options
   * @returns Whether the transfer was successful
   */
  public async transferTokens(
    recipient: string,
    amount: string,
    options?: TransferOptions
  ): Promise<boolean> {
    try {
      // Implementation would depend on the active wallet/chain
      console.log(`Transferring ${amount} tokens to ${recipient}`, options);
      
      // This is a placeholder - real implementation would interact with the blockchain
      return true;
    } catch (error) {
      console.error('Error transferring tokens:', error);
      return false;
    }
  }
  
  /**
   * Get transaction history for a wallet
   * @param address Wallet address
   * @param chain Blockchain to query
   * @returns Transaction history
   */
  public async getTransactionHistory(
    address: string,
    chain: 'ethereum' | 'solana'
  ): Promise<any[]> {
    try {
      // This would fetch transaction history from the blockchain
      console.log(`Getting transaction history for ${address} on ${chain}`);
      
      // This is a placeholder - real implementation would interact with the blockchain
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const blockchainService = new BlockchainService(); 