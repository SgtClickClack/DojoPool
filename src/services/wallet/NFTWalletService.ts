import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletConnection {
  address: string;
  chainId: number;
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
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

export class NFTWalletService {
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

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const address = await signer.getAddress();

      this.connection = {
        address,
        chainId: Number(network.chainId),
        provider,
        signer,
        isConnected: true
      };

      this.setContractAddresses(Number(network.chainId));
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
        this.dojoCoinABI,
        this.connection.provider
      );

      const balance = await contract.balanceOf(address || this.connection.address);
      return ethers.formatEther(balance);
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
        this.dojoTrophyAddress,
        this.dojoTrophyABI,
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
            mintedAt: new Date(Number(trophy.mintedAt) * 1000).toISOString(),
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
        this.dojoTrophyAddress,
        this.dojoTrophyABI,
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
        this.dojoTrophyAddress = '0x...'; // Mainnet address
        this.dojoCoinAddress = '0x...'; // Mainnet address
        break;
      case 137: // Polygon
        this.dojoTrophyAddress = '0x...'; // Polygon address
        this.dojoCoinAddress = '0x...'; // Polygon address
        break;
      case 80001: // Mumbai testnet
        this.dojoTrophyAddress = '0x...'; // Testnet address
        this.dojoCoinAddress = '0x...'; // Testnet address
        break;
      default:
        this.dojoTrophyAddress = '0x...';
        this.dojoCoinAddress = '0x...';
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
}

export const nftWalletService = new NFTWalletService(); 
