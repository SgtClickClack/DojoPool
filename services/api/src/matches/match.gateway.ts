import { Logger } from '@nestjs/common';
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
import { AiAnalysisService, ShotData } from './ai-analysis.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/match',
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Match status broadcast helper (room = match:{matchId})
  broadcastMatchStatusUpdate(matchId: string, status: string) {
    try {
      const room = `match:${matchId}`;
      this.server.to(room).emit('match_status_update', { matchId, status });
    } catch (err) {
      this.logger?.warn?.(
        `MatchGateway.broadcastMatchStatusUpdate failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  private readonly logger = new Logger(MatchGateway.name);

  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Match client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Match client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_match')
  handleJoinMatch(
    @MessageBody() data: { matchId?: string; playerId?: string },
    @ConnectedSocket() client: Socket
  ) {
    const { matchId } = data || {};
    if (!matchId) {
      client.emit('join_error', 'matchId is required');
      return;
    }
    const room = `match:${matchId}`;
    client.join(room);
    client.emit('joined_match', { room, matchId });
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('shot_taken')
  async handleShotTaken(
    @MessageBody()
    payload: {
      matchId?: string;
      playerId?: string;
      ballSunk?: any;
      wasFoul?: boolean;
      [k: string]: any;
    },
    @ConnectedSocket() client: Socket
  ) {
    try {
      // Basic validation
      const { matchId, playerId } = payload || {};
      if (!matchId || !playerId) {
        client.emit('shot_error', 'matchId and playerId are required');
        return;
      }

      const room = `match:${matchId}`;
      // Ensure the sender is in the room
      client.join(room);

      // Prepare shot data for AI
      const shotData: ShotData = {
        matchId,
        playerId,
        ballSunk: payload.ballSunk ?? null,
        wasFoul: Boolean(payload.wasFoul),
        ...payload,
      };

      // Generate live commentary
      const commentary =
        await this.aiAnalysisService.getLiveCommentary(shotData);

      // Broadcast to the match room as a simple string per spec
      this.server.to(room).emit('live_commentary', commentary);
      this.logger.log(`Broadcast live_commentary to ${room}: ${commentary}`);
    } catch (err) {
      this.logger.error('Error handling shot_taken event', err as any);
      client.emit('shot_error', 'Failed to process shot_taken event');
    }
  }
}
