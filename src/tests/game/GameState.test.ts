import { GameState, GameTable, BallState, Pocket, ShotAnalysisData } from "../../core/game/GameState";
import { Player } from "../../types/game";
import {
  RaftConsensus,
  ConsensusConfig as RaftConsensusConfig
} from "../../core/consensus/RaftConsensus";
import { StateReplicator, ReplicationConfig } from "../../core/replication/StateReplicator";
import { NetworkTransport } from "../../core/network/NetworkTransport";
import fs from "fs";
import path from "path";
import os from "os";
import { AIRefereeService, FoulType, RefereeResult } from "../../services/ai/AIRefereeService";

describe("GameState", () => {
  let gameState: GameState;
  let consensus: RaftConsensus;
  let transport: NetworkTransport;
  let tempDir: string;
  let aiRefereeServiceMock: jest.SpyInstance;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "game-state-test-"));
    transport = new NetworkTransport({
        nodeId: "node1",
        port: 3001,
        peers: [],
    } as any);
    await transport.start();

    const consensusConfig: RaftConsensusConfig = {
      nodeId: "node1",
      electionTimeout: 300,
      heartbeatInterval: 50,
      nodes: ["node1"],
    };
    consensus = new RaftConsensus(consensusConfig);

    gameState = new GameState("node1", consensusConfig);

    aiRefereeServiceMock = jest.spyOn((gameState as any).aiRefereeService, 'analyzeShot');
  });

  afterEach(async () => {
     aiRefereeServiceMock.mockRestore();
     await transport.stop();
     fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("analyzeShotOutcome", () => {
    let tableId: string;
    let player1Id: string;
    let player2Id: string;

    const setupShotTest = () => {
        tableId = "analyze-test-table";
        player1Id = "p1";
        player2Id = "p2";
        gameState.createTableRequest(tableId, "Test Table");
        gameState.joinTableRequest(tableId, player1Id, "Player 1", "teamA", "pos1");
        gameState.joinTableRequest(tableId, player2Id, "Player 2", "teamB", "pos2");
        
        const table = (gameState as any).tables.get(tableId);
        if (!table) throw new Error("Table not created in test setup");

        table.gameStarted = true;
        table.gameEnded = false;
        table.status = "active";
        table.balls = (gameState as any).createInitialBallState(table.tableWidth, table.tableHeight);
        table.pocketedBalls = [];
        table.fouls = { [player1Id]: 0, [player2Id]: 0 };
        table.playerBallTypes = { [player1Id]: 'solids', [player2Id]: 'stripes' };
        table.currentTurn = player1Id;
        table.ballInHand = false;
        table.ballInHandFromBreakScratch = false;
        table.pocketedBallsBeforeShot = [];

        (gameState as any).preShotTableState.set(tableId, {
             pocketedBalls: [...table.pocketedBalls],
             playerBallTypes: { ...table.playerBallTypes },
             balls: table.balls.map((b: BallState) => ({...b})),
             currentTurn: table.currentTurn,
         });
         (gameState as any).currentShotAnalysis.set(tableId, {
            firstObjectBallHit: 1,
            cueBallHitRail: false,
            objectBallHitRailAfterContact: true,
            isBreakShot: false,
         });

        return table as GameTable;
    };

    it('should continue turn if player pockets their own ball legally', () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 1)!.pocketed = true;
        table.pocketedBalls.push(1);

        const mockResult: RefereeResult = {
            foul: null, reason: null, isBallInHand: false,
            nextPlayerId: player1Id
        };
        aiRefereeServiceMock.mockReturnValue(mockResult);

        (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[player1Id]).toBe(0);
        expect(table.ballInHand).toBe(false);
        expect(table.currentTurn).toBe(player1Id);
        expect((gameState as any).currentShotAnalysis.has(tableId)).toBe(false);
        expect((gameState as any).preShotTableState.has(tableId)).toBe(false);
    });

    it('should change turn if player does not pocket their own ball legally', () => {
        const table = setupShotTest();
        const mockResult: RefereeResult = {
            foul: null, reason: null, isBallInHand: false,
            nextPlayerId: player2Id
        };
        aiRefereeServiceMock.mockReturnValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.ballInHand).toBe(false);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, player2Id);
        expect(table.currentTurn).toBe(player2Id);
        changeTurnSpy.mockRestore();
    });

     it('should record foul, give ball-in-hand, and change turn on foul result', () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 0)!.pocketed = true;
        table.pocketedBalls.push(0);
        const mockResult: RefereeResult = {
            foul: FoulType.SCRATCH, reason: 'Cue ball pocketed', isBallInHand: true,
            nextPlayerId: player2Id
        };
        aiRefereeServiceMock.mockReturnValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[player1Id]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(table.ballInHandFromBreakScratch).toBe(false);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, player2Id);
        expect(table.currentTurn).toBe(player2Id);
        changeTurnSpy.mockRestore();
    });

     it('should set ballInHandFromBreakScratch flag for break foul scratch', () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 0)!.pocketed = true;
        table.pocketedBalls.push(0);
        (gameState as any).currentShotAnalysis.get(tableId)!.isBreakShot = true;

        const mockResult: RefereeResult = {
            foul: FoulType.BREAK_FOUL, reason: 'Scratch on the break shot.', isBallInHand: true,
            nextPlayerId: player2Id
        };
        aiRefereeServiceMock.mockReturnValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[player1Id]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(table.ballInHandFromBreakScratch).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, player2Id);
        expect(table.currentTurn).toBe(player2Id);
        changeTurnSpy.mockRestore();
    });

     it('should assign ball types if table is open and first legal ball is pocketed', () => {
        const table = setupShotTest();
        table.playerBallTypes[player1Id] = 'open';
        table.playerBallTypes[player2Id] = 'open';
        table.balls.find((b: BallState) => b.number === 3)!.pocketed = true;
        table.pocketedBalls.push(3);

         const mockResult: RefereeResult = {
            foul: null, reason: null, isBallInHand: false,
            nextPlayerId: player1Id
        };
        aiRefereeServiceMock.mockReturnValue(mockResult);

        (gameState as any).analyzeShotOutcome(tableId);

        expect(table.playerBallTypes[player1Id]).toBe('solids');
        expect(table.playerBallTypes[player2Id]).toBe('stripes');
        expect(table.currentTurn).toBe(player1Id);
    });

    it('should end game with win if 8-ball pocketed legally after group cleared', () => {
        const table = setupShotTest();
        [1, 2, 3, 4, 5, 6, 7].forEach(num => {
            if (!table.pocketedBalls.includes(num)) table.pocketedBalls.push(num);
            const ball = table.balls.find((b: BallState) => b.number === num);
            if (ball) ball.pocketed = true;
        });
        table.balls.find((b: BallState) => b.number === 8)!.pocketed = true;
        table.pocketedBalls.push(8);

        const mockResult: RefereeResult = {
            foul: null, reason: null, isBallInHand: false,
            nextPlayerId: player1Id
        };
        aiRefereeServiceMock.mockReturnValue(mockResult);
        const endGameSpy = jest.spyOn(gameState as any, 'endGame');

        (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(endGameSpy).toHaveBeenCalledWith(tableId, player1Id);

        endGameSpy.mockRestore();
    });

    it('should end game with loss if 8-ball pocketed on a foul', () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 8)!.pocketed = true;
        table.pocketedBalls.push(8);
        table.balls.find((b: BallState) => b.number === 0)!.pocketed = true;
        table.pocketedBalls.push(0);

        const mockResult: RefereeResult = {
            foul: FoulType.SCRATCH, reason: 'Cue ball pocketed', isBallInHand: true,
            nextPlayerId: player2Id
        };
        aiRefereeServiceMock.mockReturnValue(mockResult);
        const endGameSpy = jest.spyOn(gameState as any, 'endGame');

        (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(endGameSpy).toHaveBeenCalledWith(tableId, player2Id);

        endGameSpy.mockRestore();
    });

     it('should end game with loss if 8-ball pocketed before group cleared', () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 8)!.pocketed = true;
        table.pocketedBalls.push(8);

        const mockResult: RefereeResult = {
            foul: null, reason: null, isBallInHand: false,
            nextPlayerId: player2Id 
        };
        aiRefereeServiceMock.mockReturnValue(mockResult);
        const endGameSpy = jest.spyOn(gameState as any, 'endGame');

        (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(endGameSpy).toHaveBeenCalledWith(tableId, player2Id);

        endGameSpy.mockRestore();
    });

  });

});
