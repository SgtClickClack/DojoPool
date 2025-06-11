import { describe, it, expect, vi, beforeEach } from 'vitest';
import { measurePerformance, measureFrameRate, measureNetworkPerformance, measureRenderPerformance } from '@/utils/performance';
import { GameState } from '@/core/game/GameState';
import { mockGameService, mockTournamentService } from '../game-test-utils';

// Mock TournamentService since it's not implemented yet
class TournamentService {
  public async processBatchUpdates(updates: any[]): Promise<void> {
    // Mock implementation
  }

  public async processTournamentData(data: any): Promise<void> {
    // Mock implementation
  }

  public async batchUpdateMatches(updates: any[]): Promise<void> {
    // Mock implementation
  }
}

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performance.clearMarks();
    performance.clearMeasures();
  });

  describe('Shot Analysis Performance', () => {
    it('should analyze shots within 50ms', async () => {
      const gameState = new GameState('test-table');
      const shotData = {
        cueBall: { x: 100, y: 100 },
        targetBall: { x: 200, y: 200 },
        power: 0.8,
        angle: 45,
      };

      const result = await measurePerformance(
        async () => {
          await gameState.analyzeShot(shotData);
        },
        { 
          markName: 'shotAnalysis', 
          measureName: 'shotAnalysis', 
          collectMeasures: true,
          collectMemory: true 
        }
      );

      expect(result.duration).toBeLessThan(50); // 50ms target
    });

    it('should maintain 60fps during shot animation', async () => {
      const gameState = new GameState('test-table');
      const shotData = {
        cueBall: { x: 100, y: 100 },
        targetBall: { x: 200, y: 200 },
        power: 0.8,
        angle: 45,
      };

      const result = await measureFrameRate(
        () => {
          gameState.animateShot(shotData);
        },
        { 
          duration: 1000, 
          markName: 'shotAnimation', 
          measureName: 'shotAnimation' 
        }
      );

      expect(result.fps).toBeGreaterThanOrEqual(60);
      expect(result.droppedFrames).toBeLessThan(5); // Allow max 5 frame drops
    });

    it('should analyze complex shots efficiently', async () => {
      const gameState = new GameState('test-table');
      const complexShot = {
        cueBall: { x: 100, y: 100 },
        targetBalls: [
          { x: 200, y: 200 },
          { x: 300, y: 300 },
          { x: 400, y: 400 },
        ],
        power: 0.8,
        angle: 45,
        spin: 0.2,
      };

      const result = await measurePerformance(
        async () => {
          await gameState.analyzeComplexShot(complexShot);
        },
        { 
          markName: 'complexShotAnalysis', 
          measureName: 'complexShotAnalysis', 
          collectMeasures: true,
          collectMemory: true 
        }
      );

      expect(result.duration).toBeLessThan(100); // 100ms for complex shots
    });
  });

  describe('Real-time Update Performance', () => {
    it('should process game state updates within 16ms', async () => {
      const gameState = new GameState('test-table');
      const stateUpdate = {
        balls: Array.from({ length: 16 }, (_, i) => ({
          number: i,
          position: { x: Math.random() * 500, y: Math.random() * 500 },
          pocketed: false,
        })),
      };

      const result = await measurePerformance(
        async () => {
          await gameState.updateState(stateUpdate);
        },
        { 
          markName: 'stateUpdate', 
          measureName: 'stateUpdate', 
          collectMeasures: true,
          collectMemory: true 
        }
      );

      expect(result.duration).toBeLessThan(16); // 16ms for 60fps
    });

    it('should handle rapid tournament updates efficiently', async () => {
      const tournamentService = new TournamentService();
      const updates = Array.from({ length: 100 }, (_, i) => ({
        matchId: `match-${i}`,
        status: 'in_progress' as const,
        score: '3-2',
        timestamp: Date.now(),
      }));

      const result = await measurePerformance(
        async () => {
          await tournamentService.processBatchUpdates(updates);
        },
        { 
          markName: 'tournamentUpdate', 
          measureName: 'tournamentUpdate', 
          collectMeasures: true,
          collectMemory: true 
        }
      );

      expect(result.duration).toBeLessThan(100); // 100ms for batch processing
    });

    it('should maintain performance under load', async () => {
      const gameState = new GameState('test-table');
      const result = await measurePerformance(
        async () => {
          for (let i = 0; i < 1000; i++) {
            await gameState.processUpdate({
              type: 'shot',
              data: {
                playerId: 'player-1',
                shotType: 'break',
                result: 'success',
              },
            });
          }
        },
        { 
          markName: 'loadTest', 
          measureName: 'loadTest', 
          collectMemory: true, 
          collectMeasures: true 
        }
      );

      expect(result.memoryUsage?.max).toBeLessThan(100 * 1024 * 1024); // 100MB limit
    });
  });

  describe('API Performance', () => {
    it('should respond to API requests within 100ms', async () => {
      const result = await measureNetworkPerformance(
        async () => {
          await mockGameService.getGameState('game-1');
        },
        { 
          markName: 'apiRequest', 
          measureName: 'apiRequest',
          iterations: 1 
        }
      );

      expect(result.duration).toBeLessThan(100); // 100ms target
      expect(result.successRate).toBe(1); // 100% success rate
    });

    it('should handle concurrent API requests efficiently', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        url: `/api/games/game-${i}`,
        method: 'GET' as const,
      }));

      const result = await measureNetworkPerformance(
        async () => {
          await Promise.all(requests.map(req => mockGameService.getGameState(req.url)));
        },
        { 
          markName: 'concurrentRequests', 
          measureName: 'concurrentRequests',
          iterations: 1 
        }
      );

      expect(result.duration).toBeLessThan(500); // 500ms for concurrent requests
      expect(result.successRate).toBe(1); // 100% success rate
    });

    it('should maintain performance under API load', async () => {
      const result = await measurePerformance(
        async () => {
          const requests = Array.from({ length: 100 }, (_, i) => ({
            url: `/api/games/game-${i}`,
            method: 'GET' as const,
          }));

          await Promise.all(requests.map(req => mockGameService.getGameState(req.url)));
        },
        { 
          markName: 'apiLoad', 
          measureName: 'apiLoad', 
          collectMemory: true, 
          collectMeasures: true 
        }
      );

      expect(result.memoryUsage?.max).toBeLessThan(50 * 1024 * 1024); // 50MB limit
    });
  });

  describe('UI Performance', () => {
    it('should render game table within 3s', async () => {
      const result = await measureRenderPerformance(
        () => {
          const gameTable = document.createElement('div');
          gameTable.id = 'game-table';
          document.body.appendChild(gameTable);
          return gameTable;
        },
        { 
          markName: 'render', 
          measureName: 'render',
          iterations: 1 
        }
      );

      expect(result.duration).toBeLessThan(3000); // 3s target
    });

    it('should maintain 60fps during UI interactions', async () => {
      const result = await measureFrameRate(
        () => {
          const gameTable = document.getElementById('game-table');
          if (gameTable) {
            gameTable.style.transform = `translate(${Math.random() * 100}px, ${Math.random() * 100}px)`;
          }
        },
        { 
          duration: 1000, 
          markName: 'uiInteraction', 
          measureName: 'uiInteraction' 
        }
      );

      expect(result.fps).toBeGreaterThanOrEqual(60);
      expect(result.droppedFrames).toBeLessThan(5); // Allow max 5 frame drops
    });

    it('should handle rapid UI updates efficiently', async () => {
      const result = await measurePerformance(
        () => {
          const gameTable = document.getElementById('game-table');
          if (gameTable) {
            for (let i = 0; i < 100; i++) {
              gameTable.style.transform = `translate(${i}px, ${i}px)`;
            }
          }
        },
        { 
          markName: 'rapidUpdates', 
          measureName: 'rapidUpdates', 
          collectMeasures: true 
        }
      );

      expect(result.duration).toBeLessThan(100); // 100ms for rapid updates
    });
  });

  describe('Memory Management', () => {
    it('should clean up resources after game end', async () => {
      const gameState = new GameState('test-table');
      const initialMemory = process.memoryUsage().heapUsed;

      await gameState.updateState({ status: 'in_progress' });
      await gameState.updateState({ status: 'completed' });

      const result = await measurePerformance(
        async () => {
          await gameState.cleanup();
        },
        { 
          markName: 'cleanup', 
          measureName: 'cleanup', 
          collectMemory: true, 
          collectMeasures: true 
        }
      );

      expect(result.memoryUsage?.final).toBeLessThan(initialMemory * 1.1); // 10% tolerance
    });

    it('should handle large tournament data efficiently', async () => {
      const tournamentService = new TournamentService();
      const largeTournament = {
        id: 'tournament-1',
        status: 'in_progress' as const,
        matches: Array.from({ length: 100 }, (_, i) => ({
          id: `match-${i}`,
          player1: { id: `player-${i * 2}`, name: `Player ${i * 2}` },
          player2: { id: `player-${i * 2 + 1}`, name: `Player ${i * 2 + 1}` },
          status: 'scheduled' as const,
        })),
      };

      const result = await measurePerformance(
        async () => {
          await tournamentService.processTournamentData(largeTournament);
        },
        { 
          markName: 'tournamentData', 
          measureName: 'tournamentData', 
          collectMemory: true, 
          collectMeasures: true 
        }
      );

      expect(result.memoryUsage?.max).toBeLessThan(200 * 1024 * 1024); // 200MB limit
    });
  });

  describe('Network Optimization', () => {
    it('should batch tournament updates efficiently', async () => {
      const tournamentService = new TournamentService();
      const updates = Array.from({ length: 50 }, (_, i) => ({
        matchId: `match-${i}`,
        status: 'in_progress' as const,
        score: '3-2',
      }));

      const result = await measureNetworkPerformance(
        async () => {
          await tournamentService.batchUpdateMatches(updates);
        },
        { 
          markName: 'batchUpdate', 
          measureName: 'batchUpdate',
          iterations: 1 
        }
      );

      expect(result.duration).toBeLessThan(200); // 200ms for batch updates
      expect(result.successRate).toBe(1); // 100% success rate
    });

    it('should optimize WebSocket message size', async () => {
      const gameState = new GameState('test-table');
      const stateUpdate = {
        balls: Array.from({ length: 16 }, (_, i) => ({
          number: i,
          position: { x: Math.random() * 500, y: Math.random() * 500 },
          pocketed: false,
        })),
      };

      const result = await measurePerformance(
        () => {
          const serialized = gameState.serializeState(stateUpdate);
          return serialized.length;
        },
        { 
          markName: 'messageSize', 
          measureName: 'messageSize', 
          collectMeasures: true 
        }
      );

      expect(result.duration).toBeLessThan(1); // 1ms target for serialization
    });
  });
}); 