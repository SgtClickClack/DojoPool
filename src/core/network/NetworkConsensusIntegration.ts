import { EventEmitter } from "events";
import { NetworkTransport, NetworkMessage, NetworkMessageType } from "./NetworkTransport";
import { ConsensusManager } from "../consensus/ConsensusManager";
import { StateReplicator } from "../replication/StateReplicator";
import { GameState } from "../../types/game";
import { VectorClock } from "../consistency/VectorClock";

export interface NetworkConsensusConfig {
  nodeId: string;
  nodes: string[];
  port: number;
  heartbeatInterval: number;
  electionTimeout: number;
  syncInterval: number;
}

/**
 * Integrates NetworkTransport with ConsensusManager and StateReplicator
 * to provide a unified interface for distributed state management
 */
export class NetworkConsensusIntegration extends EventEmitter {
  private readonly config: NetworkConsensusConfig;
  private readonly networkTransport: NetworkTransport;
  private readonly consensusManager: ConsensusManager;
  private readonly stateReplicator: StateReplicator;
  private readonly vectorClock: VectorClock;

  constructor(config: NetworkConsensusConfig) {
    super();
    this.config = config;
    this.vectorClock = new VectorClock(config.nodeId);

    // Initialize network transport
    this.networkTransport = new NetworkTransport({
      nodeId: config.nodeId,
      port: config.port,
      peers: config.nodes.map(nodeId => ({ nodeId, host: "127.0.0.1", port: config.port })),
      heartbeatInterval: config.heartbeatInterval,
    });

    // Initialize state replicator
    this.stateReplicator = new StateReplicator({
      nodeId: config.nodeId,
      nodes: config.nodes,
      syncInterval: config.syncInterval,
    });

    // Initialize consensus manager
    this.consensusManager = new ConsensusManager(
      {
        nodeId: config.nodeId,
        nodes: config.nodes,
        heartbeatInterval: config.heartbeatInterval,
        electionTimeout: config.electionTimeout,
      },
      this.networkTransport,
      this.stateReplicator
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle state updates from state replicator
    this.stateReplicator.on("stateUpdated", (state: GameState) => {
      this.emit("stateUpdated", state);
    });

    // Handle consensus state changes
    this.consensusManager.on("state:change", (state) => {
      this.emit("consensusStateChanged", state);
    });

    this.consensusManager.on("leader:elected", (leaderId: string) => {
      this.emit("leaderElected", leaderId);
    });

    // Handle network events
    this.networkTransport.on("connect", (nodeId: string) => {
      this.emit("nodeConnected", nodeId);
    });

    this.networkTransport.on("disconnect", (nodeId: string) => {
      this.emit("nodeDisconnected", nodeId);
    });

    this.networkTransport.on("error", (error: Error) => {
      this.emit("error", error);
    });
  }

  /**
   * Start the network consensus system
   */
  public async start(): Promise<void> {
    try {
      // Start network transport
      await this.networkTransport.start();

      // Start consensus manager (this will trigger leader election)
      await this.consensusManager.start();

      this.emit("started");
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * Stop the network consensus system
   */
  public async stop(): Promise<void> {
    try {
      await this.consensusManager.stop();
      await this.networkTransport.stop();
      this.stateReplicator.stop();
      this.emit("stopped");
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * Propose a new state update to the cluster
   */
  public async proposeStateUpdate(state: GameState): Promise<void> {
    if (!this.consensusManager.isLeader()) {
      throw new Error("Only leader can propose state updates");
    }

    try {
      // Update vector clock
      this.vectorClock.increment();
      const timestampedState = {
        ...state,
        timestamp: this.vectorClock.getCurrentTimestamp(),
      };

      // Update local state through state replicator
      this.stateReplicator.updateLocalState(timestampedState);

      // Append state update to consensus log
      await this.consensusManager.appendEntry({
        type: "stateUpdate",
        data: timestampedState,
      });
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * Get the current game state
   */
  public getState(): GameState | null {
    return this.stateReplicator.getState();
  }

  /**
   * Check if this node is the current leader
   */
  public isLeader(): boolean {
    return this.consensusManager.isLeader();
  }

  /**
   * Get the current leader's node ID
   */
  public getLeader(): string | null {
    return this.consensusManager.getLeader();
  }

  /**
   * Get the current term number
   */
  public getCurrentTerm(): number {
    return this.consensusManager.getCurrentTerm();
  }
} 