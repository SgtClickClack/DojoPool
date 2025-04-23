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

// --- Shot Outcome Analysis ---
interface ShotCollisionInfo {
  firstObjectBallHit: number | null;
  didHitRailAfterContact: boolean;
}

interface Pocket {
  position: { x: number; y: number };
  radius: number;
}

// --- Shot Outcome Analysis Data ---
interface ShotAnalysisData {
  firstObjectBallHit: number | null;
  cueBallHitRail: boolean;
  objectBallHitRailAfterContact: boolean;
  isBreakShot: boolean; // Flag for the first shot
  // Add more fields as needed, e.g., ballsPocketedDuringShot: number[];
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
  private gameLoops: Map<string, NodeJS.Timeout>;
  private state: {
    tables: Map<string, LWWRegister<Table>>;
    players: Map<string, LWWRegister<Player>>;
    currentTurn: LWWRegister<string | null>;
    gamePhase: LWWRegister<string>;
  };
  private currentShotAnalysis: Map<string, ShotAnalysisData>; // Track analysis per table

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
      gamePhase: new LWWRegister<string>("setup", nodeId),
    };
    this.currentShotAnalysis = new Map();

    this.setupConsensusListeners();
  }

  private setupConsensusListeners(): void {
    this.consensus.on("eventApplied", (event: GameEvent) => {
      if (event.nodeId !== this.nodeId) {
        console.log(
          `Applying consensus event from ${event.nodeId}: ${event.action.type}`,
        );
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
      nodeId: this.nodeId,
    };

    // TODO: Submit 'event' to Raft consensus mechanism
    console.log(
      `Proposing action: ${action.type} (needs submission to consensus)`,
    );

    // Apply locally immediately
    this.applyActionLocally(action, event.timestamp);
  }

  private applyActionLocally(
    action: GameAction,
    eventTimestamp: VectorTimestamp,
  ): void {
    console.log(`Applying action locally: ${action.type}`);
    let baseTableData: Table | undefined;
    let player: Player | undefined;
    const actionTimestamp = action.timestamp;
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
            player = {
              id: action.playerId,
              name: playerName,
              score: 0,
              isActive: true,
              lastAction: actionTimestamp,
            };
            const updatedPlayersArray = [
              ...currentTableData.players,
              action.playerId,
            ];
            const updatedBaseTableData = {
              ...currentTableData,
              players: updatedPlayersArray,
            };
            tableRegister.update(updatedBaseTableData);
            gameTable.players[action.playerId] = player;
            gameTable.lastUpdatedLocally = Date.now();
            console.log(
              `Applied JOIN_TABLE: Player ${action.playerId} to Table ${action.tableId}`,
            );
            this.emit("player:joined", { tableId: action.tableId, player });
          } else {
            console.warn(
              `Player ${action.playerId} already joined table ${action.tableId}`,
            );
          }
        } else {
          console.error(
            `JOIN_TABLE failed: Table register or local cache not found for ${action.tableId}`,
          );
        }
        break;

      case "START_GAME":
        if (tableRegister && gameTable && !gameTable.gameStarted) {
          this.state.gamePhase.update("active");
          const currentBaseTable = tableRegister.getValue();
          tableRegister.update({ ...currentBaseTable, status: "active" });
          this.startGame(action.tableId);
          console.log(`Applied START_GAME: ${action.tableId}`);
        } else {
          console.warn(
            `Could not apply START_GAME for table ${action.tableId}. Exists: ${!!tableRegister}, ${!!gameTable}. Started: ${gameTable?.gameStarted}`,
          );
        }
        break;

      case "MAKE_SHOT":
        if (gameTable) {
          // Record pre-shot state before applying velocity
          gameTable.pocketedBallsBeforeShot = [...gameTable.pocketedBalls];
          this.makeShot(action.tableId, action.playerId, action.data.shot);
          console.log(
            `Applied MAKE_SHOT: Player ${action.playerId} on Table ${action.tableId}`,
          );
        } else {
          console.error(
            `MAKE_SHOT failed: Local cache not found for ${action.tableId}`,
          );
        }
        break;

      case "PLACE_BALL":
        if (gameTable && tableRegister) {
            if (gameTable.currentTurn !== action.playerId) {
                console.warn(`PLACE_BALL: Player ${action.playerId} attempted to place ball, but it's ${gameTable.currentTurn}'s turn.`);
                return;
            }
            if (!gameTable.ballInHand) {
                console.warn(`PLACE_BALL: Player ${action.playerId} attempted to place ball, but does not have ball-in-hand.`);
                return;
            }
            const newPosition = action.data?.position as Vector2D | undefined;
            if (!newPosition) {
                console.error(`PLACE_BALL: Action missing position data.`);
                return;
            }

            // Basic validation: Is position on the table?
            if (newPosition.x < 0 || newPosition.x > gameTable.tableWidth ||
                newPosition.y < 0 || newPosition.y > gameTable.tableHeight) {
                console.warn(`PLACE_BALL: Invalid position (${newPosition.x}, ${newPosition.y}) - out of bounds.`);
                // Potentially revert or ask for re-placement? For now, just reject.
                return;
            }

            // TODO: Add more specific validation (e.g., behind head string after break scratch)
            // TODO: Check for overlap with other balls?

            const cueBall = gameTable.balls.find(b => b.number === 0);
            if (!cueBall) {
                console.error(`PLACE_BALL: Cue ball not found on table ${action.tableId}.`);
                return; // Should not happen in normal play
            }

            // If cue ball was pocketed (scratch), un-pocket it.
            if (cueBall.pocketed) {
                console.log(`PLACE_BALL: Un-pocketing cue ball for placement.`);
                cueBall.pocketed = false;
                // Remove from pocketedBalls list if it's there
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

            // Emit state update after placement
            this.emit("state:updated", { tableId: action.tableId, state: gameTable });

        } else {
          console.error(
            `PLACE_BALL failed: Table register or local cache not found for ${action.tableId}`,
          );
        }
        break;

      case "LEAVE_TABLE":
        if (tableRegister && gameTable) {
          const currentBase = tableRegister.getValue();
          const updatedPlayers = currentBase.players.filter(
            (pId) => pId !== action.playerId,
          );
          if (updatedPlayers.length < currentBase.players.length) {
            tableRegister.update({ ...currentBase, players: updatedPlayers });
            delete gameTable.players[action.playerId];
            gameTable.lastUpdatedLocally = Date.now();
            console.log(
              `Applied LEAVE_TABLE: Player ${action.playerId} from ${action.tableId}`,
            );
            // TODO: Handle game ending if player leaves mid-game
            this.emit("player:left", {
              tableId: action.tableId,
              playerId: action.playerId,
            });
          } else {
            console.warn(
              `Attempted LEAVE_TABLE for player ${action.playerId} not at table ${action.tableId}`,
            );
          }
        } else {
          console.error(
            `LEAVE_TABLE failed: Table register or local cache not found for ${action.tableId}`,
          );
        }
        break;

      case "END_GAME":
        if (tableRegister && gameTable && !gameTable.gameEnded) {
          const winnerId = action.data?.winnerId;
          const currentBase = tableRegister.getValue();
          tableRegister.update({ ...currentBase, status: "finished" });
          this.endGame(action.tableId, winnerId);
          console.log(`Applied END_GAME for table ${action.tableId}`);
        } else {
          console.warn(
            `Could not apply END_GAME for table ${action.tableId}. Exists: ${!!tableRegister}, ${!!gameTable}. Ended: ${gameTable?.gameEnded}`,
          );
        }
        break;

      case "CHANGE_TURN":
        if (tableRegister && gameTable && !gameTable.gameEnded) {
          const nextPlayerId = action.data?.nextPlayerId;
          const hasBallInHand = action.data?.ballInHand === true;
          this.changeTurn(action.tableId, nextPlayerId);
          if (gameTable) {
            // Update ballInHand on the potentially modified table
            gameTable.ballInHand = hasBallInHand;
            gameTable.lastUpdatedLocally = Date.now();
            console.log(
              `Applied CHANGE_TURN for table ${action.tableId}, next player ${nextPlayerId} ballInHand: ${hasBallInHand}.`,
            );
          }
        } else {
          console.warn(
            `Could not apply CHANGE_TURN for table ${action.tableId}. Exists: ${!!tableRegister}, ${!!gameTable}. Ended: ${gameTable?.gameEnded}`,
          );
        }
        break;

      case "STATE_UPDATE":
      case "STATE_SYNC":
      case "CONSENSUS_STATE_CHANGE":
      case "LEADER_ELECTED":
      case "ENTRY_COMMITTED":
        console.log(`Ignoring system action type: ${action.type}`);
        break;

      default:
        console.error(
          `Received unknown or unhandled action type: ${action.type}`,
        );
        try {
          const _exhaustiveCheck: never = action.type;
        } catch (e) {} // Attempt exhaustive check
    }

    if (gameTable) {
      this.emit("state:updated", { tableId: action.tableId, state: gameTable });
    }
  }

  // --- Public Request Methods ---
  public createTableRequest(tableId: string, tableName: string): void {
    const initialTableData: Table = {
      id: tableId,
      name: tableName,
      players: [],
      status: "open",
    };
    this.proposeAction({
      type: "CREATE_TABLE",
      tableId: tableId,
      playerId: "system",
      data: initialTableData,
      timestamp: Date.now(),
    });
  }

  public joinTableRequest(
    tableId: string,
    playerId: string,
    playerName: string,
  ): void {
    this.proposeAction({
      type: "JOIN_TABLE",
      tableId,
      playerId,
      data: { playerName },
      timestamp: Date.now(),
    });
  }

  public leaveTableRequest(tableId: string, playerId: string): void {
    this.proposeAction({
      type: "LEAVE_TABLE",
      tableId,
      playerId,
      timestamp: Date.now(),
    });
  }

  public requestStartGame(tableId: string, requestingPlayerId: string): void {
    const table = this.tables.get(tableId);
    if (!table) throw new Error(`Table ${tableId} not found`);
    if (Object.keys(table.players).length !== 2)
      throw new Error("Need exactly 2 players");
    if (table.gameStarted) throw new Error("Game already started");
    this.proposeAction({
      type: "START_GAME",
      tableId,
      playerId: requestingPlayerId,
      timestamp: Date.now(),
    });
  }

  public requestMakeShot(
    tableId: string,
    playerId: string,
    shot: { force: number; angle: number },
  ): void {
    const table = this.tables.get(tableId);
    if (!table) throw new Error(`Table ${tableId} not found`);
    if (!table.gameStarted || table.gameEnded)
      throw new Error("Game not in progress");
    if (table.currentTurn !== playerId) throw new Error("Not your turn");
    // Add check for ball-in-hand
    if (table.ballInHand) {
        throw new Error("Cannot make shot: Player has ball-in-hand. Place the cue ball first.");
    }
    // Check ball-in-hand condition before proposing
    // TODO: If ballInHand is true, potentially require a separate PLACE_BALL action first
    this.proposeAction({
      type: "MAKE_SHOT",
      tableId,
      playerId,
      data: { shot },
      timestamp: Date.now(),
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
    // TODO: More validation
    this.proposeAction({
      type: "END_GAME",
      tableId,
      playerId: requestingPlayerId,
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
    // TODO: More validation (is requestingPlayerId allowed to do this?)
    this.proposeAction({
      type: "CHANGE_TURN",
      tableId,
      playerId: requestingPlayerId,
      data: { nextPlayerId },
      timestamp: Date.now(),
    });
  }

  public requestPlaceBall(
      tableId: string,
      playerId: string,
      position: Vector2D
  ): void {
      const table = this.tables.get(tableId);
      if (!table) throw new Error(`Table ${tableId} not found`);
      if (!table.gameStarted || table.gameEnded)
          throw new Error("Game not in progress");
      if (table.currentTurn !== playerId) throw new Error("Not your turn");
      if (!table.ballInHand) {
          throw new Error("Cannot place ball: Player does not have ball-in-hand.");
      }
      // Basic position validation (can add more specific rules later)
      if (position.x < 0 || position.x > table.tableWidth ||
          position.y < 0 || position.y > table.tableHeight) {
          throw new Error("Invalid position: Out of table bounds.");
      }

      this.proposeAction({
          type: "PLACE_BALL",
          tableId,
          playerId,
          data: { position },
          timestamp: Date.now(),
      });
  }

  // --- Private Helper Methods ---
  private createInitialBallState(
    tableWidth: number,
    tableHeight: number,
  ): BallState[] {
    const balls: BallState[] = [];
    const radius = 0.0285;
    const diameter = radius * 2;
    const sqrt3 = Math.sqrt(3);
    const headSpotX = tableWidth / 2;
    const headSpotY = tableHeight * 0.25;
    balls.push({
      number: 0,
      position: { x: headSpotX, y: headSpotY },
      velocity: { x: 0, y: 0 },
      mass: 0.17,
      radius: radius,
      pocketed: false,
    });

    const footSpotX = tableWidth / 2;
    const footSpotY = tableHeight * 0.75;
    const rackOrder = [1, 2, 3, 4, 8, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
    let ballIndex = 0;
    for (let row = 0; row < 5; row++) {
      const ballsInRow = row + 1;
      const startX = footSpotX - (row * diameter) / 2;
      const y = footSpotY + row * ((diameter * sqrt3) / 2);
      for (let i = 0; i < ballsInRow; i++) {
        const ballNumber = rackOrder[ballIndex];
        if (ballNumber === undefined) continue;
        balls.push({
          number: ballNumber,
          position: { x: startX + i * diameter, y: y },
          velocity: { x: 0, y: 0 },
          mass: 0.16,
          radius: radius,
          pocketed: false,
        });
        ballIndex++;
      }
    }
    if (balls.length !== 16) {
      console.error(`Generated ${balls.length} balls!`);
    }
    return balls;
  }

  private startGame(tableId: string): void {
    const table = this.tables.get(tableId);
    if (!table) {
      console.error(`startGame: Table ${tableId} not found`);
      return;
    }
    if (Object.keys(table.players).length !== 2) {
      console.error("Need 2 players");
      return;
    }
    if (table.gameStarted) {
      console.warn("Game already started");
      return;
    }

    table.gameStarted = true;
    table.status = "active";
    table.currentTurn = Object.keys(table.players)[0];
    table.balls = this.createInitialBallState(
      table.tableWidth,
      table.tableHeight,
    );
    table.pocketedBalls = [];
    table.pocketedBallsBeforeShot = [];
    table.fouls = {};
    table.playerBallTypes = {};
    Object.keys(table.players).forEach((playerId) => {
      table.playerBallTypes[playerId] = "open";
    });
    table.ballInHand = false;
    table.ballInHandFromBreakScratch = false;
    table.lastUpdatedLocally = Date.now();

    this.state.currentTurn.update(table.currentTurn);
    this.state.gamePhase.update("active");

    this.startGameLoop(tableId);
    console.log(`Game loop started for table ${tableId}`);
    this.emit("game:started", {
      tableId,
      players: Object.values(table.players),
    });
  }

  private makeShot(
    tableId: string,
    playerId: string,
    shot: { force: number; angle: number },
  ): void {
    const gameTable = this.tables.get(tableId);
    if (!gameTable || !gameTable.currentGame) {
      console.error(`makeShot: Table ${tableId} or game not found.`);
      return;
    }
    if (gameTable.currentTurn !== playerId) {
      console.warn(`makeShot: Not player ${playerId}'s turn.`);
      return; // Or handle as error/foul?
    }
    // Add check for ball-in-hand here as well for internal consistency
    if (gameTable.ballInHand) {
        console.error(`makeShot Error: Player ${playerId} has ball-in-hand. PLACE_BALL action required first.`);
        // Stop the physics simulation if it was somehow started
        this.stopGameLoop(tableId);
        return; // Prevent shot execution
    }
    if (gameTable.physicsActive) {
      console.warn(`makeShot: Physics already active on table ${tableId}.`);
      return;
    }

    const cueBall = gameTable.balls.find((b) => b.number === 0);
    if (!cueBall) {
      console.error(`makeShot: Cue ball not found on table ${tableId}.`);
      return;
    }

    // Determine if it's the break shot
    // Simple check: is it the very first shot after the game started?
    // Assumes pocketedBalls is empty only before the break.
    // A more robust method might involve turn count or a dedicated game phase.
    const isBreak = gameTable.pocketedBalls.length === 0 && gameTable.pocketedBallsBeforeShot.length === 0;
    if (isBreak) {
        console.log(`makeShot: Detected break shot on table ${tableId}.`);
    }

    // Reset shot analysis data for this table
    this.currentShotAnalysis.set(tableId, {
        firstObjectBallHit: null,
        cueBallHitRail: false,
        objectBallHitRailAfterContact: false,
        isBreakShot: isBreak,
    });
    // Ensure pocketedBallsBeforeShot is set *before* applying velocity
    // Moved this up from analyzeShotOutcome originally, ensure it's set correctly here.
    gameTable.pocketedBallsBeforeShot = [...gameTable.pocketedBalls];

    // Apply force and angle
    const radians = (shot.angle * Math.PI) / 180;
    cueBall.velocity = {
      x: shot.force * Math.cos(radians),
      y: shot.force * Math.sin(radians),
    };

    console.log(
      `makeShot: Applied shot for player ${playerId} on table ${tableId}. Force: ${shot.force}, Angle: ${shot.angle}`,
    );

    // Start physics simulation loop
    this.startGameLoop(tableId);
  }

  private pocketBall(tableId: string, ballNumber: number): void {
    const table = this.tables.get(tableId);
    if (!table || !table.balls) return;
    const ball = table.balls.find((b) => b.number === ballNumber);
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

  private endGame(tableId: string, winnerId: string | null): void {
    const table = this.tables.get(tableId);
    if (!table) return;
    if (table.gameEnded) return;

    console.log(`Ending game ${tableId}, winner: ${winnerId}`);
    this.stopGameLoop(tableId);
    table.gameEnded = true;
    table.winner = winnerId;
    table.status = "finished";
    table.lastUpdatedLocally = Date.now();
    this.state.gamePhase.update("finished");

    const winnerPlayer = winnerId ? table.players[winnerId] : undefined;
    this.emit("game:ended", { tableId, winner: winnerPlayer });
  }

  private changeTurn(tableId: string, nextPlayerId: string): void {
    const table = this.tables.get(tableId);
    if (!table || table.gameEnded) return;
    if (!table.players[nextPlayerId]) {
      console.error(
        `ChangeTurn: Invalid player ${nextPlayerId} for table ${tableId}`,
      );
      return;
    }
    console.log(`Changing turn on table ${tableId} to ${nextPlayerId}`);
    table.currentTurn = nextPlayerId;
    table.lastUpdatedLocally = Date.now();
    this.state.currentTurn.update(nextPlayerId);
    this.emit("turn:changed", { tableId, playerId: table.currentTurn! });
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
      ballInHandFromBreakScratch: false,
    };
  }

  // --- Shot Outcome Analysis ---
  private analyzeShotOutcome(tableId: string): void {
    const table = this.tables.get(tableId);
    // Retrieve the shot analysis data collected during the tick loop
    const shotData = this.currentShotAnalysis.get(tableId);

    // --- Pre-checks ---
    if (!table || !table.currentTurn || !table.players[table.currentTurn] || !shotData) {
      console.error(
        `AnalyzeOutcome: Invalid table/player/shotData state for ${tableId}`,
      );
      // Clear analysis data even on error?
      this.currentShotAnalysis.delete(tableId);
      return;
    }
    const currentPlayerId = table.currentTurn;
    const opponentPlayerId = Object.keys(table.players).find(
      (id) => id !== currentPlayerId,
    );
    if (!opponentPlayerId) {
      console.error(
        `AnalyzeOutcome: Cannot find opponent player for ${tableId}`,
      );
      this.currentShotAnalysis.delete(tableId);
      return;
    }

    // --- Identify Newly Pocketed Balls ---
    const newlyPocketed = table.pocketedBalls.filter(
      (num) => !table.pocketedBallsBeforeShot.includes(num),
    );
    console.log(
      `AnalyzeOutcome: Newly pocketed balls: [${newlyPocketed.join(", ")}] by ${currentPlayerId}`,
    );
    console.log(`AnalyzeOutcome: Shot Analysis Data:`, shotData);

    // --- Determine Player/Opponent Types ---
    let currentPlayerBallType = table.playerBallTypes[currentPlayerId];
    const opponentBallType = table.playerBallTypes[opponentPlayerId];
    let ballTypeAssignedThisTurn = false;

    // --- Foul Checks --- Initial foul state
    let isFoul = false;
    let foulReason = "";
    let givesBallInHand = false; // Flag to indicate if foul grants ball-in-hand
    let breakScratchOccurred = false; // Track specifically if a scratch happened on the break

    // 1. Scratch
    if (newlyPocketed.includes(0)) {
      isFoul = true;
      foulReason = "Cue ball scratch";
      givesBallInHand = true;
      if (shotData.isBreakShot) {
          breakScratchOccurred = true;
          console.log("AnalyzeOutcome: Scratch occurred on the break shot.");
      }
    }

    // 2. No Contact
    // If the cue ball didn't hit *any* object ball (and wasn't a scratch)
    if (!isFoul && shotData.firstObjectBallHit === null && !newlyPocketed.includes(0)) {
        isFoul = true;
        foulReason = "No object ball contacted";
        givesBallInHand = true;
    }

    // --- Checks requiring initial contact ---
    if (!isFoul && shotData.firstObjectBallHit !== null) {
      const firstHit = shotData.firstObjectBallHit;
      const firstHitType = getBallType(firstHit);

      // 3. Wrong Ball First
      if (currentPlayerBallType === "solids" && firstHitType === "stripe") {
        isFoul = true;
        foulReason = `Hit opponent's ball first (Stripe ${firstHit})`;
        givesBallInHand = true;
      } else if (
        currentPlayerBallType === "stripes" &&
        firstHitType === "solid"
      ) {
        isFoul = true;
        foulReason = `Hit opponent's ball first (Solid ${firstHit})`;
        givesBallInHand = true;
      } else if (currentPlayerBallType !== "open") {
          // Check if player group is cleared (needed for 8-ball checks)
          const targetBalls =
              currentPlayerBallType === "solids"
              ? [1, 2, 3, 4, 5, 6, 7]
              : [9, 10, 11, 12, 13, 14, 15];
          const playerGroupCleared = targetBalls.every((num) =>
              table.pocketedBalls.includes(num),
          );
          if (firstHitType === "eight" && !playerGroupCleared) {
              isFoul = true;
              foulReason = "Hit 8-ball first before group cleared";
              givesBallInHand = true;
          }
      } else if (currentPlayerBallType === "open" && firstHitType === "eight") {
          // Special case for break maybe? For now, always a foul if 8 is hit first on open table.
          isFoul = true;
          foulReason = "Hit 8-ball first when table open";
          givesBallInHand = true;
      }

      // 4. No Rail After Contact
      // Check if any legal ball was pocketed
      const pocketedLegalBall = newlyPocketed.some(num => {
          const type = getBallType(num);
          return (currentPlayerBallType === 'open' && (type === 'solid' || type === 'stripe')) ||
                 (currentPlayerBallType === 'solids' && type === 'solid') ||
                 (currentPlayerBallType === 'stripes' && type === 'stripe');
      });

      // Foul if no ball hit rail *after* contact AND no legal ball was pocketed
      if (!isFoul && !pocketedLegalBall && !shotData.cueBallHitRail && !shotData.objectBallHitRailAfterContact) {
          isFoul = true;
          foulReason = "No rail contacted after initial hit (and no ball pocketed)";
          givesBallInHand = true;
      }
    }
    // TODO: Add other fouls (e.g., ball off table, double hit, push shot)

    if (isFoul) {
      console.log(
        `AnalyzeOutcome: Foul detected for ${currentPlayerId}: ${foulReason}`,
      );
      // Increment player foul count (optional)
      table.fouls[currentPlayerId] = (table.fouls[currentPlayerId] || 0) + 1;
      table.lastUpdatedLocally = Date.now(); // Update timestamp for foul logging
    }
    // --- End Foul Checks ---

    // --- Assign Ball Types (If table open and no foul) ---
    if (!isFoul && currentPlayerBallType === "open") {
      const firstLegalPot = newlyPocketed.find(
        (num) => getBallType(num) === "solid" || getBallType(num) === "stripe",
      );
      if (firstLegalPot) {
        const potType = getBallType(firstLegalPot);
        const assignedType = potType === "solid" ? "solids" : "stripes";
        const opponentAssignedType = potType === "solid" ? "stripes" : "solids";
        table.playerBallTypes[currentPlayerId] = assignedType;
        table.playerBallTypes[opponentPlayerId] = opponentAssignedType;
        currentPlayerBallType = assignedType; // Update local var for subsequent checks
        ballTypeAssignedThisTurn = true;
        console.log(
          `AnalyzeOutcome: Ball types assigned: ${currentPlayerId}=${assignedType}, ${opponentPlayerId}=${opponentAssignedType}`,
        );
        table.lastUpdatedLocally = Date.now(); // Mark local cache update
      }
    }

    // --- Check Pocketed Ball Legality ---
    let pocketedOwnBall = false;
    let pocketedEightBall = false;
    for (const ballNum of newlyPocketed) {
      const type = getBallType(ballNum);
      if (type === "eight") {
        pocketedEightBall = true;
      } else if (type === "solid" || type === "stripe") {
        if (currentPlayerBallType === "open" && !ballTypeAssignedThisTurn) {
          pocketedOwnBall = true; // Any non-8-ball pocketed on open table is 'good' initially
        } else if (
          (currentPlayerBallType === "solids" && type === "solid") ||
          (currentPlayerBallType === "stripes" && type === "stripe")
        ) {
          pocketedOwnBall = true;
        }
      }
    }

    // --- Check Win/Loss Conditions ---
    // Check if player group is cleared (re-check needed after ball assignment/pocketing)
    let playerGroupCleared = false;
    if (currentPlayerBallType !== "open") {
      const targetBalls =
        currentPlayerBallType === "solids"
          ? [1, 2, 3, 4, 5, 6, 7]
          : [9, 10, 11, 12, 13, 14, 15];
      playerGroupCleared = targetBalls.every((num) =>
        table.pocketedBalls.includes(num),
      );
      if (playerGroupCleared && newlyPocketed.some(n => targetBalls.includes(n))) {
          console.log(
              `AnalyzeOutcome: Player ${currentPlayerId} has cleared their group (${currentPlayerBallType}) on this shot.`,
          );
      }
    }

    let gameShouldEnd = false;
    let winnerId: string | null = null;
    if (pocketedEightBall) {
      if (isFoul) {
        console.log(`AnalyzeOutcome: Loss - Pocketed 8-ball with foul.`);
        gameShouldEnd = true;
        winnerId = opponentPlayerId;
      } else if (!playerGroupCleared && currentPlayerBallType !== "open") {
        console.log(`AnalyzeOutcome: Loss - Pocketed 8-ball too early.`);
        gameShouldEnd = true;
        winnerId = opponentPlayerId;
      } else {
        console.log(`AnalyzeOutcome: Win - Legally pocketed 8-ball.`);
        gameShouldEnd = true;
        winnerId = currentPlayerId;
      }
    }

    // --- Determine Next Action --- (modified to use givesBallInHand and breakScratchOccurred)
    let nextActionType: GameActionType | null = null;
    let actionData: any = {};

    if (gameShouldEnd) {
      nextActionType = "END_GAME";
      actionData = { winnerId };
    } else if (isFoul) {
      nextActionType = "CHANGE_TURN";
      actionData = {
        nextPlayerId: opponentPlayerId,
        ballInHand: givesBallInHand,
        isBreakScratch: breakScratchOccurred,
      };
    } else if (pocketedOwnBall || (ballTypeAssignedThisTurn && newlyPocketed.length > 0 && !newlyPocketed.includes(0))) {
      console.log(`AnalyzeOutcome: Player ${currentPlayerId} continues turn.`);
      nextActionType = null;
    } else {
      console.log(
        `AnalyzeOutcome: Player ${currentPlayerId} turn ends (no legal pot or foul occurred without ball-in-hand).`,
      );
      nextActionType = "CHANGE_TURN";
      actionData = {
        nextPlayerId: opponentPlayerId,
        ballInHand: false,
        isBreakScratch: false,
      };
    }

    // --- Propose Action --- (Ensure breakScratch flag is in data for CHANGE_TURN)
    if (nextActionType) {
      console.log(`AnalyzeOutcome: Proposing action: ${nextActionType} with data:`, actionData);
      this.proposeAction({
        type: nextActionType as GameActionType,
        tableId: tableId,
        playerId: currentPlayerId,
        data: actionData,
        timestamp: Date.now(),
      });
    }

    // --- Cleanup --- Clean shot analysis data after processing
    this.currentShotAnalysis.delete(tableId);
    table.pocketedBallsBeforeShot = []; // Clear this as well
  }

  // --- End Shot Outcome Analysis ---

  public tick(tableId: string, deltaTime: number): void {
    const gameTable = this.tables.get(tableId);
    if (!gameTable || !gameTable.currentGame || !gameTable.physicsActive) return;

    const shotData = this.currentShotAnalysis.get(tableId);
    if (!shotData) {
        console.error(`Tick error: Shot analysis data not found for table ${tableId}`);
        this.stopGameLoop(tableId);
        return;
    }

    const initialPositions = gameTable.balls.map(b => ({ ...b.position }));
    let cueBallContactMade = shotData.firstObjectBallHit !== null;

    // --- Physics Update --- //
    const previousVelocities = gameTable.balls.map(b => ({ ...b.velocity }));

    // Map current balls to PhysicsObject for the engine
    const physicsInput: PhysicsObject[] = gameTable.balls.map(b => ({
        position: b.position,
        velocity: b.velocity,
        mass: b.mass,
        radius: b.radius,
    }));

    // Get updated physics data
    const updatedPhysicsObjects = this.physicsEngine.updatePhysics(
      physicsInput, // Use the mapped array
      gameTable.tableWidth,
      gameTable.tableHeight,
      deltaTime,
    );

    // Map updated data back to BallState, preserving number and pocketed status
    gameTable.balls = gameTable.balls.map((originalBall, index) => {
        const updatedPhysics = updatedPhysicsObjects[index];
        if (!updatedPhysics) {
            // Should not happen if lengths match, but handle defensively
            console.error(`Mismatch in physics update for ball index ${index}, number ${originalBall.number}`);
            return originalBall; // Return original state on error
        }
        return {
            ...originalBall, // Preserves number, pocketed, etc.
            position: updatedPhysics.position,
            velocity: updatedPhysics.velocity,
        };
    });

    let anyBallMoving = false;
    let railHitOccurredThisTick = false;

    for (let i = 0; i < gameTable.balls.length; i++) {
      const ball = gameTable.balls[i];
      const prevVelocity = previousVelocities[i];
      const initialPos = initialPositions[i];

      // Check for pocketing
      if (!ball.pocketed && this.isPocketed(ball.position, gameTable.pockets)) {
        this.pocketBall(tableId, ball.number);
        // Stop the ball once pocketed (or handle in pocketBall)
        ball.velocity = { x: 0, y: 0 };
      }

      if (ball.pocketed) continue; // Ignore pocketed balls for physics checks

      // Check if any ball is still moving
      const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
      if (speed >= MIN_BALL_SPEED) {
        anyBallMoving = true;
      }

      // --- Collision/Rail Hit Tracking for Fouls --- //
      // 1. Check for first cue ball contact with an object ball
      if (ball.number === 0 && !cueBallContactMade) {
          for (let j = 0; j < gameTable.balls.length; j++) {
              if (i === j || gameTable.balls[j].number === 0 || gameTable.balls[j].pocketed) continue;
              const objBall = gameTable.balls[j];
              const collision = this.physicsEngine.detectCollision(ball, objBall);
              // Use position change or velocity change to detect actual collision event more reliably?
              // For now, assume detectCollision is accurate for the *moment* of collision check.
              // A more robust way might be to check distance < radii sum over the delta time.
              if (collision.collided) {
                  shotData.firstObjectBallHit = objBall.number;
                  cueBallContactMade = true;
                  console.log(`Tick: Cue ball first hit object ball ${objBall.number}`);
                  break; // Only care about the first hit in this tick
              }
          }
      }

      // 2. Check for rail hits (crude check based on velocity change at boundary)
      const pos = ball.position;
      const radius = ball.radius;
      let hitRail = false;
      if ( (pos.x - radius <= 0 && ball.velocity.x < 0 && prevVelocity.x >= 0) ||
           (pos.x + radius >= gameTable.tableWidth && ball.velocity.x > 0 && prevVelocity.x <= 0) ||
           (pos.y - radius <= 0 && ball.velocity.y < 0 && prevVelocity.y >= 0) ||
           (pos.y + radius >= gameTable.tableHeight && ball.velocity.y > 0 && prevVelocity.y <= 0) )
      {
            hitRail = true;
            railHitOccurredThisTick = true; // Track if *any* rail hit happened this tick
            //console.log(`Tick: Ball ${ball.number} hit rail.`);
      }

      // 3. Update rail hit flags in shotData
      if (hitRail) {
          if (ball.number === 0) {
              shotData.cueBallHitRail = true;
          } else if (cueBallContactMade) { // Only track object ball rail hits *after* contact
              shotData.objectBallHitRailAfterContact = true;
              //console.log(`Tick: Object ball ${ball.number} hit rail AFTER contact.`);
          }
      }
      // --- End Collision/Rail Tracking --- //

    }

    gameTable.lastUpdatedLocally = Date.now();
    this.emit("state:updated", { tableId, state: gameTable });

    // Stop loop if nothing is moving
    if (!anyBallMoving) {
      console.log(`Tick: All balls stopped on table ${tableId}.`);
      this.stopGameLoop(tableId);
      // Now analyze the outcome using the collected shotData
      this.analyzeShotOutcome(tableId);
    }
  }

  // --- Game Loop Management ---
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
        const typedError =
          error instanceof Error ? error : new Error(String(error));
        console.error(
          `Error during game tick for table ${tableId}:`,
          typedError,
        );
        this.emit(
          "error",
          new Error(`Tick error for table ${tableId}: ${typedError.message}`),
        );
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
  // --- End Game Loop Management ---

  // --- Merge & Get State ---
  public mergeState(remoteStateData: any): void {
    console.warn(
      "Merge state called - Deserialization and merge logic for LWWRegister needs verification",
    );
    if (remoteStateData.vectorClock) {
      this.vectorClock.merge(remoteStateData.vectorClock);
    }
    if (remoteStateData.state && remoteStateData.state.tables) {
      Object.entries(remoteStateData.state.tables).forEach(
        ([tableId, remoteRegisterData]) => {
          try {
            console.error(
              "LWWRegister deserialization logic missing in mergeState",
            );
          } catch (error) {
            console.error(
              `Failed to merge table state for ${tableId}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        },
      );
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
      vectorClockTimestamp: this.vectorClock.getCurrentTimestamp(),
    };
  }
  // --- End Merge & Get State ---

  // --- Helpers ---
  private isPocketed(
    ballPosition: { x: number; y: number },
    pockets: Pocket[],
  ): boolean {
    for (const pocket of pockets) {
      const dx = ballPosition.x - pocket.position.x;
      const dy = ballPosition.y - pocket.position.y;
      if (dx * dx + dy * dy <= pocket.radius * pocket.radius) {
        return true;
      }
    }
    return false;
  }
  // --- End Helpers ---
}
