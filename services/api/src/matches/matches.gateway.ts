import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
export class MatchesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MatchesGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // matchId -> Set of socketIds

  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
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
  handleJoinMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { matchId } = data;

    // Join the match room
    client.join(matchId);

    // Track connected clients for this match
    if (!this.connectedClients.has(matchId)) {
      this.connectedClients.set(matchId, new Set());
    }
    this.connectedClients.get(matchId)!.add(client.id);

    this.logger.log(`Client ${client.id} joined match ${matchId}`);

    // Notify other clients in the room
    client.to(matchId).emit('userJoined', {
      message: 'A new spectator joined the match',
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('leaveMatch')
  handleLeaveMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { matchId } = data;

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

    this.logger.log(`Client ${client.id} left match ${matchId}`);

    // Notify other clients in the room
    client.to(matchId).emit('userLeft', {
      message: 'A spectator left the match',
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: ChatMessage,
    @ConnectedSocket() client: Socket
  ) {
    const { matchId, userId, username, message, timestamp } = data;

    // Broadcast message to all clients in the match room
    this.server.to(matchId).emit('newMessage', {
      userId,
      username,
      message,
      timestamp,
    });

    this.logger.log(
      `Message sent in match ${matchId}: ${username}: ${message}`
    );
  }

  @SubscribeMessage('matchUpdate')
  handleMatchUpdate(
    @MessageBody() data: { matchId: string; update: any },
    @ConnectedSocket() client: Socket
  ) {
    const { matchId, update } = data;

    // Broadcast match update to all clients in the match room
    this.server.to(matchId).emit('matchUpdated', update);

    this.logger.log(`Match ${matchId} updated: ${JSON.stringify(update)}`);
  }

  @SubscribeMessage('shot_taken')
  async handleShotTaken(
    @MessageBody()
    data: {
      matchId: string;
      playerId: string;
      ballSunk: boolean;
      wasFoul: boolean;
      playerName?: string;
      shotType?: string;
    },
    @ConnectedSocket() client: Socket
  ) {
    const { matchId, playerId, ballSunk, wasFoul, playerName, shotType } = data;

    this.logger.log(
      `Shot taken in match ${matchId}: Player ${playerId}, Ball sunk: ${ballSunk}, Foul: ${wasFoul}`
    );

    try {
      // Generate AI commentary for the shot
      const commentary = await this.aiAnalysisService.getLiveCommentary({
        matchId,
        playerId,
        ballSunk,
        wasFoul,
        playerName,
        shotType,
      });

      // Broadcast the live commentary to all clients in the match room as an object payload
      this.server.to(matchId).emit('live_commentary', { message: commentary });

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
        message: `${playerName || 'The player'} takes a shot in the digital arena!`,
      });
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
