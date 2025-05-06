import { ConsensusProtocol } from "../consensus/ConsensusProtocol";
import { EventEmitter } from "events";
import { VectorClock, VectorTimestamp } from "../consistency/VectorClock";
import { LWWRegister } from "../consistency/CRDT";
import { RaftConsensus, ConsensusConfig } from "../consensus/RaftConsensus";
import {
  GameEvent,
  GameAction,
  Player,
  Table,
  GameActionType,
  Game,
} from "../../types/game";
import { Vector2D } from "../../types/geometry";
import { PhysicsEngine, PhysicsObject } from "../../utils/physics";
import { AIRefereeService, RefereeInput, RefereeResult, FoulType } from '../../services/ai/AIRefereeService';

// --- Define expected consensus event structure --- 
interface ConsensusAppliedEvent {
  action: GameAction;
  nodeId: string;
  timestamp?: VectorTimestamp; // Optional vector timestamp from consensus?
}

// --- Shot Outcome Analysis ---
interface ShotCollisionInfo {
  firstObjectBallHit: number | null;
  didHitRailAfterContact: boolean;
}

export interface Pocket {
  position: { x: number; y: number };
  radius: number;
}

// --- Shot Outcome Analysis Data ---
export interface ShotAnalysisData {
  firstObjectBallHit: number | null;
  cueBallHitRail: boolean;
  objectBallHitRailAfterContact: boolean;
  isBreakShot: boolean;
  // --- Added for break foul analysis --- 
  ballsPocketedOnBreak: number[];
  numberOfBallsHittingRailOnBreak: number;
  // Internal tracking during simulation
  ballsHittingRailOnBreak?: Set<number>; 
}

export interface GameTable {
  id: string;
  name: string;
  players: Record<string, Player>;
  status: "open" | "active" | "finished";
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
  playerBallTypes: Record<string, "solids" | "stripes" | "open">;
  ballInHand: boolean;
  ballInHandFromBreakScratch: boolean; // Flag for special placement rule
}

export interface BallState extends PhysicsObject {
  number: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  pocketed: boolean;
}

interface GameStateEvents {
  "player:joined": (event: { tableId: string; player: Player }) => void;
  "player:left": (event: { tableId: string; playerId: string }) => void;
  "game:started": (event: { tableId: string; players: Player[] }) => void;
  "game:ended": (event: { tableId: string; winner?: Player }) => void; // Winner might be undefined if drawn/error
  "turn:changed": (event: { tableId: string; playerId: string }) => void;
  "state:updated": (event: { tableId: string; state: GameTable }) => void;
  error: (error: Error) => void;
}

export declare interface GameState {
  on<U extends keyof GameStateEvents>(
    event: U,
    listener: GameStateEvents[U],
  ): this;
  emit<U extends keyof GameStateEvents>(
    event: U,
    ...args: Parameters<GameStateEvents[U]>
  ): boolean;
}

// Define minimum speed constant locally
const MIN_BALL_SPEED = 0.01;

// Helper function to determine ball type
function getBallType(
  ballNumber: number,
): "solid" | "stripe" | "eight" | "cue" | "invalid" {
  if (ballNumber === 0) return "cue";
  if (ballNumber === 8) return "eight";
  if (ballNumber >= 1 && ballNumber <= 7) return "solid";
  if (ballNumber >= 9 && ballNumber <= 15) return "stripe";
  return "invalid";
}

export class GameState extends EventEmitter {
  private tables: Map<string, GameTable>;
  private consensus: RaftConsensus;
  private nodeId: string;
  private vectorClock: VectorClock;
  private physicsEngine: PhysicsEngine;
  private aiRefereeService: AIRefereeService;
  private gameLoops: Map<string, NodeJS.Timeout>;
  private state: {
    tables: Map<string, LWWRegister<Table>>;
    players: Map<string, LWWRegister<Player>>;
    currentTurn: LWWRegister<string | null>;
    gamePhase: LWWRegister<string>;
  };
  private currentShotAnalysis: Map<string, ShotAnalysisData>; // Track analysis per table
  private preShotTableState: Map<string, Partial<GameTable>>; // Store state before shot for referee

  constructor(nodeId: string, consensusConfig: ConsensusConfig) {
    super();
    this.nodeId = nodeId;
    this.consensus = new RaftConsensus(consensusConfig);
    this.vectorClock = new VectorClock(nodeId);
    this.physicsEngine = new PhysicsEngine();
    this.aiRefereeService = new AIRefereeService();
    this.tables = new Map();
    this.gameLoops = new Map();
    this.state = {
      tables: new Map(),
      players: new Map(),
      currentTurn: new LWWRegister<string | null>(null, nodeId),
      gamePhase: new LWWRegister<string>("setup", nodeId),
    };
    this.currentShotAnalysis = new Map();
    this.preShotTableState = new Map();

    this.setupConsensusListeners();
  }

  private setupConsensusListeners(): void {
    // Listener expects GameEvent, but consensus likely emits ConsensusAppliedEvent.
    // Use type assertion to handle the expected structure.
    this.consensus.on("eventApplied", (event: GameEvent) => {
      // Assert the type to the structure we expect
      const consensusEvent = event as unknown as ConsensusAppliedEvent;
      
      // Check if the assertion might have failed (basic check)
      if (!consensusEvent.action || !consensusEvent.nodeId) {
          console.error("Consensus event structure mismatch!", event);
          return;
      }

      if (consensusEvent.nodeId !== this.nodeId) {
        console.log(
          `Applying consensus event from ${consensusEvent.nodeId}: ${consensusEvent.action.type}`,
        );
        // Use the timestamp from the action itself (number)
        this.applyActionLocally(consensusEvent.action, consensusEvent.action.timestamp);
      } else {
        console.log(`Ignoring consensus event from self: ${consensusEvent.action.type}`);
      }
    });
  }

