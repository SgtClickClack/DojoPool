import { ConsensusProtocol } from '../consensus/ConsensusProtocol';
import { EventEmitter } from 'events';
import { VectorClock, VectorTimestamp } from '../consistency/VectorClock';
import { LWWRegister } from '../consistency/CRDT';
import { RaftConsensus, ConsensusConfig } from '../consensus/RaftConsensus';
import { GameEvent, GameAction, Player, Table, GameActionType, Game } from '../../types/game';
import { PhysicsEngine, PhysicsObject } from '../../utils/physics';

interface Pocket {
    position: { x: number; y: number };
    radius: number;
}

export interface GameTable {
  id: string;
  name: string;
  players: Record<string, Player>;
  status: 'open' | 'active' | 'finished';
  currentGame?: Game;
  currentTurn: string | null;
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  balls: BallState[];
  pocketedBalls: number[];
  fouls: Record<string, number>;
  tableWidth: number;
  tableHeight: number;
  pockets: Pocket[];
  physicsActive?: boolean;
  lastUpdatedLocally: number;
  pocketedBallsBeforeShot: number[];
  playerBallTypes: Record<string, 'solids' | 'stripes' | 'open'>;
  ballInHand: boolean;
}

export interface BallState extends PhysicsObject {
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

// Define minimum speed constant locally
const MIN_BALL_SPEED = 0.01;

// Helper function to determine ball type
function getBallType(ballNumber: number): 'solid' | 'stripe' | 'eight' | 'cue' | 'invalid' {
    if (ballNumber === 0) return 'cue';
    if (ballNumber === 8) return 'eight';
    if (ballNumber >= 1 && ballNumber <= 7) return 'solid';
    if (ballNumber >= 9 && ballNumber <= 15) return 'stripe';
    return 'invalid';
}

export class GameState extends EventEmitter {
  private tables: Map<string, GameTable>;
  private consensus: RaftConsensus;
  private nodeId: string;
  private vectorClock: VectorClock;
  private physicsEngine: PhysicsEngine;
  private gameLoops: Map<string, NodeJS.Timeout>;
  private state: {
    tables: Map<string, LWWRegister<Table>>;
    players: Map<string, LWWRegister<Player>>;
    currentTurn: LWWRegister<string | null>;
    gamePhase: LWWRegister<string>;
  };

  constructor(nodeId: string, consensusConfig: ConsensusConfig) {
    super();
    this.nodeId = nodeId;
    this.consensus = new RaftConsensus(consensusConfig);
    this.vectorClock = new VectorClock(nodeId);
    this.physicsEngine = new PhysicsEngine();
    this.tables = new Map();
    this.gameLoops = new Map();
    this.state = {
      tables: new Map(),
      players: new Map(),
      currentTurn: new LWWRegister<string | null>(null, nodeId),
      gamePhase: new LWWRegister<string>('setup', nodeId)
    };

    this.setupConsensusListeners();
  }

  private setupConsensusListeners(): void {
    this.consensus.on('eventApplied', (event: GameEvent) => {
      if (event.nodeId !== this.nodeId) {
           console.log(`Applying consensus event from ${event.nodeId}: ${event.action.type}`);
           this.applyActionLocally(event.action, event.timestamp);
      } else {
           console.log(`Ignoring consensus event from self: ${event.action.type}`);
      }
    });
  }

  private proposeAction(action: GameAction): void {
    if (!action.timestamp) {
        console.warn("Proposing action without a timestamp!");
        action.timestamp = Date.now();
    }

    const event: GameEvent = {
      action,
      timestamp: this.vectorClock.getCurrentTimestamp(),
      nodeId: this.nodeId
    };

    console.log(`Proposing action: ${action.type} (needs submission to consensus)`);

    this.applyActionLocally(action, event.timestamp);
  }

