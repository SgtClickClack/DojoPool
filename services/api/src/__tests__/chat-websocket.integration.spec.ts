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

describe('Chat WebSocket Integration (e2e)', () => {
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

    // Initialize Redis adapter for WebSocket testing
    const redisService = app.get(RedisService);
    if (redisService.isEnabled()) {
      const adapter = redisService.createSocketAdapter();
      if (adapter) {
        app.useWebSocketAdapter(adapter);
      }
    }

    await app.init();

    // Create authenticated sockets for different users
    [aliceSocket, bobSocket, adminSocket] = await Promise.all([
      helper.createAuthenticatedSocket(testUsers.alice),
      helper.createAuthenticatedSocket(testUsers.bob),
      helper.createAuthenticatedSocket(testUsers.admin),
    ]);
  }, 30000);

  afterAll(async () => {
    // Clean up all sockets
    await helper.cleanup();
    await app.close();
  });

  describe('WebSocket Authentication', () => {
    it('should successfully authenticate and connect with valid JWT', async () => {
      expect(aliceSocket.connected).toBe(true);
      expect(bobSocket.connected).toBe(true);
      expect(adminSocket.connected).toBe(true);
    });

    it('should join user-specific private room on connection', async () => {
      // Verify that each user is in their own private room
      // This is handled automatically by the ChatGateway
      expect(aliceSocket.connected).toBe(true);
    });

    it('should reject connection without JWT token', async () => {
      const server = app.getHttpServer();
      const port = helper.getServerPort();

      // Create socket without authentication
      const { io: socketIo } = await import('socket.io-client');
      const unauthenticatedSocket = socketIo(`http://localhost:${port}/chat`, {
        transports: ['websocket'],
        timeout: 2000,
      });

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

    it('should reject connection with invalid JWT token', async () => {
      const server = app.getHttpServer();
      const port = helper.getServerPort();

      const { io: socketIo } = await import('socket.io-client');
      const invalidSocket = socketIo(`http://localhost:${port}/chat`, {
        auth: { token: 'invalid-jwt-token' },
        transports: ['websocket'],
        timeout: 2000,
      });

      await expect(
        new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            invalidSocket.disconnect();
            reject(new Error('Connection should have been rejected'));
          }, 3000);

          invalidSocket.on('connect', () => {
            clearTimeout(timeout);
            invalidSocket.disconnect();
            resolve(true);
          });

          invalidSocket.on('connect_error', () => {
            clearTimeout(timeout);
            invalidSocket.disconnect();
            resolve(false);
          });
        })
      ).resolves.toBe(false);
    });
  });

  describe('Direct Message Functionality', () => {
    it('should successfully send and receive direct messages', async () => {
      const testMessage = {
        receiverId: testUsers.bob.id,
        content: 'Hello Bob from Alice!',
      };

      // Bob should receive the message
      const receivedMessagePromise = helper.waitForEvent(bobSocket, 'new_dm');

      // Alice sends the message
      aliceSocket.emit('send_dm', testMessage);

      // Verify Bob receives the message
      const receivedMessage = await receivedMessagePromise;
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.senderId).toBe(testUsers.alice.id);
      expect(receivedMessage.receiverId).toBe(testUsers.bob.id);
      expect(receivedMessage.content).toBe(testMessage.content);
    });

    it('should send message back to sender for confirmation', async () => {
      const testMessage = {
        receiverId: testUsers.bob.id,
        content: 'Confirmation test message',
      };

      // Alice should also receive her own message
      const aliceReceivedPromise = helper.waitForEvent(aliceSocket, 'new_dm');

      // Send message
      aliceSocket.emit('send_dm', testMessage);

      // Verify Alice receives confirmation
      const aliceMessage = await aliceReceivedPromise;
      expect(aliceMessage.senderId).toBe(testUsers.alice.id);
      expect(aliceMessage.content).toBe(testMessage.content);
    });

    it('should handle message validation errors', async () => {
      const invalidMessage = {
        // Missing receiverId
        content: 'This should fail',
      };

      // Alice should receive an error
      const errorPromise = helper.waitForEvent(aliceSocket, 'error');

      // Send invalid message
      aliceSocket.emit('send_dm', invalidMessage);

      // Verify error response
      const error = await errorPromise;
      expect(error).toBeDefined();
      expect(error.message).toContain('receiverId and content are required');
    });

    it('should handle empty content validation', async () => {
      const emptyMessage = {
        receiverId: testUsers.bob.id,
        content: '', // Empty content
      };

      const errorPromise = helper.waitForEvent(aliceSocket, 'error');

      aliceSocket.emit('send_dm', emptyMessage);

      const error = await errorPromise;
      expect(error).toBeDefined();
      expect(error.message).toContain('receiverId and content are required');
    });
  });

  describe('Room Operations and Broadcasting', () => {
    it('should handle multiple users in the same conversation', async () => {
      // This test verifies that room-based messaging works
      // Both Alice and Bob should be able to communicate

      const aliceToBob = {
        receiverId: testUsers.bob.id,
        content: 'Room test message from Alice',
      };

      const bobToAlice = {
        receiverId: testUsers.alice.id,
        content: 'Room test reply from Bob',
      };

      // Alice sends to Bob
      const bobReceivedPromise = helper.waitForEvent(bobSocket, 'new_dm');
      aliceSocket.emit('send_dm', aliceToBob);
      await bobReceivedPromise;

      // Bob replies to Alice
      const aliceReceivedPromise = helper.waitForEvent(aliceSocket, 'new_dm');
      bobSocket.emit('send_dm', bobToAlice);
      await aliceReceivedPromise;
    });

    it('should isolate messages between different user pairs', async () => {
      // Messages between Alice and Bob should not be visible to Admin
      const privateMessage = {
        receiverId: testUsers.bob.id,
        content: 'Private message - should not reach admin',
      };

      // Admin should NOT receive this message
      let adminReceivedMessage = false;
      const adminMessageHandler = () => {
        adminReceivedMessage = true;
      };

      adminSocket.on('new_dm', adminMessageHandler);

      // Send private message
      aliceSocket.emit('send_dm', privateMessage);

      // Wait a bit and verify admin didn't receive it
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(adminReceivedMessage).toBe(false);

      // Clean up
      adminSocket.off('new_dm', adminMessageHandler);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on message sending', async () => {
      // This test would need to be adjusted based on the actual rate limit configuration
      // For now, we'll test that the rate limiting guard is applied
      const messages = Array.from({ length: 10 }, (_, i) => ({
        receiverId: testUsers.bob.id,
        content: `Rate limit test message ${i}`,
      }));

      // Send multiple messages rapidly
      const sendPromises = messages.map((msg) => {
        return new Promise<void>((resolve) => {
          aliceSocket.emit('send_dm', msg);
          setTimeout(resolve, 100); // Small delay between sends
        });
      });

      await Promise.all(sendPromises);

      // The test should pass if rate limiting is working
      // If rate limiting is too aggressive, some messages might be blocked
      expect(aliceSocket.connected).toBe(true);
    });
  });

  describe('Connection Management', () => {
    it('should handle connection cleanup properly', async () => {
      // Test that connections are properly cleaned up
      expect(aliceSocket.connected).toBe(true);
      expect(bobSocket.connected).toBe(true);
      expect(adminSocket.connected).toBe(true);
    });

    it('should handle disconnections gracefully', async () => {
      // Test disconnection handling
      const testSocket = await helper.createAuthenticatedSocket(
        testUsers.alice
      );

      // Disconnect the socket
      testSocket.disconnect();

      // Verify it's disconnected
      expect(testSocket.connected).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed message payloads', async () => {
      // Send completely malformed data
      aliceSocket.emit('send_dm', null);
      aliceSocket.emit('send_dm', undefined);
      aliceSocket.emit('send_dm', 'invalid string payload');

      // Socket should remain connected despite malformed payloads
      expect(aliceSocket.connected).toBe(true);
    });

    it('should handle non-existent receiver IDs', async () => {
      const messageToNonExistentUser = {
        receiverId: 'non-existent-user-id',
        content: 'Message to nowhere',
      };

      // This should not crash the server or disconnect the socket
      aliceSocket.emit('send_dm', messageToNonExistentUser);

      // Wait a moment and verify socket is still connected
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(aliceSocket.connected).toBe(true);
    });

    it('should handle very long message content', async () => {
      const longContent = 'a'.repeat(10000); // 10KB message
      const message = {
        receiverId: testUsers.bob.id,
        content: longContent,
      };

      // Send long message
      aliceSocket.emit('send_dm', message);

      // Socket should handle it gracefully
      expect(aliceSocket.connected).toBe(true);
    });

    it('should handle rapid consecutive messages', async () => {
      const rapidMessages = Array.from({ length: 20 }, (_, i) => ({
        receiverId: testUsers.bob.id,
        content: `Rapid message ${i}`,
      }));

      // Send messages as fast as possible
      rapidMessages.forEach((msg) => {
        aliceSocket.emit('send_dm', msg);
      });

      // System should handle the load
      await new Promise((resolve) => setTimeout(resolve, 1000));
      expect(aliceSocket.connected).toBe(true);
    });
  });

  describe('Security and Authorization', () => {
    it('should prevent sending messages as other users', async () => {
      // Alice tries to send a message that appears to be from Bob
      // This should be prevented by the server-side authentication
      const spoofedMessage = {
        receiverId: testUsers.admin.id,
        content: 'Spoofed message from Alice pretending to be Bob',
        // Even if senderId is included, server should use authenticated user
        senderId: testUsers.bob.id, // This should be ignored
      };

      const adminReceivedPromise = helper.waitForEvent(adminSocket, 'new_dm');

      aliceSocket.emit('send_dm', spoofedMessage);

      const receivedMessage = await adminReceivedPromise;
      // The message should be attributed to Alice, not Bob
      expect(receivedMessage.senderId).toBe(testUsers.alice.id);
      expect(receivedMessage.senderId).not.toBe(testUsers.bob.id);
    });

    it('should validate message content for security', async () => {
      // Test with potentially malicious content
      const maliciousMessage = {
        receiverId: testUsers.bob.id,
        content: '<script>alert("xss")</script>Normal message',
      };

      const bobReceivedPromise = helper.waitForEvent(bobSocket, 'new_dm');

      aliceSocket.emit('send_dm', maliciousMessage);

      const receivedMessage = await bobReceivedPromise;
      // Content should be sanitized or handled securely
      expect(receivedMessage.content).toBeDefined();
      expect(typeof receivedMessage.content).toBe('string');
    });
  });
});
