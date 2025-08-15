import { BrowserEventEmitter } from '';
import { GameStateService } from '.js';

export interface PlayerMovement {
  playerId: string;
  fromLocation: {
    latitude: number;
    longitude: number;
    dojoId?: string;
  };
  toLocation: {
    latitude: number;
    longitude: number;
    dojoId: string;
    dojoName: string;
  };
  startTime: Date;
  estimatedDuration: number; // in minutes
  travelMethod: 'walking' | 'driving' | 'public_transport' | 'teleport' | 'fast_travel';
  status: 'traveling' | 'arrived' | 'cancelled';
  timeoutId?: NodeJS.Timeout; // Add timeout ID for cancellation
}

export interface TeleportCost {
  energy: number;
  coins: number;
  cooldownMinutes: number;
}

export interface FastTravelCost {
  energy: number;
  coins: number;
  timeMinutes: number;
}

/**
 * Focused service for managing player movement and travel
 * Handles walking, driving, teleportation, and fast travel mechanics
 */
export class PlayerMovementService extends BrowserEventEmitter {
  private activeMovements: Map<string, PlayerMovement> = new Map();
  private gameStateService: GameStateService;

  constructor(gameStateService: GameStateService) {
    super();
    this.gameStateService = gameStateService;
  }

  /**
   * Start regular travel to a destination dojo
   */
  async startTravel(
    destinationDojoId: string, 
    travelMethod: 'walking' | 'driving' | 'public_transport' = 'walking'
  ): Promise<PlayerMovement> {
    try {
      const currentLocation = this.gameStateService.getCurrentLocation();
      const playerId = this.gameStateService.getPlayerId();
      
      // Cancel any existing travel for this player
      await this.cancelTravel();
      
      const destinationLocation = await this.getDojoLocation(destinationDojoId);
      const travelTime = this.calculateTravelTime(currentLocation, destinationLocation, travelMethod);

      const movement: PlayerMovement = {
        playerId,
        fromLocation: currentLocation,
        toLocation: {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
          dojoId: destinationDojoId,
          dojoName: destinationLocation.name
        },
        startTime: new Date(),
        estimatedDuration: travelTime,
        travelMethod,
        status: 'traveling'
      };

      // Store timeout ID for later cancellation
      const timeoutId = setTimeout(() => {
        this.completeTravel();
      }, travelTime * 60000);
      
      movement.timeoutId = timeoutId;
      this.activeMovements.set(playerId, movement);
      
      // Update game state
      this.gameStateService.setTravelingState(true, {
        dojoId: destinationDojoId,
        dojoName: destinationLocation.name,
        latitude: destinationLocation.latitude,
        longitude: destinationLocation.longitude,
        estimatedArrival: new Date(Date.now() + travelTime * 60000)
      });

      this.emit('travelStarted', movement);

      return movement;
    } catch (error) {
      console.error('Error starting travel:', error);
      throw error;
    }
  }

  /**
   * Teleport to a dojo instantly (with costs and restrictions)
   */
  async teleportToDojo(
    dojoId: string, 
    teleportType: 'instant' | 'ritual' | 'clan_gate'
  ): Promise<PlayerMovement> {
    try {
      const currentLocation = this.gameStateService.getCurrentLocation();
      const playerId = this.gameStateService.getPlayerId();
      
      // Cancel any existing travel for this player
      await this.cancelTravel();
      
      const destinationLocation = await this.getDojoLocation(dojoId);
      
      const teleportCost = this.calculateTeleportCost(teleportType, currentLocation, destinationLocation);
      
      // Check if player has required resources
      if (!this.hasTeleportResources(teleportCost)) {
        throw new Error('Insufficient resources for teleportation');
      }

      const movement: PlayerMovement = {
        playerId,
        fromLocation: currentLocation,
        toLocation: {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
          dojoId,
          dojoName: destinationLocation.name
        },
        startTime: new Date(),
        estimatedDuration: teleportType === 'instant' ? 0 : 1, // Instant or 1 minute for ritual
        travelMethod: 'teleport',
        status: teleportType === 'instant' ? 'arrived' : 'traveling'
      };

      if (teleportType === 'instant') {
        // Immediate arrival - no timeout needed
        this.activeMovements.set(playerId, movement);
        this.gameStateService.updatePlayerLocation(
          destinationLocation.latitude,
          destinationLocation.longitude,
          dojoId
        );
        this.gameStateService.setTravelingState(false);
      } else {
        // Ritual teleport with short delay - store timeout ID
        const timeoutId = setTimeout(() => {
          this.completeTravel();
        }, 60000);
        
        movement.timeoutId = timeoutId;
        this.activeMovements.set(playerId, movement);
        
        this.gameStateService.setTravelingState(true, {
          dojoId,
          dojoName: destinationLocation.name,
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
          estimatedArrival: new Date(Date.now() + 60000)
        });
      }

      this.emit('teleportStarted', { movement, cost: teleportCost });
      return movement;
    } catch (error) {
      console.error('Error teleporting to dojo:', error);
      throw error;
    }
  }

