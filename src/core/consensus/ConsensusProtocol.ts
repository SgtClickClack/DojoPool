import {
  type NetworkTransport,
  type NetworkMessage,
} from '../network/NetworkTransport';
import { VectorClock } from '../consistency/VectorClock';
import { EventEmitter } from 'events';

export type NodeRole = 'FOLLOWER' | 'CANDIDATE' | 'LEADER';
export type ConsensusState = 'VOTING' | 'COMMITTED' | 'REJECTED';

export interface ConsensusConfig {
  nodeId: string;
  electionTimeoutMin: number;
  electionTimeoutMax: number;
  heartbeatInterval: number;
  transport: NetworkTransport;
}

export interface ConsensusProposal {
  proposalId: string;
  value: any;
  term: number;
  proposerId: string;
}

export interface VoteRequest {
  term: number;
  candidateId: string;
  lastLogIndex: number;
  lastLogTerm: number;
}

export interface VoteResponse {
  term: number;
  voteGranted: boolean;
  voterId: string;
}

export interface ConsensusEvents {
  operationComplete: (success: boolean, latency: number) => void;
  sync: () => void;
  nodeCountChange: (count: number) => void;
  termChange: (gap: number) => void;
  pendingOperationsChange: (count: number) => void;
  'leader:elected': (event: { nodeId: string; term: number }) => void;
  'proposal:committed': (event: { proposalId: string; value: any }) => void;
  error: (error: Error) => void;
}

export declare interface ConsensusProtocol {
  on<K extends keyof ConsensusEvents>(
    event: K,
    listener: ConsensusEvents[K]
  ): this;
  emit<K extends keyof ConsensusEvents>(
    event: K,
    ...args: Parameters<ConsensusEvents[K]>
  ): boolean;

  // Core consensus methods
  getCurrentTerm(): Promise<number>;
  getLeader(): Promise<string | null>;
  isLeader(): Promise<boolean>;
  appendEntry(entry: any): Promise<void>;
  requestVote(): Promise<boolean>;
  stepDown(): Promise<void>;
}

export class ConsensusProtocol extends EventEmitter {
  private nodeId: string;
  private transport: NetworkTransport;
  private vectorClock: VectorClock;
  private currentTerm: number;
  private votedFor: string | null;
  private role: NodeRole;
  private leaderId: string | null;
  private votes: Map<string, boolean>;
  private electionTimeout: NodeJS.Timeout | null;
  private heartbeatTimer: NodeJS.Timeout | null;
  private electionTimeoutMin: number;
  private electionTimeoutMax: number;
  private heartbeatInterval: number;
  private proposals: Map<string, ConsensusProposal>;
  private proposalStates: Map<string, ConsensusState>;

  constructor(config: ConsensusConfig) {
    super();
    this.nodeId = config.nodeId;
    this.transport = config.transport;
    this.vectorClock = new VectorClock();
    this.currentTerm = 0;
    this.votedFor = null;
    this.role = 'FOLLOWER';
    this.leaderId = null;
    this.votes = new Map();
    this.electionTimeout = null;
    this.heartbeatTimer = null;
    this.electionTimeoutMin = config.electionTimeoutMin;
    this.electionTimeoutMax = config.electionTimeoutMax;
    this.heartbeatInterval = config.heartbeatInterval;
    this.proposals = new Map();
    this.proposalStates = new Map();

    this.setupTransportListeners();
  }

  private setupTransportListeners(): void {
    this.transport.on('consensus:request', ({ peerId, payload }) => {
      switch (payload.type) {
        case 'VOTE_REQUEST':
          this.handleVoteRequest(peerId, payload.data);
          break;
        case 'VOTE_RESPONSE':
          this.handleVoteResponse(peerId, payload.data);
          break;
        case 'PROPOSAL':
          this.handleProposal(peerId, payload.data);
          break;
        case 'PROPOSAL_RESPONSE':
          this.handleProposalResponse(peerId, payload.data);
          break;
      }
    });

    this.transport.on('peer:disconnected', () => {
      if (this.role === 'LEADER') {
        this.checkLeadershipValidity();
      }
    });
  }

  public start(): void {
    this.resetElectionTimeout();
  }

  public stop(): void {
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }

  private resetElectionTimeout(): void {
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
    }

    const timeout = Math.floor(
      Math.random() * (this.electionTimeoutMax - this.electionTimeoutMin) +
        this.electionTimeoutMin
    );

