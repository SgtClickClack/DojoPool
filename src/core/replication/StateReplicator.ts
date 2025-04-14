import { EventEmitter } from 'events';
import { VectorClock, VectorTimestamp } from '../consistency/VectorClock';
import { GameState } from '../../types/game';

export interface ReplicationConfig {
  nodeId: string;
  nodes: string[];
  syncInterval: number;
}

export class StateReplicator extends EventEmitter {
  private nodeId: string;
  private nodes: string[];
  private vectorClock: VectorClock;
  private localState: GameState | null;
  private syncInterval: number;
  private syncTimer: NodeJS.Timeout | null;

  constructor(config: ReplicationConfig) {
    super();
    this.nodeId = config.nodeId;
    this.nodes = config.nodes;
    this.syncInterval = config.syncInterval;
    this.vectorClock = new VectorClock(config.nodeId);
    this.localState = null;
    this.syncTimer = null;

    this.startSync();
  }

  private startSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.syncTimer = setInterval(() => this.syncState(), this.syncInterval);
  }

  public updateLocalState(state: GameState): void {
    this.vectorClock.increment();
    this.localState = {
      ...state,
      timestamp: this.vectorClock.getCurrentTimestamp()
    };
    this.emit('stateUpdated', this.localState);
  }

  private syncState(): void {
    if (this.localState) {
      this.nodes.forEach(nodeId => {
        if (nodeId !== this.nodeId) {
          this.emit('stateSyncRequest', {
            nodeId,
            state: this.localState,
            timestamp: this.vectorClock.getCurrentTimestamp()
          });
        }
      });
    }
  }

  public handleSyncRequest(request: {
    nodeId: string;
    state: GameState;
    timestamp: VectorTimestamp;
  }): void {
    const remoteVectorClock = new VectorClock(request.nodeId);
    remoteVectorClock.restoreFromSnapshot(request.timestamp);

    if (!this.localState || remoteVectorClock.isHappenedBefore(this.vectorClock)) {
      this.vectorClock.merge(remoteVectorClock);
      this.localState = {
        ...request.state,
        timestamp: this.vectorClock.getCurrentTimestamp()
      };
      this.emit('stateUpdated', this.localState);
    }
  }

  public getState(): GameState | null {
    return this.localState;
  }

  public stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
} 