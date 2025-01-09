import { Cache } from '../cache';
import { throttleLocationUpdates } from '../throttle';
import { Location } from '../location';

describe('Network Failure Simulation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Network Resilience', () => {
    class NetworkSimulator {
      private isOnline = true;
      private failureRate = 0;
      private latency = 0;
      private jitter = 0;

      setOnline(online: boolean) {
        this.isOnline = online;
      }

      setFailureRate(rate: number) {
        this.failureRate = rate;
      }

      setLatency(latency: number, jitter: number = 0) {
        this.latency = latency;
        this.jitter = jitter;
      }

      async send<T>(data: T): Promise<T> {
        if (!this.isOnline) {
          throw new Error('Network offline');
        }

        if (Math.random() < this.failureRate) {
          throw new Error('Network request failed');
        }

        const delay = this.latency + (Math.random() * 2 - 1) * this.jitter;
        await new Promise(resolve => setTimeout(resolve, delay));
        return data;
      }
    }

    it('handles network disconnection and reconnection', async () => {
      const network = new NetworkSimulator();
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const pendingUpdates: Location[] = [];
      let lastSuccessfulUpdate: Location | null = null;

      const callback = async (location: Location) => {
        try {
          const result = await network.send(location);
          lastSuccessfulUpdate = result;
          const currentLocations = cache.get('game123') || {};
          cache.set('game123', {
            ...currentLocations,
            player1: result,
          });
        } catch (error) {
          pendingUpdates.push(location);
        }
      };

      const throttled = throttleLocationUpdates(callback, 10, 100);

      // Initial update with network online
      const location1 = { latitude: 51.5074, longitude: -0.1278 };
      await throttled(location1);
      expect(lastSuccessfulUpdate).toEqual(location1);

      // Simulate network failure
      network.setOnline(false);
      const location2 = { latitude: 51.5075, longitude: -0.1279 };
      await throttled(location2);
      expect(lastSuccessfulUpdate).toEqual(location1); // Still the old location
      expect(pendingUpdates).toContain(location2);

      // Restore network and process pending updates
      network.setOnline(true);
      await Promise.all(pendingUpdates.map(loc => callback(loc)));
      expect(lastSuccessfulUpdate).toEqual(location2);
    });

    it('handles intermittent failures', async () => {
      const network = new NetworkSimulator();
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const successfulUpdates: Location[] = [];
      const failedUpdates: Location[] = [];

      network.setFailureRate(0.5); // 50% failure rate

      const callback = async (location: Location) => {
        try {
          await network.send(location);
          successfulUpdates.push(location);
          const currentLocations = cache.get('game123') || {};
          cache.set('game123', {
            ...currentLocations,
            player1: location,
          });
        } catch (error) {
          failedUpdates.push(location);
        }
      };

      const throttled = throttleLocationUpdates(callback, 10, 100);

      // Send multiple updates
      const locations = Array.from({ length: 10 }, (_, i) => ({
        latitude: 51.5074 + i * 0.0001,
        longitude: -0.1278 + i * 0.0001,
      }));

      await Promise.all(locations.map(loc => throttled(loc)));

      // Should have mix of successful and failed updates
      expect(successfulUpdates.length).toBeGreaterThan(0);
      expect(failedUpdates.length).toBeGreaterThan(0);
      expect(successfulUpdates.length + failedUpdates.length).toBe(
        Math.ceil(locations.length / 10) // Due to throttling
      );
    });

    it('handles high latency and jitter', async () => {
      const network = new NetworkSimulator();
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const updateTimes: number[] = [];

      network.setLatency(200, 100); // 200ms latency with ±100ms jitter

      const callback = async (location: Location) => {
        const start = Date.now();
        await network.send(location);
        updateTimes.push(Date.now() - start);

        const currentLocations = cache.get('game123') || {};
        cache.set('game123', {
          ...currentLocations,
          player1: location,
        });
      };

      const throttled = throttleLocationUpdates(callback, 10, 100);

      // Send updates
      for (let i = 0; i < 10; i++) {
        const location = {
          latitude: 51.5074 + i * 0.0001,
          longitude: -0.1278 + i * 0.0001,
        };
        await throttled(location);
        jest.advanceTimersByTime(100);
      }

      // Verify timing
      const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
      expect(avgUpdateTime).toBeGreaterThanOrEqual(200); // At least base latency
      expect(avgUpdateTime).toBeLessThanOrEqual(400); // Not too high
    });

    it('maintains data consistency during network issues', async () => {
      const network = new NetworkSimulator();
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const updates: Location[] = [];

      // Simulate varying network conditions
      let currentUpdate = 0;
      network.setFailureRate(0.3); // 30% failure rate
      network.setLatency(150, 50); // 150ms latency with ±50ms jitter

      const callback = async (location: Location) => {
        currentUpdate++;
        const updateNumber = currentUpdate;

        try {
          await network.send(location);
          updates.push(location);
          const currentLocations = cache.get('game123') || {};
          cache.set('game123', {
            ...currentLocations,
            player1: location,
          });

          // Verify update order
          const updateIndex = updates.indexOf(location);
          expect(updateIndex).toBe(updates.length - 1);
        } catch (error) {
          // Failed update shouldn't affect cache
          const cachedLocation = cache.get('game123')?.player1;
          if (cachedLocation) {
            expect(updates).toContain(cachedLocation);
          }
        }
      };

      const throttled = throttleLocationUpdates(callback, 10, 100);

      // Send updates with varying network conditions
      for (let i = 0; i < 20; i++) {
        if (i === 10) {
          network.setOnline(false);
        }
        if (i === 15) {
          network.setOnline(true);
        }

        const location = {
          latitude: 51.5074 + i * 0.0001,
          longitude: -0.1278 + i * 0.0001,
        };
        await throttled(location);
        jest.advanceTimersByTime(100);
      }

      // Verify final state
      const finalLocation = cache.get('game123')?.player1;
      if (finalLocation) {
        expect(updates).toContain(finalLocation);
      }
    });
  });
}); 