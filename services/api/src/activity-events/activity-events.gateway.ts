import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { corsOptions } from '../config/cors.config';
import { SOCKET_NAMESPACES } from '../config/sockets.config';
import { ActivityEventPayload } from '../common/dto/websocket-events.dto';

@WebSocketGateway({
  cors: corsOptions,
  namespace: SOCKET_NAMESPACES.ACTIVITY,
})
export class ActivityEventsGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ActivityEventsGateway.name);

  emitNewEvent(payload: ActivityEventPayload) {
    try {
      this.server.emit('new_activity_event', payload);
    } catch (e) {
      this.logger.warn(`Failed to emit new_activity_event: ${e}`);
    }
  }
}
