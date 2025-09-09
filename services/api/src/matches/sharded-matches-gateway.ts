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
import {
  RATE_LIMIT_PRESETS,
  WebSocketRateLimit,
  WebSocketRateLimitGuard,
} from '../auth/websocket-rate-limit.guard';
import { ShardManagerService } from '../common/shard-manager.service';
import { corsOptions } from '../config/cors.config';
import { SOCKET_NAMESPACES } from '../config/sockets.config';
import { RedisService } from '../redis/redis.service';
import { AiAnalysisService } from './ai-analysis.service';

interface ChatMessage {
  matchId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

interface MatchUpdate {
  matchId: string;
  update: any;
  timestamp: Date;
}

interface ShotData {
  matchId: string;
  playerId: string;
  ballSunk: boolean;
  wasFoul: boolean;
  shotType?: string;
}

@WebSocketGateway({
  cors: corsOptions,
  namespace: SOCKET_NAMESPACES.MATCHES,
})
@UseGuards(WebSocketJwtGuard, WebSocketRateLimitGuard)
export class ShardedMatchesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ShardedMatchesGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // matchId -> Set of socketIds
  private userMatchMapping = new Map<string, string>(); // socketId -> matchId

  constructor(
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly shardManager: ShardManagerService,
    private readonly redisService: RedisService
  ) {}

  async onModuleInit() {
    // Start periodic cleanup and metrics
    setInterval(() => this.periodicMaintenance(), 60000); // Every minute
  }

