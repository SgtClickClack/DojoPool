import { Cache } from '../cache';
import { throttleLocationUpdates } from '../throttle';
import { Location } from '../location';
import { locationValidator } from '../validation';

describe('Performance and Error Recovery', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Memory Usage', () => {
    it('maintains constant memory usage during rapid updates', () => {
      const cache = new Cache<Record<string, Location>>({ maxAge: 1000, maxSize: 100 });
      const memorySnapshots: number[] = [];
      
      // Helper to get rough memory usage
      const getMemoryUsage = () => {
        const used = process.memoryUsage();
        return Math.round(used.heapUsed / 1024 / 1024); // MB
      };

      // Initial memory snapshot
      memorySnapshots.push(getMemoryUsage());

      // Simulate 1000 rapid updates
      for (let i = 0; i < 1000; i++) {
        const location = {
          latitude: 51.5074 + (i * 0.0001),
          longitude: -0.1278 + (i * 0.0001),
        };
        cache.set(`player${i % 10}`, location);

        if (i % 100 === 0) {
          memorySnapshots.push(getMemoryUsage());
          jest.advanceTimersByTime(100);
        }
      }

      // Check memory stability
      const maxDiff = Math.max(...memorySnapshots) - Math.min(...memorySnapshots);
      expect(maxDiff).toBeLessThan(10); // Should not grow more than 10MB
    });

    it('properly cleans up resources', () => {
      const cache = new Cache<Record<string, Location>>({ maxAge: 1000 });
      const locations: Location[] = [];
      let weakRef: WeakRef<Cache<Record<string, Location>>>;

      // Create scope to test garbage collection
      {
        const tempCache = new Cache<Record<string, Location>>({ maxAge: 1000 });
        weakRef = new WeakRef(tempCache);

        // Fill cache
        for (let i = 0; i < 100; i++) {
          const location = {
            latitude: 51.5074 + (i * 0.0001),
            longitude: -0.1278 + (i * 0.0001),
          };
          tempCache.set(`player${i}`, location);
          locations.push(location);
        }
      }

      // Force garbage collection if possible
      if (global.gc) {
        global.gc();
      }

      // WeakRef should be cleared
      expect(weakRef.deref()).toBeUndefined();
    });
  });

  describe('Error Recovery', () => {
    it('recovers from cache corruption', () => {
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const callback = jest.fn((location: Location) => {
        try {
          // Simulate cache corruption
          const corruptData = '{invalid-json}' as any;
          cache.set('game123', corruptData);
        } catch (error) {
          // Should recover by setting valid data
          cache.set('game123', { player1: location });
        }
      });

      const throttled = throttleLocationUpdates(callback, 10, 1000);
      const location = { latitude: 51.5074, longitude: -0.1278 };
      
      throttled(location);
      expect(cache.get('game123')).toEqual({ player1: location });
    });

    it('handles concurrent cache access', async () => {
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const updates: Location[] = [];
      const errors: Error[] = [];

      const callback = jest.fn(async (location: Location) => {
        try {
          updates.push(location);
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 100));
          const currentLocations = cache.get('game123') || {};
          cache.set('game123', {
            ...currentLocations,
            player1: location,
          });
        } catch (error) {
          errors.push(error as Error);
        }
      });

      const throttled = throttleLocationUpdates(callback, 10, 100);

      // Send concurrent updates
      const locations = Array.from({ length: 5 }, (_, i) => ({
        latitude: 51.5074 + i * 0.0001,
        longitude: -0.1278 + i * 0.0001,
      }));

      await Promise.all(
        locations.map(location => Promise.resolve().then(() => throttled(location)))
      );

      // Should handle concurrent access without errors
      expect(errors.length).toBe(0);
      expect(cache.get('game123')?.player1).toBeDefined();
    });
  });

  describe('Performance Optimization', () => {
    it('maintains update frequency under load', () => {
      const updateTimes: number[] = [];
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      
      const callback = jest.fn((location: Location) => {
        updateTimes.push(Date.now());
        const currentLocations = cache.get('game123') || {};
        cache.set('game123', {
          ...currentLocations,
          player1: location,
        });
      });

      const throttled = throttleLocationUpdates(callback, 10, 100);

      // Simulate high-frequency updates
      for (let i = 0; i < 100; i++) {
        const location = {
          latitude: 51.5074 + (i * 0.0001),
          longitude: -0.1278 + (i * 0.0001),
        };
        throttled(location);
        jest.advanceTimersByTime(10); // 10ms between updates
      }

      // Calculate time differences between updates
      const timeDiffs = updateTimes.slice(1).map((time, i) => time - updateTimes[i]);
      const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;

      // Should maintain minimum interval
      expect(avgTimeDiff).toBeGreaterThanOrEqual(100);
    });

    it('optimizes cache access patterns', () => {
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const accessTimes: number[] = [];
      
      // Monitor cache access time
      const originalGet = cache.get.bind(cache);
      cache.get = (key: string) => {
        const start = performance.now();
        const result = originalGet(key);
        accessTimes.push(performance.now() - start);
        return result;
      };

      // Simulate typical usage pattern
      for (let i = 0; i < 1000; i++) {
        const location = {
          latitude: 51.5074 + (i * 0.0001),
          longitude: -0.1278 + (i * 0.0001),
        };
        cache.set(`player${i % 10}`, location);
        cache.get(`player${i % 10}`);
        
        if (i % 100 === 0) {
          jest.advanceTimersByTime(1000);
        }
      }

      // Calculate average access time
      const avgAccessTime = accessTimes.reduce((a, b) => a + b, 0) / accessTimes.length;
      expect(avgAccessTime).toBeLessThan(1); // Should be sub-millisecond
    });
  });
});

