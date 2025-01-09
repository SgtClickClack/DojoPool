import { Cache } from '../cache';
import { throttleLocationUpdates } from '../throttle';
import { Location } from '../location';

describe('Load Testing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Multiple Concurrent Games', () => {
    it('handles multiple games simultaneously', async () => {
      const NUM_GAMES = 10;
      const PLAYERS_PER_GAME = 5;
      const UPDATE_DURATION = 5000; // 5 seconds

      const gameStates = new Map<string, {
        cache: Cache<Record<string, Location>>;
        players: Map<string, {
          throttled: (location: Location) => void;
          updates: number;
        }>;
      }>();

      // Initialize games
      for (let i = 0; i < NUM_GAMES; i++) {
        const gameId = `game${i}`;
        const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
        const players = new Map();

        for (let j = 0; j < PLAYERS_PER_GAME; j++) {
          const playerId = `player${j}`;
          const updates: number = 0;

          const callback = (location: Location) => {
            const currentLocations = cache.get(gameId) || {};
            cache.set(gameId, {
              ...currentLocations,
              [playerId]: location,
            });
            players.get(playerId).updates++;
          };

          players.set(playerId, {
            throttled: throttleLocationUpdates(callback, 10, 100),
            updates: 0,
          });
        }

        gameStates.set(gameId, { cache, players });
      }

      // Simulate concurrent game updates
      const runGameUpdates = async () => {
        const startTime = Date.now();
        while (Date.now() - startTime < UPDATE_DURATION) {
          for (const [gameId, state] of gameStates) {
            for (const [playerId, player] of state.players) {
              const location = {
                latitude: 51.5074 + Math.random() * 0.01,
                longitude: -0.1278 + Math.random() * 0.01,
              };
              player.throttled(location);
            }
          }
          jest.advanceTimersByTime(50); // 50ms between updates
          await new Promise(resolve => setImmediate(resolve));
        }
      };

      await runGameUpdates();

      // Verify game states
      for (const [gameId, state] of gameStates) {
        // Check cache has all players
        const locations = state.cache.get(gameId);
        expect(Object.keys(locations || {})).toHaveLength(PLAYERS_PER_GAME);

        // Check update frequency
        for (const [playerId, player] of state.players) {
          // Should have reasonable number of updates (not too many, not too few)
          expect(player.updates).toBeGreaterThan(5);
          expect(player.updates).toBeLessThan(UPDATE_DURATION / 100); // Max possible updates
        }
      }
    });

    it('maintains performance under heavy load', async () => {
      const NUM_GAMES = 20;
      const PLAYERS_PER_GAME = 10;
      const DURATION = 3000;

      const performanceMetrics = {
        cacheAccessTimes: [] as number[],
        updateTimes: [] as number[],
        memoryUsage: [] as number[],
      };

      // Create games and players
      const games = new Array(NUM_GAMES).fill(0).map((_, i) => {
        const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
        const players = new Array(PLAYERS_PER_GAME).fill(0).map((_, j) => {
          const callback = (location: Location) => {
            const start = performance.now();
            const currentLocations = cache.get(`game${i}`) || {};
            cache.set(`game${i}`, {
              ...currentLocations,
              [`player${j}`]: location,
            });
            performanceMetrics.updateTimes.push(performance.now() - start);
          };
          return throttleLocationUpdates(callback, 10, 100);
        });
        return { cache, players };
      });

      // Run load test
      const startTime = Date.now();
      while (Date.now() - startTime < DURATION) {
        // Update all players in all games
        for (const game of games) {
          for (const updatePlayer of game.players) {
            const location = {
              latitude: 51.5074 + Math.random() * 0.01,
              longitude: -0.1278 + Math.random() * 0.01,
            };
            updatePlayer(location);
          }
        }

        // Record memory usage
        performanceMetrics.memoryUsage.push(
          process.memoryUsage().heapUsed / 1024 / 1024
        );

        jest.advanceTimersByTime(50);
        await new Promise(resolve => setImmediate(resolve));
      }

      // Analyze metrics
      const avgUpdateTime = performanceMetrics.updateTimes.reduce((a, b) => a + b, 0) / 
        performanceMetrics.updateTimes.length;
      const maxMemoryUsage = Math.max(...performanceMetrics.memoryUsage);
      const memoryGrowth = performanceMetrics.memoryUsage[performanceMetrics.memoryUsage.length - 1] -
        performanceMetrics.memoryUsage[0];

      // Performance assertions
      expect(avgUpdateTime).toBeLessThan(1); // Sub-millisecond updates
      expect(memoryGrowth).toBeLessThan(50); // Less than 50MB growth
      expect(maxMemoryUsage).toBeLessThan(200); // Less than 200MB total
    });
  });
}); 