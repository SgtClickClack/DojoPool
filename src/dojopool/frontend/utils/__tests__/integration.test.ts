import { Cache } from '../cache';
import { throttleLocationUpdates } from '../throttle';
import { Location } from '../location';
import { locationValidator } from '../validation';
import { gameMetricsMonitor, locationMonitor } from '../monitoring';

describe('Location Update Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Cache and Throttle Integration', () => {
    it('caches throttled location updates', () => {
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const callback = jest.fn((location: Location) => {
        const currentLocations = cache.get('game123') || {};
        cache.set('game123', {
          ...currentLocations,
          player1: location,
        });
      });

      const throttled = throttleLocationUpdates(callback, 10, 1000);

      // Initial location
      const location1 = { latitude: 51.5074, longitude: -0.1278 };
      throttled(location1);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(cache.get('game123')).toEqual({
        player1: location1,
      });

      // Rapid updates with small movements
      const location2 = { latitude: 51.5075, longitude: -0.1279 };
      throttled(location2);
      throttled(location2);
      throttled(location2);

      // Should not update due to throttling
      expect(callback).toHaveBeenCalledTimes(1);
      expect(cache.get('game123')).toEqual({
        player1: location1,
      });

      // After time passes
      jest.advanceTimersByTime(1000);

      // Should update with latest location
      expect(callback).toHaveBeenCalledTimes(2);
      expect(cache.get('game123')).toEqual({
        player1: location2,
      });
    });

    it('handles multiple players with cache expiry', () => {
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const players = ['player1', 'player2'];
      const callbacks = players.map((playerId) =>
        jest.fn((location: Location) => {
          const currentLocations = cache.get('game123') || {};
          cache.set('game123', {
            ...currentLocations,
            [playerId]: location,
          });
        })
      );

      const throttledUpdates = players.map((_, index) =>
        throttleLocationUpdates(callbacks[index], 10, 1000)
      );

      // Initial locations
      const locations = [
        { latitude: 51.5074, longitude: -0.1278 },
        { latitude: 51.508, longitude: -0.128 },
      ];

      throttledUpdates.forEach((update, index) => {
        update(locations[index]);
      });

      // Both players should be in cache
      expect(cache.get('game123')).toEqual({
        player1: locations[0],
        player2: locations[1],
      });

      // Advance time to near expiry
      jest.advanceTimersByTime(4500);

      // Update one player
      const newLocation = { latitude: 51.509, longitude: -0.129 };
      throttledUpdates[0](newLocation);

      // Cache should still have both players
      expect(cache.get('game123')).toEqual({
        player1: newLocation,
        player2: locations[1],
      });

      // Advance time past expiry
      jest.advanceTimersByTime(1000);

      // Cache should be cleared
      expect(cache.get('game123')).toBeUndefined();
    });

    it('handles concurrent updates with rate limiting', async () => {
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      const updates: Location[] = [];

      const callback = jest.fn((location: Location) => {
        updates.push(location);
        const currentLocations = cache.get('game123') || {};
        cache.set('game123', {
          ...currentLocations,
          player1: location,
        });
      });

      const throttled = throttleLocationUpdates(callback, 10, 100);

      // Simulate rapid location updates
      const locations = Array.from({ length: 10 }, (_, i) => ({
        latitude: 51.5074 + i * 0.0001,
        longitude: -0.1278 + i * 0.0001,
      }));

      // Send updates concurrently
      await Promise.all(
        locations.map((location) => Promise.resolve().then(() => throttled(location)))
      );

      // Should only process first update initially
      expect(updates.length).toBe(1);
      expect(updates[0]).toEqual(locations[0]);

      // Advance time
      jest.advanceTimersByTime(100);

      // Should process latest update
      expect(updates.length).toBe(2);
      expect(updates[1]).toEqual(locations[locations.length - 1]);

      // Cache should have latest location
      expect(cache.get('game123')).toEqual({
        player1: locations[locations.length - 1],
      });
    });

    it('maintains data consistency during rapid updates', () => {
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });
      let lastProcessedLocation: Location | null = null;

      const callback = jest.fn((location: Location) => {
        lastProcessedLocation = location;
        const currentLocations = cache.get('game123') || {};
        cache.set('game123', {
          ...currentLocations,
          player1: location,
        });
      });

      const throttled = throttleLocationUpdates(callback, 10, 1000);

      // Simulate movement path
      const path = Array.from({ length: 5 }, (_, i) => ({
        latitude: 51.5074 + i * 0.0002,
        longitude: -0.1278 + i * 0.0002,
      }));

      // Send updates in sequence
      path.forEach((location) => {
        throttled(location);
        jest.advanceTimersByTime(500); // Half the throttle time
      });

      // Should process first and last locations
      expect(callback).toHaveBeenCalledTimes(3); // First, middle, and last
      expect(lastProcessedLocation).toEqual(path[path.length - 1]);

      // Cache should have latest state
      expect(cache.get('game123')).toEqual({
        player1: path[path.length - 1],
      });
    });
  });
});

