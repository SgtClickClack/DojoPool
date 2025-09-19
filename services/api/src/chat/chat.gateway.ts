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
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  private getUserIdFromSocket(client: Socket): string | undefined {
    const headers = client.handshake.headers as Record<string, any>;
    const fromHeader = (headers['x-user-id'] || headers['X-User-Id']) as
      | string
      | undefined;
    const fromAuth = (client.handshake.auth &&
      (client.handshake.auth as any).userId) as string | undefined;
    return fromHeader || fromAuth;
  }

  handleConnection(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      client.join(userId);
      this.logger.log(`Client ${client.id} joined private room ${userId}`);
    } else {
      this.logger.warn(
        `Client ${client.id} connected without x-user-id/auth.userId; cannot join private room`
      );
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_dm')
  async handleSendDm(
    @MessageBody() data: SendDmPayload,
    @ConnectedSocket() client: Socket
  ) {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) {
      this.logger.warn('send_dm received without sender identification');
      client.emit('error', {
        message: 'Missing x-user-id/auth.userId for send_dm',
      });
      return;
    }
    const { receiverId, content } = data || ({} as SendDmPayload);
    if (!receiverId || !content) {
      client.emit('error', { message: 'receiverId and content are required' });
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
  }
}
