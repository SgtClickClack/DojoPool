import {
  CanActivate,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { AuthService, WebSocketUser } from './auth.service';

@Injectable()
export class WebSocketJwtGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: any): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();

      // Extract JWT token from handshake
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        this.logger.warn(
          `WebSocket connection rejected: No JWT token provided for client ${client.id}`
        );
        client.emit('error', {
          type: 'authentication_error',
          message: 'JWT token required for WebSocket connection',
        });
        client.disconnect();
        return false;
      }

      // Validate the token
      const user = await this.authService.validateWebSocketToken(token);

      // Attach user to socket for use in handlers
      (client as any).user = user;

      this.logger.log(
        `WebSocket authentication successful for user ${user.username} (${user.id}) on client ${client.id}`
      );

      return true;
    } catch (error) {
      const client: Socket = context.switchToWs().getClient();
      this.logger.error(
        `WebSocket authentication failed for client ${client.id}:`,
        error instanceof Error ? error.message : String(error)
      );

      client.emit('error', {
        type: 'authentication_error',
        message: 'Invalid JWT token for WebSocket connection',
      });
      client.disconnect();
      return false;
    }
  }

  private extractTokenFromHandshake(client: Socket): string | null {
    // Try different common locations for the JWT token

    // 1. Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. Query parameter
    const tokenQuery = client.handshake.query.token as string;
    if (tokenQuery) {
      return tokenQuery;
    }

    // 3. Auth object (Socket.IO auth)
    const authToken = (client.handshake.auth as any)?.token;
    if (authToken) {
      return authToken;
    }

    // 4. Custom header
    const customToken = client.handshake.headers['x-jwt-token'] as string;
    if (customToken) {
      return customToken;
    }

    return null;
  }

  // Helper method to get authenticated user from socket
  static getUserFromSocket(socket: Socket): WebSocketUser {
    const user = (socket as any).user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated on socket');
    }
    return user;
  }

  // Helper method to check if socket has authenticated user
  static hasAuthenticatedUser(socket: Socket): boolean {
    return !!(socket as any).user;
  }
}
