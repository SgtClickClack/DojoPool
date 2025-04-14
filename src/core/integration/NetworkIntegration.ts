import { EventEmitter } from 'events';
import { NetworkTransport } from '../network/NetworkTransport';
import { NetworkMessageType, NetworkEventMap, NetworkError } from '../network/types';
import { ConsensusManager } from '../consensus/ConsensusManager';
import { StateReplicator } from '../replication/StateReplicator';
import { GameState, GameEvent as GameStateEvent } from '../../types/game';
import { VectorClock } from '../consistency/VectorClock';
import { ConsensusState, LogEntry } from '../consensus/types';

export interface NetworkIntegrationConfig {
  nodeId: string;
  port: number;
  peers: Array<{ nodeId: string; host: string; port: number }>;
  syncInterval: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export interface NetworkIntegrationEvents {
  'stateUpdated': (state: GameState) => void;
  'consensusStateChanged': (state: ConsensusState) => void;
  'leaderElected': (leaderId: string) => void;
  'entryCommitted': (entry: LogEntry) => void;
  'nodeConnected': (nodeId: string) => void;
  'nodeDisconnected': (nodeId: string) => void;
  'error': (error: NetworkError) => void;
  'started': () => void;
  'stopped': () => void;
}

export interface NetworkIntegration {
  on<K extends keyof NetworkIntegrationEvents>(event: K, listener: NetworkIntegrationEvents[K]): this;
  emit<K extends keyof NetworkIntegrationEvents>(event: K, ...args: Parameters<NetworkIntegrationEvents[K]>): boolean;
}

export class NetworkIntegration extends EventEmitter {
  private readonly networkTransport: NetworkTransport;
  private readonly consensusManager: ConsensusManager;
  private readonly stateReplicator: StateReplicator;
  private readonly vectorClock: VectorClock;

  constructor(config: NetworkIntegrationConfig) {
    super();

    // Initialize components
    this.networkTransport = new NetworkTransport({
      nodeId: config.nodeId,
      port: config.port,
      peers: config.peers,
      heartbeatInterval: config.heartbeatInterval,
      connectionTimeout: config.connectionTimeout
    });

    this.stateReplicator = new StateReplicator({
      nodeId: config.nodeId,
      nodes: config.peers.map(p => p.nodeId),
      syncInterval: config.syncInterval
    });

    this.consensusManager = new ConsensusManager({
      nodeId: config.nodeId,
      nodes: config.peers.map(p => p.nodeId),
      electionTimeout: config.heartbeatInterval * 2,
      heartbeatInterval: config.heartbeatInterval
    }, this.networkTransport, this.stateReplicator);

    this.vectorClock = new VectorClock(config.nodeId);

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle state updates from StateReplicator
    this.stateReplicator.on('eventApplied', (event: GameStateEvent) => {
      if (event.action.type === 'STATE_UPDATE') {
        this.emit('stateUpdated', event.action.data as GameState);
      }
    });

    // Handle state sync requests
    this.stateReplicator.on('eventApplied', (event: GameStateEvent) => {
      if (event.action.type === 'STATE_SYNC') {
        const data = event.action.data as { nodeId: string; state: GameState; timestamp: any };
        this.networkTransport.send(data.nodeId, NetworkMessageType.STATE_SYNC, {
          state: data.state,
          timestamp: data.timestamp
        }).catch(error => this.emit('error', error as NetworkError));
      }
    });

    // Handle consensus state changes
    this.consensusManager.on('eventApplied', (event: GameStateEvent) => {
      if (event.action.type === 'CONSENSUS_STATE_CHANGE') {
        this.emit('consensusStateChanged', event.action.data as ConsensusState);
      }
    });

    this.consensusManager.on('eventApplied', (event: GameStateEvent) => {
      if (event.action.type === 'LEADER_ELECTED') {
        this.emit('leaderElected', event.action.data as string);
      }
    });

    this.consensusManager.on('eventApplied', (event: GameStateEvent) => {
      if (event.action.type === 'ENTRY_COMMITTED') {
        this.emit('entryCommitted', event.action.data as LogEntry);
      }
    });

    // Handle network events
    this.networkTransport.on('connect', (nodeId: string) => {
      this.emit('nodeConnected', nodeId);
    });

    this.networkTransport.on('disconnect', (nodeId: string) => {
      this.emit('nodeDisconnected', nodeId);
    });

    this.networkTransport.on('error', (error: NetworkError) => {
      this.emit('error', error);
    });
  }

  public async start(): Promise<void> {
    try {
      await this.networkTransport.start();
      await this.consensusManager.start();
      this.emit('started');
    } catch (error) {
      const err = error as NetworkError;
      this.emit('error', err);
      throw err;
    }
  }

  public async stop(): Promise<void> {
    try {
      this.stateReplicator.stop();
      await this.consensusManager.stop();
      await this.networkTransport.stop();
      this.emit('stopped');
    } catch (error) {
      const err = error as NetworkError;
      this.emit('error', err);
      throw err;
    }
  }

  public async updateGameState(state: GameState): Promise<void> {
    try {
      // Update local state
      this.stateReplicator.updateLocalState(state);

      // Append state update to consensus log
      const entry: Omit<LogEntry, 'term'> = {
        payload: state
      };
      await this.consensusManager.appendEntry(entry);
    } catch (error) {
      const err = error as NetworkError;
      this.emit('error', err);
      throw err;
    }
  }

  public getGameState(): GameState | null {
    return this.stateReplicator.getState();
  }

  public getConsensusState() {
    return {
      state: this.consensusManager.getState(),
      term: this.consensusManager.getCurrentTerm(),
      leader: this.consensusManager.getLeader(),
      nodes: this.consensusManager.getNodes()
    };
  }

  public getNetworkStats() {
    return this.networkTransport.getStats();
  }
} 