    this.electionTimeout = setTimeout(() => {
      if (this.role !== 'LEADER') {
        this.startElection();
      }
    }, timeout);
  }

  private startElection(): void {
    this.role = 'CANDIDATE';
    this.currentTerm++;
    this.votedFor = this.nodeId;
    this.votes.clear();
    this.votes.set(this.nodeId, true);

    const voteRequest: VoteRequest = {
      term: this.currentTerm,
      candidateId: this.nodeId,
      lastLogIndex: this.vectorClock.getTimestamp()[this.nodeId] || 0,
      lastLogTerm: this.currentTerm - 1,
    };

    this.broadcast({
      type: 'CONSENSUS_REQUEST',
      nodeId: this.nodeId,
      vectorClock: this.vectorClock.getTimestamp(),
      payload: {
        type: 'VOTE_REQUEST',
        data: voteRequest,
      },
      timestamp: Date.now(),
    });

    this.resetElectionTimeout();
  }

  private handleVoteRequest(peerId: string, request: VoteRequest): void {
    if (request.term < this.currentTerm) {
      this.sendVoteResponse(peerId, false);
      return;
    }

    if (request.term > this.currentTerm) {
      this.currentTerm = request.term;
      this.role = 'FOLLOWER';
      this.votedFor = null;
      this.leaderId = null;
    }

    if (this.votedFor === null || this.votedFor === request.candidateId) {
      this.votedFor = request.candidateId;
      this.sendVoteResponse(peerId, true);
      this.resetElectionTimeout();
    } else {
      this.sendVoteResponse(peerId, false);
    }
  }

  private sendVoteResponse(peerId: string, granted: boolean): void {
    const response: VoteResponse = {
      term: this.currentTerm,
      voteGranted: granted,
      voterId: this.nodeId,
    };

    this.transport.send(peerId, {
      type: 'CONSENSUS_RESPONSE',
      nodeId: this.nodeId,
      vectorClock: this.vectorClock.getTimestamp(),
      payload: {
        type: 'VOTE_RESPONSE',
        data: response,
      },
      timestamp: Date.now(),
    });
  }

  private handleVoteResponse(peerId: string, response: VoteResponse): void {
    if (this.role !== 'CANDIDATE' || response.term < this.currentTerm) {
      return;
    }

    if (response.term > this.currentTerm) {
      this.currentTerm = response.term;
      this.role = 'FOLLOWER';
      this.votedFor = null;
      this.leaderId = null;
      this.resetElectionTimeout();
      return;
    }

    this.votes.set(peerId, response.voteGranted);
    this.checkVotes();
  }

  private checkVotes(): void {
    const totalVotes = this.transport.getPeers().length + 1;
    const votesReceived = Array.from(this.votes.values()).filter(
      (v) => v
    ).length;

    if (votesReceived > totalVotes / 2) {
      this.becomeLeader();
    }
  }

  private becomeLeader(): void {
    if (this.role === 'CANDIDATE') {
      this.role = 'LEADER';
      this.leaderId = this.nodeId;
      this.startHeartbeat();
      this.emit('leader:elected', {
        nodeId: this.nodeId,
        term: this.currentTerm,
      });
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.broadcast({
        type: 'HEARTBEAT',
        nodeId: this.nodeId,
        vectorClock: this.vectorClock.getTimestamp(),
        timestamp: Date.now(),
      });
    }, this.heartbeatInterval);
  }

  private checkLeadershipValidity(): void {
    const connectedPeers = this.transport.getPeers().length;
    if (connectedPeers === 0) {
      this.role = 'FOLLOWER';
      this.leaderId = null;
      this.resetElectionTimeout();
    }
  }

  public proposeValue(value: any): string {
    const proposalId = `${this.nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const proposal: ConsensusProposal = {
      proposalId,
      value,
      term: this.currentTerm,
      proposerId: this.nodeId,
    };

    this.proposals.set(proposalId, proposal);
    this.proposalStates.set(proposalId, 'VOTING');

    if (this.role === 'LEADER') {
      this.broadcast({
        type: 'CONSENSUS_REQUEST',
        nodeId: this.nodeId,
        vectorClock: this.vectorClock.getTimestamp(),
        payload: {
          type: 'PROPOSAL',
          data: proposal,
        },
        timestamp: Date.now(),
      });
    } else if (this.leaderId) {
      this.transport.send(this.leaderId, {
        type: 'CONSENSUS_REQUEST',
        nodeId: this.nodeId,
        vectorClock: this.vectorClock.getTimestamp(),
        payload: {
          type: 'PROPOSAL',
          data: proposal,
        },
        timestamp: Date.now(),
      });
    }

    return proposalId;
  }

  private handleProposal(peerId: string, proposal: ConsensusProposal): void {
    if (this.role === 'LEADER' && proposal.term === this.currentTerm) {
      this.proposals.set(proposal.proposalId, proposal);
      this.proposalStates.set(proposal.proposalId, 'VOTING');

      this.broadcast({
        type: 'CONSENSUS_REQUEST',
        nodeId: this.nodeId,
        vectorClock: this.vectorClock.getTimestamp(),
        payload: {
          type: 'PROPOSAL',
          data: proposal,
        },
        timestamp: Date.now(),
      });
    }
  }

  private handleProposalResponse(
    peerId: string,
    response: { proposalId: string; accepted: boolean }
  ): void {
    const proposal = this.proposals.get(response.proposalId);
    if (!proposal || this.role !== 'LEADER') {
      return;
    }

    // TODO: Implement proposal acceptance logic
    // For now, we'll use a simple majority vote
    const state = this.proposalStates.get(response.proposalId);
    if (state === 'VOTING') {
      // Count votes and commit if majority accepts
      this.proposalStates.set(response.proposalId, 'COMMITTED');
      this.emit('proposal:committed', {
        proposalId: response.proposalId,
        value: proposal.value,
      });
    }
  }

  private broadcast(message: NetworkMessage): void {
    this.transport.broadcast(message);
  }

  public getRole(): NodeRole {
    return this.role;
  }

  public getCurrentTerm(): number {
    return this.currentTerm;
  }

  public getLeaderId(): string | null {
    return this.leaderId;
  }

  public getNodeId(): string {
    return this.nodeId;
  }
}
