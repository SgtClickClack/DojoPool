import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketJwtGuard } from '../auth/websocket-jwt.guard';
import { WebSocketRateLimitGuard } from '../auth/websocket-rate-limit.guard';
import { ShardManagerService } from '../common/shard-manager.service';
import { corsOptions } from '../config/cors.config';
import { FeatureFlagsConfig } from '../config/feature-flags.config';
import { SOCKET_NAMESPACES } from '../config/sockets.config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface PlayerPosition {
  playerId: string;
  playerName: string;
  avatar?: string;
  clan?: string;
  lat: number;
  lng: number;
  timestamp: number;
  isOnline: boolean;
  venueId?: string; // Add venue ID for geographic sharding
}

interface DojoStatus {
  id: string;
  venueId: string;
  status: 'controlled' | 'rival' | 'neutral';
  controller: string;
  influence: number;
  players: number;
}

interface GeographicRegion {
  venueId: string;
  lat: number;
  lng: number;
  radius: number; // in kilometers
}

@WebSocketGateway({
  cors: corsOptions,
  namespace: SOCKET_NAMESPACES.WORLD_MAP,
})
@UseGuards(WebSocketJwtGuard, WebSocketRateLimitGuard)
export class ShardedWorldGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ShardedWorldGateway.name);
  private connectedClients = new Map<string, Socket>();
  private playerPositions = new Map<string, PlayerPosition>();
  private dojoStatuses = new Map<string, DojoStatus>();
  private geographicRegions = new Map<string, GeographicRegion>();

  constructor(
    private readonly featureFlags: FeatureFlagsConfig,
    private readonly prisma: PrismaService,
    private readonly shardManager: ShardManagerService,
    private readonly redisService: RedisService
  ) {}

  async onModuleInit() {
    // Load geographic regions from database
    await this.loadGeographicRegions();

    // Start periodic cleanup and metrics
    setInterval(() => this.periodicMaintenance(), 60000); // Every minute
  }

  handleConnection(client: Socket) {
    this.logger.log(`World map client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Determine geographic region based on client handshake
    const venueId = this.extractVenueId(client) || undefined;
    if (venueId) {
      this.joinGeographicRegion(client, venueId);
    }

    // Send current regional state to newly connected client
    this.sendRegionalState(client, venueId);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`World map client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);

    // Remove player position if they were tracking one
    const playerId = this.findPlayerBySocketId(client.id);
    if (playerId) {
      this.playerPositions.delete(playerId);
      this.broadcastRegionalPlayerPositions(playerId);
    }
  }

  @SubscribeMessage('join_world_region')
  async handleJoinWorldRegion(
    @MessageBody() data: { venueId?: string; lat?: number; lng?: number },
    @ConnectedSocket() client: Socket
  ) {
    const { venueId, lat, lng } = data;

    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);

      // Determine venue based on coordinates or explicit venueId
      let targetVenueId = venueId;
      if (!targetVenueId && lat !== undefined && lng !== undefined) {
        targetVenueId = (await this.findNearestVenue(lat, lng)) || undefined;
      }

      if (!targetVenueId) {
        client.emit('error', {
          message: 'Unable to determine geographic region',
        });
        return;
      }

      // Join the geographic shard
      this.joinGeographicRegion(client, targetVenueId);

      // Send regional data
      this.sendRegionalState(client, targetVenueId);

      this.logger.log(
        `User ${user.username} joined world region: ${targetVenueId}`
      );

      client.emit('joined_world_region', {
        venueId: targetVenueId,
        message: 'Successfully joined geographic region',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error joining world region:', error);
      client.emit('error', { message: 'Failed to join geographic region' });
    }
  }

  @SubscribeMessage('update_player_position')
  async handleUpdatePlayerPosition(
    @MessageBody() data: Omit<PlayerPosition, 'timestamp'>,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);

      // Determine venue for geographic sharding
      let venueId = data.venueId;
      if (!venueId) {
        venueId =
          (await this.findNearestVenue(data.lat, data.lng)) || undefined;
      }

      const playerPosition: PlayerPosition = {
        ...data,
        timestamp: Date.now(),
        venueId,
      };

      this.playerPositions.set(data.playerId, playerPosition);

      // Update shard manager with connection info
      if (venueId) {
        await this.shardManager.updateShardConnections(
          SOCKET_NAMESPACES.WORLD_MAP,
          this.calculateGeographicShard(venueId),
          this.connectedClients.size
        );
      }

      this.logger.log(
        `Player ${data.playerName} position updated in region ${venueId}: ${data.lat}, ${data.lng}`
      );

      // Broadcast to clients in the same geographic region
      this.broadcastRegionalPlayerPositions(data.playerId);
    } catch (error) {
      this.logger.error('Error updating player position:', error);
      client.emit('error', { message: 'Failed to update position' });
    }
  }

  @SubscribeMessage('request_regional_positions')
  handleRequestRegionalPositions(
    @MessageBody()
    data: {
      venueId?: string;
      bounds?: { north: number; south: number; east: number; west: number };
    },
    @ConnectedSocket() client: Socket
  ) {
    const { venueId, bounds } = data;

    let regionalPositions: PlayerPosition[] = [];

    if (venueId) {
      // Get positions for specific venue
      regionalPositions = Array.from(this.playerPositions.values()).filter(
        (pos) => pos.venueId === venueId
      );
    } else if (bounds) {
      // Get positions within geographic bounds
      regionalPositions = Array.from(this.playerPositions.values()).filter(
        (pos) =>
          pos.lat >= bounds.south &&
          pos.lat <= bounds.north &&
          pos.lng >= bounds.west &&
          pos.lng <= bounds.east
      );
    }

    client.emit('regional_positions_update', {
      positions: regionalPositions,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('update_dojo_status')
  async handleUpdateDojoStatus(
    @MessageBody() data: DojoStatus,
    @ConnectedSocket() client: Socket
  ) {
    try {
      this.dojoStatuses.set(data.id, data);

      // Update shard manager
      await this.shardManager.updateShardConnections(
        SOCKET_NAMESPACES.WORLD_MAP,
        this.calculateGeographicShard(data.venueId),
        this.connectedClients.size
      );

      this.logger.log(
        `Dojo ${data.id} status updated in region ${data.venueId}: ${data.status}`
      );

      // Broadcast dojo status update to regional clients
      this.broadcastRegionalDojoStatus(data);
    } catch (error) {
      this.logger.error('Error updating dojo status:', error);
      client.emit('error', { message: 'Failed to update dojo status' });
    }
  }

  // Geographic sharding helpers
  private calculateGeographicShard(venueId: string): number {
    // Use venueId for geographic sharding
    return this.shardManager.calculateShardId(venueId, 16); // 16 geographic shards
  }

  private async findNearestVenue(
    lat: number,
    lng: number
  ): Promise<string | null> {
    try {
      // Query venues within a reasonable distance
      const venues = await this.prisma.venue.findMany({
        where: {
          // This would need a proper geospatial query
          // For now, we'll use a simple bounding box approach
        },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
        },
        take: 10,
      });

      if (venues.length === 0) return null;

      // Find closest venue using simple distance calculation
      let closestVenue = venues[0];
      let minDistance = this.calculateDistance(
        lat,
        lng,
        closestVenue.latitude,
        closestVenue.longitude
      );

      for (const venue of venues.slice(1)) {
        const distance = this.calculateDistance(
          lat,
          lng,
          venue.latitude,
          venue.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestVenue = venue;
        }
      }

      return closestVenue.id;
    } catch (error) {
      this.logger.error('Error finding nearest venue:', error);
      return null;
    }
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    // Simple distance calculation using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private joinGeographicRegion(client: Socket, venueId: string): void {
    const shardId = this.calculateGeographicShard(venueId);
    const roomName = `region:${venueId}:shard:${shardId}`;

    client.join(roomName);
    this.logger.log(
      `Client ${client.id} joined geographic region: ${roomName}`
    );
  }

  private broadcastRegionalPlayerPositions(playerId: string): void {
    const playerPosition = this.playerPositions.get(playerId);
    if (!playerPosition?.venueId) return;

    const shardId = this.calculateGeographicShard(playerPosition.venueId);
    const roomName = `region:${playerPosition.venueId}:shard:${shardId}`;

    const positions = Array.from(this.playerPositions.values()).filter(
      (pos) => pos.venueId === playerPosition.venueId
    );

    this.server.to(roomName).emit('regional_positions_update', {
      positions,
      timestamp: Date.now(),
    });
  }

  private broadcastRegionalDojoStatus(dojoStatus: DojoStatus): void {
    const shardId = this.calculateGeographicShard(dojoStatus.venueId);
    const roomName = `region:${dojoStatus.venueId}:shard:${shardId}`;

    this.server.to(roomName).emit('regional_dojo_status_update', {
      dojo: dojoStatus,
      timestamp: new Date(),
    });
  }

  private sendRegionalState(client: Socket, venueId?: string): void {
    if (!venueId) return;

    const regionalPositions = Array.from(this.playerPositions.values()).filter(
      (pos) => pos.venueId === venueId
    );

    const regionalDojos = Array.from(this.dojoStatuses.values()).filter(
      (dojo) => dojo.venueId === venueId
    );

    client.emit('regional_state_update', {
      positions: regionalPositions,
      dojos: regionalDojos,
      timestamp: new Date(),
    });
  }

  private async loadGeographicRegions(): Promise<void> {
    try {
      const venues = await this.prisma.venue.findMany({
        select: {
          id: true,
          latitude: true,
          longitude: true,
          // Add region radius if available in schema
        },
      });

      for (const venue of venues) {
        this.geographicRegions.set(venue.id, {
          venueId: venue.id,
          lat: venue.latitude,
          lng: venue.longitude,
          radius: 10, // Default 10km radius
        });
      }

      this.logger.log(`Loaded ${venues.length} geographic regions`);
    } catch (error) {
      this.logger.error('Error loading geographic regions:', error);
    }
  }

  private extractVenueId(client: Socket): string | null {
    // Try to extract venue ID from client handshake data
    const venueId = client.handshake.query?.venueId as string;
    return venueId || null;
  }

  private findPlayerBySocketId(socketId: string): string | null {
    for (const [playerId, position] of this.playerPositions.entries()) {
      // This would need proper socket-to-player mapping
      // For now, return null as we don't have this mapping
      return null;
    }
    return null;
  }

  private async periodicMaintenance(): Promise<void> {
    try {
      // Update shard connection counts
      const venueIds = Array.from(this.geographicRegions.keys());
      for (const venueId of venueIds) {
        const shardId = this.calculateGeographicShard(venueId);
        const regionalClients = this.getRegionalClientCount(venueId);

        await this.shardManager.updateShardConnections(
          SOCKET_NAMESPACES.WORLD_MAP,
          shardId,
          regionalClients
        );
      }

      // Clean up stale data
      await this.cleanupStaleData();
    } catch (error) {
      this.logger.error('Error in periodic maintenance:', error);
    }
  }

  private getRegionalClientCount(venueId: string): number {
    const shardId = this.calculateGeographicShard(venueId);
    const roomName = `region:${venueId}:shard:${shardId}`;

    // This would need access to Socket.IO room information
    // For now, return an estimate
    return this.connectedClients.size;
  }

  private async cleanupStaleData(): Promise<void> {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    // Remove stale player positions
    for (const [playerId, position] of this.playerPositions.entries()) {
      if (now - position.timestamp > staleThreshold) {
        this.playerPositions.delete(playerId);
        this.logger.log(`Removed stale player position: ${playerId}`);
      }
    }
  }
}
