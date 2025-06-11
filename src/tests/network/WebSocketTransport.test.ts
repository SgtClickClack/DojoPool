import { WebSocketTransport } from '../../core/network/WebSocketTransport';
import { NetworkMessage, NetworkMessageType } from '../../core/network/types';

jest.mock('ws', () => {
  class MockEmitter {
    static instances: any[] = [];
    _handlers: Record<string, Function>;
    constructor() {
      this._handlers = {};
      // @ts-ignore
      this.send = jest.fn();
      // @ts-ignore
      this.close = jest.fn();
      // @ts-ignore
      this.removeAllListeners = jest.fn();
      // Debug log to confirm mock usage
      // eslint-disable-next-line no-console
      console.log('[MOCK WEBSOCKET] constructor called');
      (MockEmitter.instances as any[]).push(this);
    }
    on(event: any, cb: any) {
      this._handlers[event] = cb;
    }
    emit(event: any, ...args: any[]) {
      if (this._handlers[event]) {
        this._handlers[event](...args);
      }
    }
  }
  return {
    __esModule: true,
    default: MockEmitter,
  };
});

const WebSocket = require('ws');

describe('WebSocketTransport', () => {
  let transport: WebSocketTransport;
  const TEST_URL = 'ws://localhost:8080';
  const TEST_NODE_ID = 'node1';

  beforeEach(() => {
    jest.clearAllMocks();
    WebSocket.default.instances = [];
    transport = new WebSocketTransport(TEST_URL, TEST_NODE_ID);
  });

  describe('connect', () => {
    it('should establish WebSocket connection and emit connect event', async () => {
      const connectPromise = transport.connect();
      const mockWs = WebSocket.default.instances[0];
      mockWs.emit('open');
      await expect(connectPromise).resolves.toBeUndefined();
    });

    it('should handle connection errors', async () => {
      const connectPromise = transport.connect();
      const mockWs = WebSocket.default.instances[0];
      const errorPromise = new Promise(resolve => transport.onError(resolve));
      mockWs.emit('error', new Error('Connection failed'));
      await expect(connectPromise).rejects.toThrow('Connection failed');
      const emittedError = await errorPromise;
      expect(emittedError).toEqual(new Error('Connection failed'));
    });
  });

  describe('send', () => {
    let mockWs: any;
    beforeEach(async () => {
      const connectPromise = transport.connect();
      mockWs = WebSocket.default.instances[0];
      mockWs.emit('open');
      await connectPromise;
    });

    it('should send formatted message through WebSocket', async () => {
      const testMessage: Omit<NetworkMessage<string>, 'source' | 'timestamp'> = {
        id: 'test-id-1',
        type: NetworkMessageType.STATE_SYNC,
        target: 'node2',
        payload: 'test message',
      };
      await transport.send('node2', testMessage);
      expect(mockWs.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentMessage).toMatchObject({
        ...testMessage,
        source: TEST_NODE_ID,
      });
      expect(sentMessage.timestamp).toBeDefined();
    });

    it('should throw error when not connected', async () => {
      await transport.disconnect();
      const testMessage: Omit<NetworkMessage<string>, 'source' | 'timestamp'> = {
        id: 'test-id-2',
        type: NetworkMessageType.STATE_SYNC,
        target: 'node2',
        payload: 'test message',
      };
      await expect(transport.send('node2', testMessage)).rejects.toThrow('Not connected');
    });
  });

  describe('broadcast', () => {
    let mockWs: any;
    beforeEach(async () => {
      const connectPromise = transport.connect();
      mockWs = WebSocket.default.instances[0];
      mockWs.emit('open');
      await connectPromise;
    });

    it('should broadcast message to all nodes', async () => {
      const testMessage: Omit<NetworkMessage<string>, 'source' | 'timestamp' | 'target'> = {
        id: 'test-id-3',
        type: NetworkMessageType.STATE_SYNC,
        payload: 'broadcast message',
      };
      await transport.broadcast(testMessage);
      expect(mockWs.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentMessage).toMatchObject({
        ...testMessage,
        source: TEST_NODE_ID,
        target: '*',
      });
      expect(sentMessage.timestamp).toBeDefined();
    });
  });

  describe('message handling', () => {
    it('should emit received messages to registered handlers', async () => {
      const messageHandler = jest.fn();
      transport.onMessage(messageHandler);
      const connectPromise = transport.connect();
      const mockWs = WebSocket.default.instances[0];
      mockWs.emit('open');
      await connectPromise;
      const testMessage: NetworkMessage<string> = {
        id: 'test-id-4',
        type: NetworkMessageType.STATE_SYNC,
        source: 'node2',
        target: TEST_NODE_ID,
        payload: 'test message',
        timestamp: Date.now(),
      };
      mockWs.emit('message', JSON.stringify(testMessage));
      expect(messageHandler).toHaveBeenCalledWith(testMessage);
    });

    it('should handle malformed messages gracefully', async () => {
      const connectPromise = transport.connect();
      const mockWs = WebSocket.default.instances[0];
      mockWs.emit('open');
      await connectPromise;
      const errorPromise = new Promise(resolve => transport.onError(resolve));
      mockWs.emit('message', 'invalid json');
      const emittedError = await errorPromise;
      expect(emittedError).toBeInstanceOf(Error);
      expect((emittedError as Error).message).toBe('Failed to parse message');
    });
  });
});