/**
 * @jest-environment node
 */
const WebSocket = require("ws");
import { WebSocketTransport } from "../../core/network/WebSocketTransport";
import { NetworkMessage, NetworkMessageType } from "../../core/network/types";
import { EventEmitter } from 'events';

jest.mock("ws");

console.log('[TEST] after imports');
console.log('[TEST] before describe');
type MockWebSocketWithEmit = jest.Mocked<WebSocket> & { emit: (event: string, ...args: any[]) => void };
describe("WebSocketTransport", () => {
  let transport: WebSocketTransport;
  let mockWs: MockWebSocketWithEmit;
  const TEST_URL = "ws://localhost:8080";
  const TEST_NODE_ID = "node1";

  beforeEach(() => {
    console.log('[TEST] beforeEach start');
    class MockWs extends EventEmitter {
      send = jest.fn();
      close = jest.fn();
      removeAllListeners = jest.fn();
    }
    mockWs = new MockWs() as unknown as MockWebSocketWithEmit;
    (WebSocket as jest.Mock).mockImplementation(() => mockWs);
    transport = new WebSocketTransport(TEST_URL, TEST_NODE_ID);
    console.log('[TEST] beforeEach end');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("connect", () => {
    it("should establish WebSocket connection and emit connect event", async () => {
      console.log('[TEST] inside first test case');
      const connectPromise = transport.connect();

      // Simulate successful connection
      mockWs.emit('open');

      await expect(connectPromise).resolves.toBeUndefined();
      expect(WebSocket).toHaveBeenCalledWith(TEST_URL);
    });

    it("should handle connection errors", async () => {
      const testError = new Error("Connection failed");
      const connectPromise = transport.connect();
      const errorPromise = new Promise(resolve => transport.onError(resolve));
      mockWs.emit('error', testError);
      await expect(connectPromise).rejects.toThrow(testError);
      const emittedError = await errorPromise;
      expect(emittedError).toEqual(testError);
    });
  });

  describe("send", () => {
    beforeEach(async () => {
      const connectPromise = transport.connect();
      mockWs.emit('open');
      await connectPromise;
    });

    it("should send formatted message through WebSocket", async () => {
      const testMessage: Omit<
        NetworkMessage<string>,
        "source" | "timestamp"
      > = {
        id: 'test-id-1',
        type: NetworkMessageType.STATE_SYNC,
        target: "node2",
        payload: "test message",
      };

      await transport.send("node2", testMessage);

      expect(mockWs.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      expect(sentMessage).toMatchObject({
        ...testMessage,
        source: TEST_NODE_ID,
      });
      expect(sentMessage.timestamp).toBeDefined();
    });

    it("should throw error when not connected", async () => {
      await transport.disconnect();

      const testMessage: Omit<
        NetworkMessage<string>,
        "source" | "timestamp"
      > = {
        id: 'test-id-2',
        type: NetworkMessageType.STATE_SYNC,
        target: "node2",
        payload: "test message",
      };

      await expect(transport.send("node2", testMessage)).rejects.toThrow(
        "Not connected",
      );
    });
  });

  describe("broadcast", () => {
    beforeEach(async () => {
      const connectPromise = transport.connect();
      mockWs.emit('open');
      await connectPromise;
    });

    it("should broadcast message to all nodes", async () => {
      const testMessage: Omit<
        NetworkMessage<string>,
        "source" | "timestamp" | "target"
      > = {
        id: 'test-id-3',
        type: NetworkMessageType.STATE_SYNC,
        payload: "broadcast message",
      };

      await transport.broadcast(testMessage);

      expect(mockWs.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0] as string);
      expect(sentMessage).toMatchObject({
        ...testMessage,
        source: TEST_NODE_ID,
        target: "*",
      });
      expect(sentMessage.timestamp).toBeDefined();
    });
  });

  describe("message handling", () => {
    it("should emit received messages to registered handlers", async () => {
      const messageHandler = jest.fn();
      transport.onMessage(messageHandler);

      const connectPromise = transport.connect();
      mockWs.emit('open');
      await connectPromise;

      const testMessage: NetworkMessage<string> = {
        id: 'test-id-4',
        type: NetworkMessageType.STATE_SYNC,
        source: "node2",
        target: TEST_NODE_ID,
        payload: "test message",
        timestamp: Date.now(),
      };

      // Simulate receiving a message
      mockWs.emit('message', JSON.stringify(testMessage));

      expect(messageHandler).toHaveBeenCalledWith(testMessage);
    });

    it("should handle malformed messages gracefully", async () => {
      const connectPromise = transport.connect();
      mockWs.emit('open');
      await connectPromise;
      // Simulate receiving a malformed message
      const errorPromise = new Promise(resolve => transport.onError(resolve));
      mockWs.emit('message', "invalid json");
      const emittedError = await errorPromise;
      expect(emittedError).toBeInstanceOf(Error);
      expect((emittedError as Error).message).toBe("Failed to parse message");
    });
  });
});

it('smoke', () => {
  expect(true).toBe(true);
});