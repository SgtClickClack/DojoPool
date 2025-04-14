import { StateReplicator } from '../replication/StateReplicator';
import { ConsensusProtocol } from '../consensus/ConsensusProtocol';
import { EventEmitter } from 'events';
import { VectorClock } from '../consistency/VectorClock';
import { LWWRegister } from '../consistency/CRDT';
import { RaftConsensus } from '../consensus/RaftConsensus';
import { GameEvent, GameAction, Player, Table } from '../../types/game';

export interface GameTable {
  id: string;
  players: Record<string, Player>;
  currentTurn: string | null;
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  balls: BallState[];
  pocketedBalls: number[];
  fouls: Record<string, number>;
  timestamp: number;
}

export interface BallState {
  number: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  pocketed: boolean;
}

interface GameStateEvents {
  'player:joined': (event: { tableId: string; player: Player }) => void;
  'player:left': (event: { tableId: string; playerId: string }) => void;
  'game:started': (event: { tableId: string; players: Player[] }) => void;
  'game:ended': (event: { tableId: string; winner: Player }) => void;
  'turn:changed': (event: { tableId: string; playerId: string }) => void;
  'state:updated': (event: { tableId: string; state: GameTable }) => void;
  'error': (error: Error) => void;
}

export declare interface GameState {
  on<U extends keyof GameStateEvents>(
    event: U, listener: GameStateEvents[U]
  ): this;
  emit<U extends keyof GameStateEvents>(
    event: U, ...args: Parameters<GameStateEvents[U]>
  ): boolean;
}

export class GameState extends EventEmitter {
  private tables: Map<string, GameTable>;
  private replicator: StateReplicator;
  private consensus: RaftConsensus;
  private nodeId: string;
  private vectorClock: VectorClock;
  private state: {
    tables: Map<string, LWWRegister<Table>>;
    players: Map<string, LWWRegister<Player>>;
    currentTurn: LWWRegister<string>;
    gamePhase: LWWRegister<string>;
  };

  constructor(nodeId: string, consensusConfig: ConsensusConfig) {
    super();
    this.nodeId = nodeId;
    this.replicator = new StateReplicator();
    this.consensus = new RaftConsensus(consensusConfig);
    this.vectorClock = new VectorClock(nodeId);
    this.tables = new Map();
    this.state = {
      tables: new Map(),
      players: new Map(),
      currentTurn: new LWWRegister<string>('', nodeId),
      gamePhase: new LWWRegister<string>('setup', nodeId)
    };

    this.setupReplicationListeners();
  }

  private setupReplicationListeners(): void {
    this.replicator.on('state:updated', ({ state }) => {
      if (state.tables) {
        Object.entries(state.tables).forEach(([tableId, table]) => {
          this.tables.set(tableId, table as GameTable);
          this.emit('state:updated', { tableId, state: table as GameTable });
        });
      }
    });
  }

  public createTable(tableId: string): void {
    const table: GameTable = {
      id: tableId,
      players: {},
      currentTurn: null,
      gameStarted: false,
      gameEnded: false,
      winner: null,
      balls: this.createInitialBallState(),
      pocketedBalls: [],
      fouls: {},
      timestamp: Date.now()
    };

    this.tables.set(tableId, table);
    this.replicateState();
  }

  private createInitialBallState(): BallState[] {
    // Initial positions for 8-ball pool
    return Array.from({ length: 16 }, (_, i) => ({
      number: i,
      position: { x: 0, y: 0 }, // These would be set based on rack position
      velocity: { x: 0, y: 0 },
      pocketed: false
    }));
  }

  public joinTable(tableId: string, playerId: string, playerName: string): void {
    const table = this.tables.get(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    if (table.gameStarted) {
      throw new Error('Cannot join a game in progress');
    }

    if (Object.keys(table.players).length >= 2) {
      throw new Error('Table is full');
    }

    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isActive: false,
      lastAction: Date.now()
    };

    table.players[playerId] = player;
    this.replicateState();

    this.emit('player:joined', { tableId, player });
  }