  async handleConnection(client: Socket) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      this.logger.log(
        `Authenticated client connected to matches: ${client.id} (user: ${user.username})`
      );
    } catch (error) {
      this.logger.error(`Failed to authenticate client ${client.id}:`, error);
      // Client should already be disconnected by the guard
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from matches: ${client.id}`);

    // Remove from user-match mapping
    const matchId = this.userMatchMapping.get(client.id);
    if (matchId) {
      const clients = this.connectedClients.get(matchId);
      if (clients) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.connectedClients.delete(matchId);
        }
      }
      this.userMatchMapping.delete(client.id);

      // Update shard manager
      this.updateShardConnections(matchId);
    }
  }

  @SubscribeMessage('join_match')
  @WebSocketRateLimit(RATE_LIMIT_PRESETS.MATCHES.subscriptions!)
  async handleJoinMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      const { matchId } = data;

      if (!matchId) {
        client.emit('error', { message: 'matchId is required' });
        return;
      }

      // Get shard route for this match based on user ID
      const shardRoute = await this.shardManager.getShardRoute(
        SOCKET_NAMESPACES.MATCHES,
        user.id
      );

      if (!shardRoute) {
        client.emit('error', { message: 'Unable to determine match shard' });
        return;
      }

      // Check if this is the correct shard for this match
      const isCorrectShard = await this.validateMatchShard(
        matchId,
        shardRoute.shardId
      );
      if (!isCorrectShard) {
        // Redirect client to correct shard
        client.emit('redirect_to_shard', {
          shardUrl: shardRoute.serverUrl,
          namespace: shardRoute.namespace,
          matchId,
        });
        return;
      }

      // Join the match room on this shard
      await this.joinMatchRoom(client, matchId, user.id);

      // Update shard manager with connection info
      await this.updateShardConnections(matchId);

      this.logger.log(
        `User ${user.username} joined match ${matchId} on shard ${shardRoute.shardId}`
      );

      // Notify other clients in the match room
      client.to(matchId).emit('userJoined', {
        userId: user.id,
        username: user.username,
        message: `${user.username} joined the match`,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error joining match:', error);
      client.emit('error', { message: 'Failed to join match' });
    }
  }

  @SubscribeMessage('leave_match')
  async handleLeaveMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      const { matchId } = data;

      if (!matchId) {
        client.emit('error', { message: 'matchId is required' });
        return;
      }

      await this.leaveMatchRoom(client, matchId, user.id);
      await this.updateShardConnections(matchId);

      this.logger.log(`User ${user.username} left match ${matchId}`);

      // Notify other clients in the match room
      client.to(matchId).emit('userLeft', {
        userId: user.id,
        username: user.username,
        message: `${user.username} left the match`,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error leaving match:', error);
      client.emit('error', { message: 'Failed to leave match' });
    }
  }

  @SubscribeMessage('send_message')
  @WebSocketRateLimit(RATE_LIMIT_PRESETS.MATCHES.messages)
  async handleMessage(
    @MessageBody() data: ChatMessage,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      const { matchId, message } = data;

      if (!matchId || !message) {
        client.emit('error', { message: 'matchId and message are required' });
        return;
      }

      // Use authenticated user data instead of client-provided data
      const authenticatedMessage = {
        userId: user.id,
        username: user.username,
        message: message.trim(),
        timestamp: new Date(),
      };

      // Broadcast message to all clients in the match room on this shard
      this.server.to(matchId).emit('newMessage', authenticatedMessage);

      this.logger.log(
        `Message sent in match ${matchId}: ${user.username}: ${message}`
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('match_update')
  async handleMatchUpdate(
    @MessageBody() data: { matchId: string; update: any },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      const { matchId, update } = data;

      if (!matchId || !update) {
        client.emit('error', { message: 'matchId and update are required' });
        return;
      }

      // Verify user has permission to update this match
      const hasPermission = await this.validateMatchPermission(
        matchId,
        user.id
      );
      if (!hasPermission) {
        client.emit('error', { message: 'Permission denied' });
        return;
      }

      // Broadcast match update to all clients in the match room
      this.server.to(matchId).emit('matchUpdated', {
        ...update,
        updatedBy: user.id,
        timestamp: new Date(),
      });

      this.logger.log(
        `Match ${matchId} updated by ${user.username}: ${JSON.stringify(update)}`
      );
    } catch (error) {
      this.logger.error('Error updating match:', error);
      client.emit('error', { message: 'Failed to update match' });
    }
  }

  @SubscribeMessage('shot_taken')
  @WebSocketRateLimit(RATE_LIMIT_PRESETS.MATCHES.messages)
  async handleShotTaken(
    @MessageBody() data: ShotData,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      const { matchId, ballSunk, wasFoul, shotType } = data;

      if (!matchId) {
        client.emit('error', { message: 'matchId is required' });
        return;
      }

      this.logger.log(
        `Shot taken in match ${matchId}: Player ${user.username}, Ball sunk: ${ballSunk}, Foul: ${wasFoul}`
      );

      try {
        // Generate AI commentary for the shot
        const commentary = await this.aiAnalysisService.getLiveCommentary({
          matchId,
          playerId: user.id,
          ballSunk,
          wasFoul,
          playerName: user.username,
          shotType,
        });

        // Broadcast the live commentary to all clients in the match room
        this.server.to(matchId).emit('live_commentary', {
          message: commentary,
          playerId: user.id,
          playerName: user.username,
          timestamp: new Date(),
        });

        this.logger.log(
          `Live commentary broadcast for match ${matchId}: ${commentary}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to generate live commentary for match ${matchId}:`,
          error
        );

        // Broadcast fallback commentary
        this.server.to(matchId).emit('live_commentary', {
          message: `${user.username} takes a shot in the digital arena!`,
          playerId: user.id,
          playerName: user.username,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Error handling shot taken:', error);
      client.emit('error', { message: 'Failed to process shot' });
    }
  }

  // Shard management helpers
  private async validateMatchShard(
    matchId: string,
    expectedShardId: number
  ): Promise<boolean> {
    // Check if this match belongs to the expected shard
    // This would typically involve checking the match's player IDs against the shard calculation
    const matchShardId = await this.calculateMatchShard(matchId);
    return matchShardId === expectedShardId;
  }

  private async calculateMatchShard(matchId: string): Promise<number> {
    // For matches, we use the primary player's ID as the shard key
    // This would need to be implemented based on your match data structure
    // For now, we'll use a simple hash of the matchId
    return this.shardManager.calculateShardId(matchId, 32); // 32 user-based shards
  }

  private async validateMatchPermission(
    matchId: string,
    userId: string
  ): Promise<boolean> {
    // Validate that the user has permission to update this match
    // This would typically check if the user is a participant in the match
    // Implementation depends on your match data structure
    return true; // Placeholder
  }

  private async joinMatchRoom(
    client: Socket,
    matchId: string,
    userId: string
  ): Promise<void> {
    client.join(matchId);

    // Track connected clients for this match
    if (!this.connectedClients.has(matchId)) {
      this.connectedClients.set(matchId, new Set());
    }
    this.connectedClients.get(matchId)!.add(client.id);

    // Track user-match mapping
    this.userMatchMapping.set(client.id, matchId);
  }

  private async leaveMatchRoom(
    client: Socket,
    matchId: string,
    userId: string
  ): Promise<void> {
    client.leave(matchId);

    // Remove from tracking
    const clients = this.connectedClients.get(matchId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(matchId);
      }
    }

    // Remove user-match mapping
    this.userMatchMapping.delete(client.id);
  }

  private async updateShardConnections(matchId: string): Promise<void> {
    const shardId = await this.calculateMatchShard(matchId);
    const connectionCount = this.connectedClients.get(matchId)?.size || 0;

    await this.shardManager.updateShardConnections(
      SOCKET_NAMESPACES.MATCHES,
      shardId,
      connectionCount
    );
  }

  // Venue-level broadcast helpers for table updates
  broadcastVenueTablesUpdated(venueId: string, tables: any[]) {
    try {
      // Find all matches in this venue and broadcast to their respective shards
      const venueMatches = Array.from(this.connectedClients.keys()).filter(
        (matchId) => this.isMatchInVenue(matchId, venueId)
      );

      for (const matchId of venueMatches) {
        this.server.to(matchId).emit('tablesUpdated', tables);
      }
    } catch (err) {
      this.logger.warn(
        `broadcastVenueTablesUpdated failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  broadcastVenueTableUpdate(venueId: string, table: any) {
    try {
      // Find all matches in this venue and broadcast to their respective shards
      const venueMatches = Array.from(this.connectedClients.keys()).filter(
        (matchId) => this.isMatchInVenue(matchId, venueId)
      );

      for (const matchId of venueMatches) {
        this.server.to(matchId).emit('tableUpdated', table);
      }
    } catch (err) {
      this.logger.warn(
        `broadcastVenueTableUpdate failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  // Match status broadcast helper (room = matchId)
  async broadcastMatchStatusUpdate(
    matchId: string,
    status: string
  ): Promise<void> {
    try {
      // Ensure we're on the correct shard for this match
      const expectedShardId = await this.calculateMatchShard(matchId);
      const currentShardId = await this.getCurrentShardId();

      if (expectedShardId !== currentShardId) {
        // Redirect to correct shard
        this.logger.warn(
          `Match ${matchId} should be on shard ${expectedShardId}, not ${currentShardId}`
        );
        return;
      }

      this.server.to(matchId).emit('match_status_update', { matchId, status });
    } catch (err) {
      this.logger.warn(
        `broadcastMatchStatusUpdate failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  private isMatchInVenue(matchId: string, venueId: string): boolean {
    // This would need to check if the match is associated with the venue
    // Implementation depends on your match data structure
    return true; // Placeholder
  }

  private async getCurrentShardId(): Promise<number> {
    // This would need to be implemented to get the current shard ID
    // For now, return 0 as placeholder
    return 0;
  }

  private async periodicMaintenance(): Promise<void> {
    try {
      // Update shard connection counts for all active matches
      for (const [matchId, clients] of this.connectedClients.entries()) {
        await this.updateShardConnections(matchId);
      }

      // Clean up stale connections
      await this.cleanupStaleConnections();
    } catch (error) {
      this.logger.error('Error in periodic maintenance:', error);
    }
  }

  private async cleanupStaleConnections(): Promise<void> {
    // Implementation for cleaning up stale connections
    // This would involve checking Redis for active connections
    // and removing dead ones
  }
}
