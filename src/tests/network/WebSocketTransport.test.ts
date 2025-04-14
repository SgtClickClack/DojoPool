import WebSocket from 'ws';
import { WebSocketTransport } from '../../core/network/WebSocketTransport';
import { NetworkMessage, NetworkMessageType } from '../../core/network/types';

jest.mock('ws');

describe('WebSocketTransport', () => {
  let transport: WebSocketTransport;
  let mockWs: jest.Mocked<WebSocket>;
  const TEST_URL = 'ws://localhost:8080';
  const TEST_NODE_ID = 'node1';

  beforeEach(() => {
    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      removeAllListeners: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<WebSocket>;
    
    (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWs);
    transport = new WebSocketTransport(TEST_URL, TEST_NODE_ID);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should establish WebSocket connection and emit connect event', async () => {
      const connectPromise = transport.connect();
      
      // Simulate successful connection
      const openCallback = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openCallback) {
        openCallback.call(mockWs);
      }

      await expect(connectPromise).resolves.toBeUndefined();
      expect(WebSocket).toHaveBeenCalledWith(TEST_URL);
    });

    it('should handle connection errors', async () => {
      const testError = new Error('Connection failed');
      const connectPromise = transport.connect();
      
      // Simulate connection error
      const errorCallback = mockWs.on.mock.calls.find(call => call[0] === 'error')?.[1];
      if (errorCallback) {
        errorCallback.call(mockWs, testError);
      }

      await expect(connectPromise).rejects.toThrow(testError);
    });
  });

  describe('send', () => {
    beforeEach(async () => {
      const connectPromise = transport.connect();
      const openCallback = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openCallback) {
        openCallback.call(mockWs);
      }
      await connectPromise;
    });

    it('should send formatted message through WebSocket', async () => {
      const testMessage: Omit<NetworkMessage<string>, 'source' | 'timestamp'> = {
        type: NetworkMessageType.STATE_SYNC,
        target: 'node2',
        payload: 'test message'
      };

      await transport.send('node2', testMessage);

      expect(mockWs.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      expect(sentMessage).toMatchObject({
        ...testMessage,
        source: TEST_NODE_ID,
      });
      expect(sentMessage.timestamp).toBeDefined();
    });

    it('should throw error when not connected', async () => {
      await transport.disconnect();
      
      const testMessage: Omit<NetworkMessage<string>, 'source' | 'timestamp'> = {
        type: NetworkMessageType.STATE_SYNC,
        target: 'node2',
        payload: 'test message'
      };

      await expect(transport.send('node2', testMessage)).rejects.toThrow('Not connected');
    });
  });

  describe('broadcast', () => {
    beforeEach(async () => {
      const connectPromise = transport.connect();
      const openCallback = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openCallback) {
        openCallback.call(mockWs);
      }
      await connectPromise;
    });

    it('should broadcast message to all nodes', async () => {
      const testMessage: Omit<NetworkMessage<string>, 'source' | 'timestamp' | 'target'> = {
        type: NetworkMessageType.STATE_SYNC,
        payload: 'broadcast message'
      };

      await transport.broadcast(testMessage);

      expect(mockWs.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      expect(sentMessage).toMatchObject({
        ...testMessage,
        source: TEST_NODE_ID,
        target: '*'
      });
      expect(sentMessage.timestamp).toBeDefined();
    });
  });

  describe('message handling', () => {
    it('should emit received messages to registered handlers', async () => {
      const messageHandler = jest.fn();
      transport.onMessage(messageHandler);

      const connectPromise = transport.connect();
      const openCallback = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openCallback) {
        openCallback.call(mockWs);
      }
      await connectPromise;

      const testMessage: NetworkMessage<string> = {
        type: NetworkMessageType.STATE_SYNC,
        source: 'node2',
        target: TEST_NODE_ID,
        payload: 'test message',
        timestamp: Date.now()
      };

      // Simulate receiving a message
      const messageCallback = mockWs.on.mock.calls.find(call => call[0] === 'message')?.[1];
      if (messageCallback) {
        messageCallback.call(mockWs, JSON.stringify(testMessage));
      }

      expect(messageHandler).toHaveBeenCalledWith(testMessage);
    });

    it('should handle malformed messages gracefully', async () => {
      const connectPromise = transport.connect();
      const openCallback = mockWs.on.mock.calls.find(call => call[0] === 'open')?.[1];
      if (openCallback) {
        openCallback.call(mockWs);
      }
      await connectPromise;

      // Simulate receiving a malformed message
      const messageCallback = mockWs.on.mock.calls.find(call => call[0] === 'message')?.[1];
      if (messageCallback) {
        messageCallback.call(mockWs, 'invalid json');
      }

      // The error should be caught and emitted as an error event
      const errorCallback = mockWs.on.mock.calls.find(call => call[0] === 'error')?.[1];
      expect(errorCallback).toBeDefined();
    });
  });
}); 