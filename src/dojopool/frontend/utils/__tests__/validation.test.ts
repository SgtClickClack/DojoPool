import { locationValidator } from '../validation';
import { Location } from '../location';

describe('LocationValidator', () => {
  beforeEach(() => {
    locationValidator.clearBoundaries();
  });

  describe('Basic Location Validation', () => {
    it('validates coordinates within normal bounds', () => {
      const validLocation: Location = {
        latitude: 45.0,
        longitude: -75.0,
      };
      expect(locationValidator.validateLocation(validLocation).isValid).toBe(true);
    });

    it('rejects coordinates outside valid bounds', () => {
      const invalidLocations: Location[] = [
        { latitude: 91, longitude: 0 }, // Invalid latitude
        { latitude: -91, longitude: 0 }, // Invalid latitude
        { latitude: 0, longitude: 181 }, // Invalid longitude
        { latitude: 0, longitude: -181 }, // Invalid longitude
      ];

      invalidLocations.forEach((location) => {
        const result = locationValidator.validateLocation(location);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('Invalid coordinate values');
      });
    });

    it('validates location accuracy', () => {
      const locationWithPoorAccuracy: Location = {
        latitude: 45.0,
        longitude: -75.0,
        accuracy: 100, // 100 meters accuracy (too high)
      };

      const result = locationValidator.validateLocation(locationWithPoorAccuracy);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('accuracy');
    });
  });

  describe('Movement Validation', () => {
    const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };
    const playerId = 'test-player';

    beforeEach(() => {
      // Reset player history
      locationValidator.clearPlayerHistory(playerId);
    });

    it('accepts first movement without previous location', () => {
      const result = locationValidator.validateMovement(playerId, baseLocation);
      expect(result.isValidMovement).toBe(true);
      expect(result.estimatedSpeed).toBe(0);
    });

    it('validates normal speed movement', () => {
      // First location
      locationValidator.validateMovement(playerId, baseLocation);

      // Wait a bit and move a reasonable distance
      jest.advanceTimersByTime(1000); // 1 second

      // Move ~10 meters north (approximately)
      const newLocation: Location = {
        latitude: baseLocation.latitude + 0.0001,
        longitude: baseLocation.longitude,
      };

      const result = locationValidator.validateMovement(playerId, newLocation);
      expect(result.isValidMovement).toBe(true);
      expect(result.estimatedSpeed).toBeLessThan(15); // Should be well under suspicious speed
    });

    it('flags suspicious speed', () => {
      // First location
      locationValidator.validateMovement(playerId, baseLocation);

      jest.advanceTimersByTime(1000); // 1 second

      // Move ~1.7km in 1 second (~1700 m/s, way too fast)
      const newLocation: Location = {
        latitude: baseLocation.latitude + 0.015,
        longitude: baseLocation.longitude,
      };

      const result = locationValidator.validateMovement(playerId, newLocation);
      expect(result.isValidMovement).toBe(false);
      expect(result.suspiciousReason).toContain('exceeds maximum threshold');
    });
  });

  describe('Geofencing', () => {
    const safeArea: Location[] = [
      { latitude: 45.0, longitude: -75.0 },
      { latitude: 45.0, longitude: -74.0 },
      { latitude: 46.0, longitude: -74.0 },
      { latitude: 46.0, longitude: -75.0 },
    ];

    const unsafeArea: Location[] = [
      { latitude: 45.2, longitude: -74.5 },
      { latitude: 45.2, longitude: -74.4 },
      { latitude: 45.3, longitude: -74.4 },
      { latitude: 45.3, longitude: -74.5 },
    ];

    beforeEach(() => {
      locationValidator.clearBoundaries();
      locationValidator.addBoundary({
        id: 'safe_zone',
        type: 'safe',
        points: safeArea,
      });
      locationValidator.addBoundary({
        id: 'unsafe_zone',
        type: 'unsafe',
        points: unsafeArea,
      });
    });

    it('validates location within safe area', () => {
      const safeLocation: Location = {
        latitude: 45.5,
        longitude: -74.5,
      };
      const result = locationValidator.validateLocation(safeLocation);
      expect(result.isValid).toBe(true);
    });

    it('rejects location in unsafe area', () => {
      const unsafeLocation: Location = {
        latitude: 45.25,
        longitude: -74.45,
      };
      const result = locationValidator.validateLocation(unsafeLocation);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('unsafe area');
    });

    it('detects path crossing unsafe area', () => {
      const start: Location = { latitude: 45.1, longitude: -74.6 };
      const end: Location = { latitude: 45.4, longitude: -74.3 };

      const playerId = 'test-player';
      locationValidator.validateMovement(playerId, start);
      jest.advanceTimersByTime(1000);

      const result = locationValidator.validateMovement(playerId, end);
      expect(result.isValidMovement).toBe(false);
      expect(result.suspiciousReason).toContain('crosses unsafe area');
    });

    it('maintains safety buffer around unsafe areas', () => {
      const tooCloseLocation: Location = {
        latitude: 45.195, // Just outside but within buffer
        longitude: -74.5,
      };
      const result = locationValidator.validateLocation(tooCloseLocation);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('too close to an unsafe area');
    });
  });

  describe('Boundary Management', () => {
    it('correctly adds and removes boundaries', () => {
      const boundary = {
        id: 'test_boundary',
        type: 'unsafe' as const,
        points: [
          { latitude: 45.0, longitude: -75.0 },
          { latitude: 45.0, longitude: -74.0 },
          { latitude: 46.0, longitude: -74.0 },
        ],
      };

      locationValidator.addBoundary(boundary);

      // Test location near the boundary
      const nearLocation: Location = {
        latitude: 45.1,
        longitude: -74.5,
      };
      let result = locationValidator.validateLocation(nearLocation);
      expect(result.isValid).toBe(false); // Should be invalid due to proximity

      // Remove boundary and test again
      locationValidator.removeBoundary('test_boundary');
      result = locationValidator.validateLocation(nearLocation);
      expect(result.isValid).toBe(true); // Should now be valid
    });

    it('clears all boundaries', () => {
      const boundary1 = {
        id: 'boundary1',
        type: 'unsafe' as const,
        points: [
          { latitude: 45.0, longitude: -75.0 },
          { latitude: 45.0, longitude: -74.0 },
          { latitude: 46.0, longitude: -74.0 },
        ],
      };

      const boundary2 = {
        id: 'boundary2',
        type: 'unsafe' as const,
        points: [
          { latitude: 46.0, longitude: -76.0 },
          { latitude: 46.0, longitude: -75.0 },
          { latitude: 47.0, longitude: -75.0 },
        ],
      };

      locationValidator.addBoundary(boundary1);
      locationValidator.addBoundary(boundary2);

      // Location that would be unsafe with boundaries
      const testLocation: Location = {
        latitude: 45.1,
        longitude: -74.5,
      };

      let result = locationValidator.validateLocation(testLocation);
      expect(result.isValid).toBe(false);

      locationValidator.clearBoundaries();
      result = locationValidator.validateLocation(testLocation);
      expect(result.isValid).toBe(true);
    });
  });
});