  private proposeAction(action: GameAction): void {
    if (!action.timestamp) {
      console.warn("Proposing action without a timestamp (number)!");
      action.timestamp = Date.now(); // Ensure action timestamp is a number
    }

    const eventForVectorClock: { action: GameAction, timestamp: VectorTimestamp, nodeId: string } = {
      action,
      timestamp: this.vectorClock.getCurrentTimestamp(),
      nodeId: this.nodeId,
    };

    // TODO: Submit event to Raft consensus mechanism
    console.log(
      `Proposing action: ${action.type} (needs submission to consensus)`, eventForVectorClock
    );

    // Apply locally immediately using the action's number timestamp
    this.applyActionLocally(action, action.timestamp);
  }

  private applyActionLocally(
    action: GameAction,
    actionTimestamp: number, // Changed from eventTimestamp: VectorTimestamp
  ): void {
    console.log(`Applying action locally: ${action.type} at ${actionTimestamp}`);
    let baseTableData: Table | undefined;
    let player: Player | undefined;
    let gameTable: GameTable | undefined = this.tables.get(action.tableId);
    const tableRegister = this.state.tables.get(action.tableId);

    // Reset ball-in-hand before processing MAKE_SHOT
    if (
      action.type === "MAKE_SHOT" &&
      gameTable?.ballInHand &&
      gameTable?.currentTurn === action.playerId
    ) {
      console.log(`Player ${action.playerId} consumed ball-in-hand.`);
      gameTable.ballInHand = false;
      gameTable.lastUpdatedLocally = Date.now();
    }

    switch (action.type) {
      case "CREATE_TABLE":
        if (!tableRegister) {
          baseTableData = action.data as Table;
          if (!baseTableData) {
            console.error("CREATE_TABLE action missing table data");
            return;
          }
          const newTableRegister = new LWWRegister<Table>(
            baseTableData,
            this.nodeId,
          );
          this.state.tables.set(action.tableId, newTableRegister);
          const newGameTable = this.createInitialGameTable(baseTableData);
          this.tables.set(action.tableId, newGameTable);
          gameTable = newGameTable;
          console.log(`Applied CREATE_TABLE: ${action.tableId}`);
        } else {
          console.warn(
            `Attempted to apply CREATE_TABLE for existing table: ${action.tableId}`,
          );
        }
        break;

      case "JOIN_TABLE":
        if (tableRegister && gameTable) {
          const currentTableData = tableRegister.getValue();
          const playerName = action.data?.playerName || "Unknown";
          if (!currentTableData.players.includes(action.playerId)) {
            // Create player object matching the Player type definition
            player = {
              id: action.playerId,
              name: playerName,
              score: 0,
              isActive: true,
              lastAction: actionTimestamp, // Use the number timestamp
              team: action.data?.team || 'default_team', // Add default team
              position: action.data?.position || 'default_position', // Add default position
            };
            const updatedPlayersArray = [
              ...currentTableData.players,
              action.playerId,
            ];
            const updatedBaseTableData = {
              ...currentTableData,
              players: updatedPlayersArray,
            };
            // Ensure player is defined before assigning
            if (player) {
                 tableRegister.update(updatedBaseTableData);
                 gameTable.players[action.playerId] = player; // Assign the valid Player object
                 gameTable.lastUpdatedLocally = Date.now();
                 console.log(
                   `Applied JOIN_TABLE: Player ${action.playerId} (${player.name}) to Table ${action.tableId}`
                 );
                 this.emit("player:joined", { tableId: action.tableId, player });
            } else {
                 console.error(`JOIN_TABLE: Failed to create player object for ${action.playerId}`);
            }
          } else {
            console.warn(
              `Attempted to apply JOIN_TABLE for already joined player: ${action.playerId}`,
            );
          }
        }
        break;

       case "LEAVE_TABLE":
         if (tableRegister && gameTable && action.playerId) {
           const currentTableData = tableRegister.getValue();
           if (currentTableData.players.includes(action.playerId)) {
             const updatedPlayersArray = currentTableData.players.filter(pId => pId !== action.playerId);
             const updatedBaseTableData = {
                 ...currentTableData,
                 players: updatedPlayersArray,
             };
             tableRegister.update(updatedBaseTableData);
             delete gameTable.players[action.playerId];
             gameTable.lastUpdatedLocally = Date.now();
             console.log(
                 `Applied LEAVE_TABLE: Player ${action.playerId} from ${action.tableId}`,
             );
             // TODO: Handle game ending if player leaves mid-game
             this.emit("player:left", {
                 tableId: action.tableId,
                 playerId: action.playerId
             });
           } else {
               console.warn(`Attempted LEAVE_TABLE for player ${action.playerId} not on table ${action.tableId}`);
           }
         } else {
             console.warn(`Attempted LEAVE_TABLE for invalid table or player ID: ${action.tableId}, ${action.playerId}`);
         }
         break;

      case "START_GAME":
        if (gameTable && gameTable.currentTurn === action.playerId) { // Only current player can start?
            this.startGame(action.tableId);
        } else {
            console.warn(`Player ${action.playerId} attempted START_GAME on table ${action.tableId} but conditions not met.`);
        }
        break;

      case "MAKE_SHOT":
        if (gameTable) {
          // Store relevant pre-shot state for the referee
          this.preShotTableState.set(action.tableId, {
            playerBallTypes: { ...gameTable.playerBallTypes },
            pocketedBalls: [...gameTable.pocketedBalls],
            balls: gameTable.balls.map(b => ({
              number: b.number,
              position: { ...b.position },
              pocketed: b.pocketed,
              // Add missing required properties for BallState
              velocity: { ...b.velocity },
              mass: b.mass,
              radius: b.radius,
            })),
            currentTurn: gameTable.currentTurn,
          });

          // Apply the shot impulse and start the physics loop
          this.makeShot(action.tableId, action.playerId, action.data.shot);
          console.log(
            `Applied MAKE_SHOT: Player ${action.playerId} on table ${action.tableId}`,
          );
        }
        break;

       case "PLACE_BALL":
          if (gameTable && action.playerId === gameTable.currentTurn && gameTable.ballInHand) {
              const newPosition = action.data.position as Vector2D;
              if (!newPosition) {
                  console.error(`PLACE_BALL action missing position data for table ${action.tableId}`);
                  return;
              }

              // Basic validation: Is position on the table?
              if (newPosition.x < 0 || newPosition.x > gameTable.tableWidth ||
                  newPosition.y < 0 || newPosition.y > gameTable.tableHeight) {
                  console.warn(`PLACE_BALL: Invalid position (${newPosition.x}, ${newPosition.y}) - out of bounds.`);
                  return;
              }

              // TODO: Add more specific validation (e.g., behind head string after break scratch)
              // TODO: Check for overlap with other balls?

              const cueBall = gameTable.balls.find(b => b.number === 0);
              if (!cueBall) {
                  console.error(`PLACE_BALL: Cue ball not found on table ${action.tableId}.`);
                  return;
              }

              // If cue ball was pocketed (scratch), un-pocket it.
              if (cueBall.pocketed) {
                  console.log(`PLACE_BALL: Un-pocketing cue ball for placement.`);
                  cueBall.pocketed = false;
                  const pocketedIndex = gameTable.pocketedBalls.indexOf(0);
                  if (pocketedIndex > -1) {
                      gameTable.pocketedBalls.splice(pocketedIndex, 1);
                  }
              }

              // Update cue ball position and ensure velocity is zero
              cueBall.position = newPosition;
              cueBall.velocity = { x: 0, y: 0 };

              // Consume ball-in-hand
              gameTable.ballInHand = false;
              gameTable.lastUpdatedLocally = Date.now();

              console.log(`Applied PLACE_BALL: Player ${action.playerId} placed cue ball at (${newPosition.x}, ${newPosition.y}) on table ${action.tableId}. Ball-in-hand consumed.`);

              this.emit("state:updated", { tableId: action.tableId, state: gameTable });

          } else {
               console.warn(`PLACE_BALL: Invalid conditions for player ${action.playerId} on table ${action.tableId}. Has ball-in-hand: ${gameTable?.ballInHand}`);
          }
          break;

      case "END_GAME":
          console.log(`applyActionLocally: Handling END_GAME for table ${action.tableId}`);
          // Add actual logic from endGame method or ensure it's called appropriately
          if (gameTable && !gameTable.gameEnded) {
            const winnerId = action.data?.winnerId;
            this.endGame(action.tableId, winnerId); // Call the existing method
          }
          break;

      case "CHANGE_TURN":
          console.log(`applyActionLocally: Handling CHANGE_TURN for table ${action.tableId}`);
          // Add actual logic from changeTurn method or ensure it's called appropriately
          if (gameTable && !gameTable.gameEnded) {
            const nextPlayerId = action.data?.nextPlayerId;
             const hasBallInHand = action.data?.ballInHand === true; // Check if ballInHand needs setting
             if (nextPlayerId) {
                 this.changeTurn(action.tableId, nextPlayerId);
                 // Update ballInHand status after turn change if needed
                 if (gameTable.currentTurn === nextPlayerId) { // Ensure turn actually changed
                     gameTable.ballInHand = hasBallInHand;
                 }
             } else {
                 console.warn(`CHANGE_TURN action missing nextPlayerId for table ${action.tableId}`);
             }
          }
          break;

      // Add placeholder cases for other unhandled action types
      case "STATE_UPDATE":
      case "STATE_SYNC":
      case "CONSENSUS_STATE_CHANGE":
      case "LEADER_ELECTED":
      case "ENTRY_COMMITTED":
          console.log(`applyActionLocally: Ignoring system/unhandled action type: ${action.type}`);
          break;

      default:
        console.warn(`Unhandled action type in applyActionLocally: ${action.type}`);
        // Attempt exhaustive check for unhandled cases
        try {
          const _exhaustiveCheck: never = action.type;
        } catch (e) {}
    }
  }

