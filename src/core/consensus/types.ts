import { VectorTimestamp } from "../../types/consistency";

export enum ConsensusState {
  FOLLOWER = "FOLLOWER",
  CANDIDATE = "CANDIDATE",
  LEADER = "LEADER",
}

export enum NodeRole {
  FOLLOWER = "FOLLOWER",
  CANDIDATE = "CANDIDATE",
  LEADER = "LEADER",
}

export interface LogEntry {
  term: number;
  payload: any;
}

export interface ConsensusConfig {
  nodeId: string;
  nodes: string[];
  electionTimeout: number;
  heartbeatInterval: number;
}

export interface AppendEntriesRequest {
  term: number;
  leaderId: string;
  prevLogIndex: number;
  prevLogTerm: number;
  entries: LogEntry[];
  leaderCommit: number;
}

export interface AppendEntriesResponse {
  term: number;
  success: boolean;
}

export interface RequestVoteRequest {
  term: number;
  candidateId: string;
  lastLogIndex: number;
  lastLogTerm: number;
}

export interface RequestVoteResponse {
  term: number;
  voteGranted: boolean;
}

export interface GameEvent {
  type: string;
  data: any;
}
