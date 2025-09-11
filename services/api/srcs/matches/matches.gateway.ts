import { corsOptions } from '../config/cors.config';
import { AiAnalysisService } from './ai-analysis.service';
import { MatchesService } from './matches.service';

interface ChatMessage {
  matchId: string;
  message: string;
  sender: string;
}

@WebSocketGateway({
  cors: corsOptions,
  transports: ['websocket'],
})
export class MatchesGateway {
  private readonly logger = new Logger(MatchesGateway.name);
  private connectedClients = new Map<string, Set<string>>(); // matchId -> Set of socketIds

  constructor(
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly matchesService: MatchesService
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinMatch')
  async handleJoinMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      if (!user) {
        this.logger.warn(`User not authenticated for joinMatch.`);
        client.emit('error', { message: 'Authentication required.' });
        return;
      }

      const { matchId } = data;
      if (!matchId) {
        this.logger.warn(`matchId is required for joinMatch.`);
        client.emit('error', { message: 'matchId is required' });
        return;
      }

      const isParticipant = await this.matchesService.isUserInMatch(
        user.id,
        matchId
      );
      if (!isParticipant) {
        this.logger.warn(
          `User ${user.username} (${user.id}) attempted to join match ${matchId} without permission.`
        );
        client.emit('error', {
          message: 'You are not a participant in this match.',
        });
        return;
      }

      // Join the match room
      client.join(matchId);

      this.logger.log(
        `User ${user.username} (${user.id}) joined match ${matchId}`
      );
      this.connectedClients.get(matchId)!.add(client.id);

      this.logger.log(
        `User ${user.username} (${user.id}) joined match ${matchId}. Total clients: ${this.connectedClients.get(matchId)?.size}`
      );
    } catch (error) {
      this.logger.error(`Error joining match: ${error.message}`, error.stack);
      client.emit('error', { message: 'Failed to join match.' });
    }
  }

  @SubscribeMessage('leaveMatch')
  async handleLeaveMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      if (!user) {
        this.logger.warn(`User not authenticated for leaveMatch.`);
        client.emit('error', { message: 'Authentication required.' });
        return;
      }

      const { matchId } = data;
      if (!matchId) {
        this.logger.warn(`matchId is required for leaveMatch.`);
        client.emit('error', { message: 'matchId is required' });
        return;
      }

      const isParticipant = await this.matchesService.isUserInMatch(
        user.id,
        matchId
      );
      if (!isParticipant) {
        this.logger.warn(
          `User ${user.username} (${user.id}) attempted to leave match ${matchId} without permission.`
        );
        client.emit('error', {
          message: 'You are not authorized to leave this match.',
        });
        return;
      }

      // Leave the match room
      client.leave(matchId);

      this.logger.log(
        `User ${user.username} (${user.id}) left match ${matchId}`
      );
      this.connectedClients.get(matchId)!.delete(client.id);

      this.logger.log(
        `User ${user.username} (${user.id}) left match ${matchId}. Total clients: ${this.connectedClients.get(matchId)?.size}`
      );
    } catch (error) {
      this.logger.error(`Error leaving match: ${error.message}`, error.stack);
      client.emit('error', { message: 'Failed to leave match.' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { matchId: string; message: string },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      if (!user) {
        this.logger.warn(`User not authenticated for sendMessage.`);
        client.emit('error', { message: 'Authentication required.' });
        return;
      }

      const { matchId, message } = data;
      if (!matchId || !message) {
        this.logger.warn(`matchId and message are required for sendMessage.`);
        client.emit('error', { message: 'matchId and message are required' });
        return;
      }

      const isParticipant = await this.matchesService.isUserInMatch(
        user.id,
        matchId
      );
      if (!isParticipant) {
        this.logger.warn(
          `User ${user.username} (${user.id}) attempted to send message in match ${matchId} without permission.`
        );
        client.emit('error', {
          message: 'You are not authorized to send messages in this match.',
        });
        return;
      }

      const chatMessage: ChatMessage = {
        matchId,
        message,
        sender: user.username,
      };

      // Broadcast message to all clients in the match room
      this.server.to(matchId).emit('messageReceived', chatMessage);

      this.logger.log(
        `User ${user.username} (${user.id}) sent message in match ${matchId}`
      );
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      client.emit('error', { message: 'Failed to send message.' });
    }
  }

  @SubscribeMessage('updateMatch')
  async handleUpdateMatch(
    @MessageBody() data: { matchId: string; update: any },
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      if (!user) {
        this.logger.warn(`User not authenticated for updateMatch.`);
        client.emit('error', { message: 'Authentication required.' });
        return;
      }

      const { matchId, update } = data;
      if (!matchId || !update) {
        this.logger.warn(`matchId and update are required for updateMatch.`);
        client.emit('error', { message: 'matchId and update are required' });
        return;
      }

      const isParticipant = await this.matchesService.isUserInMatch(
        user.id,
        matchId
      );
      if (!isParticipant) {
        this.logger.warn(
          `User ${user.username} (${user.id}) attempted to update match ${matchId} without permission.`
        );
        client.emit('error', {
          message: 'You are not authorized to update this match.',
        });
        return;
      }

      // Broadcast match update to all clients in the match room
      this.server.to(matchId).emit('matchUpdated', {
        matchId,
        update,
      });

      this.logger.log(
        `User ${user.username} (${user.id}) updated match ${matchId}`
      );
    } catch (error) {
      this.logger.error(`Error updating match: ${error.message}`, error.stack);
      client.emit('error', { message: 'Failed to update match.' });
    }
  }
}
