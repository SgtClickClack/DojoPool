import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { io, Socket } from 'socket.io-client';

export interface TestUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface WebSocketTestSetup {
  app: INestApplication;
  jwtService: JwtService;
  generateToken: (user: TestUser) => string;
  createAuthenticatedSocket: (
    user: TestUser,
    namespace?: string
  ) => Promise<Socket>;
  cleanup: () => Promise<void>;
}

/**
 * Helper class for WebSocket integration testing
 */
export class WebSocketTestHelper {
  private app: INestApplication;
  private jwtService: JwtService;
  private connectedSockets: Socket[] = [];

  constructor(setup: WebSocketTestSetup) {
    this.app = setup.app;
    this.jwtService = setup.jwtService;
  }

  /**
   * Generate a JWT token for a test user
   */
  generateToken(user: TestUser): string {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  }

  /**
   * Create an authenticated WebSocket connection
   */
  async createAuthenticatedSocket(
    user: TestUser,
    namespace: string = '/chat'
  ): Promise<Socket> {
    const token = this.generateToken(user);
    const server = this.app.getHttpServer();
    const port = server.address().port || 3000;

    const socket = io(`http://localhost:${port}${namespace}`, {
      auth: {
        token,
      },
      transports: ['websocket'],
      timeout: 5000,
    });

    // Track the socket for cleanup
    this.connectedSockets.push(socket);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      socket.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Wait for a specific event on a socket
   */
  async waitForEvent<T = any>(
    socket: Socket,
    event: string,
    timeout: number = 5000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      socket.once(event, (data: T) => {
        clearTimeout(timeoutId);
        resolve(data);
      });

      socket.once('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Emit an event and wait for a response
   */
  async emitAndWaitForResponse<T = any>(
    socket: Socket,
    emitEvent: string,
    emitData: any,
    responseEvent: string,
    timeout: number = 5000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to ${emitEvent}`));
      }, timeout);

      socket.once(responseEvent, (data: T) => {
        clearTimeout(timeoutId);
        resolve(data);
      });

      socket.once('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      socket.emit(emitEvent, emitData);
    });
  }

  /**
   * Clean up all connected sockets
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = this.connectedSockets.map((socket) => {
      return new Promise<void>((resolve) => {
        if (socket.connected) {
          socket.disconnect();
        }
        resolve();
      });
    });

    await Promise.all(cleanupPromises);
    this.connectedSockets = [];
  }

  /**
   * Get the HTTP server port
   */
  getServerPort(): number {
    const server = this.app.getHttpServer();
    const address = server.address();
    return typeof address === 'string' ? 3000 : address.port || 3000;
  }
}

/**
 * Create a test setup with WebSocket helpers
 */
export async function createWebSocketTestSetup(
  moduleClass: any
): Promise<WebSocketTestSetup> {
  const moduleRef = await Test.createTestingModule({
    imports: [moduleClass],
  }).compile();

  const app = moduleRef.createNestApplication();
  const jwtService = moduleRef.get<JwtService>(JwtService);

  // Enable CORS for WebSocket testing
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(0); // Use random available port

  const helper = new WebSocketTestHelper({ app, jwtService } as any);

  return {
    app,
    jwtService,
    generateToken: helper.generateToken.bind(helper),
    createAuthenticatedSocket: helper.createAuthenticatedSocket.bind(helper),
    cleanup: helper.cleanup.bind(helper),
  };
}

/**
 * Test user fixtures
 */
export const testUsers = {
  alice: {
    id: 'user-alice-123',
    username: 'alice_test',
    email: 'alice@test.com',
    role: UserRole.USER,
  } as TestUser,

  bob: {
    id: 'user-bob-456',
    username: 'bob_test',
    email: 'bob@test.com',
    role: UserRole.USER,
  } as TestUser,

  admin: {
    id: 'user-admin-789',
    username: 'admin_test',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
  } as TestUser,
};