describe('Safety System Integration', () => {
  beforeEach(() => {
    locationValidator.clearBoundaries();
    gameMetricsMonitor.reset();
    locationMonitor.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Location Validation and Monitoring', () => {
    it('correctly tracks player movement and violations', () => {
      const playerId = 'test_player';
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };

      // Set up game area
      locationValidator.addBoundary({
        id: 'game_boundary',
        type: 'safe',
        points: [
          { latitude: 44.9, longitude: -75.1 },
          { latitude: 44.9, longitude: -74.9 },
          { latitude: 45.1, longitude: -74.9 },
          { latitude: 45.1, longitude: -75.1 },
        ],
      });

      // Track normal movement
      const validLocations = [
        baseLocation,
        { latitude: 45.01, longitude: -75.01 },
        { latitude: 45.02, longitude: -75.02 },
      ];

      validLocations.forEach((location) => {
        const validation = locationValidator.validateLocation(location, playerId);
        expect(validation.isValid).toBe(true);
        locationMonitor.recordLocation(playerId, location);
      });

      // Verify path recording
      const path = locationMonitor.getPlayerPath(playerId);
      expect(path).toHaveLength(3);
      expect(path[0]).toEqual(baseLocation);

      // Attempt suspicious movement
      const fastLocation = { latitude: 45.05, longitude: -75.05 };
      const movementValidation = locationValidator.validateMovement(playerId, fastLocation);
      expect(movementValidation.isValidMovement).toBe(false);

      // Verify metrics recording
      const metrics = gameMetricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBe(1);
    });

    it('integrates automated responses with monitoring', () => {
      const playerId = 'violation_player';
      const unsafeLocation: Location = { latitude: 45.15, longitude: -75.0 };

      // Set up unsafe area
      locationValidator.addBoundary({
        id: 'unsafe_zone',
        type: 'unsafe',
        points: [
          { latitude: 45.1, longitude: -75.1 },
          { latitude: 45.1, longitude: -74.9 },
          { latitude: 45.2, longitude: -74.9 },
          { latitude: 45.2, longitude: -75.1 },
        ],
      });

      // Generate multiple violations
      const violations = Array.from({ length: 5 }, () => {
        const validation = locationValidator.validateLocation(unsafeLocation, playerId);
        if (!validation.isValid && validation.automatedResponse) {
          gameMetricsMonitor.recordSafetyIncident(
            playerId,
            'boundary_violation',
            validation.reason || 'Unknown'
          );
        }
        jest.advanceTimersByTime(60000); // 1 minute between violations
        return validation;
      });

      // Verify escalating responses
      expect(violations[0].automatedResponse?.type).toBe('warning');
      expect(violations[2].automatedResponse?.type).toBe('suspension');
      expect(violations[4].automatedResponse?.type).toBe('ban');

      // Verify monitoring data
      const metrics = gameMetricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBe(5);
      expect(metrics.safetyIncidents.byType.boundary_violation).toBe(5);

      // Verify violation history
      const summary = locationValidator.getViolationSummary(playerId);
      expect(summary.recentViolations).toBe(5);
      expect(summary.severity.high).toBeGreaterThan(0);
    });
  });

  describe('Real-time Monitoring and Response', () => {
    it('handles concurrent violations and updates', async () => {
      const numPlayers = 5;
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };
      const unsafeLocation: Location = { latitude: 45.15, longitude: -75.0 };

      // Set up boundaries
      locationValidator.addBoundary({
        id: 'unsafe_area',
        type: 'unsafe',
        points: [
          { latitude: 45.1, longitude: -75.1 },
          { latitude: 45.1, longitude: -74.9 },
          { latitude: 45.2, longitude: -74.9 },
          { latitude: 45.2, longitude: -75.1 },
        ],
      });

      // Simulate concurrent player activity
      await Promise.all(
        Array.from({ length: numPlayers }, async (_, index) => {
          const playerId = `player_${index}`;

          // Start with valid movement
          const validation1 = locationValidator.validateLocation(baseLocation, playerId);
          if (validation1.isValid) {
            locationMonitor.recordLocation(playerId, baseLocation);
          }

          // Small delay
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

          // Attempt unsafe movement
          const validation2 = locationValidator.validateLocation(unsafeLocation, playerId);
          if (!validation2.isValid && validation2.automatedResponse) {
            gameMetricsMonitor.recordSafetyIncident(
              playerId,
              'boundary_violation',
              validation2.reason || 'Unknown'
            );
          }
        })
      );

      // Verify system state
      const metrics = gameMetricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBe(numPlayers);

      // Verify each player's state
      for (let i = 0; i < numPlayers; i++) {
        const playerId = `player_${i}`;
        const path = locationMonitor.getPlayerPath(playerId);
        expect(path).toHaveLength(1); // Only valid locations recorded

        const summary = locationValidator.getViolationSummary(playerId);
        expect(summary.recentViolations).toBe(1);
      }
    });

    it('maintains data consistency during rapid updates', async () => {
      const playerId = 'rapid_player';
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };
      const updates = 50;

      // Set up boundaries
      locationValidator.addBoundary({
        id: 'test_boundary',
        type: 'safe',
        points: [
          { latitude: 44.9, longitude: -75.1 },
          { latitude: 44.9, longitude: -74.9 },
          { latitude: 45.1, longitude: -74.9 },
          { latitude: 45.1, longitude: -75.1 },
        ],
      });

      // Generate rapid location updates
      const locations: Location[] = Array.from({ length: updates }, (_, i) => ({
        latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.01,
        longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.01,
      }));

      // Process updates rapidly
      await Promise.all(
        locations.map(async (location, index) => {
          const validation = locationValidator.validateLocation(location, playerId);
          if (validation.isValid) {
            locationMonitor.recordLocation(playerId, location);
          } else if (validation.automatedResponse) {
            gameMetricsMonitor.recordSafetyIncident(
              playerId,
              'rapid_update_violation',
              validation.reason || 'Unknown'
            );
          }

          // Simulate small processing delay
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
        })
      );

      // Verify data consistency
      const path = locationMonitor.getPlayerPath(playerId);
      expect(path.length).toBeLessThanOrEqual(updates);
      expect(path.length).toBeGreaterThan(0);

      const metrics = gameMetricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBeGreaterThanOrEqual(0);

      // Verify path continuity
      for (let i = 1; i < path.length; i++) {
        const distance = locationValidator['calculateDistance'](path[i - 1], path[i]);
        expect(distance).toBeLessThan(1000); // Maximum 1km between consecutive points
      }
    });
  });
});
