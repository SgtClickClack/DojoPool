import WebSocket from "ws";
import { NetworkTransport } from "../../core/network/NetworkTransport";
import {
  NetworkMessage,
  NetworkMessageType,
  NetworkTransportConfig,
  NodeAddress,
  NetworkError,
} from "../../core/network/types";

describe("NetworkTransport", () => {
  let node1: NetworkTransport;
  let node2: NetworkTransport;

  beforeEach(() => {
    const config1: NetworkTransportConfig = {
      nodeId: "node1",
      host: "localhost",
      port: 3001,
      peers: [],
      heartbeatInterval: 1000,
      connectionTimeout: 5000,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
    };

    const config2: NetworkTransportConfig = {
      nodeId: "node2",
      host: "localhost",
      port: 3002,
      peers: ["ws://localhost:3001" as NodeAddress],
      heartbeatInterval: 1000,
      connectionTimeout: 5000,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
    };

    node1 = new NetworkTransport(config1);
    node2 = new NetworkTransport(config2);
  });

  afterEach(async () => {
    await node1.stop();
    await node2.stop();
  });

  it("should start a WebSocket server", async () => {
    await node1.start();
    expect(node1.connectedPeers.size).toBe(0);
  });

  it("should connect to peers", async () => {
    await node1.start();
    await node2.start();

    // Wait for connection to establish
    await new Promise((resolve) => setTimeout(resolve, 100));

    const connectedPeers = Array.from(node2.connectedPeers.keys());
    expect(connectedPeers).toContain("ws://localhost:3001");
  });

  it("should handle heartbeats", async () => {
    const heartbeatPromise = new Promise<void>((resolve) => {
      node1.on("message", (message: NetworkMessage) => {
        if (message.type === NetworkMessageType.HEARTBEAT) {
          expect(message.source).toBe("node2");
          resolve();
        }
      });
    });

    await node1.start();
    await node2.start();

    await heartbeatPromise;
  });

  it("should broadcast messages to all peers", async () => {
    const messagePromise = new Promise<void>((resolve) => {
      node1.on("message", (message: NetworkMessage) => {
        if (message.type === NetworkMessageType.STATE_SYNC) {
          expect(message.source).toBe("node2");
          expect(message.payload).toEqual({ test: "data" });
          resolve();
        }
      });
    });

    await node1.start();
    await node2.start();

    // Wait for connection to establish
    await new Promise((resolve) => setTimeout(resolve, 100));

    node2.broadcast({
      type: NetworkMessageType.STATE_SYNC,
      payload: { test: "data" },
    });

    await messagePromise;
  });

  it("should handle connection errors gracefully", async () => {
    const errorPromise = new Promise<void>((resolve) => {
      node2.on("error", (error: NetworkError) => {
        expect(error.address).toBe("ws://localhost:3001");
        resolve();
      });
    });

    // Try to connect to non-existent server
    await node2.start();

    await errorPromise;
  });

  it("should attempt to reconnect after disconnection", async () => {
    const reconnectPromise = new Promise<void>((resolve) => {
      node2.on("connect", (address: NodeAddress) => {
        if (address === "ws://localhost:3001") {
          resolve();
        }
      });
    });

    await node2.start();
    await node1.start();

    await reconnectPromise;
  });

  it("should handle consensus messages", async () => {
    const consensusPromise = new Promise<void>((resolve) => {
      node1.on("message", (message: NetworkMessage) => {
        if (message.type === NetworkMessageType.APPEND_ENTRIES) {
          expect(message.source).toBe("node2");
          expect(message.payload).toEqual({ proposal: "test" });
          resolve();
        }
      });
    });

    await node1.start();
    await node2.start();

    // Wait for connection to establish
    await new Promise((resolve) => setTimeout(resolve, 100));

    node2.broadcast({
      type: NetworkMessageType.APPEND_ENTRIES,
      payload: { proposal: "test" },
    });

    await consensusPromise;
  });
});
