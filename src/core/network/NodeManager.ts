import { type NetworkTransport } from './NetworkTransport';
import { EventEmitter } from 'events';

export class NodeManager extends EventEmitter {
  private static instance: NodeManager;
  private nodes: Map<string, NetworkTransport> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): NodeManager {
    if (!NodeManager.instance) {
      NodeManager.instance = new NodeManager();
    }
    return NodeManager.instance;
  }

  public registerNode(nodeId: string, transport: NetworkTransport): void {
    if (this.nodes.has(nodeId)) {
      throw new Error(`Node ${nodeId} is already registered`);
    }
    this.nodes.set(nodeId, transport);
    this.emit('nodeRegistered', nodeId);
  }

  public unregisterNode(nodeId: string): void {
    const transport = this.nodes.get(nodeId);
    if (transport) {
      transport.disconnect();
      this.nodes.delete(nodeId);
      this.emit('nodeUnregistered', nodeId);
    }
  }

  public getTransport(nodeId: string): NetworkTransport | undefined {
    return this.nodes.get(nodeId);
  }

  public getAllNodeIds(): string[] {
    return Array.from(this.nodes.keys());
  }

  public getNodeCount(): number {
    return this.nodes.size;
  }

  public isNodeRegistered(nodeId: string): boolean {
    return this.nodes.has(nodeId);
  }

  public getNodeMetrics(nodeId: string) {
    const transport = this.nodes.get(nodeId);
    if (!transport) {
      throw new Error(`Node ${nodeId} not found`);
    }
    return transport.getMetrics();
  }

  public getAllNodesMetrics() {
    const metrics = new Map();
    for (const [nodeId, transport] of this.nodes) {
      metrics.set(nodeId, transport.getMetrics());
    }
    return metrics;
  }

  public disconnectAll(): void {
    for (const [nodeId, transport] of this.nodes) {
      transport.disconnect();
      this.emit('nodeUnregistered', nodeId);
    }
    this.nodes.clear();
  }
}
