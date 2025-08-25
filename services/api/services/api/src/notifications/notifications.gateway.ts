import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SOCKET_NAMESPACES } from '../config/sockets.config';

@WebSocketGateway({
  cors: {
    origin:
      (process.env.ALLOWED_ORIGINS &&
        process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())) ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000',
    credentials: true,
  },
  namespace: SOCKET_NAMESPACES.NOTIFICATIONS,
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

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
      this.logger.log(
        `Client ${client.id} joined notifications room ${userId}`
      );
    } else {
      this.logger.warn(
        `Client ${client.id} connected without x-user-id/auth.userId; cannot join notifications room`
      );
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notifications client disconnected: ${client.id}`);
  }

  emitToUser(userId: string, notification: any) {
    try {
      this.server.to(userId).emit('new_notification', notification);
    } catch (e) {
      this.logger.warn(`Failed to emit new_notification to ${userId}: ${e}`);
    }
  }
}
