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
import { corsOptions } from '../config/cors.config';
import { AiAnalysisService } from './ai-analysis.service';

interface ChatMessage {
  matchId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

@WebSocketGateway({
  cors: corsOptions,
})
@UseGuards(WebSocketJwtGuard, WebSocketRateLimitGuard)
export class MatchesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MatchesGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // matchId -> Set of socketIds

  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  handleConnection(client: Socket) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      this.logger.log(
        `Authenticated client connected: ${client.id} (user: ${user.username})`
      );
    } catch (error) {
      this.logger.error(`Failed to authenticate client ${client.id}:`, error);
      // Client should already be disconnected by the guard
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove client from all match rooms
    this.connectedClients.forEach((clients, matchId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(matchId);
      }
    });
  }

  @SubscribeMessage('joinMatch')
  @SubscribeMessage('join_match')
  @WebSocketRateLimit(RATE_LIMIT_PRESETS.MATCHES.subscriptions!)
  handleJoinMatch(
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

      // TODO: Add match permission validation here
      // For now, allow authenticated users to join any match
      // In production, validate user has permission to view this match

      // Join the match room
      client.join(matchId);

      // Track connected clients for this match
      if (!this.connectedClients.has(matchId)) {
        this.connectedClients.set(matchId, new Set());
      }
      this.connectedClients.get(matchId)!.add(client.id);

      this.logger.log(
        `User ${user.username} (${client.id}) joined match ${matchId}`
      );

      // Notify other clients in the room
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

  @SubscribeMessage('leaveMatch')
  handleLeaveMatch(
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

      // Leave the match room
      client.leave(matchId);

      // Remove from tracking
      const clients = this.connectedClients.get(matchId);
      if (clients) {
        clients.delete(client.id);
        if (clients.size === 0) {
          this.connectedClients.delete(matchId);
        }
      }

      this.logger.log(
        `User ${user.username} (${client.id}) left match ${matchId}`
      );

      // Notify other clients in the room
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

  @SubscribeMessage('sendMessage')
  @WebSocketRateLimit(RATE_LIMIT_PRESETS.MATCHES.messages)
  handleMessage(
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

      // Broadcast message to all clients in the match room
      this.server.to(matchId).emit('newMessage', authenticatedMessage);

      this.logger.log(
        `Message sent in match ${matchId}: ${user.username}: ${message}`
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('matchUpdate')
  handleMatchUpdate(
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

      // TODO: Add authorization check - only match participants should send updates

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
    @MessageBody()
    data: {
      matchId: string;
      ballSunk: boolean;
      wasFoul: boolean;
      shotType?: string;
    },
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

        // Broadcast the live commentary to all clients in the match room as an object payload
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

        // Broadcast fallback commentary as an object payload
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

  // Venue-level broadcast helpers for table updates
  broadcastVenueTablesUpdated(venueId: string, tables: any[]) {
    try {
      this.server.to(`venue:${venueId}`).emit('tablesUpdated', tables);
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
      this.server.to(`venue:${venueId}`).emit('tableUpdated', table);
    } catch (err) {
      this.logger.warn(
        `broadcastVenueTableUpdate failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  // Match status broadcast helper (room = matchId)
  broadcastMatchStatusUpdate(matchId: string, status: string) {
    try {
      this.server.to(matchId).emit('match_status_update', { matchId, status });
    } catch (err) {
      this.logger.warn(
        `broadcastMatchStatusUpdate failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }
}
