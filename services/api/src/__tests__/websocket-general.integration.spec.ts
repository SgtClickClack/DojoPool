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

describe('WebSocket General Integration (e2e)', () => {
  let app: INestApplication;
  let helper: WebSocketTestHelper;
  let chatSockets: Socket[];
  let activitySockets: Socket[];

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

    // Create multiple sockets across different namespaces
    const [chatAlice, chatBob, activityAlice, activityBob] = await Promise.all([
      helper.createAuthenticatedSocket(testUsers.alice, '/chat'),
      helper.createAuthenticatedSocket(testUsers.bob, '/chat'),
      helper.createAuthenticatedSocket(testUsers.alice, '/activity'),
      helper.createAuthenticatedSocket(testUsers.bob, '/activity'),
    ]);

    chatSockets = [chatAlice, chatBob];
    activitySockets = [activityAlice, activityBob];
  }, 30000);

  afterAll(async () => {
    await helper.cleanup();
    await app.close();
  });

  describe('Multi-Namespace Authentication', () => {
    it('should authenticate across different namespaces independently', async () => {
      // All sockets should be connected and authenticated
      chatSockets.forEach((socket) => {
        expect(socket.connected).toBe(true);
      });

      activitySockets.forEach((socket) => {
        expect(socket.connected).toBe(true);
      });
    });

    it('should maintain separate authentication contexts per namespace', async () => {
      // Test that authentication works independently per namespace
      const testMessage = {
        receiverId: testUsers.bob.id,
        content: 'Cross-namespace test message',
      };

      // Send message in chat namespace
      const bobReceivedPromise = helper.waitForEvent(chatSockets[1], 'new_dm'); // Bob's chat socket
      chatSockets[0].emit('send_dm', testMessage); // Alice's chat socket

      const receivedMessage = await bobReceivedPromise;
      expect(receivedMessage.senderId).toBe(testUsers.alice.id);
      expect(receivedMessage.content).toBe(testMessage.content);
    });
  });

  describe('Cross-Namespace Isolation', () => {
    it('should prevent cross-namespace event leakage', async () => {
      const chatMessage = {
        receiverId: testUsers.bob.id,
        content: 'This should only go to chat namespace',
      };

      // Activity sockets should NOT receive chat messages
      let activityReceivedMessage = false;
      const activityMessageHandler = () => {
        activityReceivedMessage = true;
      };

      activitySockets.forEach((socket) => {
        socket.on('new_dm', activityMessageHandler);
      });

      // Send message in chat namespace
      chatSockets[0].emit('send_dm', chatMessage);

      // Wait and verify activity sockets didn't receive the message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(activityReceivedMessage).toBe(false);

      // Clean up
      activitySockets.forEach((socket) => {
        socket.off('new_dm', activityMessageHandler);
      });
    });

    it('should maintain namespace-specific room memberships', async () => {
      // Each namespace should maintain its own room structure
      // Chat namespace: users join their own private rooms
      // Activity namespace: broadcast to all connected clients

      // Test chat namespace room isolation
      const chatMessage = {
        receiverId: testUsers.bob.id,
        content: 'Private room test',
      };

      const chatReceivedPromise = helper.waitForEvent(chatSockets[1], 'new_dm');
      chatSockets[0].emit('send_dm', chatMessage);

      await chatReceivedPromise;
      // Message should only go to Bob's private room in chat namespace
    });
  });

  describe('Concurrent Namespace Operations', () => {
    it('should handle simultaneous operations across namespaces', async () => {
      const chatMessage = {
        receiverId: testUsers.bob.id,
        content: 'Concurrent chat message',
      };

      // Start operations in both namespaces simultaneously
      const chatPromise = helper.emitAndWaitForResponse(
        chatSockets[0],
        'send_dm',
        chatMessage,
        'new_dm',
        3000
      );

      // Simulate activity event broadcast
      const activityGateway = app.get('ActivityEventsGateway');
      const activityEvent = {
        id: 'concurrent-test',
        type: 'concurrent_test',
        userId: testUsers.alice.id,
        data: { test: 'simultaneous operations' },
      };

      const activityPromises = activitySockets.map((socket) =>
        helper.waitForEvent(socket, 'new_activity_event', 3000)
      );

      // Execute both operations
      const [chatResponse] = await Promise.all([
        chatPromise,
        ...activityPromises.map(
          (promise) => activityGateway.emitNewEvent(activityEvent) as any
        ),
      ]);

      // Both operations should succeed
      expect(chatResponse).toBeDefined();
    });
  });

  describe('Rate Limiting Across Namespaces', () => {
    it('should apply namespace-specific rate limits', async () => {
      // Test rate limiting in chat namespace
      const chatMessages = Array.from({ length: 15 }, (_, i) => ({
        receiverId: testUsers.bob.id,
        content: `Rate limit test message ${i}`,
      }));

      // Send messages rapidly in chat namespace
      const chatPromises = chatMessages.map(
        (msg) =>
          new Promise<void>((resolve) => {
            chatSockets[0].emit('send_dm', msg);
            setTimeout(resolve, 100);
          })
      );

      await Promise.all(chatPromises);

      // Chat connections should remain stable
      chatSockets.forEach((socket) => {
        expect(socket.connected).toBe(true);
      });
    });

    it('should handle rate limit violations gracefully', async () => {
      // Test extreme rate limiting scenario
      const extremeMessages = Array.from({ length: 50 }, (_, i) => ({
        receiverId: testUsers.bob.id,
        content: `Extreme rate limit test ${i}`,
      }));

      // Send messages extremely rapidly
      extremeMessages.forEach((msg) => {
        chatSockets[0].emit('send_dm', msg);
      });

      // Wait for rate limiting to take effect
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Socket should still be connected (rate limiting shouldn't disconnect)
      expect(chatSockets[0].connected).toBe(true);
    });
  });

  describe('Connection Lifecycle Management', () => {
    it('should handle namespace-specific connection lifecycles', async () => {
      // Create additional sockets for lifecycle testing
      const [extraChatSocket, extraActivitySocket] = await Promise.all([
        helper.createAuthenticatedSocket(testUsers.alice, '/chat'),
        helper.createAuthenticatedSocket(testUsers.alice, '/activity'),
      ]);

      // Verify all sockets are connected
      expect(extraChatSocket.connected).toBe(true);
      expect(extraActivitySocket.connected).toBe(true);

      // Disconnect chat socket
      extraChatSocket.disconnect();

      // Chat socket should be disconnected
      expect(extraChatSocket.connected).toBe(false);

      // Activity socket should remain connected
      expect(extraActivitySocket.connected).toBe(true);

      // Activity operations should continue working
      const activityGateway = app.get('ActivityEventsGateway');
      const testEvent = {
        id: 'lifecycle-test',
        type: 'lifecycle_test',
        userId: testUsers.alice.id,
        data: { test: 'after chat disconnect' },
      };

      const activityPromise = helper.waitForEvent(
        extraActivitySocket,
        'new_activity_event'
      );
      activityGateway.emitNewEvent(testEvent);

      await activityPromise;

      // Clean up
      extraActivitySocket.disconnect();
    });
  });

  describe('Resource Management', () => {
    it('should efficiently manage resources across namespaces', async () => {
      // Test memory and resource usage with multiple concurrent connections
      const startMemory = process.memoryUsage();

      // Create burst of connections
      const burstSockets = await Promise.all([
        ...Array.from({ length: 5 }, () =>
          helper.createAuthenticatedSocket(testUsers.alice, '/chat')
        ),
        ...Array.from({ length: 5 }, () =>
          helper.createAuthenticatedSocket(testUsers.alice, '/activity')
        ),
      ]);

      const midMemory = process.memoryUsage();

      // Clean up burst connections
      await Promise.all(
        burstSockets.map(
          (socket) =>
            new Promise<void>((resolve) => {
              socket.disconnect();
              resolve();
            })
        )
      );

      const endMemory = process.memoryUsage();

      // Memory usage should be reasonable
      const memoryIncrease = midMemory.heapUsed - startMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase

      // After cleanup, memory should decrease
      const finalMemoryIncrease = endMemory.heapUsed - startMemory.heapUsed;
      expect(finalMemoryIncrease).toBeLessThan(memoryIncrease);
    });
  });

  describe('Error Propagation and Recovery', () => {
    it('should handle namespace-specific errors without affecting others', async () => {
      // Send invalid data to chat namespace
      chatSockets[0].emit('send_dm', null);
      chatSockets[0].emit('send_dm', undefined);
      chatSockets[0].emit('send_dm', { invalid: 'data' });

      // Chat socket should remain connected
      expect(chatSockets[0].connected).toBe(true);

      // Activity operations should continue unaffected
      const activityGateway = app.get('ActivityEventsGateway');
      const errorTestEvent = {
        id: 'error-recovery-test',
        type: 'error_recovery_test',
        userId: testUsers.alice.id,
        data: { test: 'after chat errors' },
      };

      const activityPromises = activitySockets.map((socket) =>
        helper.waitForEvent(socket, 'new_activity_event')
      );

      activityGateway.emitNewEvent(errorTestEvent);

      await Promise.all(activityPromises);
    });

    it('should recover from connection interruptions', async () => {
      // Simulate connection interruption by disconnecting and reconnecting
      const testSocket = chatSockets[0];

      // Disconnect
      testSocket.disconnect();
      expect(testSocket.connected).toBe(false);

      // Reconnect
      const reconnectedSocket = await helper.createAuthenticatedSocket(
        testUsers.alice,
        '/chat'
      );

      // New connection should work
      expect(reconnectedSocket.connected).toBe(true);

      // Test that operations work on reconnected socket
      const testMessage = {
        receiverId: testUsers.bob.id,
        content: 'Post-reconnection test message',
      };

      const receivedPromise = helper.waitForEvent(chatSockets[1], 'new_dm');
      reconnectedSocket.emit('send_dm', testMessage);

      await receivedPromise;

      // Clean up
      reconnectedSocket.disconnect();
    });
  });
});