  private applyActionLocally(action: GameAction, eventTimestamp: VectorTimestamp): void {
    console.log(`Applying action locally: ${action.type}`);
    let baseTableData: Table | undefined;
    let player: Player | undefined;
    const actionTimestamp = action.timestamp;
    let gameTable: GameTable | undefined = this.tables.get(action.tableId);
    const tableRegister = this.state.tables.get(action.tableId);

    // Reset ball-in-hand if the current player is making a shot (consuming ball-in-hand)
    if (action.type === 'MAKE_SHOT' && gameTable?.ballInHand && gameTable?.currentTurn === action.playerId) {
        console.log(`Player ${action.playerId} consumed ball-in-hand.`);
        gameTable.ballInHand = false;
        gameTable.lastUpdatedLocally = Date.now();
    }

    // Use string literals for action types
    switch (action.type) {
      case 'CREATE_TABLE':
        if (!tableRegister) {
          baseTableData = action.data as Table;
          if (!baseTableData) {
              console.error('CREATE_TABLE action missing table data');
              return;
          }
          const newTableRegister = new LWWRegister<Table>(baseTableData, this.nodeId);
          this.state.tables.set(action.tableId, newTableRegister);
          
          const newGameTable = this.createInitialGameTable(baseTableData);
          this.tables.set(action.tableId, newGameTable);
          gameTable = newGameTable;
          console.log(`Applied CREATE_TABLE: ${action.tableId}`);
        } else {
             console.warn(`Attempted to apply CREATE_TABLE for existing table: ${action.tableId}`);
        }
        break;
      case 'JOIN_TABLE':
        if (tableRegister && gameTable) { 
          const currentTableData = tableRegister.getValue();
          const playerName = action.data?.playerName || 'Unknown';
          if (!currentTableData.players.includes(action.playerId)) {
              player = {
                  id: action.playerId,
                  name: playerName,
                  score: 0,
                  isActive: true,
                  lastAction: actionTimestamp
              };
              const updatedPlayersArray = [...currentTableData.players, action.playerId];
              const updatedBaseTableData = { ...currentTableData, players: updatedPlayersArray };
              tableRegister.update(updatedBaseTableData);
              
              gameTable.players[action.playerId] = player;
              gameTable.lastUpdatedLocally = Date.now();

              console.log(`Applied JOIN_TABLE: Player ${action.playerId} to Table ${action.tableId}`);
              this.emit('player:joined', { tableId: action.tableId, player });
          } else {
               console.warn(`Player ${action.playerId} already joined table ${action.tableId}`);
          }
        } else {
            console.error(`JOIN_TABLE failed: Table register or local cache not found for ${action.tableId}`);
        }
        break;
      case 'START_GAME':
          if (tableRegister && gameTable && !gameTable.gameStarted) {
              this.state.gamePhase.update('active'); 
              const currentBaseTable = tableRegister.getValue();
              tableRegister.update({ ...currentBaseTable, status: 'active' });

              this.startGame(action.tableId);
              console.log(`Applied START_GAME: ${action.tableId}`);
          } else {
              console.warn(`Could not apply START_GAME for table ${action.tableId}. Exists: ${!!tableRegister}, ${!!gameTable}. Started: ${gameTable?.gameStarted}`);
          }
          break;
      case 'MAKE_SHOT':
         if (gameTable) {
             gameTable.pocketedBallsBeforeShot = [...gameTable.pocketedBalls]; 
             this.makeShot(action.tableId, action.playerId, action.data.shot);
             console.log(`Applied MAKE_SHOT: Player ${action.playerId} on Table ${action.tableId}`);
         } else {
             console.error(`MAKE_SHOT failed: Local cache not found for ${action.tableId}`);
         }
        break;
       case 'LEAVE_TABLE':
            if (tableRegister && gameTable) {
                const currentBase = tableRegister.getValue();
                const updatedPlayers = currentBase.players.filter(pId => pId !== action.playerId);
                if (updatedPlayers.length < currentBase.players.length) {
                    tableRegister.update({ ...currentBase, players: updatedPlayers });
                    delete gameTable.players[action.playerId];
                    gameTable.lastUpdatedLocally = Date.now();
                    console.log(`Applied LEAVE_TABLE: Player ${action.playerId} from ${action.tableId}`);
                    this.emit('player:left', { tableId: action.tableId, playerId: action.playerId });
                } else {
                    console.warn(`Attempted LEAVE_TABLE for player ${action.playerId} not at table ${action.tableId}`);
                }
            } else {
                 console.error(`LEAVE_TABLE failed: Table register or local cache not found for ${action.tableId}`);
            }
            break;
       case 'END_GAME':
            if (tableRegister && gameTable && !gameTable.gameEnded) {
                const winnerId = action.data?.winnerId;
                const currentBase = tableRegister.getValue();
                tableRegister.update({ ...currentBase, status: 'finished' });
                this.endGame(action.tableId, winnerId);
                console.log(`Applied END_GAME for table ${action.tableId}`);
            } else {
                console.warn(`Could not apply END_GAME for table ${action.tableId}. Exists: ${!!tableRegister}, ${!!gameTable}. Ended: ${gameTable?.gameEnded}`);
            }
            break;
       case 'CHANGE_TURN' as GameActionType: 
            if (tableRegister && gameTable && !gameTable.gameEnded) {
                const nextPlayerId = action.data?.nextPlayerId;
                const hasBallInHand = action.data?.ballInHand === true;
                
                this.changeTurn(action.tableId, nextPlayerId);
                
                // Update ball-in-hand status for the *next* player
                if (gameTable) { // Check gameTable again as changeTurn might modify it
                    gameTable.ballInHand = hasBallInHand;
                    gameTable.lastUpdatedLocally = Date.now();
                    if (hasBallInHand) {
                        console.log(`Applied CHANGE_TURN for table ${action.tableId}, next player ${nextPlayerId} HAS ball-in-hand.`);
                    } else {
                        console.log(`Applied CHANGE_TURN for table ${action.tableId}, next player ${nextPlayerId} does NOT have ball-in-hand.`);
                    }
                }
            } else {
                 console.warn(`Could not apply CHANGE_TURN for table ${action.tableId}. Exists: ${!!tableRegister}, ${!!gameTable}. Ended: ${gameTable?.gameEnded}`);
            }
            break;
       case 'STATE_UPDATE':
       case 'STATE_SYNC':
       case 'CONSENSUS_STATE_CHANGE':
       case 'LEADER_ELECTED':
       case 'ENTRY_COMMITTED':
            // Ignore these internal/system actions for now in this game state logic
            console.log(`Ignoring system action type: ${action.type}`);
            break;
      default:
        console.error(`Received unknown or unhandled action type: ${action.type}`);
        // Attempt exhaustive check
        const _exhaustiveCheck: never = action.type;
    }
    
    if (gameTable) {
        this.emit('state:updated', { tableId: action.tableId, state: gameTable });
    }
  }

