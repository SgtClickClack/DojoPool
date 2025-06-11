console.log('JEST OUTPUT CONFIRMED');
import { NetworkTransport } from "../../core/network/NetworkTransport";
import { NetworkMessageType, NetworkError, NodeAddress, NetworkTransportConfig, NetworkMessage } from "../../core/network/types";
import WebSocket from "ws";

jest.mock('ws', () => {
  // Mesh-capable in-memory WebSocket mock
  class MockWebSocket {
    static servers: Record<number, MockWebSocketServer> = {};
    static reset() { MockWebSocket.servers = {}; }
    url: string;
    nodeId: string;
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: any }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readyState = 0;
    server: MockWebSocketServer | null = null;
    listeners: Record<string, ((...args: any[]) => void)[]> = {};
    address: string;

    constructor(url: string) {
      const urlObj = new URL(url, 'ws://localhost');
      this.nodeId = urlObj.searchParams.get('nodeId') || '';
      let port = 0;
      if (urlObj.port) {
        port = parseInt(urlObj.port, 10);
      } else {
        const portMatch = url.match(/:(\d+)(?:\/?|$)/);
        if (portMatch) port = parseInt(portMatch[1], 10);
      }
      if (!port) throw new Error(`[MockWS] Could not extract port from URL: ${url}`);
      this.address = `ws://localhost:${port}`;
      this.url = url;

      // Connect to server if it exists
      if (MockWebSocket.servers[port]) {
        this.server = MockWebSocket.servers[port];
        this.server.addClient(this);
        // Always fire onopen and server connection event
        process.nextTick(() => {
          this.readyState = 1;
          if (this.onopen) {
            console.log(`[MockWS] Client ${this.nodeId} onopen`);
            this.onopen();
          }
          if (this.server) {
            console.log(`[MockWS] Server ${this.server.port} connection event for client ${this.nodeId}`);
            this.server.emit('connection', this);
          }
        });
      } else {
        // If server not yet created, client will be added when server is constructed
        console.log(`[MockWS] Client ${this.nodeId} waiting for server on port ${port}`);
      }
    }

    send(data: string, callback?: (err?: Error) => void) {
      if (this.readyState !== 1) {
        const err = new Error('WebSocket is not open');
        if (callback) callback(err);
        return;
      }
      try {
        if (this.server) {
          // Broadcast to all clients except sender
          this.server.clients.forEach(client => {
            if (client !== this && client.onmessage) {
              process.nextTick(() => {
                console.log(`[MockWS] Client ${this.nodeId} sending message to ${client.nodeId}`);
                client.onmessage!({ data });
              });
            }
          });
        }
        if (callback) callback();
      } catch (err) {
        if (callback) callback(err as Error);
      }
    }

    close() {
      if (this.readyState === 3) return;
      this.readyState = 3;
      process.nextTick(() => {
        if (this.onclose) {
          console.log(`[MockWS] Client ${this.nodeId} onclose`);
          this.onclose();
        }
        if (this.server) this.server.removeClient(this);
      });
    }

    on(event: string, cb: (...args: any[]) => void) {
      if (event === 'open') this.onopen = cb;
      else if (event === 'message') this.onmessage = cb;
      else if (event === 'close') this.onclose = cb;
      else if (event === 'error') this.onerror = cb;
      else {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(cb);
      }
    }
  }

  class MockWebSocketServer {
    port: number;
    clients: MockWebSocket[] = [];
    listeners: Record<string, ((...args: any[]) => void)[]> = {};
    isListening: boolean = false;

    constructor({ port }: { port: number }) {
      this.port = port;
      MockWebSocket.servers[port] = this;
      // Ensure all event methods are present
      this.on = this.on.bind(this);
      this.emit = this.emit.bind(this);
      this.close = this.close.bind(this);
      process.nextTick(() => {
        this.isListening = true;
        this.emit('listening');
        this.clients.forEach(client => {
          if (client.readyState === 0) {
            client.readyState = 1;
            if (client.onopen) {
              client.onopen();
            }
            this.emit('connection', client);
          }
        });
      });
    }

    addClient(client: MockWebSocket) {
      if (!this.clients.includes(client)) {
        this.clients.push(client);
        if (this.isListening) {
          process.nextTick(() => {
            client.readyState = 1;
            if (client.onopen) {
              client.onopen();
            }
            this.emit('connection', client);
          });
        }
      }
    }

    removeClient(client: MockWebSocket) {
      this.clients = this.clients.filter(c => c !== client);
    }

    close() {
      this.clients.forEach(client => client.close());
      delete MockWebSocket.servers[this.port];
      this.emit('close');
    }

    on(event: string, cb: (...args: any[]) => void) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
    }

    emit(event: string, ...args: any[]) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          process.nextTick(() => cb(...args));
        });
      }
    }
  }

  // Attach Server as a property and as a named export
  return {
    __esModule: true,
    default: MockWebSocket,
    Server: MockWebSocketServer,
  };
});

jest.setTimeout(30000);

