import { io, type Socket } from 'socket.io-client';
import { type Location } from '@/utils/location';
import { Cache } from '@/utils/cache';
import { throttleLocationUpdates } from '@/utils/throttle';
import {
  performanceMonitor,
  locationMonitor,
  systemHealthMonitor,
} from '@/utils/monitoring';
import { WEBSOCKET_URL } from '@/constants';
import { locationValidator } from '@/utils/validation';

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

    // Register health checks
    systemHealthMonitor.registerHealthCheck('websocket', async () => {
      return this.socket?.connected ?? false;
    });

    systemHealthMonitor.registerHealthCheck('location_cache', async () => {
      try {
        const testKey = 'health_check';
        this.locationCache.set(testKey, { latitude: 0, longitude: 0 });
        return this.locationCache.get(testKey) !== undefined;
      } catch {
        return false;
      }
    });

    // Start health monitoring
    systemHealthMonitor.startMonitoring();
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
      if (this.socket.auth?.token) {
        locationValidator.clearPlayerHistory(this.socket.auth.token as string);
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
      performanceMonitor.recordLatency(connectionTime);
      performanceMonitor.recordSuccess(true);

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
      performanceMonitor.recordSuccess(false);
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      performanceMonitor.recordSuccess(false);
    });

    // Monitor player locations from other players
    this.socket.on(
      'player_locations',
      (locations: Record<string, Location>) => {
        Object.entries(locations).forEach(([playerId, location]) => {
          locationMonitor.recordLocation(playerId, location);
        });
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
          performanceMonitor.recordUpdateTime(duration);
          performanceMonitor.recordSuccess(true);
          locationMonitor.recordLocation('self', location);
        } catch (error) {
          performanceMonitor.recordSuccess(false);
          this.pendingUpdates.push(location);
        }
      },
      10, // minimum 10 meters
      1000 // minimum 1 second
    );
  }

  updateLocation(location: Location) {
    if (this.throttledUpdateLocation) {
      // Validate location before sending
      const validationResult = locationValidator.validateLocation(location);
      if (!validationResult.isValid) {
        console.warn('Invalid location:', validationResult.reason);
        return;
      }

      // Validate movement if we have a game state
      if (this.gameId && this.socket?.auth?.token) {
        const movementValidation = locationValidator.validateMovement(
          this.socket.auth.token as string,
          location
        );

        if (!movementValidation.isValidMovement) {
          console.warn(
            'Invalid movement:',
            movementValidation.suspiciousReason
          );
          return;
        }

        if (movementValidation.suspiciousReason) {
          console.warn(
            'Suspicious movement:',
            movementValidation.suspiciousReason
          );
        }

        // Record the speed in monitoring
        locationMonitor.recordPlayerSpeed(
          this.socket.auth.token as string,
          movementValidation.estimatedSpeed
        );
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
        performanceMonitor.recordUpdateTime(performance.now() - start);
        performanceMonitor.recordSuccess(true);
      } catch (error) {
        performanceMonitor.recordSuccess(false);
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
        performanceMonitor.recordUpdateTime(performance.now() - start);
        performanceMonitor.recordSuccess(true);
      } catch (error) {
        performanceMonitor.recordSuccess(false);
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
      performance: performanceMonitor.getAverages(),
      health: systemHealthMonitor.getStatus(),
      playerSpeeds: Object.fromEntries(
        Array.from(this.locationCache.get(this.gameId!) || {}).map(
          ([playerId]) => [playerId, locationMonitor.getPlayerSpeed(playerId)]
        )
      ),
    };
  }
}

export const gameSocket = new GameSocketService();