  public createTableRequest(tableId: string, tableName: string): void {
      const initialTableData: Table = { 
          id: tableId,
          name: tableName,
          players: [],
          status: 'open',
      };
      this.proposeAction({ 
          type: 'CREATE_TABLE',
          tableId: tableId, 
          playerId: 'system',
          data: initialTableData, 
          timestamp: Date.now() 
      });
  }

  public joinTableRequest(tableId: string, playerId: string, playerName: string): void {
      this.proposeAction({ 
          type: 'JOIN_TABLE',
          tableId, 
          playerId, 
          data: { playerName }, 
          timestamp: Date.now() 
      });
  }

  public leaveTableRequest(tableId: string, playerId: string): void {
      this.proposeAction({ 
          type: 'LEAVE_TABLE',
          tableId, 
          playerId, 
          timestamp: Date.now() 
      });
  }

  private startGame(tableId: string): void {
    const table = this.tables.get(tableId);
    if (!table) {
        console.error(`startGame called for non-existent table: ${tableId}`);
        return;
    }
    if (Object.keys(table.players).length !== 2) {
      console.error('Need exactly 2 players to start game locally');
      return;
    }
    if (table.gameStarted) {
        console.warn('Game already started locally');
        return;
    }

    table.gameStarted = true;
    table.status = 'active';
    table.currentTurn = Object.keys(table.players)[0];
    table.balls = this.createInitialBallState(table.tableWidth, table.tableHeight);
    table.pocketedBalls = [];
    table.pocketedBallsBeforeShot = [];
    table.fouls = {};
    table.playerBallTypes = {};
    Object.keys(table.players).forEach(playerId => {
        table.playerBallTypes[playerId] = 'open';
    });
    table.ballInHand = false;
    table.lastUpdatedLocally = Date.now();
    
    this.state.currentTurn.update(table.currentTurn);
    this.state.gamePhase.update('active');

    this.startGameLoop(tableId);
    console.log(`Game loop started for table ${tableId}`);
    this.emit('game:started', { 
      tableId, 
      players: Object.values(table.players)
    });
  }

