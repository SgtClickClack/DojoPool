import { WEBSOCKET_URL } from '@/constants';
import { Cache } from '@/utils/cache';
import { type Location } from '@/utils/location';
import { systemHealthMonitor } from '@/utils/monitoring';
import { throttleLocationUpdates } from '@/utils/throttle';
import { locationValidator } from '@/utils/validation';
import { io, type Socket } from 'socket.io-client';

export interface GameUpdate {
  type: 'location' | 'game_over';
  data: any;
}

class GameSocketService {
  private socket: Socket | null = null;
  private gameId: string | null = null;
  private locationCache: Cache<Record<string, Location>>;
  private throttledUpdateLocation: ((location: Location) => void) | null = null;
  private pendingUpdates: Location[] = [];
  private connectionStartTime: number = 0;

  constructor() {
    this.locationCache = new Cache<Record<string, Location>>({
      maxAge: 5000,
      maxSize: 100,
    });

    // Start health monitoring if available
    if (systemHealthMonitor.startGameMetricsMonitoring) {
      systemHealthMonitor.startGameMetricsMonitoring();
    }
  }

  connect(gameId: string) {
    if (this.socket?.connected) {
      this.disconnect();
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    this.gameId = gameId;
    this.connectionStartTime = performance.now();

    this.socket = io(WEBSOCKET_URL, {
      auth: { token },
      query: { gameId },
    });

    this.setupEventHandlers();
    this.setupLocationThrottling();
  }

  disconnect() {
    if (this.socket) {
      // Clear location validation history
      const auth = (this.socket as any).auth;
      if (auth?.token) {
        locationValidator.clearPlayerHistory(auth.token as string);
      }

      this.socket.disconnect();
      this.socket = null;
      this.gameId = null;
      this.throttledUpdateLocation = null;
      this.pendingUpdates = [];
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to game socket');
      const connectionTime = performance.now() - this.connectionStartTime;
      console.log(`Connection time: ${connectionTime}ms`);

      // Send any pending updates
      if (this.pendingUpdates.length > 0) {
        const latestUpdate =
          this.pendingUpdates[this.pendingUpdates.length - 1];
        this.updateLocation(latestUpdate);
        this.pendingUpdates = [];
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from game socket');
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
    });

    // Monitor player locations from other players
    this.socket.on(
      'player_locations',
      (locations: Record<string, Location>) => {
        // Store all locations in cache
        this.locationCache.set(this.gameId!, locations);
      }
    );
  }

  private setupLocationThrottling() {
    this.throttledUpdateLocation = throttleLocationUpdates(
      async (location: Location) => {
        const start = performance.now();

        try {
          if (!this.socket?.connected) {
            this.pendingUpdates.push(location);
            return;
          }

          this.socket.emit('update_location', {
            gameId: this.gameId,
            location,
          });

          // Update cache with our own location
          const currentLocations = this.locationCache.get(this.gameId!) || {};
          this.locationCache.set(this.gameId!, {
            ...currentLocations,
            self: location,
          });

          // Record metrics
          const duration = performance.now() - start;
          console.log(`Location update time: ${duration}ms`);
        } catch (error) {
          console.error('Location update failed:', error);
          this.pendingUpdates.push(location);
        }
      },
      1000 // minimum 1 second
    );
  }

  updateLocation(location: Location) {
    if (this.throttledUpdateLocation) {
      // Validate location before sending
      const validationResult = locationValidator.validateLocation(
        'self',
        location
      );
      if (!validationResult) {
        console.warn('Invalid location: validation failed');
        return;
      }

      // Basic movement validation using validateLocation
      if (this.gameId && this.socket) {
        const auth = (this.socket as any).auth;
        if (auth?.token) {
          const isValidMovement = locationValidator.validateLocation(
            auth.token as string,
            location
          );

          if (!isValidMovement) {
            console.warn('Invalid movement: suspicious speed detected');
            return;
          }
        }
      }

      this.throttledUpdateLocation(location);
    }
  }

  onGameUpdate(callback: (update: GameUpdate) => void) {
    if (!this.socket) return;

    const wrappedCallback = (update: GameUpdate) => {
      const start = performance.now();
      try {
        callback(update);
        const duration = performance.now() - start;
        console.log(`Game update time: ${duration}ms`);
      } catch (error) {
        console.error('Game update error:', error);
      }
    };

    this.socket.on('game_update', wrappedCallback);
    return () => {
      this.socket?.off('game_update', wrappedCallback);
    };
  }

  onPlayerLocations(callback: (locations: Record<string, Location>) => void) {
    if (!this.socket) return;

    // Check cache first
    const cachedLocations = this.locationCache.get(this.gameId!);
    if (cachedLocations) {
      callback(cachedLocations);
    }

    // Listen for real-time updates
    const handleLocations = (locations: Record<string, Location>) => {
      const start = performance.now();
      try {
        this.locationCache.set(this.gameId!, locations);
        callback(locations);
        const duration = performance.now() - start;
        console.log(`Location update time: ${duration}ms`);
      } catch (error) {
        console.error('Location update error:', error);
      }
    };

    this.socket.on('player_locations', handleLocations);
    return () => {
      this.socket?.off('player_locations', handleLocations);
    };
  }

  getMetrics() {
    return {
      performance: { averageLatency: 0, averageFPS: 0 },
      health: { status: 'healthy', lastCheck: Date.now() },
      playerSpeeds: Object.fromEntries(
        Object.entries(this.locationCache.get(this.gameId!) || {}).map(
          ([playerId]) => [playerId, 0]
        )
      ),
    };
  }
}

export const gameSocket = new GameSocketService();