describe('Geofencing Performance', () => {
  const generatePolygon = (centerLat: number, centerLng: number, points: number, radius: number): Location[] => {
    const polygon: Location[] = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      polygon.push({
        latitude: centerLat + radius * Math.cos(angle),
        longitude: centerLng + radius * Math.sin(angle),
      });
    }
    return polygon;
  };

  const generateLocations = (count: number, bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): Location[] => {
    return Array.from({ length: count }, () => ({
      latitude: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
      longitude: bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng),
    }));
  };

  beforeEach(() => {
    locationValidator.clearBoundaries();
    jest.clearAllTimers();
  });

  describe('Boundary Validation Performance', () => {
    it('handles large polygons efficiently', () => {
      // Create a complex polygon with 100 points
      const complexPolygon = generatePolygon(45.0, -75.0, 100, 0.1);
      
      locationValidator.addBoundary({
        id: 'complex_boundary',
        type: 'unsafe',
        points: complexPolygon,
      });

      const testLocation: Location = { latitude: 45.0, longitude: -75.0 };
      
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        locationValidator.validateLocation(testLocation);
      }
      const end = performance.now();
      
      // Should process 1000 validations in under 100ms
      expect(end - start).toBeLessThan(100);
    });

    it('scales well with multiple boundaries', () => {
      // Add 10 different boundaries
      for (let i = 0; i < 10; i++) {
        const polygon = generatePolygon(45.0 + i * 0.1, -75.0, 20, 0.05);
        locationValidator.addBoundary({
          id: `boundary_${i}`,
          type: 'unsafe',
          points: polygon,
        });
      }

      const testLocations = generateLocations(100, {
        minLat: 44.5,
        maxLat: 46.5,
        minLng: -76.0,
        maxLng: -74.0,
      });

      const start = performance.now();
      testLocations.forEach(location => {
        locationValidator.validateLocation(location);
      });
      const end = performance.now();

      // Should process 100 locations against 10 boundaries in under 50ms
      expect(end - start).toBeLessThan(50);
    });

    it('maintains performance with concurrent validations', async () => {
      const complexPolygon = generatePolygon(45.0, -75.0, 50, 0.1);
      locationValidator.addBoundary({
        id: 'concurrent_test',
        type: 'unsafe',
        points: complexPolygon,
      });

      const testLocations = generateLocations(100, {
        minLat: 44.9,
        maxLat: 45.1,
        minLng: -75.1,
        maxLng: -74.9,
      });

      const start = performance.now();
      await Promise.all(
        testLocations.map(location => 
          new Promise<void>(resolve => {
            locationValidator.validateLocation(location);
            resolve();
          })
        )
      );
      const end = performance.now();

      // Should handle 100 concurrent validations in under 50ms
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('Movement Validation Performance', () => {
    it('efficiently validates paths crossing boundaries', () => {
      // Create multiple overlapping boundaries
      for (let i = 0; i < 5; i++) {
        const polygon = generatePolygon(45.0 + i * 0.05, -75.0, 30, 0.08);
        locationValidator.addBoundary({
          id: `path_boundary_${i}`,
          type: 'unsafe',
          points: polygon,
        });
      }

      const paths = Array.from({ length: 100 }, (_, i) => ({
        start: { latitude: 44.8, longitude: -75.2 },
        end: { latitude: 45.2, longitude: -74.8 },
        playerId: `player_${i}`,
      }));

      const start = performance.now();
      paths.forEach(path => {
        locationValidator.validateMovement(path.playerId, path.start);
        locationValidator.validateMovement(path.playerId, path.end);
      });
      const end = performance.now();

      // Should validate 100 paths in under 100ms
      expect(end - start).toBeLessThan(100);
    });

    it('maintains performance with complex movement patterns', () => {
      const playerId = 'test_player';
      const movements = Array.from({ length: 100 }, (_, i) => ({
        latitude: 45.0 + Math.sin(i * 0.1) * 0.1,
        longitude: -75.0 + Math.cos(i * 0.1) * 0.1,
      }));

      const start = performance.now();
      movements.forEach(location => {
        locationValidator.validateMovement(playerId, location);
      });
      const end = performance.now();

      // Should process 100 sequential movements in under 50ms
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('Memory Usage', () => {
    it('maintains reasonable memory usage with many boundaries', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Add 100 complex boundaries
      for (let i = 0; i < 100; i++) {
        const polygon = generatePolygon(45.0 + i * 0.01, -75.0, 20, 0.05);
        locationValidator.addBoundary({
          id: `memory_test_${i}`,
          type: 'unsafe',
          points: polygon,
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // Convert to MB

      // Memory increase should be less than 10MB
      expect(memoryIncrease).toBeLessThan(10);
    });
  });
}); 