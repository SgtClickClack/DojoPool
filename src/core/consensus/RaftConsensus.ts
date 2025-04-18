import { EventEmitter } from "events";
import { VectorClock } from "../consistency/VectorClock";
import { GameState, VectorTimestamp } from "../../types/consistency";
import { GameEvent } from "../../types/game";

declare module "events" {
  interface EventEmitter {
    on(
      event: "stateChange",
      listener: (data: { state: NodeState; term: number }) => void,
    ): this;
    on(event: "requestVote", listener: (request: VoteRequest) => void): this;
    on(event: "voteResponse", listener: (response: VoteResponse) => void): this;
    on(
      event: "appendEntries",
      listener: (nodeId: string, request: AppendEntriesRequest) => void,
    ): this;
    on(
      event: "appendEntriesResponse",
      listener: (response: AppendEntriesResponse) => void,
    ): this;
    on(event: "commandProposed", listener: (entry: LogEntry) => void): this;
    on(event: "applyCommand", listener: (command: any) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    on(event: "eventApplied", listener: (event: GameEvent) => void): this;
  }
}

export interface ConsensusConfig {
  nodeId: string;
  heartbeatInterval: number;
  electionTimeout: number;
  nodes: string[];
}

interface LogEntry {
  term: number;
  event: GameEvent;
}

interface VoteRequest {
  term: number;
  candidateId: string;
  lastLogIndex: number;
  lastLogTerm: number;
}

interface VoteResponse {
  term: number;
  voteGranted: boolean;
}

interface AppendEntriesRequest {
  term: number;
  leaderId: string;
  entries: LogEntry[];
}

interface AppendEntriesResponse {
  term: number;
  success: boolean;
}

type NodeState = "follower" | "candidate" | "leader";

/**
 * Raft consensus implementation for distributed state management
 * Ensures strong consistency across the game cluster
 */
export class RaftConsensus extends EventEmitter {
  private nodeId: string;
  private state: NodeState;
  private currentTerm: number;
  private votedFor: string | null;
  private log: LogEntry[];
  private commitIndex: number;
  private lastApplied: number;
  private nodes: string[];
  private heartbeatInterval: number;
  private electionTimeout: number;
  private heartbeatTimer: NodeJS.Timeout | null;
  private electionTimer: NodeJS.Timeout | null;
  private vectorClock: VectorClock;

  constructor(config: ConsensusConfig) {
    super();
    this.nodeId = config.nodeId;
    this.heartbeatInterval = config.heartbeatInterval;
    this.electionTimeout = config.electionTimeout;
    this.nodes = config.nodes;

    this.state = "follower";
    this.currentTerm = 0;
    this.votedFor = null;
    this.log = [];
    this.commitIndex = -1;
    this.lastApplied = -1;
    this.heartbeatTimer = null;
    this.electionTimer = null;
    this.vectorClock = new VectorClock(config.nodeId);

    this.resetElectionTimeout();
  }

  private resetElectionTimeout(): void {
    if (this.electionTimer) {
      clearTimeout(this.electionTimer);
    }

    const timeout = this.electionTimeout + Math.random() * this.electionTimeout;
    this.electionTimer = setTimeout(() => this.startElection(), timeout);
  }

  private startElection(): void {
    if (this.state !== "leader") {
      this.state = "candidate";
      this.currentTerm++;
      this.votedFor = this.nodeId;
      this.requestVotes();
    }
  }

  private requestVotes(): void {
    const lastLogIndex = this.log.length - 1;
    const lastLogTerm = lastLogIndex >= 0 ? this.log[lastLogIndex].term : 0;

    this.emit("requestVote", {
      term: this.currentTerm,
      candidateId: this.nodeId,
      lastLogIndex,
      lastLogTerm,
    });
  }

  public handleVoteRequest(request: {
    term: number;
    candidateId: string;
    lastLogIndex: number;
    lastLogTerm: number;
  }): void {
    if (request.term > this.currentTerm) {
      this.currentTerm = request.term;
      this.state = "follower";
      this.votedFor = null;
    }

    const lastLogIndex = this.log.length - 1;
    const lastLogTerm = lastLogIndex >= 0 ? this.log[lastLogIndex].term : 0;

    if (
      request.term === this.currentTerm &&
      (this.votedFor === null || this.votedFor === request.candidateId) &&
      (request.lastLogTerm > lastLogTerm ||
        (request.lastLogTerm === lastLogTerm &&
          request.lastLogIndex >= lastLogIndex))
    ) {
      this.votedFor = request.candidateId;
      this.emit("voteGranted", {
        term: this.currentTerm,
        voteGranted: true,
      });
    }
  }

  public broadcastEvent(event: GameEvent): void {
    if (this.state === "leader") {
      const entry: LogEntry = {
        term: this.currentTerm,
        event,
      };
      this.log.push(entry);
      this.emit("appendEntries", {
        term: this.currentTerm,
        leaderId: this.nodeId,
        entries: [entry],
      });
    }
  }

  public handleAppendEntries(request: {
    term: number;
    leaderId: string;
    entries: LogEntry[];
  }): void {
    if (request.term >= this.currentTerm) {
      this.state = "follower";
      this.currentTerm = request.term;
      this.votedFor = null;
      this.resetElectionTimeout();

      // Apply new entries
      request.entries.forEach((entry) => {
        if (
          !this.log.some(
            (e) => e.term === entry.term && e.event === entry.event,
          )
        ) {
          this.log.push(entry);
          this.emit("eventApplied", entry.event);
        }
      });
    }
  }

  public getState(): {
    nodeId: string;
    state: NodeState;
    currentTerm: number;
    log: LogEntry[];
  } {
    return {
      nodeId: this.nodeId,
      state: this.state,
      currentTerm: this.currentTerm,
      log: [...this.log],
    };
  }

  /**
   * Stop the consensus protocol
   */
  stop(): void {
    if (this.electionTimer) {
      clearTimeout(this.electionTimer);
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }
}