  /**
   * Fast travel to allied or controlled territories
   */
  async fastTravelToDojo(
    dojoId: string, 
    fastTravelType: 'clan_network' | 'alliance_network' | 'premium'
  ): Promise<PlayerMovement> {
    try {
      const currentLocation = this.gameStateService.getCurrentLocation();
      const playerId = this.gameStateService.getPlayerId();
      
      // Cancel any existing travel for this player
      await this.cancelTravel();
      
      // Check fast travel access
      if (!this.hasFastTravelAccess(fastTravelType, dojoId)) {
        throw new Error('No fast travel access to this dojo');
      }

      const destinationLocation = await this.getDojoLocation(dojoId);
      const fastTravelCost = this.calculateFastTravelCost(fastTravelType, currentLocation, destinationLocation);
      const travelTime = this.calculateFastTravelTime(fastTravelType);

      const movement: PlayerMovement = {
        playerId,
        fromLocation: currentLocation,
        toLocation: {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
          dojoId,
          dojoName: destinationLocation.name
        },
        startTime: new Date(),
        estimatedDuration: travelTime,
        travelMethod: 'fast_travel',
        status: 'traveling'
      };

      // Store timeout ID for later cancellation
      const timeoutId = setTimeout(() => {
        this.completeTravel();
      }, travelTime * 60000);
      
      movement.timeoutId = timeoutId;
      this.activeMovements.set(playerId, movement);
      
      this.gameStateService.setTravelingState(true, {
        dojoId,
        dojoName: destinationLocation.name,
        latitude: destinationLocation.latitude,
        longitude: destinationLocation.longitude,
        estimatedArrival: new Date(Date.now() + travelTime * 60000)
      });

      this.emit('fastTravelStarted', { movement, cost: fastTravelCost });

      return movement;
    } catch (error) {
      console.error('Error fast traveling to dojo:', error);
      throw error;
    }
  }

  /**
   * Complete current travel
   */
  async completeTravel(): Promise<void> {
    try {
      const playerId = this.gameStateService.getPlayerId();
      const movement = this.activeMovements.get(playerId);
      
      if (!movement) {
        throw new Error('No active travel to complete');
      }

      // Clear any existing timeout
      if (movement.timeoutId) {
        clearTimeout(movement.timeoutId);
        movement.timeoutId = undefined;
      }

      // Update player location
      this.gameStateService.updatePlayerLocation(
        movement.toLocation.latitude,
        movement.toLocation.longitude,
        movement.toLocation.dojoId
      );

      // Clear traveling state
      this.gameStateService.setTravelingState(false);

      // Update movement status
      movement.status = 'arrived';
      this.activeMovements.set(playerId, movement);

      this.emit('travelCompleted', movement);
      
      // Clean up completed movement after a delay
      setTimeout(() => {
        this.activeMovements.delete(playerId);
      }, 5000);
    } catch (error) {
      console.error('Error completing travel:', error);
      throw error;
    }
  }

  /**
   * Cancel current travel
   */
  async cancelTravel(): Promise<void> {
    try {
      const playerId = this.gameStateService.getPlayerId();
      const movement = this.activeMovements.get(playerId);
      
      if (!movement) {
        return; // No active travel to cancel
      }

      // Clear any existing timeout
      if (movement.timeoutId) {
        clearTimeout(movement.timeoutId);
        movement.timeoutId = undefined;
      }

      movement.status = 'cancelled';
      this.activeMovements.set(playerId, movement);

      // Clear traveling state
      this.gameStateService.setTravelingState(false);

      this.emit('travelCancelled', movement);
      
      // Clean up cancelled movement
      setTimeout(() => {
        this.activeMovements.delete(playerId);
      }, 1000);
    } catch (error) {
      console.error('Error cancelling travel:', error);
      throw error;
    }
  }