  private prepareRefereeInput(tableId: string): RefereeInput | null {
    const gameTable = this.tables.get(tableId);
    const preShotState = this.preShotTableState.get(tableId);
    const shotAnalysis = this.currentShotAnalysis.get(tableId);

    if (!gameTable || !preShotState || !shotAnalysis) {
      console.error(
        `Cannot prepare referee input for table ${tableId}: missing state data.`,
      );
      return null;
    }

    // Ensure required pre-shot data exists and has a player ID
    if (!preShotState.currentTurn) {
      console.error(
        `Cannot prepare referee input for table ${tableId}: missing current turn in pre-shot state.`,
      );
      return null;
    }

    // TODO: Determine actual game rules dynamically if needed
    const gameRules = "8-ball";

    const input: RefereeInput = {
      // Pass only the necessary parts of the state, not the full GameTable
      // Cast to Partial<GameTable> to satisfy the type, assuming AIRefereeService
      // knows which parts are essential (balls, player assignments, etc.)
      tableStateBeforeShot: preShotState as Partial<GameTable>,
      tableStateAfterShot: gameTable, // Pass the full current state
      shotAnalysis: shotAnalysis,
      currentPlayerId: preShotState.currentTurn,
      gameRules: gameRules, // Assuming 8-ball for now
    };

    return input;
  }

  public createTableRequest(tableId: string, tableName: string): void {
    const initialTableData: Table = {
      id: tableId,
      name: tableName,
      players: [],
      status: "open",
    };
    this.proposeAction({
      type: "CREATE_TABLE",
      playerId: "system", // Or the requesting player ID
      tableId,
      data: initialTableData,
      timestamp: Date.now(),
    });
  }