  public requestStartGame(tableId: string, requestingPlayerId: string): void {
      const table = this.tables.get(tableId);
      if (!table) throw new Error(`Table ${tableId} not found`);
      if (Object.keys(table.players).length !== 2) throw new Error('Need exactly 2 players');
      if (table.gameStarted) throw new Error('Game already started');
      this.proposeAction({ 
          type: 'START_GAME',
          tableId, 
          playerId: requestingPlayerId,
          timestamp: Date.now() 
        });
  }

  private makeShot(tableId: string, playerId: string, shot: { force: number; angle: number }): void {
    const table = this.tables.get(tableId);
    if (!table) return;
    if (!table.gameStarted || table.gameEnded) return;
    if (table.currentTurn !== playerId) return;

    const cueBall = table.balls.find(b => b.number === 0);
    if (!cueBall) return;

    const force = Math.min(shot.force, 10);
    const angle = shot.angle;
    cueBall.velocity = { x: force * Math.cos(angle), y: force * Math.sin(angle) };
    table.lastUpdatedLocally = Date.now();
  }

  public requestMakeShot(tableId: string, playerId: string, shot: { force: number; angle: number }): void {
      const table = this.tables.get(tableId);
      if (!table) throw new Error(`Table ${tableId} not found`);
      if (!table.gameStarted || table.gameEnded) throw new Error('Game not in progress');
      if (table.currentTurn !== playerId) throw new Error('Not your turn');
      this.proposeAction({ 
          type: 'MAKE_SHOT',
          tableId, 
          playerId, 
          data: { shot }, 
          timestamp: Date.now() 
      });
  }

  private pocketBall(tableId: string, ballNumber: number): void {
    const table = this.tables.get(tableId);
    if (!table || !table.balls) return;
    const ball = table.balls.find(b => b.number === ballNumber);
    if (ball && !ball.pocketed) {
      console.log(`Pocketing ball ${ballNumber} on table ${tableId}`);
      ball.pocketed = true;
      ball.velocity = { x: 0, y: 0 };
      if (!table.pocketedBalls.includes(ballNumber)) {
         table.pocketedBalls.push(ballNumber);
      }
      table.lastUpdatedLocally = Date.now();
    }
  }

  private endGame(tableId: string, winnerId: string): void {
    const table = this.tables.get(tableId);
    if (!table) return;
    if (table.gameEnded) return;

    console.log(`Ending game ${tableId}, winner: ${winnerId}`);
    this.stopGameLoop(tableId);
    table.gameEnded = true;
    table.status = 'finished';
    table.lastUpdatedLocally = Date.now();
    this.state.gamePhase.update('finished'); 
    
    const winnerPlayer = table.players[winnerId];
    this.emit('game:ended', { tableId, winner: winnerPlayer });
  }

  public requestEndGame(tableId: string, winnerId: string, requestingPlayerId: string): void {
      this.proposeAction({ 
          type: 'END_GAME',
          tableId, 
          playerId: requestingPlayerId, 
          data: { winnerId }, 
          timestamp: Date.now() 
      });
  }

