export type GameActionType = 
  | 'CREATE_TABLE'
  | 'JOIN_TABLE'
  | 'LEAVE_TABLE'
  | 'START_GAME'
  | 'MAKE_SHOT'
  | 'END_GAME'
  | 'CHANGE_TURN'
  | 'STATE_UPDATE'
  | 'STATE_SYNC'
  | 'CONSENSUS_STATE_CHANGE'
  | 'LEADER_ELECTED'
  | 'ENTRY_COMMITTED';

export interface GameAction {
  // ... rest of the file ...
} 