  /**
   * Get current movement for player
   */
  getCurrentMovement(playerId: string): PlayerMovement | undefined {
    return this.activeMovements.get(playerId);
  }

  /**
   * Get all active movements
   */
  getAllMovements(): Map<string, PlayerMovement> {
    return new Map(this.activeMovements);
  }

  /**
   * Calculate travel time between locations
   */
  private calculateTravelTime(from: any, to: any, method: string): number {
    const distance = this.calculateDistance(from, to);
    
    const speedKmPerHour = {
      walking: 5,
      driving: 50,
      public_transport: 30
    };

    const speed = speedKmPerHour[method as keyof typeof speedKmPerHour] || 5;
    return Math.max(1, Math.round((distance / speed) * 60)); // Convert to minutes
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(from: any, to: any): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.latitude - from.latitude);
    const dLon = this.toRad(to.longitude - from.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(from.latitude)) * Math.cos(this.toRad(to.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate teleport cost based on type and distance
   */
  private calculateTeleportCost(teleportType: string, from: any, to: any): TeleportCost {
    const distance = this.calculateDistance(from, to);
    
    const baseCosts = {
      instant: { energy: 50, coins: 100, cooldownMinutes: 60 },
      ritual: { energy: 30, coins: 50, cooldownMinutes: 30 },
      clan_gate: { energy: 20, coins: 25, cooldownMinutes: 15 }
    };

    const base = baseCosts[teleportType as keyof typeof baseCosts] || baseCosts.instant;
    const distanceMultiplier = Math.max(1, distance / 10);

    return {
      energy: Math.round(base.energy * distanceMultiplier),
      coins: Math.round(base.coins * distanceMultiplier),
      cooldownMinutes: base.cooldownMinutes
    };
  }

  /**
   * Calculate fast travel cost
   */
  private calculateFastTravelCost(fastTravelType: string, from: any, to: any): FastTravelCost {
    const distance = this.calculateDistance(from, to);
    
    const baseCosts = {
      clan_network: { energy: 15, coins: 20, timeMinutes: 5 },
      alliance_network: { energy: 20, coins: 30, timeMinutes: 8 },
      premium: { energy: 10, coins: 50, timeMinutes: 3 }
    };

    const base = baseCosts[fastTravelType as keyof typeof baseCosts] || baseCosts.premium;
    const distanceMultiplier = Math.max(1, distance / 20);

    return {
      energy: Math.round(base.energy * distanceMultiplier),
      coins: Math.round(base.coins * distanceMultiplier),
      timeMinutes: Math.round(base.timeMinutes * distanceMultiplier)
    };
  }

  /**
   * Calculate fast travel time
   */
  private calculateFastTravelTime(fastTravelType: string): number {
    const travelTimes = {
      clan_network: 5,
      alliance_network: 8,
      premium: 3
    };

    return travelTimes[fastTravelType as keyof typeof travelTimes] || 5;
  }

  /**
   * Check if player has required teleport resources
   */
  private hasTeleportResources(cost: TeleportCost): boolean {
    // TODO: Integrate with player resource/wallet service
    return true; // Placeholder
  }

  /**
   * Check if player has fast travel access to dojo
   */
  private hasFastTravelAccess(fastTravelType: string, dojoId: string): boolean {
    // TODO: Integrate with territory/clan service to check access
    switch (fastTravelType) {
      case 'clan_network':
        return true; // Check if dojo is controlled by same clan
      case 'alliance_network':
        return true; // Check if dojo is controlled by allied clan
      case 'premium':
        return true; // Check if player has premium access
      default:
        return false;
    }
  }

  /**
   * Get dojo location data
   */
  private async getDojoLocation(dojoId: string): Promise<any> {
    // TODO: Integrate with dojo service
    const mockDojos = {
      'dojo-1': { latitude: -27.4698, longitude: 153.0251, name: 'Central Pool Hall' },
      'dojo-2': { latitude: -27.4750, longitude: 153.0300, name: 'Riverside Dojo' },
      'dojo-3': { latitude: -27.4800, longitude: 153.0350, name: 'Mountain View Pool' }
    };

    return mockDojos[dojoId as keyof typeof mockDojos] || mockDojos['dojo-1'];
  }
}

export default PlayerMovementService;