  public leaveTable(tableId: string, playerId: string): void {
    const table = this.tables.get(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    if (!table.players[playerId]) {
      throw new Error(`Player ${playerId} not found at table ${tableId}`);
    }

    delete table.players[playerId];
    
    if (table.currentTurn === playerId) {
      this.endGame(tableId, Object.keys(table.players)[0]);
    }

    this.replicateState();
    this.emit('player:left', { tableId, playerId });
  }

  public startGame(tableId: string): void {
    const table = this.tables.get(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    if (Object.keys(table.players).length !== 2) {
      throw new Error('Need exactly 2 players to start the game');
    }

    if (table.gameStarted) {
      throw new Error('Game already in progress');
    }

    table.gameStarted = true;
    table.currentTurn = Object.keys(table.players)[0];
    table.timestamp = Date.now();

    this.replicateState();
    this.emit('game:started', { 
      tableId, 
      players: Object.values(table.players)
    });
  }

  public makeShot(tableId: string, playerId: string, shot: { force: number; angle: number }): void {
    const table = this.tables.get(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    if (!table.gameStarted || table.gameEnded) {
      throw new Error('Game not in progress');
    }

    if (table.currentTurn !== playerId) {
      throw new Error('Not your turn');
    }

    // Apply shot physics (simplified for now)
    const cueBall = table.balls[0];
    const force = Math.min(shot.force, 100);
    const angle = shot.angle % (2 * Math.PI);
    
    cueBall.velocity = {
      x: force * Math.cos(angle),
      y: force * Math.sin(angle)
    };

    table.timestamp = Date.now();
    this.replicateState();
  }

  public updateBallPositions(tableId: string, positions: { number: number; position: { x: number; y: number } }[]): void {
    const table = this.tables.get(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    positions.forEach(({ number, position }) => {
      const ball = table.balls.find(b => b.number === number);
      if (ball) {
        ball.position = position;
      }
    });

    table.timestamp = Date.now();
    this.replicateState();
  }

  public pocketBall(tableId: string, ballNumber: number): void {
    const table = this.tables.get(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    const ball = table.balls.find(b => b.number === ballNumber);
    if (ball) {
      ball.pocketed = true;
      table.pocketedBalls.push(ballNumber);

      // Check for game end (8-ball pocketed)
      if (ballNumber === 8) {
        this.endGame(tableId, table.currentTurn!);
      }
    }

    table.timestamp = Date.now();
    this.replicateState();
  }

  public endGame(tableId: string, winnerId: string): void {
    const table = this.tables.get(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    table.gameEnded = true;
    table.winner = winnerId;
    table.timestamp = Date.now();

    const winner = table.players[winnerId];
    if (winner) {
      winner.score += 1;
    }

    this.replicateState();
    this.emit('game:ended', { tableId, winner: winner! });
  }

  public changeTurn(tableId: string): void {
    const table = this.tables.get(tableId);
    if (!table) {
      throw new Error(`Table ${tableId} not found`);
    }

    const players = Object.keys(table.players);
    const currentIndex = players.indexOf(table.currentTurn!);
    table.currentTurn = players[(currentIndex + 1) % players.length];
    table.timestamp = Date.now();

    this.replicateState();
    this.emit('turn:changed', { tableId, playerId: table.currentTurn });
  }

  private replicateState(): void {
    const state = {
      tables: Object.fromEntries(this.tables.entries())
    };
    this.consensus.proposeValue(state);
  }

  public getTable(tableId: string): GameTable | undefined {
    return this.tables.get(tableId);
  }

  public getAllTables(): GameTable[] {
    return Array.from(this.tables.values());
  }

  public getActivePlayers(tableId: string): Player[] {
    const table = this.tables.get(tableId);
    if (!table) {
      return [];
    }
    return Object.values(table.players).filter(p => p.isActive);
  }

  public applyAction(action: GameAction): void {
    this.vectorClock.increment();
    const timestamp = this.vectorClock.getCurrentTimestamp();

    switch (action.type) {
      case 'CREATE_TABLE':
        this.state.tables.set(
          action.tableId,
          new LWWRegister<Table>(action.table, this.vectorClock.getNodeId())
        );
        break;
      case 'JOIN_TABLE':
        const table = this.state.tables.get(action.tableId);
        if (table) {
          const updatedTable = { ...table.getValue() };
          updatedTable.players.push(action.playerId);
          table.update(updatedTable);
        }
        break;
      case 'MAKE_SHOT':
        // Shot actions will be handled by physics engine
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    this.broadcastStateUpdate(action, timestamp);
  }

  private broadcastStateUpdate(action: GameAction, timestamp: VectorTimestamp): void {
    const event: GameEvent = {
      action,
      timestamp,
      nodeId: this.vectorClock.getNodeId()
    };
    this.consensus.broadcastEvent(event);
  }

  public mergeState(remoteState: GameState): void {
    this.vectorClock.merge(remoteState.vectorClock);
    
    // Merge tables
    remoteState.state.tables.forEach((remoteTable, tableId) => {
      const localTable = this.state.tables.get(tableId);
      if (localTable) {
        localTable.merge(remoteTable);
      } else {
        this.state.tables.set(tableId, remoteTable);
      }
    });

    // Merge players
    remoteState.state.players.forEach((remotePlayer, playerId) => {
      const localPlayer = this.state.players.get(playerId);
      if (localPlayer) {
        localPlayer.merge(remotePlayer);
      } else {
        this.state.players.set(playerId, remotePlayer);
      }
    });

    // Merge current turn and game phase
    this.state.currentTurn.merge(remoteState.state.currentTurn);
    this.state.gamePhase.merge(remoteState.state.gamePhase);
  }

  public getState(): GameState {
    return {
      tables: Array.from(this.state.tables.entries()).map(([id, table]) => ({
        id,
        ...table.getValue()
      })),
      players: Array.from(this.state.players.entries()).map(([id, player]) => ({
        id,
        ...player.getValue()
      })),
      currentTurn: this.state.currentTurn.getValue(),
      gamePhase: this.state.gamePhase.getValue(),
      timestamp: this.vectorClock.getCurrentTimestamp()
    };
  }
} 