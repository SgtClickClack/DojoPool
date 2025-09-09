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
import { SOCKET_NAMESPACES } from '../config/sockets.config';
import { ChatService } from './chat.service';

interface SendDmPayload {
  receiverId: string;
  content: string;
}

@WebSocketGateway({
  cors: corsOptions,
  namespace: SOCKET_NAMESPACES.CHAT,
})
@UseGuards(WebSocketJwtGuard, WebSocketRateLimitGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    try {
      // User is already authenticated by WebSocketJwtGuard
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      const userId = user.id;

      // Join user's private room for direct messages
      client.join(userId);
      this.logger.log(
        `Authenticated client ${client.id} joined private room ${userId} for user ${user.username}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to get authenticated user for client ${client.id}:`,
        error
      );
      // Client should already be disconnected by the guard, but ensure it
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_dm')
  @WebSocketRateLimit(RATE_LIMIT_PRESETS.CHAT.messages)
  async handleSendDm(
    @MessageBody() data: SendDmPayload,
    @ConnectedSocket() client: Socket
  ) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      const senderId = user.id;

      const { receiverId, content } = data || ({} as SendDmPayload);
      if (!receiverId || !content) {
        client.emit('error', {
          message: 'receiverId and content are required',
        });
        return;
      }

      const message = await this.chatService.sendDirectMessage(
        senderId,
        receiverId,
        content
      );

      // Emit to receiver's private room and back to sender
      this.server.to(receiverId).emit('new_dm', message);
      this.server.to(senderId).emit('new_dm', message);

      this.logger.log(
        `DM sent from ${user.username} to receiver ${receiverId}`
      );
    } catch (error) {
      this.logger.error('Error handling send_dm:', error);
      client.emit('error', { message: 'Failed to send direct message' });
    }
  }
}
