import axiosInstance from '../../frontend/api/axiosInstance'; // Corrected path
import { Wallet, Transaction, WalletStats } from '../../types/wallet';
import { ethers } from 'ethers';

export interface WalletConnection {
  address: string;
  chainId: number;
  provider: ethers.providers.Web3Provider;
  signer: ethers.Signer;
  isConnected: boolean;
}

export interface TrophyInfo {
  tokenId: string;
  name: string;
  description: string;
  imageURI: string;
  rarity: string;
  trophyType: string;
  mintedAt: string;
  isTransferable: boolean;
  territoryId?: string;
  achievementId?: string;
}

export class WalletService {
    private connection: WalletConnection | null = null;
    private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

    private dojoTrophyAddress: string = '';
    private dojoCoinAddress: string = '';

    private dojoTrophyABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function getUserTrophies(address user) view returns (uint256[])',
      'function getTrophy(uint256 tokenId) view returns (tuple(uint256 id, uint8 trophyType, uint8 rarity, string name, string description, uint256 mintedAt, address mintedBy, bool isTransferable, uint256 territoryId, string achievementId))',
      'function mintTerritoryTrophy(address to, uint256 territoryId, string territoryName, uint8 rarity)',
      'event TrophyMinted(uint256 indexed tokenId, address indexed to, uint8 trophyType, uint8 rarity, string name)'
    ];

    private dojoCoinABI = [
      'function balanceOf(address account) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)'
    ];

    constructor() {
      this.setupEventListeners();
    }

    async connectMetaMask(): Promise<WalletConnection> {
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }

        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
          throw new Error('No accounts found');
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();
        const address = await signer.getAddress();

        this.connection = {
          address,
          chainId: network.chainId,
          provider,
          signer,
          isConnected: true
        };

        this.setContractAddresses(network.chainId);
        this.emit('connected', this.connection);
        return this.connection;

      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        throw error;
      }
    }

    disconnect(): void {
      this.connection = null;
      this.emit('disconnected');
    }

    getConnection(): WalletConnection | null {
      return this.connection;
    }

    isConnected(): boolean {
      return this.connection?.isConnected || false;
    }

    async getDojoCoinBalance(address?: string): Promise<string> {
      if (!this.connection) {
        throw new Error('Wallet not connected');
      }

      try {
        const contract = new ethers.Contract(
          this.dojoCoinAddress,
          this.dojCoinABI,
          this.connection.provider
        );

        const balance = await contract.balanceOf(address || this.connection.address);
        return ethers.utils.formatEther(balance);
      } catch (error) {
        console.error('Error getting Dojo Coin balance:', error);
        throw error;
      }
    }

    async getUserTrophies(address?: string): Promise<TrophyInfo[]> {
      if (!this.connection) {
        throw new Error('Wallet not connected');
      }

      try {
        const contract = new ethers.Contract(
          this.dojTrophyAddress,
          this.dojTrophyABI,
          this.connection.provider
        );

        const userAddress = address || this.connection.address;
        const trophyIds = await contract.getUserTrophies(userAddress);
        
        const trophies: TrophyInfo[] = [];
        
        for (const tokenId of trophyIds) {
          try {
            const trophy = await contract.getTrophy(tokenId);
            
            trophies.push({
              tokenId: tokenId.toString(),
              name: trophy.name,
              description: trophy.description,
              imageURI: `https://ipfs.io/ipfs/trophy-${tokenId}.png`,
              rarity: this.getRarityString(trophy.rarity),
              trophyType: this.getTrophyTypeString(trophy.trophyType),
              mintedAt: new Date(trophy.mintedAt.toNumber() * 1000).toISOString(),
              isTransferable: trophy.isTransferable,
              territoryId: trophy.territoryId.toString(),
              achievementId: trophy.achievementId
            });
          } catch (error) {
            console.error(`Error fetching trophy ${tokenId}:`, error);
          }
        }

        return trophies;
      } catch (error) {
        console.error('Error getting user trophies:', error);
        throw error;
      }
    }

    async mintTerritoryTrophy(
      territoryId: string,
      territoryName: string,
      rarity: number
    ): Promise<string> {
      if (!this.connection) {
        throw new Error('Wallet not connected');
      }

      try {
        const contract = new ethers.Contract(
          this.dojTrophyAddress,
          this.dojTrophyABI,
          this.connection.signer
        );

        const tx = await contract.mintTerritoryTrophy(
          this.connection.address,
          territoryId,
          territoryName,
          rarity
        );

        const receipt = await tx.wait();
        
        const event = receipt.events?.find((e: any) => e.event === 'TrophyMinted');
        if (event) {
          const tokenId = event.args.tokenId.toString();
          this.emit('trophyMinted', { tokenId, territoryId, territoryName, rarity });
          return tokenId;
        }

        throw new Error('Trophy minted but event not found');
      } catch (error) {
        console.error('Error minting territory trophy:', error);
        throw error;
      }
    }

    private setContractAddresses(chainId: number): void {
      switch (chainId) {
        case 1: // Ethereum mainnet
          this.dojTrophyAddress = '0x...'; // Mainnet address
          this.dojCoinAddress = '0x...'; // Mainnet address
          break;
        case 137: // Polygon
          this.dojTrophyAddress = '0x...'; // Polygon address
          this.dojCoinAddress = '0x...'; // Polygon address
          break;
        case 80001: // Mumbai testnet
          this.dojTrophyAddress = '0x...'; // Testnet address
          this.dojCoinAddress = '0x...'; // Testnet address
          break;
        default:
          this.dojTrophyAddress = '0x...';
          this.dojCoinAddress = '0x...';
      }
    }

    private getRarityString(rarity: number): string {
      const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
      return rarities[rarity] || 'Unknown';
    }

    private getTrophyTypeString(type: number): string {
      const types = ['Territory Ownership', 'Tournament Winner', 'Achievement'];
      return types[type] || 'Unknown';
    }

    private setupEventListeners(): void {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            this.disconnect();
          } else if (this.connection) {
            this.connection.address = accounts[0];
            this.emit('accountChanged', accounts[0]);
          }
        });

        window.ethereum.on('chainChanged', (chainId: string) => {
          if (this.connection) {
            this.connection.chainId = parseInt(chainId, 16);
            this.setContractAddresses(this.connection.chainId);
            this.emit('chainChanged', this.connection.chainId);
          }
        });
      }
    }

    on(event: string, callback: (...args: any[]) => void): void {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event)!.push(callback);
    }

    off(event: string, callback: (...args: any[]) => void): void {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }

    private emit(event: string, data?: any): void {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach(callback => callback(data));
      }
    }

    // Fetches the current logged-in user's wallet details
    async getWallet(): Promise<Wallet> {
        try {
            const response = await axiosInstance.get<Wallet>('/api/v1/wallet');
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
             const response = await axiosInstance.get<Transaction[]>('/api/v1/transactions', {
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
             const response = await axiosInstance.get<WalletStats>(`/api/v1/wallet/stats`, {
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
            const response = await axiosInstance.post('/api/v1/wallet/transfer', { // Placeholder endpoint
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

export const walletService = new WalletService(); 