  private changeTurn(tableId: string, nextPlayerId: string): void {
    const table = this.tables.get(tableId);
    if (!table || table.gameEnded) return;
    if (!table.players[nextPlayerId]) { 
        console.error(`Attempted to change turn to invalid player ${nextPlayerId} on table ${tableId}`);
        return;
    }
    console.log(`Changing turn on table ${tableId} to ${nextPlayerId}`);
    table.currentTurn = nextPlayerId;
    table.lastUpdatedLocally = Date.now();
    this.state.currentTurn.update(nextPlayerId);
    this.emit('turn:changed', { tableId, playerId: table.currentTurn! });
  }

  public requestChangeTurn(tableId: string, nextPlayerId: string, requestingPlayerId: string): void {
      // TODO: Add validation
      this.proposeAction({ 
          type: 'CHANGE_TURN' as GameActionType, 
          tableId, 
          playerId: requestingPlayerId,
          data: { nextPlayerId }, 
          timestamp: Date.now() 
        });
  }

  public mergeState(remoteStateData: any): void {
      console.warn("Merge state called - Deserialization and merge logic for LWWRegister needs verification");
      if (remoteStateData.vectorClock) {
          this.vectorClock.merge(remoteStateData.vectorClock);
      }
      if (remoteStateData.state && remoteStateData.state.tables) {
          Object.entries(remoteStateData.state.tables).forEach(([tableId, remoteRegisterData]) => {
              try {
                  console.error("LWWRegister deserialization logic missing in mergeState");
              } catch (error) {
                  console.error(`Failed to merge table state for ${tableId}:`, error);
              }
          });
      }
  }

  public getState(): any { 
    const tablesCRDTState = Object.fromEntries(this.state.tables.entries());
    const playersCRDTState = Object.fromEntries(this.state.players.entries());

    const tablesLocalState = Object.fromEntries(this.tables.entries());

    return {
      crdt: {
           tables: tablesCRDTState,
           players: playersCRDTState,
           currentTurn: this.state.currentTurn,
           gamePhase: this.state.gamePhase,
      },
      local: tablesLocalState,
      vectorClockTimestamp: this.vectorClock.getCurrentTimestamp()
    };
  }

  public tick(tableId: string, deltaTime: number): void {
    const table = this.tables.get(tableId);
    if (!table || !table.gameStarted || table.gameEnded || !table.balls) {
      return;
    }

    const activeBalls = table.balls.filter(ball => !ball.pocketed);
    if (activeBalls.length === 0) {
        if (table.physicsActive) {
            console.log(`No active balls left, stopping physics for table ${tableId}`);
            table.physicsActive = false;
            this.analyzeShotOutcome(tableId);
        }
        return;
    }

    const areBallsMoving = activeBalls.some(b => Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2) > MIN_BALL_SPEED);
    
    if (!areBallsMoving) {
        if (table.physicsActive) { 
             console.log(`Physics simulation ended for table ${tableId}`);
             table.physicsActive = false;
             this.analyzeShotOutcome(tableId);
        }
        return; 
    }

    table.physicsActive = true; 
    
    const physicsObjects: PhysicsObject[] = activeBalls.map(ball => ({
        position: ball.position,
        velocity: ball.velocity,
        mass: ball.mass,
        radius: ball.radius,
        _originalNumber: ball.number 
    }));

    const updatedPhysicsObjects = this.physicsEngine.updatePhysics(
      physicsObjects,
      table.tableWidth,
      table.tableHeight,
      deltaTime
    );

    updatedPhysicsObjects.forEach(updatedObj => {
        const originalBall = activeBalls.find(b => b.number === (updatedObj as any)._originalNumber);
        if (originalBall) {
            originalBall.position = updatedObj.position;
            originalBall.velocity = updatedObj.velocity;

            if (this.isPocketed(originalBall.position, table.pockets)) { 
               this.pocketBall(tableId, originalBall.number);
            }
        }
    });

    table.lastUpdatedLocally = Date.now();
    this.emit('state:updated', { tableId, state: table });
  }