describe("NetworkTransport", () => {
  console.error('JEST OUTPUT TEST');
  console.log('JEST STARTED');
  let node1: NetworkTransport;
  let node2: NetworkTransport;

  beforeEach(async () => {
    // Reset the in-memory WebSocket servers before each test
    if (typeof (WebSocket as any).reset === 'function') {
      (WebSocket as any).reset();
    }

    const config1: NetworkTransportConfig = {
      nodeId: "node1",
      port: 3001,
      peers: [
        { nodeId: "node2", host: "localhost", port: 3002, url: "ws://localhost:3002?nodeId=node2" } as any,
      ],
      heartbeatInterval: 100, // Reduced for faster tests
      connectionTimeout: 1000, // Reduced for faster tests
    };

    const config2: NetworkTransportConfig = {
      nodeId: "node2",
      port: 3002,
      peers: [
        { nodeId: "node1", host: "localhost", port: 3001, url: "ws://localhost:3001?nodeId=node1" } as any,
      ],
      heartbeatInterval: 100, // Reduced for faster tests
      connectionTimeout: 1000, // Reduced for faster tests
    };

    console.log('[TEST] config1', config1);
    console.log('[TEST] config2', config2);
    node1 = new NetworkTransport(config1);
    node2 = new NetworkTransport(config2);
    // Patch the mock server to call handleConnection on the owning node
    const MockWebSocket = (WebSocket as any);
    const origAddClient = MockWebSocket.Server.prototype.addClient;
    MockWebSocket.Server.prototype.addClient = function(client: any) {
      origAddClient.call(this, client);
      // Only call handleConnection if client is a MockWebSocket (not server)
      if (client && typeof client.url === 'string' && typeof client.send === 'function' && !(client instanceof MockWebSocket.Server)) {
        if (this.port === 3001) {
          node1['handleConnection'](client as any);
        } else if (this.port === 3002) {
          node2['handleConnection'](client as any);
        }
      }
    };
    console.log('[TEST] beforeEach complete');
  });

  afterEach(async () => {
    // Ensure proper cleanup
    await Promise.all([
      node1.stop().catch(() => {}),
      node2.stop().catch(() => {})
    ]);
    // Reset mocks
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("should start a WebSocket server", async () => {
    console.log('[TEST] should start a WebSocket server - START');
    await node1.start();
    expect(node1['server']).toBeDefined();
    console.log('[TEST] should start a WebSocket server - END');
  }, 10000); // 10s timeout for this test

  it("should connect to peers", async () => {
    console.log('[TEST] should connect to peers - START');
    await node1.start();
    await node2.start();
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(node1['connections'].size).toBeGreaterThan(0);
    expect(node2['connections'].size).toBeGreaterThan(0);
    console.log('[TEST] should connect to peers - END');
  }, 10000); // 10s timeout for this test

  it("should handle heartbeats", async () => {
    console.log('[TEST] should handle heartbeats - START');
    const heartbeatPromise = new Promise<void>((resolve) => {
      node1.on("message", (message: NetworkMessage) => {
        console.log('[EVENT] node1 received message', message);
        if (message.type === NetworkMessageType.HEARTBEAT) {
          expect(message.source).toBe("node2");
          console.log('[PROMISE] heartbeatPromise resolved');
          resolve();
        }
      });
    });
    await node1.start();
    await node2.start();
    await heartbeatPromise;
    console.log('[TEST] should handle heartbeats - END');
  }, 10000); // 10s timeout for this test

  it("should broadcast messages to all peers", async () => {
    console.log('[TEST] should broadcast messages to all peers - START');
    const messagePromise = new Promise<void>((resolve) => {
      node1.on("message", (message: NetworkMessage) => {
        console.log('[EVENT] node1 received message', message);
        if (message.type === NetworkMessageType.STATE_SYNC) {
          expect(message.source).toBe("node2");
          expect(message.payload).toEqual({ test: "data" });
          console.log('[PROMISE] messagePromise resolved');
          resolve();
        }
      });
    });
    await node1.start();
    await node2.start();
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 500));
    await node2.broadcast(NetworkMessageType.STATE_SYNC, { test: "data" });
    await messagePromise;
    console.log('[TEST] should broadcast messages to all peers - END');
  }, 10000); // 10s timeout for this test

  it("should handle connection errors gracefully", async () => {
    console.log('[TEST] should handle connection errors gracefully - START');
    const errorPromise = new Promise<void>((resolve) => {
      node2.on("error", (error: NetworkError) => {
        console.log('[EVENT] node2 received error', error);
        expect(error.code).toBe("CONNECTION_ERROR");
        console.log('[PROMISE] errorPromise resolved');
        resolve();
      });
    });
    // Try to connect to non-existent server
    await node2.start();
    await errorPromise;
    console.log('[TEST] should handle connection errors gracefully - END');
  }, 10000); // 10s timeout for this test

  it("should attempt to reconnect after disconnection", async () => {
    console.log('[TEST] should attempt to reconnect after disconnection - START');
    const reconnectPromise = new Promise<void>((resolve) => {
      node2.on("connect", (address: string) => {
        console.log('[EVENT] node2 connected', address);
        if (address === "ws://localhost:3001") {
          console.log('[PROMISE] reconnectPromise resolved');
          resolve();
        }
      });
    });
    await node2.start();
    await node1.start();
    await reconnectPromise;
    console.log('[TEST] should attempt to reconnect after disconnection - END');
  }, 10000); // 10s timeout for this test

  it("should handle consensus messages", async () => {
    console.log('[TEST] should handle consensus messages - START');
    const consensusPromise = new Promise<void>((resolve) => {
      node1.on("message", (message: NetworkMessage) => {
        console.log('[EVENT] node1 received message', message);
        if (message.type === NetworkMessageType.APPEND_ENTRIES) {
          expect(message.source).toBe("node2");
          expect(message.payload).toEqual({ proposal: "test" });
          console.log('[PROMISE] consensusPromise resolved');
          resolve();
        }
      });
    });
    await node1.start();
    await node2.start();
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 500));
    await node2.broadcast(NetworkMessageType.APPEND_ENTRIES, { proposal: "test" });
    await consensusPromise;
    console.log('[TEST] should handle consensus messages - END');
  }, 10000); // 10s timeout for this test
});
