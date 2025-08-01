import { io, Socket } from 'socket.io-client';

// Types for the Living World Hub
export interface DojoData {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  allegiance: 'player' | 'rival' | 'neutral';
  isLocked: boolean;
  players: number;
  rating: number;
  clan: string;
  clanLeader: string;
  territoryLevel: number;
  clanWarStatus: 'active' | 'defending' | 'preparing' | 'none';
  clanWarScore: string;
  lastChallenge: string;
  distance: string;
  revenue: string;
  activeMatches: number;
  challenges: ChallengeData[];
  // Clan Wars territory ownership fields
  controllingClanId?: string;
  controllingClan?: {
    id: string;
    name: string;
    tag: string;
    avatar?: string;
  };
}

export interface ChallengeData {
  type: 'pilgrimage' | 'duel' | 'gauntlet';
  challenger: string;
  status: 'pending' | 'active' | 'completed';
}

export interface PlayerData {
  name: string;
  level: number;
  homeDojo: string;
  avatar: string;
  clan: string;
  clanRank: string;
  dojoCoins: number;
  currentLocation: { lat: number; lng: number };
  isMoving: boolean;
  destination: DojoData | null;
}

export interface TerritoryUpdate {
  dojoId: string;
  allegiance: 'player' | 'rival' | 'neutral';
  territoryLevel: number;
  clanWarStatus: 'active' | 'defending' | 'preparing' | 'none';
  clanWarScore: string;
  activeMatches: number;
}

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class LivingWorldHubService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private offlineQueue: Array<() => Promise<void>> = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.baseUrl = '/api';
    this.setupOnlineOfflineHandling();
  }

  // Setup online/offline event handling
  private setupOnlineOfflineHandling(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
      console.log('Living World Hub: Back online, processing queued operations');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Living World Hub: Gone offline, operations will be queued');
    });
  }

  // Cache management
  private getCacheKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // Offline queue management
  private addToOfflineQueue(operation: () => Promise<void>): void {
    this.offlineQueue.push(operation);
    // Limit queue size to prevent memory issues
    if (this.offlineQueue.length > 50) {
      this.offlineQueue.shift();
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) return;

    console.log(`Processing ${this.offlineQueue.length} queued operations`);
    
    const operations = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operation of operations) {
      try {
        await operation();
      } catch (error) {
        console.error('Failed to process queued operation:', error);
        // Re-queue failed operations
        this.offlineQueue.push(operation);
      }
    }
  }

  // Initialize WebSocket connection with reconnection logic
  async initializeSocket(): Promise<void> {
    try {
      this.socket = io(this.baseUrl, {
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000
      } as any);
      
      this.socket.on('connect', () => {
        console.log('Living World Hub connected to WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.processOfflineQueue();
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('Living World Hub disconnected from WebSocket:', reason);
        this.isConnected = false;
        
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          this.socket?.connect();
        }
      });

      this.socket.on('reconnect', (attemptNumber: number) => {
        console.log(`Living World Hub reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.processOfflineQueue();
      });

      this.socket.on('reconnect_attempt', (attemptNumber: number) => {
        console.log(`Living World Hub reconnection attempt ${attemptNumber}`);
        this.reconnectAttempts = attemptNumber;
      });

      this.socket.on('reconnect_failed', () => {
        console.error('Living World Hub reconnection failed');
        this.isConnected = false;
      });

      this.socket.on('territory_update', (data: TerritoryUpdate) => {
        console.log('Territory update received:', data);
        // Clear cache for this territory
        this.cache.delete(`dojos:${JSON.stringify({ lat: data.dojoId, lng: data.dojoId })}`);
        // Emit custom event for components to listen to
        window.dispatchEvent(new CustomEvent('territoryUpdate', { detail: data }));
      });

      this.socket.on('challenge_update', (data: any) => {
        console.log('Challenge update received:', data);
        // Clear challenge cache
        this.cache.delete('challenges:active');
        window.dispatchEvent(new CustomEvent('challengeUpdate', { detail: data }));
      });

      this.socket.on('player_movement', (data: any) => {
        console.log('Player movement update received:', data);
        window.dispatchEvent(new CustomEvent('playerMovement', { detail: data }));
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      this.isConnected = false;
    }
  }

  // Get all Dojos with enhanced data and caching
  async getDojos(lat: number, lng: number, radius: number = 5000): Promise<DojoData[]> {
    const cacheKey = this.getCacheKey('dojos', { lat, lng, radius });
    
    // Try cache first
    const cached = this.getFromCache<DojoData[]>(cacheKey);
    if (cached) {
      console.log('Returning cached dojo data');
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/dojo/candidates?lat=${lat}&lng=${lng}&radius=${radius}`, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      // Transform backend data to frontend format
      const dojos: DojoData[] = result.data.map((dojo: any) => ({
        id: dojo.id,
        name: dojo.name,
        coordinates: { lat: dojo.latitude, lng: dojo.longitude },
        allegiance: this.determineAllegiance(dojo),
        isLocked: dojo.status === 'locked',
        players: Math.floor(Math.random() * 20) + 5, // TODO: Get from backend
        rating: 4.5 + Math.random() * 0.5, // TODO: Get from backend
        clan: this.getClanForDojo(dojo),
        clanLeader: this.getClanLeaderForDojo(dojo),
        territoryLevel: this.getTerritoryLevel(dojo),
        clanWarStatus: this.getClanWarStatus(dojo),
        clanWarScore: this.getClanWarScore(dojo),
        lastChallenge: this.getLastChallengeTime(dojo),
        distance: `${dojo.distance}m`,
        revenue: this.getRevenueForDojo(dojo),
        activeMatches: Math.floor(Math.random() * 5), // TODO: Get from backend
        challenges: this.getChallengesForDojo(dojo),
        // Clan Wars territory ownership fields
        controllingClanId: dojo.controllingClanId || null,
        controllingClan: dojo.controllingClan ? {
          id: dojo.controllingClan.id,
          name: dojo.controllingClan.name,
          tag: dojo.controllingClan.tag,
          avatar: dojo.controllingClan.avatar
        } : null
      }));

      // Cache the result for 2 minutes
      this.setCache(cacheKey, dojos, 2 * 60 * 1000);

      return dojos;
    } catch (error) {
      console.error('Failed to fetch dojos:', error);
      
      // If offline, queue the operation
      if (!this.isOnline) {
        this.addToOfflineQueue(async () => {
          await this.getDojos(lat, lng, radius);
        });
      }
      
      // Return mock data as fallback
      return this.getMockDojos();
    }
  }

  // Get player data with caching
  async getPlayerData(): Promise<PlayerData> {
    const cacheKey = 'player:data';
    
    // Try cache first
    const cached = this.getFromCache<PlayerData>(cacheKey);
    if (cached) {
      console.log('Returning cached player data');
      return cached;
    }

    try {
      const [homeDojoResponse, playerResponse] = await Promise.all([
        fetch(`${this.baseUrl}/player/homeDojo`, {
          signal: AbortSignal.timeout(5000)
        }),
        fetch(`${this.baseUrl}/player/profile`, {
          signal: AbortSignal.timeout(5000)
        })
      ]);

      const homeDojoResult = await homeDojoResponse.json();
      const playerResult = await playerResponse.json();

      // TODO: Get real player data from backend
      const playerData: PlayerData = {
        name: "Kicky Breaks",
        level: 15,
        homeDojo: homeDojoResult.success ? homeDojoResult.data?.name : "The Empire Hotel",
        avatar: "👤",
        clan: "Crimson Monkey Clan",
        clanRank: "Leader",
        dojoCoins: 1250,
        currentLocation: { lat: -27.4698, lng: 153.0251 },
        isMoving: false,
        destination: null
      };

      // Cache for 1 minute
      this.setCache(cacheKey, playerData, 60 * 1000);

      return playerData;
    } catch (error) {
      console.error('Failed to fetch player data:', error);
      
      // If offline, queue the operation
      if (!this.isOnline) {
        this.addToOfflineQueue(async () => {
          await this.getPlayerData();
        });
      }
      
      // Return mock data as fallback
      return {
        name: "Kicky Breaks",
        level: 15,
        homeDojo: "The Empire Hotel",
        avatar: "👤",
        clan: "Crimson Monkey Clan",
        clanRank: "Leader",
        dojoCoins: 1250,
        currentLocation: { lat: -27.4698, lng: 153.0251 },
        isMoving: false,
        destination: null
      };
    }
  }

  // Create a challenge with offline support
  async createChallenge(type: string, dojoId: string, defenderId: string): Promise<any> {
    const operation = async () => {
      const response = await fetch(`${this.baseUrl}/challenge/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          defenderId,
          dojoId,
          requirements: this.getChallengeRequirements(type)
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      // Clear challenge cache
      this.cache.delete('challenges:active');

      // Emit challenge update via WebSocket
      if (this.socket && this.isConnected) {
        this.socket.emit('challenge_created', result.data);
      }

      return result.data;
    };

    try {
      return await operation();
    } catch (error) {
      console.error('Failed to create challenge:', error);
      
      // If offline, queue the operation
      if (!this.isOnline) {
        this.addToOfflineQueue(operation);
        console.log('Challenge creation queued for when back online');
        return { id: 'queued', status: 'queued', message: 'Challenge will be created when back online' };
      }
      
      throw error;
    }
  }

  // Get active challenges with caching
  async getActiveChallenges(): Promise<any[]> {
    const cacheKey = 'challenges:active';
    
    // Try cache first
    const cached = this.getFromCache<any[]>(cacheKey);
    if (cached) {
      console.log('Returning cached challenges');
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/challenge/active`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      // Cache for 30 seconds
      this.setCache(cacheKey, result.data, 30 * 1000);

      return result.data;
    } catch (error) {
      console.error('Failed to fetch active challenges:', error);
      
      // If offline, queue the operation
      if (!this.isOnline) {
        this.addToOfflineQueue(async () => {
          await this.getActiveChallenges();
        });
      }
      
      return [];
    }
  }

  // Update player location with offline support
  async updatePlayerLocation(lat: number, lng: number): Promise<void> {
    const operation = async () => {
      const response = await fetch(`${this.baseUrl}/player/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Emit movement update via WebSocket
      if (this.socket && this.isConnected) {
        this.socket.emit('player_moved', { lat, lng });
      }
    };

    try {
      await operation();
    } catch (error) {
      console.error('Failed to update player location:', error);
      
      // If offline, queue the operation
      if (!this.isOnline) {
        this.addToOfflineQueue(operation);
        console.log('Location update queued for when back online');
      }
    }
  }

  // Subscribe to territory updates
  subscribeToTerritoryUpdates(callback: (data: TerritoryUpdate) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('territoryUpdate', handler as EventListener);
    
    return () => {
      window.removeEventListener('territoryUpdate', handler as EventListener);
    };
  }

  // Subscribe to challenge updates
  subscribeToChallengeUpdates(callback: (data: any) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('challengeUpdate', handler as EventListener);
    
    return () => {
      window.removeEventListener('challengeUpdate', handler as EventListener);
    };
  }

  // Subscribe to player movement updates
  subscribeToPlayerMovement(callback: (data: any) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    window.addEventListener('playerMovement', handler as EventListener);
    
    return () => {
      window.removeEventListener('playerMovement', handler as EventListener);
    };
  }

  // Performance monitoring
  getPerformanceMetrics(): any {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      cacheSize: this.cache.size,
      offlineQueueSize: this.offlineQueue.length,
      isOnline: this.isOnline
    };
  }

  // Clear all caches
  clearAllCaches(): void {
    this.clearCache();
    console.log('All caches cleared');
  }

  // Helper methods for data transformation
  private determineAllegiance(dojo: any): 'player' | 'rival' | 'neutral' {
    // TODO: Implement real allegiance logic based on clan ownership
    if (dojo.name === 'The Empire Hotel') return 'player';
    if (dojo.name === 'The Wickham' || dojo.name === 'The Story Bridge Hotel') return 'rival';
    return 'neutral';
  }

  private getClanForDojo(dojo: any): string {
    const clanMap: { [key: string]: string } = {
      'The Empire Hotel': 'Crimson Monkey Clan',
      'The Wickham': 'Iron Fist Alliance',
      'The Story Bridge Hotel': 'Dragon\'s Breath',
      'The Victory Hotel': 'Unclaimed Territory',
      'The Plough Inn': 'Unclaimed Territory'
    };
    return clanMap[dojo.name] || 'Unclaimed Territory';
  }

  private getClanLeaderForDojo(dojo: any): string {
    const leaderMap: { [key: string]: string } = {
      'The Empire Hotel': 'Kicky Breaks',
      'The Wickham': 'RyuKlaw',
      'The Story Bridge Hotel': 'FireMaster',
      'The Victory Hotel': 'None',
      'The Plough Inn': 'None'
    };
    return leaderMap[dojo.name] || 'None';
  }

  private getTerritoryLevel(dojo: any): number {
    // TODO: Get from backend territory data
    const levelMap: { [key: string]: number } = {
      'The Empire Hotel': 3,
      'The Wickham': 2,
      'The Story Bridge Hotel': 1,
      'The Victory Hotel': 0,
      'The Plough Inn': 0
    };
    return levelMap[dojo.name] || 0;
  }

  private getClanWarStatus(dojo: any): 'active' | 'defending' | 'preparing' | 'none' {
    // TODO: Get from backend clan war data
    const statusMap: { [key: string]: 'active' | 'defending' | 'preparing' | 'none' } = {
      'The Empire Hotel': 'active',
      'The Wickham': 'defending',
      'The Story Bridge Hotel': 'preparing',
      'The Victory Hotel': 'none',
      'The Plough Inn': 'none'
    };
    return statusMap[dojo.name] || 'none';
  }

  private getClanWarScore(dojo: any): string {
    // TODO: Get from backend clan war data
    const scoreMap: { [key: string]: string } = {
      'The Empire Hotel': '15-8',
      'The Wickham': '8-15',
      'The Story Bridge Hotel': '0-0',
      'The Victory Hotel': '0-0',
      'The Plough Inn': '0-0'
    };
    return scoreMap[dojo.name] || '0-0';
  }

  private getLastChallengeTime(dojo: any): string {
    // TODO: Get from backend challenge history
    const timeMap: { [key: string]: string } = {
      'The Empire Hotel': '2 hours ago',
      'The Wickham': '1 hour ago',
      'The Story Bridge Hotel': '3 hours ago',
      'The Victory Hotel': 'Never',
      'The Plough Inn': '1 day ago'
    };
    return timeMap[dojo.name] || 'Never';
  }

  private getRevenueForDojo(dojo: any): string {
    // TODO: Get from backend revenue data
    const revenueMap: { [key: string]: string } = {
      'The Empire Hotel': '$2,450/week',
      'The Wickham': '$1,890/week',
      'The Story Bridge Hotel': '$1,200/week',
      'The Victory Hotel': '$0/week',
      'The Plough Inn': '$0/week'
    };
    return revenueMap[dojo.name] || '$0/week';
  }

  private getChallengesForDojo(dojo: any): ChallengeData[] {
    // TODO: Get from backend challenge data
    const challengeMap: { [key: string]: ChallengeData[] } = {
      'The Empire Hotel': [
        { type: 'pilgrimage', challenger: 'ShadowStriker', status: 'pending' },
        { type: 'duel', challenger: 'PoolMaster', status: 'active' }
      ],
      'The Wickham': [
        { type: 'gauntlet', challenger: 'Kicky Breaks', status: 'pending' }
      ],
      'The Story Bridge Hotel': [],
      'The Victory Hotel': [],
      'The Plough Inn': []
    };
    return challengeMap[dojo.name] || [];
  }

  private getChallengeRequirements(type: string): any {
    const requirements = {
      pilgrimage: { wins: 2, topTenDefeats: 2, masterDefeat: 1 },
      duel: { wins: 1, topTenDefeats: 1, masterDefeat: 0 },
      gauntlet: { wins: 3, topTenDefeats: 3, masterDefeat: 2 }
    };
    return requirements[type as keyof typeof requirements] || requirements.pilgrimage;
  }

  // Mock data fallback
  private getMockDojos(): DojoData[] {
    return [
      {
        id: '1',
        name: 'The Empire Hotel',
        coordinates: { lat: -27.4698, lng: 153.0251 },
        allegiance: 'player',
        isLocked: false,
        players: 12,
        rating: 4.8,
        clan: 'Crimson Monkey Clan',
        clanLeader: 'Kicky Breaks',
        territoryLevel: 3,
        clanWarStatus: 'active',
        clanWarScore: '15-8',
        lastChallenge: '2 hours ago',
        distance: '0.2 km',
        revenue: '$2,450/week',
        activeMatches: 3,
        challenges: [
          { type: 'pilgrimage', challenger: 'ShadowStriker', status: 'pending' },
          { type: 'duel', challenger: 'PoolMaster', status: 'active' }
        ]
      },
      {
        id: '2',
        name: 'The Wickham',
        coordinates: { lat: -27.4700, lng: 153.0255 },
        allegiance: 'rival',
        isLocked: false,
        players: 8,
        rating: 4.6,
        clan: 'Iron Fist Alliance',
        clanLeader: 'RyuKlaw',
        territoryLevel: 2,
        clanWarStatus: 'defending',
        clanWarScore: '8-15',
        lastChallenge: '1 hour ago',
        distance: '0.5 km',
        revenue: '$1,890/week',
        activeMatches: 1,
        challenges: [
          { type: 'gauntlet', challenger: 'Kicky Breaks', status: 'pending' }
        ]
      }
    ];
  }

  // Cleanup
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.clearCache();
    this.offlineQueue = [];
  }
}

// Export singleton instance
export const livingWorldHubService = new LivingWorldHubService();
export default livingWorldHubService; 
