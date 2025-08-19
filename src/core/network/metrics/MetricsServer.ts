import WebSocket from 'ws';
import { NetworkMetrics } from './NetworkMetricsCollector';
import { type NetworkTransport } from '../NetworkTransport';

export class MetricsServer {
  private wss: WebSocket.Server;
  private clients: Map<string, Set<WebSocket>> = new Map();
  private updateInterval: number = 1000; // 1 second updates
  private updateTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(private port: number = 3002) {
    this.wss = new WebSocket.Server({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws, req) => {
      const nodeId = this.extractNodeId(req.url);
      if (!nodeId) {
        ws.close();
        return;
      }

      this.addClient(nodeId, ws);

      ws.on('close', () => {
        this.removeClient(nodeId, ws);
      });

      ws.on('error', () => {
        this.removeClient(nodeId, ws);
      });
    });
  }

  private extractNodeId(url: string | undefined): string | null {
    if (!url) return null;
    const match = url.match(/\/metrics\/([^/]+)$/);
    return match ? match[1] : null;
  }

  private addClient(nodeId: string, ws: WebSocket): void {
    if (!this.clients.has(nodeId)) {
      this.clients.set(nodeId, new Set());
    }
    this.clients.get(nodeId)!.add(ws);

    // Start metrics updates if this is the first client for this node
    if (this.clients.get(nodeId)!.size === 1) {
      this.startMetricsUpdates(nodeId);
    }
  }

  private removeClient(nodeId: string, ws: WebSocket): void {
    const nodeClients = this.clients.get(nodeId);
    if (nodeClients) {
      nodeClients.delete(ws);
      if (nodeClients.size === 0) {
        this.clients.delete(nodeId);
        this.stopMetricsUpdates(nodeId);
      }
    }
  }

  private startMetricsUpdates(nodeId: string): void {
    const timer = setInterval(() => {
      this.broadcastMetrics(nodeId);
    }, this.updateInterval);
    this.updateTimers.set(nodeId, timer);
  }

  private stopMetricsUpdates(nodeId: string): void {
    const timer = this.updateTimers.get(nodeId);
    if (timer) {
      clearInterval(timer);
      this.updateTimers.delete(nodeId);
    }
  }

  private broadcastMetrics(nodeId: string): void {
    const nodeClients = this.clients.get(nodeId);
    if (!nodeClients || nodeClients.size === 0) return;

    const networkTransport = this.getNetworkTransport(nodeId);
    if (!networkTransport) return;

    const metrics = networkTransport.getMetrics();
    const metricsString = JSON.stringify(metrics);

    for (const client of nodeClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(metricsString);
      }
    }
  }

  private getNetworkTransport(nodeId: string): NetworkTransport | null {
    // This method should be implemented to retrieve the NetworkTransport instance
    // for the given nodeId from your application's node management system
    return null; // Placeholder - implement based on your architecture
  }

  public stop(): void {
    // Clear all update timers
    for (const [nodeId] of this.updateTimers) {
      this.stopMetricsUpdates(nodeId);
    }

    // Close all client connections
    for (const [, clients] of this.clients) {
      for (const client of clients) {
        client.close();
      }
    }

    // Close the server
    this.wss.close();
  }
}
