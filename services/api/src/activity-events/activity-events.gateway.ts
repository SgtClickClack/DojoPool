import { Logger, UseGuards } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WebSocketJwtGuard } from '../auth/websocket-jwt.guard';
import { WebSocketRateLimitGuard } from '../auth/websocket-rate-limit.guard';
import { corsOptions } from '../config/cors.config';
import { SOCKET_NAMESPACES } from '../config/sockets.config';

@WebSocketGateway({
  cors: corsOptions,
  namespace: SOCKET_NAMESPACES.ACTIVITY,
})
@UseGuards(WebSocketJwtGuard, WebSocketRateLimitGuard)
export class ActivityEventsGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ActivityEventsGateway.name);

  emitNewEvent(payload: any) {
    try {
      this.server.emit('new_activity_event', payload);
    } catch (e) {
      this.logger.warn(`Failed to emit new_activity_event: ${e}`);
    }
  }
}