  public joinTableRequest(
    tableId: string,
    playerId: string,
    playerName: string,
    // Optionally pass team/position if known at join time
    team?: string,
    position?: string
  ): void {
    this.proposeAction({
      type: "JOIN_TABLE",
      playerId,
      tableId,
      data: { playerName, team, position }, // Pass extra data
      timestamp: Date.now(),
    });
  }

  public leaveTableRequest(tableId: string, playerId: string): void {
     this.proposeAction({
       type: "LEAVE_TABLE",
       playerId,
       tableId,
       timestamp: Date.now(),
     });
   }

  public requestStartGame(tableId: string, requestingPlayerId: string): void {
    const table = this.tables.get(tableId);
    if (!table || table.status !== "open") throw new Error("Table not available");
    // Add validation: enough players? Requesting player allowed?
    this.proposeAction({
      type: "START_GAME",
      playerId: requestingPlayerId,
      tableId,
      timestamp: Date.now(),
    });
  }

  public requestMakeShot(
    tableId: string,
    playerId: string,
    shot: { force: number; angle: number },
  ): void {
    const table = this.tables.get(tableId);
    if (!table || !table.gameStarted || table.gameEnded)
      throw new Error("Game not in progress");
    if (table.currentTurn !== playerId) throw new Error("Not your turn");
    if (table.ballInHand) {
        throw new Error("Cannot make shot: Player has ball-in-hand. Place the cue ball first.");
    }
    this.proposeAction({
      type: "MAKE_SHOT",
      playerId,
      tableId,
      data: { shot },
      timestamp: Date.now(),
    });
  }

   public requestPlaceBall(
       tableId: string,
       playerId: string,
       position: Vector2D
   ): void {
       const table = this.tables.get(tableId);
       if (!table || !table.gameStarted || table.gameEnded) {
           throw new Error("Game not active");
       }
       if (table.currentTurn !== playerId) {
           throw new Error("Not your turn to place the ball");
       }
       if (!table.ballInHand) {
           throw new Error("Cannot place ball: Player does not have ball-in-hand.");
       }
       if (position.x < 0 || position.x > table.tableWidth ||
           position.y < 0 || position.y > table.tableHeight) {
           throw new Error("Invalid placement position - out of bounds.");
       }
       // TODO: Add specific placement rules (e.g., behind headstring)

       this.proposeAction({
           type: "PLACE_BALL",
           playerId,
           tableId,
           data: { position },
           timestamp: Date.now()
       });
   }

  public requestEndGame(
    tableId: string,
    winnerId: string,
    requestingPlayerId: string,
  ): void {
    const table = this.tables.get(tableId);
    if (!table || !table.gameStarted || table.gameEnded)
      throw new Error("Game not active");
    this.proposeAction({
      type: "END_GAME",
      playerId: requestingPlayerId,
      tableId,
      data: { winnerId },
      timestamp: Date.now(),
    });
  }

  public requestChangeTurn(
    tableId: string,
    nextPlayerId: string,
    requestingPlayerId: string,
  ): void {
    const table = this.tables.get(tableId);
    if (!table || !table.gameStarted || table.gameEnded)
      throw new Error("Game not active");
    this.proposeAction({
      type: "CHANGE_TURN",
      playerId: requestingPlayerId,
      tableId,
      data: { nextPlayerId },
      timestamp: Date.now(),
    });
  }

  private createInitialBallState(
    tableWidth: number,
    tableHeight: number,
  ): BallState[] {
    const balls: BallState[] = [];
    const radius = 15; // Example radius

    // Cue ball
    balls.push({
      number: 0,
      position: { x: tableWidth * 0.25, y: tableHeight / 2 },
      velocity: { x: 0, y: 0 },
      pocketed: false,
      mass: 1,
      radius: radius
    });

    // Object balls (8-ball rack example)
    const rackPositions = [
      { x: tableWidth * 0.75, y: tableHeight / 2 }, // 1st ball
      { x: tableWidth * 0.75 + 2 * radius, y: tableHeight / 2 - radius }, // 2nd row
      { x: tableWidth * 0.75 + 2 * radius, y: tableHeight / 2 + radius },
      { x: tableWidth * 0.75 + 4 * radius, y: tableHeight / 2 - 2 * radius }, // 3rd row
      { x: tableWidth * 0.75 + 4 * radius, y: tableHeight / 2 }, // 8-ball
      { x: tableWidth * 0.75 + 4 * radius, y: tableHeight / 2 + 2 * radius },
      // ... Add remaining rows
    ];

    const ballNumbers = [1, 9, 2, 8, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15]; // Example rack order
    let currentBallIndex = 0;

    // Naive placement, needs proper triangle logic
     for (let row = 0; row < 5; row++) {
         for (let i = 0; i <= row; i++) {
             if (currentBallIndex >= ballNumbers.length) break;
             const x = tableWidth * 0.75 + row * (radius * 1.8); // Approximate x based on row
             const y = tableHeight / 2 + (i * 2 * radius) - (row * radius); // Approximate y
             balls.push({
                 number: ballNumbers[currentBallIndex],
                 position: { x: x, y: y },
                 velocity: { x: 0, y: 0 },
                 pocketed: false,
                 mass: 1,
                 radius: radius
             });
             currentBallIndex++;
         }
     }

    return balls;
  }

