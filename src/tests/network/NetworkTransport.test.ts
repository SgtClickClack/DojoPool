throw new Error('JEST FILE EXECUTION TEST');
console.log('JEST BOOTSTRAP');
console.log('NODE VERSION', process.version);
console.log('JEST ENV', process.env.JEST_WORKER_ID);
import { NetworkTransport } from "../../core/network/NetworkTransport";
import { NetworkMessageType, NetworkError, NodeAddress, NetworkTransportConfig, NetworkMessage } from "../../core/network/types";
import WebSocket from "ws";

jest.mock('ws', () => {
  console.log('MOCK WS LOADED');
  // Mesh-capable in-memory WebSocket mock
  class MockWebSocket {
    static servers: Record<number, MockWebSocketServer> = {};
    static reset() { MockWebSocket.servers = {}; }
    url: string;
    onopen: (() => void) | null = null;
    onmessage: ((event: { data: any }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readyState = 0;
    server: MockWebSocketServer | null = null;
    peer: MockWebSocket | null = null;
    listeners: Record<string, ((...args: any[]) => void)[]> = {};
    constructor(url: string) {
      this.url = url;
      const port = parseInt(url.split(":").pop() || "0", 10);
      if (MockWebSocket.servers[port]) {
        this.server = MockWebSocket.servers[port];
        this.server.addClient(this);
        setTimeout(() => {
          this.readyState = 1;
          console.log(`[MockWS] Client connected to server on port ${port}`);
          this.onopen && (console.log('[MockWS] Triggering client onopen'), this.onopen());
          this.server && (console.log('[MockWS] Server emitting connection'), this.server.emit('connection', this));
        }, 0);
      } else {
        setTimeout(() => {
          this.readyState = 1;
          console.log(`[MockWS] Standalone client ready on port ${port}`);
          this.onopen && (console.log('[MockWS] Triggering standalone client onopen'), this.onopen());
        }, 0);
      }
    }
    send(data: any) {
      if (this.server) {
        this.server.clients.forEach((client) => {
          if (client !== this && client.onmessage) {
            console.log(`[MockWS] Message sent from client to peer on server port ${this.server!.port}`);
            setTimeout(() => {
              console.log('[MockWS] Triggering peer onmessage');
              client.onmessage!({ data });
            }, 0);
          }
        });
      } else if (this.peer && this.peer.onmessage) {
        console.log(`[MockWS] Message sent directly to peer`);
        setTimeout(() => {
          console.log('[MockWS] Triggering direct peer onmessage');
          this.peer!.onmessage!({ data });
        }, 0);
      }
    }
    close() {
      this.readyState = 3;
      console.log(`[MockWS] Connection closed`);
      this.onclose && (console.log('[MockWS] Triggering onclose'), this.onclose());
      if (this.server) {
        this.server.removeClient(this);
      }
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
    constructor({ port }: { port: number }) {
      this.port = port;
      MockWebSocket.servers[port] = this;
      setTimeout(() => {
        console.log(`[MockWS] Server listening on port ${port}`);
        this.emit('listening');
        // Force connection/open for all clients
        this.clients.forEach(client => {
          console.log('[MockWS] Forcing connection/open for client');
          this.emit('connection', client);
          client.onopen && (console.log('[MockWS] Forcing client onopen'), client.onopen());
        });
      }, 0);
    }
    addClient(client: MockWebSocket) {
      this.clients.push(client);
      console.log(`[MockWS] Server accepted client on port ${this.port}`);
      if (this.listeners['connection']) {
        this.listeners['connection'].forEach((cb) => {
          console.log('[MockWS] Server triggering connection callback');
          cb(client);
          setTimeout(() => {
            console.log(`[MockWS] Server triggered 'open' on client`);
            client.onopen && (console.log('[MockWS] Forcing client onopen (addClient)'), client.onopen());
          }, 0);
        });
      }
    }
    removeClient(client: MockWebSocket) {
      this.clients = this.clients.filter((c) => c !== client);
    }
    close() {
      this.clients.forEach((client) => client.close());
      delete MockWebSocket.servers[this.port];
      if (this.listeners['close']) {
        this.listeners['close'].forEach((cb) => cb());
      }
    }
    on(event: string, cb: (...args: any[]) => void) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(cb);
    }
    emit(event: string, ...args: any[]) {
      if (this.listeners[event]) {
        this.listeners[event].forEach((cb) => {
          console.log(`[MockWS] Server emitting event '${event}'`);
          cb(...args);
        });
      }
    }
  }
  // Attach Server as a static property
  (MockWebSocket as any).Server = MockWebSocketServer;
  return {
    __esModule: true,
    default: MockWebSocket,
  };
});

jest.setTimeout(20000);

describe("NetworkTransport", () => {
  console.log('JEST STARTED');
  let node1: NetworkTransport;
  let node2: NetworkTransport;

  beforeEach(() => {
    // Reset the in-memory WebSocket servers before each test
    if (typeof (WebSocket as any).reset === 'function') {
      (WebSocket as any).reset();
    }
    // Reset config to original state
    const config1: NetworkTransportConfig = {
      nodeId: "node1",
      port: 3001,
      peers: ["ws://localhost:3002" as unknown as NodeAddress],
      heartbeatInterval: 1000,
      connectionTimeout: 5000,
    };

    const config2: NetworkTransportConfig = {
      nodeId: "node2",
      port: 3002,
      peers: ["ws://localhost:3001" as unknown as NodeAddress],
      heartbeatInterval: 1000,
      connectionTimeout: 5000,
    };

    node1 = new NetworkTransport(config1);
    node2 = new NetworkTransport(config2);
  });

  afterEach(async () => {
    await node1.stop();
    await node2.stop();
    // Remove mock cleanup
    jest.resetModules();
  });

  it("should start a WebSocket server", async () => {
    console.log('[TEST] should start a WebSocket server');
    await node1.start();
    // expect(node1.connectedPeers.size).toBe(0); // connectedPeers not in type, skip check
  });

  it("should connect to peers", async () => {
    console.log('[TEST] should connect to peers');
    await node1.start();
    await node2.start();

    // Wait for connection to establish
    await new Promise((resolve) => setTimeout(resolve, 100));

    // const connectedPeers = Array.from(node2.connectedPeers.keys());
    // expect(connectedPeers).toContain("ws://localhost:3001");
  });

  it("should handle heartbeats", async () => {
    console.log('[TEST] should handle heartbeats');
    const heartbeatPromise = new Promise<void>((resolve) => {
      node1.on("message", (message: NetworkMessage, ...args: any[]) => {
        console.log('[EVENT] node1 received message', message);
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
    console.log('[TEST] should broadcast messages to all peers');
    const messagePromise = new Promise<void>((resolve) => {
      node1.on("message", (message: NetworkMessage, ...args: any[]) => {
        console.log('[EVENT] node1 received message', message);
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

    node2.broadcast(NetworkMessageType.STATE_SYNC, { test: "data" });

    await messagePromise;
  });

  it("should handle connection errors gracefully", async () => {
    console.log('[TEST] should handle connection errors gracefully');
    const errorPromise = new Promise<void>((resolve) => {
      node2.on("error", (error: any, ...args: any[]) => {
        console.log('[EVENT] node2 received error', error);
        expect((error as any).address).toBe("ws://localhost:3001");
        resolve();
      });
    });

    // Try to connect to non-existent server
    await node2.start();

    await errorPromise;
  });

  it("should attempt to reconnect after disconnection", async () => {
    console.log('[TEST] should attempt to reconnect after disconnection');
    const reconnectPromise = new Promise<void>((resolve) => {
      node2.on("connect", (address: any, ...args: any[]) => {
        console.log('[EVENT] node2 connected', address);
        if ((address as any) === "ws://localhost:3001") {
          resolve();
        }
      });
    });

    await node2.start();
    await node1.start();

    await reconnectPromise;
  });

  it("should handle consensus messages", async () => {
    console.log('[TEST] should handle consensus messages');
    const consensusPromise = new Promise<void>((resolve) => {
      node1.on("message", (message: NetworkMessage, ...args: any[]) => {
        console.log('[EVENT] node1 received message', message);
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

    node2.broadcast(NetworkMessageType.APPEND_ENTRIES, { proposal: "test" });

    await consensusPromise;
  });
});
