import { locationValidator } from '../validation';
import { gameMetricsMonitor, locationMonitor } from '../monitoring';
import { Location } from '../location';

describe('Safety System Scenarios', () => {
  beforeEach(() => {
    locationValidator.clearBoundaries();
    gameMetricsMonitor.reset();
    locationMonitor.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('End-to-End Scenarios', () => {
    it('handles a complete player session with safety violations', () => {
      const playerId = 'test_player';
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };

      // Set up game boundaries
      locationValidator.addBoundary({
        id: 'safe_zone',
        type: 'safe',
        points: [
          { latitude: 44.9, longitude: -75.1 },
          { latitude: 44.9, longitude: -74.9 },
          { latitude: 45.1, longitude: -74.9 },
          { latitude: 45.1, longitude: -75.1 },
        ],
      });

      locationValidator.addBoundary({
        id: 'unsafe_zone',
        type: 'unsafe',
        points: [
          { latitude: 45.05, longitude: -75.05 },
          { latitude: 45.05, longitude: -74.95 },
          { latitude: 45.15, longitude: -74.95 },
          { latitude: 45.15, longitude: -75.05 },
        ],
      });

      // Simulate normal gameplay
      const normalLocations: Location[] = [
        baseLocation,
        { latitude: 45.01, longitude: -75.01 },
        { latitude: 45.02, longitude: -75.02 },
      ];

      normalLocations.forEach((location) => {
        const validation = locationValidator.validateLocation(location, playerId);
        expect(validation.isValid).toBe(true);
        locationMonitor.recordLocation(playerId, location);
        jest.advanceTimersByTime(60000); // 1 minute between updates
      });

      // Attempt to enter unsafe area
      const unsafeLocation: Location = { latitude: 45.1, longitude: -75.0 };
      const unsafeValidation = locationValidator.validateLocation(unsafeLocation, playerId);
      expect(unsafeValidation.isValid).toBe(false);
      expect(unsafeValidation.automatedResponse?.type).toBe('warning');

      // Record the violation
      if (!unsafeValidation.isValid) {
        gameMetricsMonitor.recordSafetyIncident(
          playerId,
          'boundary_violation',
          unsafeValidation.reason || 'Unknown'
        );
      }

      // Simulate suspicious movement
      jest.advanceTimersByTime(1000); // 1 second
      const fastLocation: Location = { latitude: 45.2, longitude: -75.0 }; // Fast movement
      const movementValidation = locationValidator.validateMovement(playerId, fastLocation);
      expect(movementValidation.isValidMovement).toBe(false);
      expect(movementValidation.automatedResponse?.type).toBe('warning');

      if (!movementValidation.isValidMovement) {
        gameMetricsMonitor.recordSafetyIncident(
          playerId,
          'speed_violation',
          movementValidation.suspiciousReason || 'Unknown'
        );
      }

      // Verify monitoring system state
      const metrics = gameMetricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBe(2);
      expect(metrics.safetyIncidents.byType.boundary_violation).toBe(1);
      expect(metrics.safetyIncidents.byType.speed_violation).toBe(1);

      // Verify location history
      const playerPath = locationMonitor.getPlayerPath(playerId);
      expect(playerPath.length).toBe(3); // Only valid locations should be recorded
    });

    it('escalates responses for repeated violations', () => {
      const playerId = 'repeat_offender';
      const unsafeLocation: Location = { latitude: 45.1, longitude: -75.0 };

      // Set up unsafe area
      locationValidator.addBoundary({
        id: 'unsafe_zone',
        type: 'unsafe',
        points: [
          { latitude: 45.05, longitude: -75.05 },
          { latitude: 45.05, longitude: -74.95 },
          { latitude: 45.15, longitude: -74.95 },
          { latitude: 45.15, longitude: -75.05 },
        ],
      });

      // Function to simulate violation
      const simulateViolation = () => {
        const validation = locationValidator.validateLocation(unsafeLocation, playerId);
        if (!validation.isValid) {
          gameMetricsMonitor.recordSafetyIncident(
            playerId,
            'boundary_violation',
            validation.reason || 'Unknown'
          );
          return validation.automatedResponse;
        }
        return null;
      };

      // First violation
      const firstResponse = simulateViolation();
      expect(firstResponse?.type).toBe('warning');

      // Second violation
      jest.advanceTimersByTime(60000); // 1 minute
      const secondResponse = simulateViolation();
      expect(secondResponse?.type).toBe('warning');

      // Third violation
      jest.advanceTimersByTime(60000);
      const thirdResponse = simulateViolation();
      expect(thirdResponse?.type).toBe('suspension');

      // Fourth violation (during suspension)
      jest.advanceTimersByTime(60000);
      const fourthResponse = simulateViolation();
      expect(fourthResponse?.type).toBe('suspension');

      // Fifth violation (severe)
      jest.advanceTimersByTime(60000);
      const fifthResponse = simulateViolation();
      expect(fifthResponse?.type).toBe('ban');

      // Verify violation history
      const summary = locationValidator.getViolationSummary(playerId);
      expect(summary.recentViolations).toBe(5);
      expect(summary.severity.high).toBeGreaterThan(0);
    });

    it('handles concurrent player violations', async () => {
      const numPlayers = 10;
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };
      const unsafeLocation: Location = { latitude: 45.1, longitude: -75.0 };

      // Set up unsafe area
      locationValidator.addBoundary({
        id: 'unsafe_zone',
        type: 'unsafe',
        points: [
          { latitude: 45.05, longitude: -75.05 },
          { latitude: 45.05, longitude: -74.95 },
          { latitude: 45.15, longitude: -74.95 },
          { latitude: 45.15, longitude: -75.05 },
        ],
      });

      // Simulate multiple players violating simultaneously
      await Promise.all(
        Array.from({ length: numPlayers }, async (_, index) => {
          const playerId = `player_${index}`;

          // Start with valid location
          locationValidator.validateLocation(baseLocation, playerId);
          locationMonitor.recordLocation(playerId, baseLocation);

          // Small random delay
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

          // Violate boundary
          const validation = locationValidator.validateLocation(unsafeLocation, playerId);
          if (!validation.isValid) {
            gameMetricsMonitor.recordSafetyIncident(
              playerId,
              'boundary_violation',
              validation.reason || 'Unknown'
            );
          }
        })
      );

      // Verify system state
      const metrics = gameMetricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBe(numPlayers);
      expect(metrics.safetyIncidents.byType.boundary_violation).toBe(numPlayers);

      // Verify each player's state
      for (let i = 0; i < numPlayers; i++) {
        const playerId = `player_${i}`;
        const summary = locationValidator.getViolationSummary(playerId);
        expect(summary.recentViolations).toBe(1);
      }
    });

    it('maintains system integrity during extended gameplay', () => {
      const playerId = 'long_session_player';
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };
      const sessionDuration = 4 * 60 * 60 * 1000; // 4 hours
      const updateInterval = 60 * 1000; // 1 minute

      // Set up boundaries
      locationValidator.addBoundary({
        id: 'unsafe_zone',
        type: 'unsafe',
        points: [
          { latitude: 45.05, longitude: -75.05 },
          { latitude: 45.05, longitude: -74.95 },
          { latitude: 45.15, longitude: -74.95 },
          { latitude: 45.15, longitude: -75.05 },
        ],
      });

      let currentTime = 0;
      let violationCount = 0;
      const maxViolations = 10;

      // Simulate gameplay over time
      while (currentTime < sessionDuration && violationCount < maxViolations) {
        // Generate location with occasional violations
        const shouldViolate = Math.random() < 0.1; // 10% chance of violation
        const location: Location = shouldViolate
          ? { latitude: 45.1, longitude: -75.0 } // Unsafe
          : {
              latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.01,
              longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.01,
            };

        // Validate location
        const validation = locationValidator.validateLocation(location, playerId);
        if (!validation.isValid) {
          gameMetricsMonitor.recordSafetyIncident(
            playerId,
            'boundary_violation',
            validation.reason || 'Unknown'
          );
          violationCount++;
        } else {
          locationMonitor.recordLocation(playerId, location);
        }

        currentTime += updateInterval;
        jest.advanceTimersByTime(updateInterval);
      }

      // Verify system state
      const metrics = gameMetricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBeLessThanOrEqual(maxViolations);

      const playerPath = locationMonitor.getPlayerPath(playerId);
      expect(playerPath.length).toBeGreaterThan(0);

      const summary = locationValidator.getViolationSummary(playerId);
      expect(summary.recentViolations).toBeLessThanOrEqual(maxViolations);
    });
  });
});
