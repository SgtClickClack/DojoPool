import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
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
  namespace: SOCKET_NAMESPACES.ACTIVITY,
})
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
