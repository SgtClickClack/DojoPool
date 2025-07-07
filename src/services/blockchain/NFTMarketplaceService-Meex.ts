/**
 * NFT Marketplace Service
 * 
 * Comprehensive NFT marketplace for player achievements, tournament rewards,
 * and digital collectibles with cross-chain functionality and smart contract integration.
 */

import { io, Socket } from 'socket.io-client';

// Core NFT Interfaces
export interface NFTMetadata {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes: NFTAttribute[];
  tournamentId?: string;
  playerId?: string;
  achievementId?: string;
  rarity: NFTRarity;
  mintDate: Date;
  creator: string;
  owner: string;
  network: BlockchainNetwork;
  contractAddress: string;
  tokenStandard: 'ERC721' | 'ERC1155';
  supply?: number; // For ERC1155
  royaltyPercentage?: number;
  isListed: boolean;
  listingPrice?: string;
  listingCurrency?: 'ETH' | 'DOJO' | 'USDC';
  listingExpiry?: Date;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
}

export interface NFTListing {
  id: string;
  tokenId: string;
  contractAddress: string;
  network: BlockchainNetwork;
  seller: string;
  price: string;
  currency: 'ETH' | 'DOJO' | 'USDC';
  expiryDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NFTCollection {
  id: string;
  name: string;
  description: string;
  image: string;
  bannerImage?: string;
  contractAddress: string;
  network: BlockchainNetwork;
  tokenStandard: 'ERC721' | 'ERC1155';
  creator: string;
  royaltyPercentage: number;
  totalSupply: number;
  floorPrice?: string;
  volume24h?: string;
  items: NFTMetadata[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NFTAchievement {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: NFTRarity;
  requirements: AchievementRequirement[];
  rewards: AchievementReward[];
  isActive: boolean;
  createdAt: Date;
}

export interface AchievementRequirement {
  type: 'tournament_win' | 'shot_accuracy' | 'games_played' | 'streak' | 'custom';
  value: number;
  description: string;
  metadata?: any;
}

export interface AchievementReward {
  type: 'nft' | 'tokens' | 'experience' | 'badge';
  value: string | number;
  metadata?: any;
}

export interface NFTTransaction {
  id: string;
  tokenId: string;
  contractAddress: string;
  network: BlockchainNetwork;
  type: 'mint' | 'transfer' | 'sale' | 'bid' | 'cancel';
  from: string;
  to: string;
  price?: string;
  currency?: string;
  txHash: string;
  blockNumber: number;
  timestamp: Date;
  gasUsed?: number;
  gasPrice?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface NFTBid {
  id: string;
  tokenId: string;
  contractAddress: string;
  network: BlockchainNetwork;
  bidder: string;
  amount: string;
  currency: 'ETH' | 'DOJO' | 'USDC';
  expiryDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface NFTMarketplaceStats {
  totalVolume: string;
  totalSales: number;
  totalListings: number;
  floorPrice: string;
  uniqueOwners: number;
  totalSupply: number;
  volume24h: string;
  sales24h: number;
  averagePrice: string;
}

// Enums
export enum NFTRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
  MYTHIC = 'mythic'
}

export enum BlockchainNetwork {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  SOLANA = 'solana',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  BSC = 'bsc'
}

export enum NFTStatus {
  MINTED = 'minted',
  LISTED = 'listed',
  SOLD = 'sold',
  TRANSFERRED = 'transferred',
  BURNED = 'burned'
}

class NFTMarketplaceService {
  private static instance: NFTMarketplaceService;
  private socket: Socket | null = null;
  private connected = false;
  
  // Data storage
  private nfts: Map<string, NFTMetadata> = new Map();
  private listings: Map<string, NFTListing> = new Map();
  private collections: Map<string, NFTCollection> = new Map();
  private achievements: Map<string, NFTAchievement> = new Map();
  private transactions: Map<string, NFTTransaction> = new Map();
  private bids: Map<string, NFTBid> = new Map();
  private marketplaceStats: NFTMarketplaceStats | null = null;

  private constructor() {
    this.initializeWebSocket();
    this.loadMockData();
  }

  public static getInstance(): NFTMarketplaceService {
    if (!NFTMarketplaceService.instance) {
      NFTMarketplaceService.instance = new NFTMarketplaceService();
    }
    return NFTMarketplaceService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('NFT Marketplace Service connected to server');
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('NFT Marketplace Service disconnected from server');
      });

      this.socket.on('nft-minted', (data: NFTMetadata) => {
        this.addNFT(data);
      });

      this.socket.on('nft-listed', (data: NFTListing) => {
        this.addListing(data);
      });

      this.socket.on('nft-sold', (data: NFTTransaction) => {
        this.addTransaction(data);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
    }
  }

  // Public methods will be added in the next part

  // NFT Management
  public async mintNFT(metadata: Omit<NFTMetadata, 'tokenId' | 'mintDate' | 'owner'>): Promise<NFTMetadata> {
    try {
      const newNFT: NFTMetadata = {
        ...metadata,
        tokenId: this.generateTokenId(),
        mintDate: new Date(),
        owner: metadata.creator, // Initially owned by creator
        isListed: false
      };

      this.addNFT(newNFT);
      this.socket?.emit('nft-minted', newNFT);

      return newNFT;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  public async listNFT(
    tokenId: string,
    contractAddress: string,
    network: BlockchainNetwork,
    price: string,
    currency: 'ETH' | 'DOJO' | 'USDC',
    seller: string,
    expiryDays: number = 30
  ): Promise<NFTListing> {
    try {
      const nft = this.getNFT(tokenId, contractAddress, network);
      if (!nft) {
        throw new Error('NFT not found');
      }

      if (nft.owner !== seller) {
        throw new Error('Only owner can list NFT');
      }

      const listing: NFTListing = {
        id: this.generateId(),
        tokenId,
        contractAddress,
        network,
        seller,
        price,
        currency,
        expiryDate: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update NFT listing status
      nft.isListed = true;
      nft.listingPrice = price;
      nft.listingCurrency = currency;
      nft.listingExpiry = listing.expiryDate;
      this.addNFT(nft);

      this.addListing(listing);
      this.socket?.emit('nft-listed', listing);

      return listing;
    } catch (error) {
      console.error('Error listing NFT:', error);
      throw error;
    }
  }

  public async buyNFT(
    listingId: string,
    buyer: string,
    price: string
  ): Promise<NFTTransaction> {
    try {
      const listing = this.getListing(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }

      if (!listing.isActive) {
        throw new Error('Listing is not active');
      }

      if (new Date() > listing.expiryDate) {
        throw new Error('Listing has expired');
      }

      if (listing.price !== price) {
        throw new Error('Price mismatch');
      }

      // Create transaction
      const transaction: NFTTransaction = {
        id: this.generateId(),
        tokenId: listing.tokenId,
        contractAddress: listing.contractAddress,
        network: listing.network,
        type: 'sale',
        from: listing.seller,
        to: buyer,
        price,
        currency: listing.currency,
        txHash: this.generateTxHash(),
        blockNumber: Math.floor(Math.random() * 1000000),
        timestamp: new Date(),
        gasUsed: Math.floor(Math.random() * 100000) + 50000,
        gasPrice: (Math.random() * 50 + 10).toString(),
        status: 'confirmed'
      };

      // Update NFT ownership
      const nft = this.getNFT(listing.tokenId, listing.contractAddress, listing.network);
      if (nft) {
        nft.owner = buyer;
        nft.isListed = false;
        nft.listingPrice = undefined;
        nft.listingCurrency = undefined;
        nft.listingExpiry = undefined;
        this.addNFT(nft);
      }

      // Deactivate listing
      listing.isActive = false;
      listing.updatedAt = new Date();
      this.addListing(listing);

      this.addTransaction(transaction);
      this.socket?.emit('nft-sold', transaction);

      return transaction;
    } catch (error) {
      console.error('Error buying NFT:', error);
      throw error;
    }
  }

  public async placeBid(
    tokenId: string,
    contractAddress: string,
    network: BlockchainNetwork,
    bidder: string,
    amount: string,
    currency: 'ETH' | 'DOJO' | 'USDC',
    expiryDays: number = 7
  ): Promise<NFTBid> {
    try {
      const bid: NFTBid = {
        id: this.generateId(),
        tokenId,
        contractAddress,
        network,
        bidder,
        amount,
        currency,
        expiryDate: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: new Date()
      };

      this.addBid(bid);
      this.socket?.emit('nft-bid-placed', bid);

      return bid;
    } catch (error) {
      console.error('Error placing bid:', error);
      throw error;
    }
  }

  public async acceptBid(bidId: string, owner: string): Promise<NFTTransaction> {
    try {
      const bid = this.getBid(bidId);
      if (!bid) {
        throw new Error('Bid not found');
      }

      if (!bid.isActive) {
        throw new Error('Bid is not active');
      }

      if (new Date() > bid.expiryDate) {
        throw new Error('Bid has expired');
      }

      const nft = this.getNFT(bid.tokenId, bid.contractAddress, bid.network);
      if (!nft || nft.owner !== owner) {
        throw new Error('Only owner can accept bid');
      }

      // Create transaction
      const transaction: NFTTransaction = {
        id: this.generateId(),
        tokenId: bid.tokenId,
        contractAddress: bid.contractAddress,
        network: bid.network,
        type: 'sale',
        from: owner,
        to: bid.bidder,
        price: bid.amount,
        currency: bid.currency,
        txHash: this.generateTxHash(),
        blockNumber: Math.floor(Math.random() * 1000000),
        timestamp: new Date(),
        gasUsed: Math.floor(Math.random() * 100000) + 50000,
        gasPrice: (Math.random() * 50 + 10).toString(),
        status: 'confirmed'
      };

      // Update NFT ownership
      nft.owner = bid.bidder;
      nft.isListed = false;
      nft.listingPrice = undefined;
      nft.listingCurrency = undefined;
      nft.listingExpiry = undefined;
      this.addNFT(nft);

      // Deactivate bid
      bid.isActive = false;
      this.addBid(bid);

      this.addTransaction(transaction);
      this.socket?.emit('nft-sold', transaction);

      return transaction;
    } catch (error) {
      console.error('Error accepting bid:', error);
      throw error;
    }
  }

  // Achievement System
  public async createAchievement(achievement: Omit<NFTAchievement, 'id' | 'createdAt'>): Promise<NFTAchievement> {
    const newAchievement: NFTAchievement = {
      ...achievement,
      id: this.generateId(),
      createdAt: new Date()
    };

    this.achievements.set(newAchievement.id, newAchievement);
    return newAchievement;
  }

  public async checkAndAwardAchievements(playerId: string, playerStats: any): Promise<NFTMetadata[]> {
    const awardedNFTs: NFTMetadata[] = [];

    for (const achievement of this.achievements.values()) {
      if (!achievement.isActive) continue;

      const isEligible = this.checkAchievementEligibility(achievement, playerStats);
      if (isEligible) {
        // Award NFT
        const nft = await this.mintNFT({
          name: achievement.name,
          description: achievement.description,
          image: achievement.image,
          attributes: [
            { trait_type: 'Achievement', value: achievement.name },
            { trait_type: 'Rarity', value: achievement.rarity },
            { trait_type: 'Player', value: playerId }
          ],
          rarity: achievement.rarity,
          creator: '0x0000000000000000000000000000000000000000', // System
          network: BlockchainNetwork.ETHEREUM,
          contractAddress: '0x1234567890123456789012345678901234567890', // Achievement contract
          tokenStandard: 'ERC721',
          isListed: false
        });

        awardedNFTs.push(nft);
      }
    }

    return awardedNFTs;
  }

  // Collection Management
  public async createCollection(collection: Omit<NFTCollection, 'id' | 'createdAt' | 'updatedAt' | 'items'>): Promise<NFTCollection> {
    const newCollection: NFTCollection = {
      ...collection,
      id: this.generateId(),
      items: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.collections.set(newCollection.id, newCollection);
    return newCollection;
  }

  public async addNFTToCollection(nftId: string, collectionId: string): Promise<void> {
    const nft = this.getNFTById(nftId);
    const collection = this.collections.get(collectionId);

    if (!nft || !collection) {
      throw new Error('NFT or collection not found');
    }

    collection.items.push(nft);
    collection.totalSupply = collection.items.length;
    collection.updatedAt = new Date();
  }

  // Query Methods
  public getNFT(tokenId: string, contractAddress: string, network: BlockchainNetwork): NFTMetadata | undefined {
    return Array.from(this.nfts.values()).find(
      nft => nft.tokenId === tokenId && 
             nft.contractAddress === contractAddress && 
             nft.network === network
    );
  }

  public getNFTById(id: string): NFTMetadata | undefined {
    return this.nfts.get(id);
  }

  public getNFTsByOwner(owner: string): NFTMetadata[] {
    return Array.from(this.nfts.values()).filter(nft => nft.owner === owner);
  }

  public getNFTsByCollection(collectionId: string): NFTMetadata[] {
    const collection = this.collections.get(collectionId);
    return collection ? collection.items : [];
  }

  public getActiveListings(): NFTListing[] {
    return Array.from(this.listings.values()).filter(
      listing => listing.isActive && new Date() < listing.expiryDate
    );
  }

  public getListingsByNetwork(network: BlockchainNetwork): NFTListing[] {
    return this.getActiveListings().filter(listing => listing.network === network);
  }

  public getBidsByToken(tokenId: string, contractAddress: string, network: BlockchainNetwork): NFTBid[] {
    return Array.from(this.bids.values()).filter(
      bid => bid.tokenId === tokenId && 
             bid.contractAddress === contractAddress && 
             bid.network === network &&
             bid.isActive &&
             new Date() < bid.expiryDate
    );
  }

  public getTransactionsByToken(tokenId: string, contractAddress: string, network: BlockchainNetwork): NFTTransaction[] {
    return Array.from(this.transactions.values()).filter(
      tx => tx.tokenId === tokenId && 
            tx.contractAddress === contractAddress && 
            tx.network === network
    );
  }

  public getMarketplaceStats(): NFTMarketplaceStats {
    if (!this.marketplaceStats) {
      this.calculateMarketplaceStats();
    }
    return this.marketplaceStats!;
  }

  // Private Helper Methods
  private addNFT(nft: NFTMetadata): void {
    this.nfts.set(nft.tokenId, nft);
  }

  private addListing(listing: NFTListing): void {
    this.listings.set(listing.id, listing);
  }

  private addTransaction(transaction: NFTTransaction): void {
    this.transactions.set(transaction.id, transaction);
  }

  private addBid(bid: NFTBid): void {
    this.bids.set(bid.id, bid);
  }

  private getListing(listingId: string): NFTListing | undefined {
    return this.listings.get(listingId);
  }

  private getBid(bidId: string): NFTBid | undefined {
    return this.bids.get(bidId);
  }

  private checkAchievementEligibility(achievement: NFTAchievement, playerStats: any): boolean {
    for (const requirement of achievement.requirements) {
      const statValue = playerStats[requirement.type] || 0;
      if (statValue < requirement.value) {
        return false;
      }
    }
    return true;
  }

  private calculateMarketplaceStats(): void {
    const activeListings = this.getActiveListings();
    const confirmedTransactions = Array.from(this.transactions.values()).filter(
      tx => tx.status === 'confirmed' && tx.type === 'sale'
    );

    const totalVolume = confirmedTransactions.reduce((sum, tx) => {
      return sum + parseFloat(tx.price || '0');
    }, 0).toString();

    const volume24h = confirmedTransactions
      .filter(tx => new Date().getTime() - tx.timestamp.getTime() < 24 * 60 * 60 * 1000)
      .reduce((sum, tx) => sum + parseFloat(tx.price || '0'), 0)
      .toString();

    const uniqueOwners = new Set(Array.from(this.nfts.values()).map(nft => nft.owner)).size;

    this.marketplaceStats = {
      totalVolume,
      totalSales: confirmedTransactions.length,
      totalListings: activeListings.length,
      floorPrice: this.calculateFloorPrice(),
      uniqueOwners,
      totalSupply: this.nfts.size,
      volume24h,
      sales24h: confirmedTransactions.filter(
        tx => new Date().getTime() - tx.timestamp.getTime() < 24 * 60 * 60 * 1000
      ).length,
      averagePrice: confirmedTransactions.length > 0 
        ? (parseFloat(totalVolume) / confirmedTransactions.length).toString()
        : '0'
    };
  }

  private calculateFloorPrice(): string {
    const activeListings = this.getActiveListings();
    if (activeListings.length === 0) return '0';

    const prices = activeListings.map(listing => parseFloat(listing.price));
    return Math.min(...prices).toString();
  }

  private generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTokenId(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTxHash(): string {
    return `0x${Math.random().toString(16).substr(2, 64)}`;
  }

  private loadMockData(): void {
    // Mock achievements
    this.createAchievement({
      name: 'Tournament Champion',
      description: 'Win your first tournament',
      image: '/images/achievements/tournament-champion.png',
      rarity: NFTRarity.LEGENDARY,
      requirements: [
        {
          type: 'tournament_win',
          value: 1,
          description: 'Win a tournament'
        }
      ],
      rewards: [
        {
          type: 'nft',
          value: 'Tournament Champion NFT',
          metadata: { rarity: NFTRarity.LEGENDARY }
        }
      ],
      isActive: true
    });

    // Mock collection
    this.createCollection({
      name: 'DojoPool Achievements',
      description: 'Collection of player achievements and tournament rewards',
      image: '/images/collections/achievements.png',
      contractAddress: '0x1234567890123456789012345678901234567890',
      network: BlockchainNetwork.ETHEREUM,
      tokenStandard: 'ERC721',
      creator: '0x0000000000000000000000000000000000000000',
      royaltyPercentage: 2.5,
      totalSupply: 0,
      floorPrice: '0.1',
      volume24h: '0'
    });
  }

  // Public getter methods
  public isConnected(): boolean {
    return this.connected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

export default NFTMarketplaceService; 