  private startGame(tableId: string): void {
    const gameTable = this.tables.get(tableId);
    if (!gameTable || gameTable.gameStarted) {
      console.warn(
        `Attempted startGame on invalid/already started table ${tableId}`,
      );
      return;
    }

    console.log(`Starting game on table ${tableId}`);
    gameTable.gameStarted = true;
    gameTable.gameEnded = false;
    gameTable.status = "active";
    gameTable.balls = this.createInitialBallState(gameTable.tableWidth, gameTable.tableHeight);
    gameTable.pocketedBalls = [];
    gameTable.fouls = {};
    gameTable.playerBallTypes = {}; // Reset ball types
    Object.keys(gameTable.players).forEach(pId => {
        gameTable.fouls[pId] = 0;
        gameTable.playerBallTypes[pId] = 'open'; // Start as open table
    });
    gameTable.ballInHand = false; // No ball-in-hand at start (usually)
    gameTable.ballInHandFromBreakScratch = false;
    
    // Randomly assign first turn or use a specific rule
    const playerIds = Object.keys(gameTable.players);
    gameTable.currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)];

    gameTable.lastUpdatedLocally = Date.now();
    this.emit("game:started", {
      tableId,
      players: Object.values(gameTable.players),
    });
     this.emit("turn:changed", { tableId, playerId: gameTable.currentTurn });
    this.emit("state:updated", { tableId, state: gameTable });
  }

  private makeShot(
    tableId: string,
    playerId: string,
    shot: { force: number; angle: number },
  ): void {
    const gameTable = this.tables.get(tableId);
    if (!gameTable || !gameTable.balls) {
      console.error(`makeShot Error: Invalid table or balls state for ${tableId}`);
      return;
    }
    const cueBall = gameTable.balls.find((ball) => ball.number === 0);
    if (!cueBall) {
      console.error(`makeShot Error: Cue ball not found for table ${tableId}`);
      return;
    }
     if (gameTable.currentTurn !== playerId) {
        console.warn(`makeShot: Not player ${playerId}'s turn.`);
        return;
      }
      if (gameTable.ballInHand) {
          console.error(`makeShot Error: Player ${playerId} has ball-in-hand. PLACE_BALL action required first.`);
          this.stopGameLoop(tableId);
          return;
      }
      if (gameTable.physicsActive) {
          console.warn(`makeShot Warning: Physics already active for table ${tableId}. Ignoring shot.`);
          return;
      }

     // Determine if it's the break shot
    const isBreak = gameTable.pocketedBalls.length === 0 && (!gameTable.pocketedBallsBeforeShot || gameTable.pocketedBallsBeforeShot.length === 0);
    if (isBreak) {
        console.log(`makeShot: Detected break shot on table ${tableId}.`);
    }

    // Reset shot analysis data for this table
    this.currentShotAnalysis.set(tableId, {
        firstObjectBallHit: null,
        cueBallHitRail: false,
        objectBallHitRailAfterContact: false,
        isBreakShot: isBreak,
        ballsPocketedOnBreak: [],
        numberOfBallsHittingRailOnBreak: 0,
        ballsHittingRailOnBreak: new Set<number>(),
    });
    gameTable.pocketedBallsBeforeShot = [...gameTable.pocketedBalls];

    // Apply force and angle
    const radians = (shot.angle * Math.PI) / 180;
    cueBall.velocity = {
      x: Math.cos(radians) * shot.force,
      y: Math.sin(radians) * shot.force,
    };

    console.log(
      `makeShot: Applied force ${shot.force}, angle ${shot.angle} to cue ball on table ${tableId}`,
    );

    this.startGameLoop(tableId);
  }

  private pocketBall(tableId: string, ballNumber: number): void {
    const gameTable = this.tables.get(tableId);
    if (!gameTable) return;
    const ball = gameTable.balls.find((b) => b.number === ballNumber);
    if (ball && !ball.pocketed) {
      ball.pocketed = true;
      ball.velocity = { x: 0, y: 0 }; // Stop the ball
      gameTable.pocketedBalls.push(ballNumber);
      console.log(`Ball ${ballNumber} pocketed on table ${tableId}`);
      gameTable.lastUpdatedLocally = Date.now();

      // If currently analyzing a break shot, record the pocketed ball
      const shotData = this.currentShotAnalysis.get(tableId);
      if (shotData?.isBreakShot) {
          shotData.ballsPocketedOnBreak.push(ballNumber);
      }
    }
  }

  private endGame(tableId: string, winnerId: string | null): void {
    const gameTable = this.tables.get(tableId);
    if (!gameTable || gameTable.gameEnded) return;

    console.log(`Ending game on table ${tableId}. Winner: ${winnerId || 'None'}`);
    gameTable.gameEnded = true;
    gameTable.gameStarted = false; // Mark as no longer actively started
    gameTable.status = "finished";
    gameTable.winner = winnerId;
    gameTable.currentTurn = null; // No current turn after game ends
    this.stopGameLoop(tableId); // Ensure physics stops

    gameTable.lastUpdatedLocally = Date.now();
    this.emit("game:ended", {
      tableId,
      winner: winnerId ? gameTable.players[winnerId] : undefined,
    });
    this.emit("state:updated", { tableId, state: gameTable });
  }

  private changeTurn(tableId: string, nextPlayerId: string): void {
    const gameTable = this.tables.get(tableId);
    if (!gameTable || !gameTable.players[nextPlayerId]) {
      console.error(`changeTurn: Invalid next player ID ${nextPlayerId} for table ${tableId}`);
      return;
    }
    if (gameTable.currentTurn !== nextPlayerId) {
        gameTable.currentTurn = nextPlayerId;
        gameTable.lastUpdatedLocally = Date.now();
        console.log(`Turn changed to ${nextPlayerId} on table ${tableId}`);
        this.emit("turn:changed", { tableId, playerId: nextPlayerId });
         this.emit("state:updated", { tableId, state: gameTable });
    }
  }

  // Make this method async to handle the promise from AIRefereeService
  private async analyzeShotOutcome(tableId: string): Promise<void> {
    const gameTable = this.tables.get(tableId);
    const analysisData = this.currentShotAnalysis.get(tableId);

    if (!gameTable) {
      console.error(`analyzeShotOutcome: Missing gameTable for table ${tableId}`);
      return;
    }

    console.log(`Analyzing shot outcome for table: ${tableId}`);

    // 1. Prepare input for the AI Referee
    const refereeInput = this.prepareRefereeInput(tableId);
    if (!refereeInput) {
      console.error(
        `Failed to prepare referee input for table ${tableId}. Cannot determine outcome.`,
      );
      // Fallback: Change turn, no foul, no ball-in-hand
      const currentPlayerId = gameTable.currentTurn;
      const opponentPlayerId =
        Object.keys(gameTable.players).find((id) => id !== currentPlayerId) ||
        currentPlayerId ||
        "";
      if (currentPlayerId !== opponentPlayerId) {
          this.changeTurn(tableId, opponentPlayerId);
      } else {
          console.warn(`Cannot determine opponent for table ${tableId}, turn remains.`);
      }
      this.currentShotAnalysis.delete(tableId);
      this.preShotTableState.delete(tableId);
      this.emit("state:updated", { tableId, state: gameTable });
      return;
    }

    // 2. Call the AI Referee Service
    let refereeResult: RefereeResult;
    try {
      console.log(`Calling AI Referee for table ${tableId}...`);
      refereeResult = await this.aiRefereeService.analyzeShot(refereeInput);
      console.log(`AI Referee result for table ${tableId}:`, refereeResult);
    } catch (error) {
      console.error(`Error calling AI Referee service for table ${tableId}:`, error);
      // Handle error - Award ball-in-hand and change turn as a safe default
      const opponentPlayerId =
        Object.keys(gameTable.players).find(
          (id) => id !== refereeInput.currentPlayerId,
        ) || refereeInput.currentPlayerId; // Fallback to current player if opponent not found
      refereeResult = {
        foul: null, // Indicate no specific foul, but an error occurred
        reason: `Service Error: ${error instanceof Error ? error.message : "Unknown"}`,
        isBallInHand: true,
        nextPlayerId: opponentPlayerId,
      };
    }

    // 3. Process the Referee's Decision
    gameTable.ballInHand = refereeResult.isBallInHand;

    // Apply foul (if any)
    if (refereeResult.foul) {
      console.log(
        `Foul detected: ${refereeResult.foul} - ${refereeResult.reason}`,
      );
      const currentPlayerId = refereeInput.currentPlayerId; // Use ID from input
      if (currentPlayerId) {
        gameTable.fouls[currentPlayerId] =
          (gameTable.fouls[currentPlayerId] || 0) + 1;
        // TODO: Implement specific foul consequences (e.g., 3 consecutive fouls lose game)
      }
      // If foul, ball-in-hand is typically awarded to the NEXT player (handled below)
      console.log(`Ball-in-hand awarded due to foul: ${refereeResult.isBallInHand}`);

      // Handle special case: Break foul scratch gives different placement rules
       if (refereeResult.foul === FoulType.BREAK_FOUL && refereeResult.reason?.includes('Scratch')) {
            gameTable.ballInHandFromBreakScratch = true;
            console.log("Ball in hand from break scratch set to true.");
       } else {
            gameTable.ballInHandFromBreakScratch = false;
       }

    } else {
      // No foul occurred
      gameTable.ballInHandFromBreakScratch = false; // Ensure reset if no foul
      console.log("No foul detected.");
      // Ball-in-hand state should be false if no foul and not explicitly awarded
       if (!refereeResult.isBallInHand) {
           gameTable.ballInHand = false;
       }
    }

    // TODO: Assign ball types (solids/stripes) after the break if the table is open
    // This logic might depend on pocketed balls and refereeResult.foul state
    if (
      refereeInput.shotAnalysis.isBreakShot &&
      !refereeResult.foul &&
      Object.values(gameTable.playerBallTypes).every((type) => type === "open")
    ) {
      // Determine pocketed balls during this shot
      const pocketedThisShot = gameTable.balls
        .filter(
          (b) =>
            b.pocketed &&
            !refereeInput.tableStateBeforeShot.balls?.find((pb) => pb.number === b.number)?.pocketed,
        )
        .map((b) => b.number);

        const firstLegalPocket = pocketedThisShot.find(num => {
            const type = getBallType(num);
            return type === 'solid' || type === 'stripe';
        });

        if (firstLegalPocket) {
            const pocketedType = getBallType(firstLegalPocket);
            const currentPlayerId = refereeInput.currentPlayerId;
            const opponentPlayerId = Object.keys(gameTable.players).find(id => id !== currentPlayerId) || currentPlayerId;

            if (pocketedType === 'solid') {
                gameTable.playerBallTypes[currentPlayerId] = 'solids';
                gameTable.playerBallTypes[opponentPlayerId] = 'stripes';
                console.log(`Assigned Solids to ${currentPlayerId}, Stripes to ${opponentPlayerId}`);
            } else if (pocketedType === 'stripe') {
                gameTable.playerBallTypes[currentPlayerId] = 'stripes';
                gameTable.playerBallTypes[opponentPlayerId] = 'solids';
                 console.log(`Assigned Stripes to ${currentPlayerId}, Solids to ${opponentPlayerId}`);
            }
        }
    }

    // Check for game over (e.g., 8-ball pocketed illegally or legally)
    // THIS LOGIC NEEDS REFINEMENT based on official 8-ball rules and referee output
    const eightBallPocketed = gameTable.balls.find(b => b.number === 8)?.pocketed === true;
    const wasEightBallPocketedBefore = refereeInput.tableStateBeforeShot.balls?.find(b => b.number === 8)?.pocketed === true;

    if (eightBallPocketed && !wasEightBallPocketedBefore) {
        const currentPlayerId = refereeInput.currentPlayerId;
        const playerType = gameTable.playerBallTypes[currentPlayerId];
        const opponentPlayerId = Object.keys(gameTable.players).find(id => id !== currentPlayerId) || currentPlayerId;

        // Check if player's group is cleared (excluding 8-ball)
        const legalTargets = playerType === 'solids'
            ? [1, 2, 3, 4, 5, 6, 7]
            : playerType === 'stripes'
            ? [9, 10, 11, 12, 13, 14, 15]
            : [];
        const playerGroupCleared = legalTargets.every(num => gameTable.balls.find(b => b.number === num)?.pocketed);

        let winnerId: string | null = null;
        let loserId: string | null = null;

        if (refereeResult.foul) {
            console.log(`Game Over: ${currentPlayerId} pocketed 8-ball on a foul shot. ${opponentPlayerId} wins.`);
            winnerId = opponentPlayerId;
            loserId = currentPlayerId;
        } else if (playerType !== 'open' && !playerGroupCleared) {
             console.log(`Game Over: ${currentPlayerId} pocketed 8-ball before their group was cleared. ${opponentPlayerId} wins.`);
             winnerId = opponentPlayerId;
             loserId = currentPlayerId;
        } else if (playerType !== 'open' && playerGroupCleared) {
             console.log(`Game Over: ${currentPlayerId} legally pocketed the 8-ball. ${currentPlayerId} wins.`);
             winnerId = currentPlayerId;
             loserId = opponentPlayerId;
        } else if (playerType === 'open') {
            // Pocketing 8-ball on break is usually a win (unless scratch), but rules vary.
            // Assuming simple rule: pocketing 8-ball on break without foul wins.
            if (!refereeResult.foul) {
                 console.log(`Game Over: ${currentPlayerId} pocketed the 8-ball on the break shot legally. ${currentPlayerId} wins.`);
                 winnerId = currentPlayerId;
                 loserId = opponentPlayerId;
            } else {
                // Pocketing 8-ball on break WITH a foul (e.g. scratch)
                 console.log(`Game Over: ${currentPlayerId} pocketed the 8-ball on break but committed a foul. ${opponentPlayerId} wins.`);
                 winnerId = opponentPlayerId;
                 loserId = currentPlayerId;
            }
        }

        if (winnerId) {
            this.endGame(tableId, winnerId);
            this.stopGameLoop(tableId);
            this.emit("game:ended", { tableId: tableId, winner: gameTable.players[winnerId] });
            gameTable.lastUpdatedLocally = Date.now();
            this.emit("state:updated", { tableId, state: gameTable });
            return; // Stop further processing if game ended
        }
    }

    // Determine and change turn if necessary
    // Use the playerId from the referee result
    if (gameTable.currentTurn !== refereeResult.nextPlayerId) {
      console.log(
        `Changing turn from ${gameTable.currentTurn} to ${refereeResult.nextPlayerId}`,
      );
      this.changeTurn(tableId, refereeResult.nextPlayerId);
      // Ball-in-hand applies to the player whose turn it *now* is.
      // If the turn changed TO this player, and ballInHand is true, they get it.
      if(refereeResult.isBallInHand) {
          console.log(`Ball-in-hand set for incoming player ${refereeResult.nextPlayerId}`);
          gameTable.ballInHand = true; // This is now the state for the next player
      }

    } else {
      console.log(`Player ${gameTable.currentTurn} retains the turn.`);
      // If the current player keeps the turn, ballInHand is applied directly if true.
      if (refereeResult.isBallInHand) {
        console.log(
          `Ball-in-hand awarded to current player ${gameTable.currentTurn}`,
        );
        gameTable.ballInHand = true;
      } else if (!refereeResult.foul) {
          // If player keeps turn, no foul, no explicit ball-in-hand = ball-in-hand is false
          gameTable.ballInHand = false;
      }
      // If player keeps turn AND foul occurred, ball-in-hand is handled by turn change logic (opponent gets it)
       // which shouldn't happen based on refereeResult.nextPlayerId logic, but being explicit.
    }

    // Clean up shot-specific state
    this.currentShotAnalysis.delete(tableId);
    this.preShotTableState.delete(tableId);

    // Final state update emission
    gameTable.lastUpdatedLocally = Date.now();
    console.log(
      `Shot analysis complete for table ${tableId}. Final state:`, gameTable
    );
    this.emit("state:updated", { tableId, state: gameTable });
  }

  public tick(tableId: string, deltaTime: number): void {
    const gameTable = this.tables.get(tableId);
    const shotData = this.currentShotAnalysis.get(tableId);
    if (!gameTable || !gameTable.balls || !shotData || !gameTable.physicsActive) {
      return; // Not simulating physics for this table
    }

    let anyBallMoving = false;
    const initialPositions = gameTable.balls.map(b => ({ ...b.position }));
    let cueBallContactMade = shotData.firstObjectBallHit !== null;
    let railHitOccurredThisTick = false;

    const physicsInput: PhysicsObject[] = gameTable.balls.map(b => ({
        position: b.position,
        velocity: b.velocity,
        mass: b.mass,
        radius: b.radius,
        id: b.number // Pass ball number as ID for collision tracking if needed
    }));

    const updatedPhysicsObjects = this.physicsEngine.updatePhysics(
      physicsInput,
      gameTable.tableWidth,
      gameTable.tableHeight,
      deltaTime,
    );

    gameTable.balls = gameTable.balls.map((originalBall, index) => {
        const updatedPhysics = updatedPhysicsObjects[index];
        if (!updatedPhysics) {
            console.error(`Mismatch in physics update for ball index ${index}, number ${originalBall.number}`);
            return originalBall;
        }
        return {
            ...originalBall,
            position: updatedPhysics.position,
            velocity: updatedPhysics.velocity,
        };
    });

    for (let i = 0; i < gameTable.balls.length; i++) {
      const ball = gameTable.balls[i];
      const initialPos = initialPositions[i];

      if (!ball.pocketed && this.isPocketed(ball.position, gameTable.pockets)) {
        this.pocketBall(tableId, ball.number);
        ball.velocity = { x: 0, y: 0 };
      }

      if (ball.pocketed) continue;

      const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
      if (speed >= MIN_BALL_SPEED) {
        anyBallMoving = true;
      }

      if (ball.number === 0 && !cueBallContactMade) {
          for (let j = 0; j < gameTable.balls.length; j++) {
              if (i === j || gameTable.balls[j].number === 0 || gameTable.balls[j].pocketed) continue;
              const objBall = gameTable.balls[j];
              const collision = this.physicsEngine.detectCollision(ball, objBall);
              if (collision.collided) {
                  shotData.firstObjectBallHit = objBall.number;
                  cueBallContactMade = true;
                  break;
              }
          }
      }

      const pos = ball.position;
      const radius = ball.radius;
      let hitRail = false;
      if (pos.x - radius < 0 || pos.x + radius > gameTable.tableWidth ||
          pos.y - radius < 0 || pos.y + radius > gameTable.tableHeight)
      {
            hitRail = true;
            railHitOccurredThisTick = true;
      }

      if (hitRail) {
          if (ball.number === 0) {
              shotData.cueBallHitRail = true;
          } else if (cueBallContactMade) {
              shotData.objectBallHitRailAfterContact = true;
          }
          
          if (shotData.isBreakShot && ball.number !== 0) {
               shotData.ballsHittingRailOnBreak?.add(ball.number);
          }
      }
    }

    gameTable.lastUpdatedLocally = Date.now();
    this.emit("state:updated", { tableId, state: gameTable });

    if (!anyBallMoving) {
      console.log(`Tick: All balls stopped on table ${tableId}.`);
      this.stopGameLoop(tableId);
      
      if (shotData.isBreakShot && shotData.ballsHittingRailOnBreak) {
          shotData.numberOfBallsHittingRailOnBreak = shotData.ballsHittingRailOnBreak.size;
          console.log(`Break shot rail count: ${shotData.numberOfBallsHittingRailOnBreak}`);
          delete shotData.ballsHittingRailOnBreak;
      }

      // analyzeShotOutcome is now async, but tick is synchronous.
      // We need to handle the promise here. Fire-and-forget for now, but
      // consider implications (e.g., state updates might appear slightly delayed).
      this.analyzeShotOutcome(tableId).catch(error => {
          console.error(`Error during async analyzeShotOutcome for table ${tableId}:`, error);
          // Decide how to handle errors - stop game? Log? Emit error event?
          this.stopGameLoop(tableId); // Example: Stop loop on analysis error
      });
    }
  }

  private startGameLoop(tableId: string, intervalMs = 16): void {
    if (this.gameLoops.has(tableId)) return;
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000; // Delta time in seconds
      lastTime = now;

      try {
         this.tick(tableId, deltaTime);
      } catch (error) {
          console.error(`Error during game loop tick for table ${tableId}:`, error);
          this.stopGameLoop(tableId); // Stop loop on error
      }
    };

    const intervalId = setInterval(loop, intervalMs);
    this.gameLoops.set(tableId, intervalId);
    const gameTable = this.tables.get(tableId);
    if(gameTable) gameTable.physicsActive = true;
    console.log(`Game loop started for table ${tableId}`);
  }

  private stopGameLoop(tableId: string): void {
    if (this.gameLoops.has(tableId)) {
      clearInterval(this.gameLoops.get(tableId)!);
      this.gameLoops.delete(tableId);
       const gameTable = this.tables.get(tableId);
       if(gameTable) gameTable.physicsActive = false;
      console.log(`Game loop stopped for table ${tableId}`);
    }
  }

  public mergeState(remoteStateData: any): void {
    console.warn(
      "GameState.mergeState: Basic merge logic - potential for conflicts!",
    );
    // Example basic merge: Overwrite local state if remote is newer (based on simple timestamp)
    // This needs proper CRDT merging or vector clock comparison for robust consistency.
    /* LWWRegister likely doesn't have getTimestamp(), comment out for now
    if (
      remoteStateData.timestamp &&
      (!this.state.gamePhase.getTimestamp() || // Error: Property 'getTimestamp' does not exist on type 'LWWRegister<string>'.
        remoteStateData.timestamp > this.state.gamePhase.getTimestamp()) // Error: Property 'getTimestamp' does not exist on type 'LWWRegister<string>'.
    ) {
      // TODO: Implement proper merging logic using CRDTs or vector clocks
      // For now, this is a placeholder and likely incorrect for real distributed use.
      console.log("Merging remote state based on timestamp (basic)");
      // this.state = remoteStateData; // Don't just overwrite!
    }
    */
  }

  public getState(): any {
    // Return a serializable snapshot of the current state
    // This should include CRDT values and vector clock for proper merging
    return {
      tables: Object.fromEntries(this.tables.entries()),
      // Add other relevant state parts (players, game phase, etc.)
    };
  }

  private isPocketed(
    ballPosition: { x: number; y: number },
    pockets: Pocket[],
  ): boolean {
    for (const pocket of pockets) {
      const dx = ballPosition.x - pocket.position.x;
      const dy = ballPosition.y - pocket.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < pocket.radius) {
        return true;
      }
    }
    return false;
  }

  // Add back the missing helper method
  private createInitialGameTable(baseTableData: Table): GameTable {
    const tableWidth = 2.24; // Example standard dimensions
    const tableHeight = 1.12;
    const cornerPocketRadius = 0.06;
    const sidePocketRadius = 0.055;
    const pockets: Pocket[] = [
      { position: { x: 0, y: 0 }, radius: cornerPocketRadius },
      { position: { x: tableWidth / 2, y: 0 }, radius: sidePocketRadius },
      { position: { x: tableWidth, y: 0 }, radius: cornerPocketRadius },
      { position: { x: 0, y: tableHeight }, radius: cornerPocketRadius },
      {
        position: { x: tableWidth / 2, y: tableHeight },
        radius: sidePocketRadius,
      },
      {
        position: { x: tableWidth, y: tableHeight },
        radius: cornerPocketRadius,
      },
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
      balls: [], // Initial balls added in startGame
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
      ballInHandFromBreakScratch: false,
    };
  }
}