  private startGameLoop(tableId: string, intervalMs = 16 /* ~60 FPS */): void {
    if (this.gameLoops.has(tableId)) return;

    let lastTime = Date.now();
    const intervalId = setInterval(() => {
      const table = this.tables.get(tableId);
      if (!table || table.gameEnded) { 
          this.stopGameLoop(tableId);
          return;
      }

      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      try {
         this.tick(tableId, Math.min(deltaTime, 0.1));
      } catch (error) {
         const typedError = error instanceof Error ? error : new Error(String(error));
         console.error(`Error during game tick for table ${tableId}:`, typedError);
         this.emit('error', new Error(`Tick error for table ${tableId}: ${typedError.message}`));
         this.stopGameLoop(tableId);
      }
      lastTime = now;
    }, intervalMs);

    this.gameLoops.set(tableId, intervalId);
  }

  private stopGameLoop(tableId: string): void {
    const intervalId = this.gameLoops.get(tableId);
    if (intervalId) {
      clearInterval(intervalId);
      this.gameLoops.delete(tableId);
    }
  }

  private createInitialBallState(tableWidth: number, tableHeight: number): BallState[] {
    const balls: BallState[] = [];
    const radius = 0.0285; // Standard ball radius in meters (approx 2.25 inches / 2)
    const diameter = radius * 2;
    const sqrt3 = Math.sqrt(3);

    // --- Cue Ball --- 
    // Place cue ball on head spot (center of head string)
    const headSpotX = tableWidth / 2;
    const headSpotY = tableHeight * 0.25; // Head string at 1/4 table height from head rail
    balls.push({
      number: 0, // Cue ball
      position: { x: headSpotX, y: headSpotY },
      velocity: { x: 0, y: 0 },
      mass: 0.17, // Slightly heavier
      radius: radius,
      pocketed: false
    });

    // --- Racked Balls (1-15) --- 
    // Foot spot position (center of foot string)
    const footSpotX = tableWidth / 2;
    const footSpotY = tableHeight * 0.75; // Foot string at 3/4 table height from head rail

    // Ball numbers in a standard 8-ball rack order (example, solids/stripes vary)
    // Row 1 (Apex)
    // Row 2
    // Row 3 (8-ball middle)
    // Row 4
    // Row 5 (Corners: one solid, one stripe)
    // We need a defined order to place them. Let's use a common one:
    const rackOrder = [
      1, // Apex
      2, 3, // Row 2
      4, 8, 5, // Row 3
      6, 7, 9, 10, // Row 4
      11, 12, 13, 14, 15 // Row 5 (e.g., 11=solid, 15=stripe in corners)
    ];

    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
      const ballsInRow = row + 1;
      const startX = footSpotX - (row * diameter) / 2;
      const y = footSpotY + row * (diameter * sqrt3 / 2);

      for (let i = 0; i < ballsInRow; i++) {
        const ballNumber = rackOrder[ballIndex];
        if (ballNumber === undefined) continue; // Should not happen with correct rackOrder length

        balls.push({
          number: ballNumber,
          position: { x: startX + i * diameter, y: y },
          velocity: { x: 0, y: 0 },
          mass: 0.16, // Standard ball mass
          radius: radius,
          pocketed: false
        });
        ballIndex++;
      }
    }

    // Ensure we have 16 balls total
    if (balls.length !== 16) {
        console.error(`createInitialBallState generated ${balls.length} balls instead of 16!`);
        // Fallback to random or error state?
    }

