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
            ballsPocketedOnBreak: [], 
            numberOfBallsHittingRailOnBreak: 0, 
         });

        return table as GameTable;
    };

    it('should continue turn if player pockets their own ball legally', async () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 1)!.pocketed = true;
        table.pocketedBalls.push(1);

        const mockResult: RefereeResult = {
            foul: null, reason: null, isBallInHand: false,
            nextPlayerId: player1Id
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[player1Id]).toBe(0);
        expect(table.ballInHand).toBe(false);
        expect(table.currentTurn).toBe(player1Id);
        expect((gameState as any).currentShotAnalysis.has(tableId)).toBe(false);
        expect((gameState as any).preShotTableState.has(tableId)).toBe(false);
    });

    it('should change turn if player does not pocket their own ball legally', async () => {
        const table = setupShotTest();
        const mockResult: RefereeResult = {
            foul: null, reason: null, isBallInHand: false,
            nextPlayerId: player2Id
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.ballInHand).toBe(false);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, player2Id);
        expect(table.currentTurn).toBe(player2Id);
        changeTurnSpy.mockRestore();
    });

     it('should record foul, give ball-in-hand, and change turn on foul result', async () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 0)!.pocketed = true;
        table.pocketedBalls.push(0);
        const mockResult: RefereeResult = {
            foul: FoulType.SCRATCH, reason: 'Cue ball pocketed', isBallInHand: true,
            nextPlayerId: player2Id
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[player1Id]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(table.ballInHandFromBreakScratch).toBe(false);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, player2Id);
        expect(table.currentTurn).toBe(player2Id);
        changeTurnSpy.mockRestore();
    });

     it('should set ballInHandFromBreakScratch flag for break foul scratch', async () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 0)!.pocketed = true;
        table.pocketedBalls.push(0);
        (gameState as any).currentShotAnalysis.get(tableId)!.isBreakShot = true;

        const mockResult: RefereeResult = {
            foul: FoulType.BREAK_FOUL, reason: 'Scratch on the break shot.', isBallInHand: true,
            nextPlayerId: player2Id
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[player1Id]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(table.ballInHandFromBreakScratch).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, player2Id);
        expect(table.currentTurn).toBe(player2Id);
        changeTurnSpy.mockRestore();
    });

     it('should assign ball types if table is open and first legal ball is pocketed', async () => {
        const table = setupShotTest();
        table.playerBallTypes[player1Id] = 'open';
        table.playerBallTypes[player2Id] = 'open';
        table.balls.find((b: BallState) => b.number === 3)!.pocketed = true;
        table.pocketedBalls.push(3);

         const mockResult: RefereeResult = {
            foul: null, reason: null, isBallInHand: false,
            nextPlayerId: player1Id
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(table.playerBallTypes[player1Id]).toBe('solids');
        expect(table.playerBallTypes[player2Id]).toBe('stripes');
        expect(table.currentTurn).toBe(player1Id);
    });

    it('should end game with win if 8-ball pocketed legally after group cleared', async () => {
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
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const endGameSpy = jest.spyOn(gameState as any, 'endGame');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(endGameSpy).toHaveBeenCalledWith(tableId, player1Id);

        endGameSpy.mockRestore();
    });

    it('should end game with loss if 8-ball pocketed on a foul', async () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 8)!.pocketed = true;
        table.pocketedBalls.push(8);
        table.balls.find((b: BallState) => b.number === 0)!.pocketed = true;
        table.pocketedBalls.push(0);

        const mockResult: RefereeResult = {
            foul: FoulType.SCRATCH, reason: 'Cue ball pocketed', isBallInHand: true,
            nextPlayerId: player2Id
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const endGameSpy = jest.spyOn(gameState as any, 'endGame');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(endGameSpy).toHaveBeenCalledWith(tableId, player2Id);

        endGameSpy.mockRestore();
    });

     it('should end game with loss if 8-ball pocketed before group cleared', async () => {
        const table = setupShotTest();
        table.balls.find((b: BallState) => b.number === 8)!.pocketed = true;
        table.pocketedBalls.push(8);

        const mockResult: RefereeResult = {
            foul: null, reason: null, isBallInHand: false,
            nextPlayerId: player2Id 
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const endGameSpy = jest.spyOn(gameState as any, 'endGame');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(endGameSpy).toHaveBeenCalledWith(tableId, player2Id);

        endGameSpy.mockRestore();
    });

    it('should handle error from AI referee service gracefully', async () => {
        const table = setupShotTest();
        const error = new Error('AI Service Unavailable');
        aiRefereeServiceMock.mockRejectedValue(error);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        // analyzeShotOutcome should catch the error and handle it
        await expect((gameState as any).analyzeShotOutcome(tableId)).resolves.toBeUndefined();

        // Verify fallback behavior: foul logged (implicitly via default error result), ball-in-hand true, turn changed
        expect(aiRefereeServiceMock).toHaveBeenCalled();
        // Check state after error handling within analyzeShotOutcome
        expect(table.ballInHand).toBe(true); // Should be awarded on error
        expect(table.currentTurn).toBe(player2Id); // Turn should change to opponent
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, player2Id);
        // Ensure analysis/pre-shot state is still cleared
        expect((gameState as any).currentShotAnalysis.has(tableId)).toBe(false);
        expect((gameState as any).preShotTableState.has(tableId)).toBe(false);

        changeTurnSpy.mockRestore();
    });

    it('should record WRONG_BALL_FIRST foul, give ball-in-hand, and change turn', async () => {
        const table = setupShotTest();
        const currentPlayerId = table.currentTurn; // Store current player ID before potential change
        const opponentPlayerId = currentPlayerId === player1Id ? player2Id : player1Id;
        const mockResult: RefereeResult = {
            foul: FoulType.WRONG_BALL_FIRST, reason: 'Hit opponent\'s ball first', isBallInHand: true,
            nextPlayerId: opponentPlayerId // Use the determined opponent ID
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[currentPlayerId as string]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, mockResult.nextPlayerId);
        expect(table.currentTurn).toBe(mockResult.nextPlayerId);
        changeTurnSpy.mockRestore();
    });

    it('should record NO_RAIL_AFTER_CONTACT foul, give ball-in-hand, and change turn', async () => {
        const table = setupShotTest();
        const currentPlayerId = table.currentTurn;
        const opponentPlayerId = currentPlayerId === player1Id ? player2Id : player1Id;
        const mockResult: RefereeResult = {
            foul: FoulType.NO_RAIL_AFTER_CONTACT, reason: 'No ball hit a rail after contact', isBallInHand: true,
            nextPlayerId: opponentPlayerId
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[currentPlayerId as string]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, mockResult.nextPlayerId);
        expect(table.currentTurn).toBe(mockResult.nextPlayerId);
        changeTurnSpy.mockRestore();
    });

    it('should record BALLS_OFF_TABLE foul, give ball-in-hand, and change turn', async () => {
        const table = setupShotTest();
        const currentPlayerId = table.currentTurn;
        const opponentPlayerId = currentPlayerId === player1Id ? player2Id : player1Id;
        const mockResult: RefereeResult = {
            foul: FoulType.BALLS_OFF_TABLE, reason: 'Ball went off the table', isBallInHand: true,
            nextPlayerId: opponentPlayerId
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[currentPlayerId as string]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, mockResult.nextPlayerId);
        expect(table.currentTurn).toBe(mockResult.nextPlayerId);
        changeTurnSpy.mockRestore();
    });

     it('should record TOUCHING_BALL foul, give ball-in-hand, and change turn', async () => {
        const table = setupShotTest();
        const currentPlayerId = table.currentTurn;
        const opponentPlayerId = currentPlayerId === player1Id ? player2Id : player1Id;
        const mockResult: RefereeResult = {
            foul: FoulType.TOUCHING_BALL, reason: 'Touched a ball illegally', isBallInHand: true,
            nextPlayerId: opponentPlayerId
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[currentPlayerId as string]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, mockResult.nextPlayerId);
        expect(table.currentTurn).toBe(mockResult.nextPlayerId);
        changeTurnSpy.mockRestore();
    });

    it('should record DOUBLE_HIT foul, give ball-in-hand, and change turn', async () => {
        const table = setupShotTest();
        const currentPlayerId = table.currentTurn;
        const opponentPlayerId = currentPlayerId === player1Id ? player2Id : player1Id;
        const mockResult: RefereeResult = {
            foul: FoulType.DOUBLE_HIT, reason: 'Hit cue ball twice', isBallInHand: true,
            nextPlayerId: opponentPlayerId
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[currentPlayerId as string]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, mockResult.nextPlayerId);
        expect(table.currentTurn).toBe(mockResult.nextPlayerId);
        changeTurnSpy.mockRestore();
    });

    it('should record PUSH_SHOT foul, give ball-in-hand, and change turn', async () => {
        const table = setupShotTest();
        const currentPlayerId = table.currentTurn;
        const opponentPlayerId = currentPlayerId === player1Id ? player2Id : player1Id;
        const mockResult: RefereeResult = {
            foul: FoulType.PUSH_SHOT, reason: 'Pushed the cue ball', isBallInHand: true,
            nextPlayerId: opponentPlayerId
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[currentPlayerId as string]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, mockResult.nextPlayerId);
        expect(table.currentTurn).toBe(mockResult.nextPlayerId);
        changeTurnSpy.mockRestore();
    });

     it('should record ILLEGAL_JUMP foul, give ball-in-hand, and change turn', async () => {
        const table = setupShotTest();
        const currentPlayerId = table.currentTurn;
        const opponentPlayerId = currentPlayerId === player1Id ? player2Id : player1Id;
        const mockResult: RefereeResult = {
            foul: FoulType.ILLEGAL_JUMP, reason: 'Illegal jump shot', isBallInHand: true,
            nextPlayerId: opponentPlayerId
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[currentPlayerId as string]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, mockResult.nextPlayerId);
        expect(table.currentTurn).toBe(mockResult.nextPlayerId);
        changeTurnSpy.mockRestore();
    });

     it('should record NO_CONTACT foul, give ball-in-hand, and change turn', async () => {
        const table = setupShotTest();
        const currentPlayerId = table.currentTurn;
        const opponentPlayerId = currentPlayerId === player1Id ? player2Id : player1Id;
        const mockResult: RefereeResult = {
            foul: FoulType.NO_CONTACT, reason: 'Cue ball did not contact any object ball', isBallInHand: true,
            nextPlayerId: opponentPlayerId
        };
        aiRefereeServiceMock.mockResolvedValue(mockResult);
        const changeTurnSpy = jest.spyOn(gameState as any, 'changeTurn');

        await (gameState as any).analyzeShotOutcome(tableId);

        expect(aiRefereeServiceMock).toHaveBeenCalled();
        expect(table.fouls[currentPlayerId as string]).toBe(1);
        expect(table.ballInHand).toBe(true);
        expect(changeTurnSpy).toHaveBeenCalledWith(tableId, mockResult.nextPlayerId);
        expect(table.currentTurn).toBe(mockResult.nextPlayerId);
        changeTurnSpy.mockRestore();
    });

  });

});
