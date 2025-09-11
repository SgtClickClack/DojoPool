import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketJwtGuard } from '../auth/websocket-jwt.guard';
import { WebSocketRateLimitGuard } from '../auth/websocket-rate-limit.guard';
import { GeolocationService } from '../geolocation/geolocation.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface LocationUpdateData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

interface NearbyPlayersRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  includeAvatars?: boolean;
}

interface PlayerPresenceData {
  playerId: string;
  username: string;
  avatarUrl?: string;
  clanTag?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  isOnline: boolean;
  lastSeen: Date;
}

@Injectable()
@UseGuards(WebSocketJwtGuard, WebSocketRateLimitGuard)
@WebSocketGateway({
  namespace: '/world',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WorldGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WorldGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();
  private playerLocations = new Map<string, PlayerPresenceData>();

  // Room management for efficient broadcasting
  private locationRooms = new Map<string, Set<string>>(); // roomId -> Set of playerIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly geolocationService: GeolocationService,
    private readonly prisma: PrismaService
  ) {}

  afterInit(server: Server) {
    this.logger.log('World Gateway initialized');

    // Set up middleware for authentication
    server.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const payload = this.jwtService.verify(token);
        socket.userId = payload.sub || payload.id;

        // Load player profile
        const user = await this.prisma.user.findUnique({
          where: { id: socket.userId },
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
            memberships: {
              where: { status: 'ACTIVE' },
              select: {
                clan: {
                  select: { tag: true },
                },
              },
            },
          },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        // Store user info on socket
        socket.userId = user.id;
        (socket as any).userData = {
          username: user.profile?.displayName || user.username,
          avatarUrl: user.profile?.avatarUrl,
          clanTag: user.memberships[0]?.clan?.tag,
        };

        next();
      } catch (error) {
        this.logger.error('WebSocket authentication failed', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  async handleConnection(client: AuthenticatedSocket) {
    if (!client.userId) {
      client.disconnect();
      return;
    }

    this.logger.log(`Player ${client.userId} connected to world`);
    this.connectedClients.set(client.userId, client);

    // Get player's last known location
    const location = await this.geolocationService.getPlayerLocation(
      client.userId
    );

    if (location && location.isSharing) {
      // Update player presence
      const presenceData: PlayerPresenceData = {
        playerId: client.userId,
        username: (client as any).userData.username,
        avatarUrl: (client as any).userData.avatarUrl,
        clanTag: (client as any).userData.clanTag,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        isOnline: true,
        lastSeen: new Date(),
      };

      this.playerLocations.set(client.userId, presenceData);
      client.location = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      // Join location-based room for efficient broadcasting
      const roomId = this.getLocationRoomId(
        location.latitude,
        location.longitude
      );
      client.join(roomId);

      if (!this.locationRooms.has(roomId)) {
        this.locationRooms.set(roomId, new Set());
      }
      this.locationRooms.get(roomId)!.add(client.userId);

      // Broadcast player joined to nearby players
      this.broadcastToNearbyPlayers(
        client.userId,
        'player_joined',
        presenceData,
        2000 // 2km radius
      );

      // Send initial nearby players list to client
      await this.sendNearbyPlayersToClient(client);
    }

    client.emit('world_connected', {
      playerId: client.userId,
      timestamp: new Date(),
      status: 'connected',
    });
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (!client.userId) return;

    this.logger.log(`Player ${client.userId} disconnected from world`);

    // Update player presence
    const presenceData = this.playerLocations.get(client.userId);
    if (presenceData) {
      presenceData.isOnline = false;
      presenceData.lastSeen = new Date();

      // Broadcast player left to nearby players
      this.broadcastToNearbyPlayers(
        client.userId,
        'player_left',
        { playerId: client.userId, lastSeen: presenceData.lastSeen },
        2000
      );
    }

    // Clean up room membership
    if (client.location) {
      const roomId = this.getLocationRoomId(
        client.location.latitude,
        client.location.longitude
      );
      client.leave(roomId);
      const roomPlayers = this.locationRooms.get(roomId);
      if (roomPlayers) {
        roomPlayers.delete(client.userId);
        if (roomPlayers.size === 0) {
          this.locationRooms.delete(roomId);
        }
      }
    }

    // Clean up data structures
    this.connectedClients.delete(client.userId);
    this.playerLocations.delete(client.userId);
  }

  @SubscribeMessage('update_location')
  async handleLocationUpdate(
    @MessageBody() data: LocationUpdateData,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.userId) return;

    try {
      // Validate location data
      if (!this.isValidLocation(data.latitude, data.longitude)) {
        client.emit('location_error', { message: 'Invalid location data' });
        return;
      }

      // Update location in database
      const locationData = {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        altitude: data.altitude,
        heading: data.heading,
        speed: data.speed,
        isPrecise: true,
        isSharing: true,
      };

      await this.geolocationService.updateLocation(client.userId, locationData);

      // Update in-memory location
      const presenceData = this.playerLocations.get(client.userId);
      if (presenceData) {
        presenceData.latitude = data.latitude;
        presenceData.longitude = data.longitude;
        presenceData.heading = data.heading;
        presenceData.speed = data.speed;
        presenceData.lastSeen = new Date();
      }

      // Handle room transitions for efficient broadcasting
      await this.handleRoomTransition(client, data);

      // Broadcast location update to nearby players
      const locationUpdate = {
        playerId: client.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        timestamp: Date.now(),
      };

      this.broadcastToNearbyPlayers(
        client.userId,
        'location_update',
        locationUpdate,
        2000 // 2km radius
      );

      // Confirm update to client
      client.emit('location_updated', {
        success: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        `Location update failed for player ${client.userId}`,
        error
      );
      client.emit('location_error', {
        message: 'Failed to update location',
        timestamp: Date.now(),
      });
    }
  }

  @SubscribeMessage('get_nearby_players')
  async handleNearbyPlayersRequest(
    @MessageBody() data: NearbyPlayersRequest,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    if (!client.userId) return;

    try {
      const nearbyPlayers = await this.geolocationService.getNearbyPlayers(
        client.userId,
        {
          latitude: data.latitude,
          longitude: data.longitude,
          radius: data.radius || 1000,
          limit: 50,
        }
      );

      client.emit('nearby_players', {
        players: nearbyPlayers.players,
        center: nearbyPlayers.center,
        radius: nearbyPlayers.radius,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        `Nearby players request failed for ${client.userId}`,
        error
      );
      client.emit('nearby_players_error', {
        message: 'Failed to get nearby players',
        timestamp: Date.now(),
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('authenticate')
  handleAuthentication(
    @MessageBody() data: { token: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    // Authentication is handled by middleware, just acknowledge
    client.emit('authenticated', {
      success: true,
      playerId: client.userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast message to nearby players only
   */
  private broadcastToNearbyPlayers(
    senderId: string,
    event: string,
    data: any,
    radiusMeters: number = 1000
  ) {
    const senderPresence = this.playerLocations.get(senderId);
    if (!senderPresence) return;

    const nearbyPlayerIds = new Set<string>();

    // Find all players within radius using room-based approach
    for (const [roomId, playerIds] of this.locationRooms) {
      // Check if room is relevant (rough bounding box check)
      if (
        this.isRoomRelevant(
          roomId,
          senderPresence.latitude,
          senderPresence.longitude,
          radiusMeters
        )
      ) {
        for (const playerId of playerIds) {
          if (playerId !== senderId) {
            const playerPresence = this.playerLocations.get(playerId);
            if (
              playerPresence &&
              this.isWithinRadius(
                senderPresence.latitude,
                senderPresence.longitude,
                playerPresence.latitude,
                playerPresence.longitude,
                radiusMeters
              )
            ) {
              nearbyPlayerIds.add(playerId);
            }
          }
        }
      }
    }

    // Broadcast to nearby players
    for (const playerId of nearbyPlayerIds) {
      const client = this.connectedClients.get(playerId);
      if (client) {
        client.emit(event, data);
      }
    }

    this.logger.debug(
      `Broadcasted ${event} to ${nearbyPlayerIds.size} nearby players`
    );
  }

  /**
   * Send initial nearby players list to a newly connected client
   */
  private async sendNearbyPlayersToClient(client: AuthenticatedSocket) {
    if (!client.userId || !client.location) return;

    try {
      const nearbyPlayers = await this.geolocationService.getNearbyPlayers(
        client.userId,
        {
          latitude: client.location.latitude,
          longitude: client.location.longitude,
          radius: 2000, // 2km initial radius
          limit: 100,
        }
      );

      const onlinePlayers = nearbyPlayers.players.filter((player) => {
        const presence = this.playerLocations.get(player.playerId);
        return presence?.isOnline;
      });

      client.emit('nearby_players', {
        players: onlinePlayers,
        center: nearbyPlayers.center,
        radius: nearbyPlayers.radius,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to send nearby players to ${client.userId}`,
        error
      );
    }
  }

  /**
   * Handle room transitions when player moves
   */
  private async handleRoomTransition(
    client: AuthenticatedSocket,
    newLocation: LocationUpdateData
  ) {
    if (!client.location) return;

    const oldRoomId = this.getLocationRoomId(
      client.location.latitude,
      client.location.longitude
    );
    const newRoomId = this.getLocationRoomId(
      newLocation.latitude,
      newLocation.longitude
    );

    if (oldRoomId !== newRoomId) {
      // Leave old room
      client.leave(oldRoomId);
      const oldRoomPlayers = this.locationRooms.get(oldRoomId);
      if (oldRoomPlayers) {
        oldRoomPlayers.delete(client.userId!);
        if (oldRoomPlayers.size === 0) {
          this.locationRooms.delete(oldRoomId);
        }
      }

      // Join new room
      client.join(newRoomId);
      if (!this.locationRooms.has(newRoomId)) {
        this.locationRooms.set(newRoomId, new Set());
      }
      this.locationRooms.get(newRoomId)!.add(client.userId!);
    }

    // Update client location
    client.location = {
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
    };
  }

  /**
   * Generate room ID based on location (for efficient broadcasting)
   */
  private getLocationRoomId(latitude: number, longitude: number): string {
    // Create a grid-based room system (roughly 1km x 1km rooms)
    const latGrid = Math.floor(latitude * 100) / 100;
    const lngGrid = Math.floor(longitude * 100) / 100;
    return `loc_${latGrid}_${lngGrid}`;
  }

  /**
   * Check if a room is relevant for a location and radius
   */
  private isRoomRelevant(
    roomId: string,
    centerLat: number,
    centerLng: number,
    radiusMeters: number
  ): boolean {
    const match = roomId.match(/loc_(-?\d+\.\d+)_(-?\d+\.\d+)/);
    if (!match) return false;

    const roomLat = parseFloat(match[1]);
    const roomLng = parseFloat(match[2]);

    // Rough distance check (not precise but efficient for filtering)
    const latDiff = Math.abs(centerLat - roomLat);
    const lngDiff = Math.abs(centerLng - roomLng);

    // Convert to approximate meters (rough approximation)
    const latMeters = latDiff * 111000; // ~111km per degree latitude
    const lngMeters = lngDiff * 111000 * Math.cos((centerLat * Math.PI) / 180);

    const distance = Math.sqrt(latMeters * latMeters + lngMeters * lngMeters);

    return distance <= radiusMeters + 1000; // Add 1km buffer
  }

  /**
   * Calculate if two points are within a given radius (using Haversine formula)
   */
  private isWithinRadius(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    radiusMeters: number
  ): boolean {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance <= radiusMeters;
  }

  /**
   * Validate location coordinates
   */
  private isValidLocation(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    );
  }
}
