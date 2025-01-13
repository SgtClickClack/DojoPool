import { locationValidator } from '../validation';
import { gameMetricsMonitor, locationMonitor } from '../monitoring';
import { Location } from '../location';
import { Cache } from '../cache';
import { throttleLocationUpdates } from '../throttle';

describe('Safety System Error Handling', () => {
  beforeEach(() => {
    locationValidator.clearBoundaries();
    gameMetricsMonitor.reset();
    locationMonitor.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Validation Error Recovery', () => {
    it('handles invalid location data gracefully', () => {
      const playerId = 'test_player';
      const validLocation: Location = { latitude: 45.0, longitude: -75.0 };

      // Test invalid coordinates
      const invalidLocations = [
        { latitude: 91, longitude: -75.0 }, // Invalid latitude
        { latitude: 45.0, longitude: -181.0 }, // Invalid longitude
        { latitude: NaN, longitude: -75.0 }, // NaN values
        { latitude: 45.0, longitude: Infinity }, // Infinity values
        {} as Location, // Missing coordinates
      ];

      // Process valid location first
      const validValidation = locationValidator.validateLocation(validLocation, playerId);
      expect(validValidation.isValid).toBe(true);
      locationMonitor.recordLocation(playerId, validLocation);

      // Process invalid locations
      invalidLocations.forEach((location) => {
        const validation = locationValidator.validateLocation(location, playerId);
        expect(validation.isValid).toBe(false);

        // System should not record invalid locations
        const path = locationMonitor.getPlayerPath(playerId);
        expect(path[path.length - 1]).toEqual(validLocation);
      });

      // Verify system remains stable
      const metrics = gameMetricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBe(invalidLocations.length);
    });

    it('recovers from boundary validation errors', () => {
      const playerId = 'boundary_test';
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };

      // Add invalid boundary (self-intersecting polygon)
      locationValidator.addBoundary({
        id: 'invalid_boundary',
        type: 'unsafe',
        points: [
          { latitude: 45.0, longitude: -75.0 },
          { latitude: 45.1, longitude: -75.1 },
          { latitude: 45.0, longitude: -75.1 },
          { latitude: 45.1, longitude: -75.0 },
        ],
      });

      // Test locations near invalid boundary
      const testLocations = [
        baseLocation,
        { latitude: 45.05, longitude: -75.05 },
        { latitude: 45.08, longitude: -75.08 },
      ];

      // System should still function with invalid boundary
      testLocations.forEach((location) => {
        const validation = locationValidator.validateLocation(location, playerId);
        // Should default to safe when boundary validation fails
        if (validation.isValid) {
          locationMonitor.recordLocation(playerId, location);
        }
      });

      const path = locationMonitor.getPlayerPath(playerId);
      expect(path.length).toBeGreaterThan(0);
    });
  });

  describe('Monitoring System Recovery', () => {
    it('handles monitoring system overload', async () => {
      const numPlayers = 100;
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });

      // Simulate many concurrent updates
      await Promise.all(
        Array.from({ length: numPlayers }, async (_, index) => {
          const playerId = `player_${index}`;
          const location = {
            latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.1,
            longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.1,
          };

          try {
            // Validate and record location
            const validation = locationValidator.validateLocation(location, playerId);
            if (validation.isValid) {
              locationMonitor.recordLocation(playerId, location);

              // Update cache
              const currentLocations = cache.get('game123') || {};
              cache.set('game123', {
                ...currentLocations,
                [playerId]: location,
              });
            }
          } catch (error) {
            // Should not throw, should handle errors gracefully
            console.error('Error processing location update:', error);
          }
        })
      );

      // Verify system stability
      const cachedLocations = cache.get('game123') || {};
      expect(Object.keys(cachedLocations).length).toBeGreaterThan(0);
    });

    it('maintains data integrity during error conditions', () => {
      const playerId = 'error_test';
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };

      // Set up monitoring with throttling
      const callback = jest.fn((location: Location) => {
        if (Math.random() < 0.3) {
          // 30% chance of error
          throw new Error('Simulated processing error');
        }
        locationMonitor.recordLocation(playerId, location);
      });

      const throttled = throttleLocationUpdates(callback, 10, 100);

      // Generate test locations
      const locations = Array.from({ length: 20 }, (_, i) => ({
        latitude: baseLocation.latitude + i * 0.001,
        longitude: baseLocation.longitude + i * 0.001,
      }));

      // Process locations with potential errors
      locations.forEach((location) => {
        try {
          throttled(location);
          jest.advanceTimersByTime(50);
        } catch (error) {
          // Error should be caught and handled
          console.error('Error processing location:', error);
        }
      });

      // Verify system state
      const path = locationMonitor.getPlayerPath(playerId);
      expect(path.length).toBeGreaterThan(0);
      expect(path.length).toBeLessThanOrEqual(locations.length);

      // Verify path continuity despite errors
      for (let i = 1; i < path.length; i++) {
        const distance = locationValidator['calculateDistance'](path[i - 1], path[i]);
        expect(distance).toBeLessThan(100); // Reasonable distance between points
      }
    });
  });

  describe('System Recovery', () => {
    it('recovers from temporary service disruption', async () => {
      const playerId = 'recovery_test';
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };
      const cache = new Cache<Record<string, Location>>({ maxAge: 5000 });

      // Simulate service disruption
      const processLocationUpdate = async (location: Location, shouldFail: boolean = false) => {
        if (shouldFail) {
          throw new Error('Simulated service disruption');
        }

        const validation = locationValidator.validateLocation(location, playerId);
        if (validation.isValid) {
          locationMonitor.recordLocation(playerId, location);

          const currentLocations = cache.get('game123') || {};
          cache.set('game123', {
            ...currentLocations,
            [playerId]: location,
          });
        }
      };

      // Process updates with intermittent failures
      const updates = [
        { location: baseLocation, shouldFail: false },
        { location: { latitude: 45.01, longitude: -75.01 }, shouldFail: true }, // Simulated failure
        { location: { latitude: 45.02, longitude: -75.02 }, shouldFail: false },
        { location: { latitude: 45.03, longitude: -75.03 }, shouldFail: true }, // Simulated failure
        { location: { latitude: 45.04, longitude: -75.04 }, shouldFail: false },
      ];

      for (const update of updates) {
        try {
          await processLocationUpdate(update.location, update.shouldFail);
          jest.advanceTimersByTime(1000);
        } catch (error) {
          // System should continue processing after error
          console.error('Service disruption:', error);
        }
      }

      // Verify system recovery
      const path = locationMonitor.getPlayerPath(playerId);
      expect(path.length).toBe(3); // Should have recorded non-failed updates

      const cachedLocation = cache.get('game123')?.[playerId];
      expect(cachedLocation).toBeDefined();
      expect(cachedLocation).toEqual(updates[4].location); // Should have latest successful update
    });

    it('handles rapid reconnection attempts', () => {
      const playerId = 'reconnect_test';
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };
      let connectionAttempts = 0;

      // Simulate connection handling
      const processReconnection = () => {
        connectionAttempts++;
        if (connectionAttempts > 3) {
          // Simulate successful reconnection after 3 attempts
          return true;
        }
        throw new Error('Connection failed');
      };

      // Test reconnection with location updates
      const locations = Array.from({ length: 5 }, (_, i) => ({
        latitude: baseLocation.latitude + i * 0.01,
        longitude: baseLocation.longitude + i * 0.01,
      }));

      locations.forEach((location) => {
        try {
          if (processReconnection()) {
            const validation = locationValidator.validateLocation(location, playerId);
            if (validation.isValid) {
              locationMonitor.recordLocation(playerId, location);
            }
          }
        } catch (error) {
          // Should handle reconnection failures gracefully
          console.error('Reconnection failed:', error);
        }
        jest.advanceTimersByTime(1000);
      });

      // Verify system state after reconnection
      const path = locationMonitor.getPlayerPath(playerId);
      expect(path.length).toBeGreaterThan(0);
      expect(connectionAttempts).toBeGreaterThan(3);
    });
  });
});
