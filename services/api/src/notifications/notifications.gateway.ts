import { Logger } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, type Socket } from 'socket.io';
import { corsOptions } from '../config/cors.config';
import { SOCKET_NAMESPACES } from '../config/sockets.config';

@WebSocketGateway({
  cors: corsOptions,
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
      void client.join(userId);
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

  emitToUser(userId: string, event: string, payload: any) {
    if (!this.server) return;
    void this.server.to(userId).emit(event, payload);
    this.logger.log(`Emitted ${event} to user ${userId}`);
  }

  emitToMultipleUsers(userIds: string[], event: string, payload: any) {
    if (!this.server) return;
    userIds.forEach((userId) => {
      void this.server.to(userId).emit(event, payload);
    });
    this.logger.log(`Emitted ${event} to ${userIds.length} users`);
  }

  getConnectedUsers(): string[] {
    if (!this.server) return [];
    const rooms = this.server.sockets.adapter.rooms;
    const userIds: string[] = [];

    for (const [roomId, sockets] of rooms.entries()) {
      // Skip socket.io internal rooms
      if (!roomId.startsWith('socket.io')) {
        userIds.push(roomId);
      }
    }

    return userIds;
  }
}
