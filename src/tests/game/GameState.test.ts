import { GameState, GameTable, Player } from '../../core/game/GameState';
import { ConsensusProtocol, ConsensusConfig } from '../../core/consensus/ConsensusProtocol';
import { StateReplicator, ReplicatorConfig } from '../../core/replication/StateReplicator';
import { NetworkTransport } from '../../core/network/NetworkTransport';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('GameState', () => {
  let gameState: GameState;
  let consensus: ConsensusProtocol;
  let replicator: StateReplicator;
  let transport: NetworkTransport;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for storage
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'game-state-test-'));

    // Set up network transport
    transport = new NetworkTransport({
      nodeId: 'node1',
      port: 3001
    });

    await transport.start();

    // Set up consensus
    const consensusConfig: ConsensusConfig = {
      nodeId: 'node1',
      electionTimeoutMin: 150,
      electionTimeoutMax: 300,
      heartbeatInterval: 50,
      transport
    };

    consensus = new ConsensusProtocol(consensusConfig);

    // Set up replicator
    const replicatorConfig: ReplicatorConfig = {
      nodeId: 'node1',
      consensus,
      storageDir: tempDir
    };

    replicator = new StateReplicator(replicatorConfig);

    // Set up game state
    gameState = new GameState('node1', consensus, replicator);

    // Start consensus
    consensus.start();
  });

  afterEach(async () => {
    consensus.stop();
    await transport.stop();

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Table Management', () => {
    it('should create a new table', () => {
      const tableId = 'table1';
      gameState.createTable(tableId);

      const table = gameState.getTable(tableId);
      expect(table).toBeDefined();
      expect(table?.id).toBe(tableId);
      expect(table?.players).toEqual({});
      expect(table?.gameStarted).toBe(false);
      expect(table?.balls.length).toBe(16);
    });

    it('should list all tables', () => {
      gameState.createTable('table1');
      gameState.createTable('table2');

      const tables = gameState.getAllTables();
      expect(tables.length).toBe(2);
      expect(tables.map(t => t.id)).toContain('table1');
      expect(tables.map(t => t.id)).toContain('table2');
    });
  });

  describe('Player Management', () => {
    let tableId: string;

    beforeEach(() => {
      tableId = 'test-table';
      gameState.createTable(tableId);
    });

    it('should allow a player to join a table', () => {
      const playerId = 'player1';
      const playerName = 'Test Player';

      gameState.joinTable(tableId, playerId, playerName);

      const table = gameState.getTable(tableId);
      expect(table?.players[playerId]).toBeDefined();
      expect(table?.players[playerId].name).toBe(playerName);
    });

    it('should not allow more than 2 players at a table', () => {
      gameState.joinTable(tableId, 'player1', 'Player 1');
      gameState.joinTable(tableId, 'player2', 'Player 2');

      expect(() => {
        gameState.joinTable(tableId, 'player3', 'Player 3');
      }).toThrow('Table is full');
    });

    it('should allow a player to leave a table', () => {
      const playerId = 'player1';
      gameState.joinTable(tableId, playerId, 'Test Player');
      gameState.leaveTable(tableId, playerId);

      const table = gameState.getTable(tableId);
      expect(table?.players[playerId]).toBeUndefined();
    });

    it('should end the game if current turn player leaves', () => {
      gameState.joinTable(tableId, 'player1', 'Player 1');
      gameState.joinTable(tableId, 'player2', 'Player 2');
      gameState.startGame(tableId);

      const table = gameState.getTable(tableId)!;
      const currentTurn = table.currentTurn!;
      gameState.leaveTable(tableId, currentTurn);

      expect(table.gameEnded).toBe(true);
      expect(table.winner).toBe(Object.keys(table.players)[0]);
    });
  });

  describe('Game Flow', () => {
    let tableId: string;
    let player1Id: string;
    let player2Id: string;

    beforeEach(() => {
      tableId = 'test-table';
      player1Id = 'player1';
      player2Id = 'player2';

      gameState.createTable(tableId);
      gameState.joinTable(tableId, player1Id, 'Player 1');
      gameState.joinTable(tableId, player2Id, 'Player 2');
    });

    it('should start a game with two players', () => {
      gameState.startGame(tableId);

      const table = gameState.getTable(tableId);
      expect(table?.gameStarted).toBe(true);
      expect(table?.currentTurn).toBeDefined();
      expect([player1Id, player2Id]).toContain(table?.currentTurn);
    });

    it('should not start a game with one player', () => {
      gameState.leaveTable(tableId, player2Id);

      expect(() => {
        gameState.startGame(tableId);
      }).toThrow('Need exactly 2 players to start the game');
    });

    it('should handle turn changes', () => {
      gameState.startGame(tableId);
      const table = gameState.getTable(tableId)!;
      const initialTurn = table.currentTurn;

      gameState.changeTurn(tableId);

      expect(table.currentTurn).not.toBe(initialTurn);
      expect([player1Id, player2Id]).toContain(table.currentTurn);
    });

    it('should handle shots and ball updates', () => {
      gameState.startGame(tableId);
      const table = gameState.getTable(tableId)!;
      const currentTurn = table.currentTurn!;

      gameState.makeShot(tableId, currentTurn, { force: 50, angle: Math.PI / 4 });

      const cueBall = table.balls[0];
      expect(cueBall.velocity.x).toBeGreaterThan(0);
      expect(cueBall.velocity.y).toBeGreaterThan(0);

      // Update ball positions
      const newPositions = [
        { number: 0, position: { x: 100, y: 100 } }
      ];
      gameState.updateBallPositions(tableId, newPositions);

      expect(table.balls[0].position).toEqual({ x: 100, y: 100 });
    });

    it('should handle pocketed balls and game end', () => {
      gameState.startGame(tableId);
      const table = gameState.getTable(tableId)!;
      const currentTurn = table.currentTurn!;

      // Pocket some balls
      gameState.pocketBall(tableId, 1);
      expect(table.pocketedBalls).toContain(1);
      expect(table.balls[1].pocketed).toBe(true);

      // Pocket the 8-ball
      gameState.pocketBall(tableId, 8);
      expect(table.gameEnded).toBe(true);
      expect(table.winner).toBe(currentTurn);
    });
  });

  describe('State Replication', () => {
    it('should replicate state changes across nodes', (done) => {
      const tableId = 'test-table';
      const playerId = 'player1';

      gameState.on('state:updated', ({ state }) => {
        expect(state.players[playerId]).toBeDefined();
        expect(state.players[playerId].name).toBe('Test Player');
        done();
      });

      gameState.createTable(tableId);
      gameState.joinTable(tableId, playerId, 'Test Player');
    });
  });
}); 