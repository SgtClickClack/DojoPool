import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebSocketJwtGuard } from '../auth/websocket-jwt.guard';
import { WebSocketRateLimitGuard } from '../auth/websocket-rate-limit.guard';
import { corsOptions } from '../config/cors.config';
import { SOCKET_NAMESPACES } from '../config/sockets.config';

@WebSocketGateway({
  cors: corsOptions,
  namespace: SOCKET_NAMESPACES.NOTIFICATIONS,
})
@UseGuards(WebSocketJwtGuard, WebSocketRateLimitGuard)
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    try {
      const user = WebSocketJwtGuard.getUserFromSocket(client);
      const userId = user.id;

      // Join user's private notifications room
      client.join(userId);
      this.logger.log(
        `Authenticated client ${client.id} joined notifications room ${userId} for user ${user.username}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to get authenticated user for client ${client.id}:`,
        error
      );
      // Client should already be disconnected by the guard
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notifications client disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, payload: any) {
    if (!this.server) return;
    this.server.to(userId).emit(event, payload);
    this.logger.log(`Emitted ${event} to user ${userId}`);
  }

  emitToMultipleUsers(userIds: string[], event: string, payload: any) {
    if (!this.server) return;
    userIds.forEach((userId) => {
      this.server.to(userId).emit(event, payload);
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
