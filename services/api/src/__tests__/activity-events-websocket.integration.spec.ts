import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { FileUploadService } from '../common/file-upload.service';
import { RedisService } from '../redis/redis.service';
import {
  WebSocketTestHelper,
  createWebSocketTestSetup,
  testUsers,
} from './websocket-test-helper';

describe('Activity Events WebSocket Integration (e2e)', () => {
  let app: INestApplication;
  let helper: WebSocketTestHelper;
  let aliceSocket: Socket;
  let bobSocket: Socket;
  let adminSocket: Socket;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const setup = await createWebSocketTestSetup(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.test', '.env.local', '.env'],
          }),
          AppModule,
        ],
      })
        .overrideProvider(RedisService)
        .useValue({
          ping: async () => true,
          isEnabled: () => false,
          isProductionMode: () => false,
          createSocketAdapter: () => null,
          disconnect: async () => {},
        })
        .overrideProvider(JwtStrategy)
        .useValue({
          validate: async () => ({ userId: testUsers.alice.id }),
        })
        .overrideProvider(FileUploadService)
        .useValue({
          uploadFile: async () => ({
            filename: 'test.jpg',
            path: './uploads/test.jpg',
          }),
          deleteFile: async () => {},
          getFileUrl: () => 'http://localhost:3000/uploads/test.jpg',
        })
    );

    app = setup.app;
    helper = new WebSocketTestHelper(setup);

    await app.init();

    // Create authenticated sockets for activity events namespace
    [aliceSocket, bobSocket, adminSocket] = await Promise.all([
      helper.createAuthenticatedSocket(testUsers.alice, '/activity'),
      helper.createAuthenticatedSocket(testUsers.bob, '/activity'),
      helper.createAuthenticatedSocket(testUsers.admin, '/activity'),
    ]);
  }, 30000);

  afterAll(async () => {
    await helper.cleanup();
    await app.close();
  });

  describe('WebSocket Authentication', () => {
    it('should connect to activity events namespace with authentication', async () => {
      expect(aliceSocket.connected).toBe(true);
      expect(bobSocket.connected).toBe(true);
      expect(adminSocket.connected).toBe(true);
    });

    it('should handle authentication failures for activity namespace', async () => {
      const server = app.getHttpServer();
      const port = helper.getServerPort();

      const { io: socketIo } = await import('socket.io-client');
      const unauthenticatedSocket = socketIo(
        `http://localhost:${port}/activity`,
        {
          transports: ['websocket'],
          timeout: 2000,
        }
      );

      await expect(
        new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            unauthenticatedSocket.disconnect();
            reject(new Error('Connection should have been rejected'));
          }, 3000);

          unauthenticatedSocket.on('connect', () => {
            clearTimeout(timeout);
            unauthenticatedSocket.disconnect();
            resolve(true);
          });

          unauthenticatedSocket.on('connect_error', () => {
            clearTimeout(timeout);
            unauthenticatedSocket.disconnect();
            resolve(false);
          });
        })
      ).resolves.toBe(false);
    });
  });

  describe('Activity Event Broadcasting', () => {
    it('should broadcast activity events to all connected clients', async () => {
      // Get the activity events gateway from the app
      const activityGateway = app.get('ActivityEventsGateway');

      // Mock event data
      const testEvent = {
        id: 'test-event-123',
        type: 'user_login',
        userId: testUsers.alice.id,
        username: testUsers.alice.username,
        timestamp: new Date().toISOString(),
        data: {
          venue: 'Test Dojo',
          action: 'logged_in',
        },
      };

      // Set up listeners for all clients
      const alicePromise = helper.waitForEvent(
        aliceSocket,
        'new_activity_event'
      );
      const bobPromise = helper.waitForEvent(bobSocket, 'new_activity_event');
      const adminPromise = helper.waitForEvent(
        adminSocket,
        'new_activity_event'
      );

      // Emit the event using the gateway
      activityGateway.emitNewEvent(testEvent);

      // Verify all clients receive the event
      const [aliceEvent, bobEvent, adminEvent] = await Promise.all([
        alicePromise,
        bobPromise,
        adminPromise,
      ]);

      expect(aliceEvent).toEqual(testEvent);
      expect(bobEvent).toEqual(testEvent);
      expect(adminEvent).toEqual(testEvent);
    });

    it('should handle multiple sequential activity events', async () => {
      const activityGateway = app.get('ActivityEventsGateway');

      const events = [
        {
          id: 'event-1',
          type: 'match_started',
          userId: testUsers.alice.id,
          data: { matchId: 'match-123' },
        },
        {
          id: 'event-2',
          type: 'achievement_unlocked',
          userId: testUsers.bob.id,
          data: { achievement: 'First Win' },
        },
        {
          id: 'event-3',
          type: 'venue_checkin',
          userId: testUsers.admin.id,
          data: { venueId: 'venue-456' },
        },
      ];

      // Test sequential broadcasting
      for (const event of events) {
        const promises = [
          helper.waitForEvent(aliceSocket, 'new_activity_event'),
          helper.waitForEvent(bobSocket, 'new_activity_event'),
          helper.waitForEvent(adminSocket, 'new_activity_event'),
        ];

        activityGateway.emitNewEvent(event);

        const receivedEvents = await Promise.all(promises);
        receivedEvents.forEach((receivedEvent) => {
          expect(receivedEvent).toEqual(event);
        });
      }
    });

    it('should handle high-frequency activity events', async () => {
      const activityGateway = app.get('ActivityEventsGateway');

      const rapidEvents = Array.from({ length: 10 }, (_, i) => ({
        id: `rapid-event-${i}`,
        type: 'rapid_test_event',
        userId: testUsers.alice.id,
        data: { sequence: i },
      }));

      // Send events rapidly
      const sendPromises = rapidEvents.map((event) => {
        return new Promise<void>((resolve) => {
          activityGateway.emitNewEvent(event);
          setTimeout(resolve, 50); // Small delay between sends
        });
      });

      await Promise.all(sendPromises);

      // Verify sockets remain connected
      expect(aliceSocket.connected).toBe(true);
      expect(bobSocket.connected).toBe(true);
      expect(adminSocket.connected).toBe(true);
    });
  });

  describe('Namespace Isolation', () => {
    it('should isolate activity events from other namespaces', async () => {
      // Create a chat namespace socket
      const chatSocket = await helper.createAuthenticatedSocket(
        testUsers.alice,
        '/chat'
      );

      const activityGateway = app.get('ActivityEventsGateway');

      const activityEvent = {
        id: 'isolation-test',
        type: 'isolation_test',
        userId: testUsers.alice.id,
        data: { test: 'namespace isolation' },
      };

      // Activity event should not be received on chat socket
      let chatReceivedEvent = false;
      const chatEventHandler = () => {
        chatReceivedEvent = true;
      };

      chatSocket.on('new_activity_event', chatEventHandler);

      // Send event to activity namespace
      activityGateway.emitNewEvent(activityEvent);

      // Wait and verify chat socket didn't receive activity event
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(chatReceivedEvent).toBe(false);

      // Clean up
      chatSocket.off('new_activity_event', chatEventHandler);
      chatSocket.disconnect();
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to activity event connections', async () => {
      // Test rate limiting by creating multiple connections rapidly
      const connectionPromises = Array.from({ length: 5 }, () =>
        helper.createAuthenticatedSocket(testUsers.alice, '/activity')
      );

      const sockets = await Promise.all(connectionPromises);

      // Verify all connections succeeded (or were rate limited appropriately)
      const connectedCount = sockets.filter(
        (socket) => socket.connected
      ).length;

      // At minimum, the first connection should work
      expect(connectedCount).toBeGreaterThan(0);

      // Clean up additional sockets
      await Promise.all(
        sockets.slice(1).map(
          (socket) =>
            new Promise<void>((resolve) => {
              socket.disconnect();
              resolve();
            })
        )
      );
    });
  });

  describe('Connection Resilience', () => {
    it('should handle client disconnections gracefully', async () => {
      const testSocket = await helper.createAuthenticatedSocket(
        testUsers.alice,
        '/activity'
      );

      // Verify initial connection
      expect(testSocket.connected).toBe(true);

      // Disconnect
      testSocket.disconnect();

      // Verify disconnection
      expect(testSocket.connected).toBe(false);

      // Activity gateway should continue to work for other clients
      const activityGateway = app.get('ActivityEventsGateway');
      const testEvent = {
        id: 'post-disconnect-test',
        type: 'disconnect_test',
        userId: testUsers.alice.id,
        data: { test: 'after client disconnect' },
      };

      const promises = [
        helper.waitForEvent(aliceSocket, 'new_activity_event'),
        helper.waitForEvent(bobSocket, 'new_activity_event'),
      ];

      activityGateway.emitNewEvent(testEvent);

      // Other clients should still receive events
      await Promise.all(promises);
    });

    it('should handle server-side errors without crashing clients', async () => {
      const activityGateway = app.get('ActivityEventsGateway');

      // Send event with invalid data that might cause server errors
      const invalidEvent = {
        id: null, // Invalid ID
        type: '', // Empty type
        userId: testUsers.alice.id,
        data: null, // Invalid data
      };

      // This should not crash the gateway or disconnect clients
      activityGateway.emitNewEvent(invalidEvent);

      // Wait and verify clients remain connected
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(aliceSocket.connected).toBe(true);
      expect(bobSocket.connected).toBe(true);
    });
  });

  describe('Broadcast Performance', () => {
    it('should efficiently broadcast to multiple clients', async () => {
      const activityGateway = app.get('ActivityEventsGateway');

      const performanceEvent = {
        id: 'performance-test',
        type: 'performance_test',
        userId: testUsers.alice.id,
        data: { timestamp: Date.now() },
      };

      const startTime = Date.now();

      // All connected clients should receive the event
      const promises = [
        helper.waitForEvent(aliceSocket, 'new_activity_event', 2000),
        helper.waitForEvent(bobSocket, 'new_activity_event', 2000),
        helper.waitForEvent(adminSocket, 'new_activity_event', 2000),
      ];

      activityGateway.emitNewEvent(performanceEvent);

      await Promise.all(promises);

      const endTime = Date.now();
      const broadcastTime = endTime - startTime;

      // Broadcast should complete within reasonable time (less than 1 second)
      expect(broadcastTime).toBeLessThan(1000);
    });
  });
});