    return balls;
  }

  private createInitialGameTable(baseTableData: Table): GameTable {
    const tableWidth = 2.24;
    const tableHeight = 1.12;
    const cornerPocketRadius = 0.06;
    const sidePocketRadius = 0.055;

    const pockets: Pocket[] = [
        { position: { x: 0, y: 0 }, radius: cornerPocketRadius },
        { position: { x: tableWidth / 2, y: 0 }, radius: sidePocketRadius },
        { position: { x: tableWidth, y: 0 }, radius: cornerPocketRadius },
        { position: { x: 0, y: tableHeight }, radius: cornerPocketRadius },
        { position: { x: tableWidth / 2, y: tableHeight }, radius: sidePocketRadius },
        { position: { x: tableWidth, y: tableHeight }, radius: cornerPocketRadius }
    ];

    return {
        id: baseTableData.id,
        name: baseTableData.name,
        players: {},
        status: baseTableData.status,
        currentGame: baseTableData.currentGame,
        currentTurn: null,
        gameStarted: false,
        gameEnded: false,
        winner: null,
        balls: [],
        pocketedBalls: [],
        fouls: {},
        tableWidth: tableWidth,
        tableHeight: tableHeight,
        pockets: pockets,
        physicsActive: false,
        lastUpdatedLocally: Date.now(),
        pocketedBallsBeforeShot: [],
        playerBallTypes: {},
        ballInHand: false,
    };
  }

  private isPocketed(ballPosition: { x: number; y: number }, pockets: Pocket[]): boolean {
    for (const pocket of pockets) {
        const dx = ballPosition.x - pocket.position.x;
        const dy = ballPosition.y - pocket.position.y;
        if (dx * dx + dy * dy <= pocket.radius * pocket.radius) {
            return true;
        }
    }
    return false;
  }

  private analyzeShotOutcome(tableId: string): void {
    const table = this.tables.get(tableId);
    if (!table || !table.currentTurn || !table.players[table.currentTurn]) {
        console.error(`Cannot analyze outcome: Invalid table or player state for ${tableId}`);
        return;
    }
    const currentPlayerId = table.currentTurn;
    const opponentPlayerId = Object.keys(table.players).find(id => id !== currentPlayerId);
    if (!opponentPlayerId) {
        console.error(`Cannot find opponent player for outcome analysis: ${tableId}`);
        return;
    }

    // 1. Identify newly pocketed balls
    const newlyPocketed = table.pocketedBalls.filter(
        num => !table.pocketedBallsBeforeShot.includes(num)
    );
    console.log(`Newly pocketed balls: [${newlyPocketed.join(', ')}] by ${currentPlayerId}`);

    // 2. Check Fouls (Basic: Scratch)
    const didScratch = newlyPocketed.includes(0);
    let isFoul = didScratch;
    // TODO: Add other foul checks (hitting opponent first, no rail, etc.)
    if (didScratch) {
        console.log(`Player ${currentPlayerId} scratched! Foul.`);
        // TODO: Implement ball-in-hand & cue ball recovery
    }

    // 3. Assign Ball Types if Table is Open
    let currentPlayerBallType = table.playerBallTypes[currentPlayerId];
    let ballTypeAssignedThisTurn = false;
    if (currentPlayerBallType === 'open' && !isFoul) {
        const firstLegalPot = newlyPocketed.find(num => getBallType(num) === 'solid' || getBallType(num) === 'stripe');
        if (firstLegalPot) {
            const potType = getBallType(firstLegalPot);
            if (potType === 'solid') {
                table.playerBallTypes[currentPlayerId] = 'solids';
                table.playerBallTypes[opponentPlayerId] = 'stripes';
                currentPlayerBallType = 'solids'; // Update local variable for subsequent checks
                ballTypeAssignedThisTurn = true;
                console.log(`Ball types assigned: ${currentPlayerId}=solids, ${opponentPlayerId}=stripes`);
            } else if (potType === 'stripe') {
                table.playerBallTypes[currentPlayerId] = 'stripes';
                table.playerBallTypes[opponentPlayerId] = 'solids';
                currentPlayerBallType = 'stripes'; // Update local variable
                ballTypeAssignedThisTurn = true;
                console.log(`Ball types assigned: ${currentPlayerId}=stripes, ${opponentPlayerId}=solids`);
            }
            // TODO: Persist playerBallTypes change via CRDT/Action if necessary
            table.lastUpdatedLocally = Date.now();
        }
    }

    // 4. Check Legality & Win/Loss Conditions
    let pocketedOwnBall = false;
    let pocketedOpponentBall = false;
    let pocketedEightBall = false;

    // Re-check player type after potential assignment
    const playerType = table.playerBallTypes[currentPlayerId]; 

    for (const ballNum of newlyPocketed) {
        const type = getBallType(ballNum);
        if (type === 'eight') {
            pocketedEightBall = true;
        } else if (type === 'solid' || type === 'stripe') {
            if (playerType !== 'open') {
                if ((playerType === 'solids' && type === 'solid') || (playerType === 'stripes' && type === 'stripe')) {
                    pocketedOwnBall = true;
                } else {
                    pocketedOpponentBall = true;
                }
            } else {
                // Table is open, type determined by firstLegalPot this turn
                // Any solid/stripe pocketed counts for potentially continuing turn (if break)
                pocketedOwnBall = true; // Treat any non-8 non-cue pot as 'own' on open table for turn logic
            }
        }
    }

    // Determine if player has cleared their group (needed for legal 8-ball pot)
    let playerGroupCleared = false;
    if (playerType !== 'open') {
        const targetBalls = playerType === 'solids' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
        playerGroupCleared = targetBalls.every(num => table.pocketedBalls.includes(num));
        if (playerGroupCleared) {
           console.log(`Player ${currentPlayerId} has cleared their group (${playerType})`);
        }
    }

    // 5. Check Win/Loss based on 8-ball
    let gameShouldEnd = false;
    let winnerId: string | null = null;

    if (pocketedEightBall) {
        if (isFoul) {
            console.log(`Loss Condition: ${currentPlayerId} pocketed 8-ball with a foul.`);
            gameShouldEnd = true;
            winnerId = opponentPlayerId;
        } else if (!playerGroupCleared && playerType !== 'open') {
            console.log(`Loss Condition: ${currentPlayerId} pocketed 8-ball too early.`);
            gameShouldEnd = true;
            winnerId = opponentPlayerId;
        } else {
            console.log(`Win Condition: ${currentPlayerId} legally pocketed 8-ball.`);
            gameShouldEnd = true;
            winnerId = currentPlayerId;
        }
    }

    // 6. Determine Next Action
    let nextActionType: GameActionType | null = null;
    let actionData: any = {};
    let givesBallInHand = false;

    if (gameShouldEnd) {
        nextActionType = 'END_GAME';
        actionData = { winnerId };
    } else if (isFoul) {
        nextActionType = 'CHANGE_TURN' as GameActionType;
        givesBallInHand = true;
        actionData = { nextPlayerId: opponentPlayerId, ballInHand: givesBallInHand }; 
        console.log(`Foul detected. Ball-in-hand for ${opponentPlayerId}`);
    } else if (pocketedOwnBall) {
        console.log(`Player ${currentPlayerId} continues turn.`);
        nextActionType = null; // Player continues turn
    } else {
        console.log(`Player ${currentPlayerId} turn ends (no legal pot).`);
        nextActionType = 'CHANGE_TURN' as GameActionType;
        givesBallInHand = false;
        actionData = { nextPlayerId: opponentPlayerId, ballInHand: givesBallInHand };
    }

    // 7. Propose the determined action
    if (nextActionType) {
        console.log(`Proposing action after outcome analysis: ${nextActionType}`);
        if (nextActionType === 'END_GAME' && winnerId) {
           actionData = { winnerId };
        }
        // Ensure ballInHand data is included if set
        if (nextActionType === 'CHANGE_TURN') {
            actionData = { nextPlayerId: opponentPlayerId, ballInHand: givesBallInHand };
        }

        this.proposeAction({ 
            type: nextActionType,
            tableId,
            playerId: currentPlayerId, 
            data: actionData,
            timestamp: Date.now()
        });
    } else {
        console.log(`No state-changing action proposed after outcome analysis (player continues turn).`);
    }

    // Clear the pre-shot state for the next turn
    table.pocketedBallsBeforeShot = []; 
  }
}