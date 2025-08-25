import { forwardRef, Inject, Logger } from '@nestjs/common';
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
import { SOCKET_NAMESPACES } from '../config/sockets.config';
import { TournamentsService } from './tournaments.service';

@WebSocketGateway({
  cors: {
    origin:
      (process.env.ALLOWED_ORIGINS &&
        process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())) ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000',
    credentials: true,
  },
  namespace: SOCKET_NAMESPACES.TOURNAMENTS,
})
export class TournamentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TournamentsGateway.name);
  private connectedClients = new Map<string, Socket>();

  constructor(
    @Inject(forwardRef(() => TournamentsService))
    private readonly tournamentsService: TournamentsService
  ) {}

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id}`);

    // Send connection confirmation
    client.emit('connected', {
      message: 'Connected to tournament WebSocket server',
      clientId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_tournament')
  handleJoinTournament(
    @MessageBody() data: { tournamentId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { tournamentId } = data;
      client.join(`tournament:${tournamentId}`);
      this.logger.log(
        `Client ${client.id} joined tournament room: ${tournamentId}`
      );

      client.emit('joined_tournament', {
        tournamentId,
        message: `Joined tournament ${tournamentId}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error joining tournament: ${errorMessage}`);
      client.emit('error', { message: 'Failed to join tournament' });
    }
  }

  @SubscribeMessage('leave_tournament')
  handleLeaveTournament(
    @MessageBody() data: { tournamentId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { tournamentId } = data;
      client.leave(`tournament:${tournamentId}`);
      this.logger.log(
        `Client ${client.id} left tournament room: ${tournamentId}`
      );

      client.emit('left_tournament', {
        tournamentId,
        message: `Left tournament ${tournamentId}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error leaving tournament: ${errorMessage}`);
      client.emit('error', { message: 'Failed to leave tournament' });
    }
  }

  @SubscribeMessage('join_match')
  handleJoinMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { matchId } = data;
      client.join(`match:${matchId}`);
      this.logger.log(`Client ${client.id} joined match room: ${matchId}`);

      client.emit('joined_match', {
        matchId,
        message: `Joined match ${matchId}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error joining match: ${errorMessage}`);
      client.emit('error', { message: 'Failed to join match' });
    }
  }

  @SubscribeMessage('leave_match')
  handleLeaveMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { matchId } = data;
      client.leave(`match:${matchId}`);
      this.logger.log(`Client ${client.id} left match room: ${matchId}`);

      client.emit('left_match', {
        matchId,
        message: `Left match ${matchId}`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error leaving match: ${errorMessage}`);
      client.emit('error', { message: 'Failed to leave match' });
    }
  }

  @SubscribeMessage('join_global_tournaments')
  handleJoinGlobalTournaments(@ConnectedSocket() client: Socket) {
    try {
      client.join('global_tournaments');
      this.logger.log(`Client ${client.id} joined global tournaments room`);

      client.emit('joined_global_tournaments', {
        message: 'Joined global tournaments room',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error joining global tournaments: ${errorMessage}`);
      client.emit('error', { message: 'Failed to join global tournaments' });
    }
  }

  @SubscribeMessage('leave_global_tournaments')
  handleLeaveGlobalTournaments(@ConnectedSocket() client: Socket) {
    try {
      client.leave('global_tournaments');
      this.logger.log(`Client ${client.id} left global tournaments room`);

      client.emit('left_global_tournaments', {
        message: 'Left global tournaments room',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error leaving global tournaments: ${errorMessage}`);
      client.emit('error', { message: 'Failed to leave global tournaments' });
    }
  }

  @SubscribeMessage('tournament_action')
  handleTournamentAction(
    @MessageBody() data: { action: string; data: any },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { action, data: actionData } = data;
      this.logger.log(`Tournament action: ${action}`, actionData);

      // Broadcast to all clients in the global tournaments room
      this.server.to('global_tournaments').emit('tournament_update', {
        type: `tournament_${action}`,
        tournamentId: actionData.tournamentId,
        data: actionData,
        timestamp: new Date(),
      });

      // Also broadcast to specific tournament room if tournamentId is provided
      if (actionData.tournamentId) {
        this.server
          .to(`tournament:${actionData.tournamentId}`)
          .emit('tournament_update', {
            type: `tournament_${action}`,
            tournamentId: actionData.tournamentId,
            data: actionData,
            timestamp: new Date(),
          });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling tournament action: ${errorMessage}`);
      client.emit('error', { message: 'Failed to process tournament action' });
    }
  }

  @SubscribeMessage('match_result')
  handleMatchResult(
    @MessageBody() data: { matchId: string; result: any },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const { matchId, result } = data;
      this.logger.log(`Match result update: ${matchId}`, result);

      // Broadcast to all clients in the match room
      this.server.to(`match:${matchId}`).emit('match_update', {
        matchId,
        tournamentId: result.tournamentId,
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        winnerId: result.winnerId,
        status: 'completed',
        timestamp: new Date(),
      });

      // Also broadcast to tournament room if tournamentId is provided
      if (result.tournamentId) {
        this.server
          .to(`tournament:${result.tournamentId}`)
          .emit('match_update', {
            matchId,
            tournamentId: result.tournamentId,
            scoreA: result.scoreA,
            scoreB: result.scoreB,
            winnerId: result.winnerId,
            status: 'completed',
            timestamp: new Date(),
          });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error handling match result: ${errorMessage}`);
      client.emit('error', { message: 'Failed to process match result' });
    }
  }

  // Public methods for broadcasting updates from the service layer
  broadcastTournamentUpdate(
    tournamentId: string,
    updateType: string,
    data: any
  ) {
    const update = {
      type: updateType,
      tournamentId,
      data,
      timestamp: new Date(),
    };

    // Broadcast to global tournaments room
    this.server.to('global_tournaments').emit('tournament_update', update);

    // Broadcast to specific tournament room
    this.server
      .to(`tournament:${tournamentId}`)
      .emit('tournament_update', update);
  }

  broadcastMatchUpdate(matchId: string, tournamentId: string, data: any) {
    const update = {
      matchId,
      tournamentId,
      ...data,
      timestamp: new Date(),
    };

    // Broadcast to match room
    this.server.to(`match:${matchId}`).emit('match_update', update);

    // Broadcast to tournament room
    this.server.to(`tournament:${tournamentId}`).emit('match_update', update);
  }

  broadcastParticipantUpdate(
    tournamentId: string,
    playerId: string,
    action: 'registered' | 'unregistered'
  ) {
    const update = {
      tournamentId,
      playerId,
      action,
      timestamp: new Date(),
    };

    // Broadcast to global tournaments room
    this.server.to('global_tournaments').emit('participant_update', update);

    // Broadcast to specific tournament room
    this.server
      .to(`tournament:${tournamentId}`)
      .emit('participant_update', update);
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalClients: this.connectedClients.size,
      connectedClients: Array.from(this.connectedClients.keys()),
    };
  }
}
