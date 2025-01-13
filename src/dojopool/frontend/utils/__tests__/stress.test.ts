import { locationValidator } from '../validation';
import { gameMetricsMonitor, locationMonitor } from '../monitoring';
import { Location } from '../location';

describe('Safety System Stress Tests', () => {
  const generateRandomLocation = (base: Location, radius: number): Location => ({
    latitude: base.latitude + (Math.random() - 0.5) * radius,
    longitude: base.longitude + (Math.random() - 0.5) * radius,
  });

  beforeEach(() => {
    locationValidator.clearBoundaries();
    gameMetricsMonitor.reset();
    locationMonitor.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('High Concurrency Tests', () => {
    it('handles many concurrent players with location updates', async () => {
      const numPlayers = 1000;
      const updatesPerPlayer = 10;
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };

      // Set up some boundaries
      const boundaries = Array.from({ length: 10 }, (_, i) => ({
        id: `boundary_${i}`,
        type: 'unsafe' as const,
        points: Array.from({ length: 4 }, (_, j) => generateRandomLocation(baseLocation, 0.1)),
      }));

      boundaries.forEach((boundary) => locationValidator.addBoundary(boundary));

      // Simulate concurrent player updates
      const start = performance.now();

      await Promise.all(
        Array.from({ length: numPlayers }, (_, playerIndex) => {
          const playerId = `player_${playerIndex}`;
          return Promise.all(
            Array.from({ length: updatesPerPlayer }, async (_, updateIndex) => {
              const location = generateRandomLocation(baseLocation, 0.2);

              // Validate and record location
              const validation = locationValidator.validateLocation(location, playerId);
              locationMonitor.recordLocation(playerId, location);

              // Small delay to simulate real-world conditions
              await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));

              if (!validation.isValid && validation.automatedResponse) {
                gameMetricsMonitor.recordSafetyIncident(
                  playerId,
                  'stress_test_violation',
                  validation.reason || 'Unknown'
                );
              }
            })
          );
        })
      );

      const end = performance.now();
      const totalOperations = numPlayers * updatesPerPlayer;
      const timePerOperation = (end - start) / totalOperations;

      // Verify system performance
      expect(timePerOperation).toBeLessThan(1); // Less than 1ms per operation

      // Verify monitoring system handled the load
      const metrics = gameMetricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBeGreaterThan(0);
      expect(Object.keys(metrics.safetyIncidents.byType).length).toBeGreaterThan(0);
    });

    it('maintains response time under heavy violation load', async () => {
      const numPlayers = 100;
      const violationsPerPlayer = 5;
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };

      // Set up a complex unsafe area
      locationValidator.addBoundary({
        id: 'stress_test_boundary',
        type: 'unsafe',
        points: [
          { latitude: 45.1, longitude: -75.1 },
          { latitude: 45.1, longitude: -74.9 },
          { latitude: 44.9, longitude: -74.9 },
          { latitude: 44.9, longitude: -75.1 },
        ],
      });

      const responseTimes: number[] = [];

      // Generate violations concurrently
      await Promise.all(
        Array.from({ length: numPlayers }, (_, playerIndex) => {
          const playerId = `player_${playerIndex}`;
          return Promise.all(
            Array.from({ length: violationsPerPlayer }, async () => {
              const start = performance.now();

              // Generate violation in unsafe area
              const location = {
                latitude: 45.0,
                longitude: -75.0,
              };

              const validation = locationValidator.validateLocation(location, playerId);
              const end = performance.now();
              responseTimes.push(end - start);

              if (!validation.isValid && validation.automatedResponse) {
                // Record incident and check response time
                const incidentStart = performance.now();
                gameMetricsMonitor.recordSafetyIncident(
                  playerId,
                  'stress_test_violation',
                  validation.reason || 'Unknown'
                );
                const incidentEnd = performance.now();
                responseTimes.push(incidentEnd - incidentStart);
              }
            })
          );
        })
      );

      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      // Verify performance
      expect(avgResponseTime).toBeLessThan(5); // Average under 5ms
      expect(maxResponseTime).toBeLessThan(20); // Max under 20ms
    });

    it('handles rapid boundary changes under load', async () => {
      const numOperations = 1000;
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };
      const players = Array.from({ length: 100 }, (_, i) => `player_${i}`);

      const operations = Array.from({ length: numOperations }, () => ({
        type: Math.random() < 0.7 ? 'validation' : 'boundary',
        player: players[Math.floor(Math.random() * players.length)],
      }));

      const start = performance.now();

      await Promise.all(
        operations.map(async (op, index) => {
          if (op.type === 'boundary') {
            // Add or remove boundary
            if (Math.random() < 0.5) {
              locationValidator.addBoundary({
                id: `boundary_${index}`,
                type: 'unsafe',
                points: Array.from({ length: 4 }, () => generateRandomLocation(baseLocation, 0.1)),
              });
            } else {
              locationValidator.removeBoundary(`boundary_${index - 1}`);
            }
          } else {
            // Validate location
            const location = generateRandomLocation(baseLocation, 0.2);
            locationValidator.validateLocation(location, op.player);
          }

          // Small random delay
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
        })
      );

      const end = performance.now();
      const timePerOperation = (end - start) / numOperations;

      // Verify performance
      expect(timePerOperation).toBeLessThan(1); // Less than 1ms per operation
    });

    it('maintains memory stability under extended load', async () => {
      const numPlayers = 500;
      const hoursSimulated = 2;
      const updatesPerHour = 60; // One update per minute
      const baseLocation: Location = { latitude: 45.0, longitude: -75.0 };

      const initialMemory = process.memoryUsage().heapUsed;
      const memoryMeasurements: number[] = [initialMemory];

      // Simulate game time
      for (let hour = 0; hour < hoursSimulated; hour++) {
        for (let update = 0; update < updatesPerHour; update++) {
          await Promise.all(
            Array.from({ length: numPlayers }, async (_, playerIndex) => {
              const playerId = `player_${playerIndex}`;
              const location = generateRandomLocation(baseLocation, 0.1);

              // Process location update
              const validation = locationValidator.validateLocation(location, playerId);
              locationMonitor.recordLocation(playerId, location);

              if (!validation.isValid) {
                gameMetricsMonitor.recordSafetyIncident(
                  playerId,
                  'memory_test_violation',
                  validation.reason || 'Unknown'
                );
              }

              // Simulate time passing
              jest.advanceTimersByTime(60000); // 1 minute
            })
          );

          // Measure memory usage
          memoryMeasurements.push(process.memoryUsage().heapUsed);
        }
      }

      // Calculate memory stability metrics
      const memoryVariation = Math.max(...memoryMeasurements) - Math.min(...memoryMeasurements);
      const averageMemory =
        memoryMeasurements.reduce((a, b) => a + b, 0) / memoryMeasurements.length;
      const memoryGrowthRate =
        (memoryMeasurements[memoryMeasurements.length - 1] - initialMemory) /
        (hoursSimulated * 3600000);

      // Verify memory stability
      expect(memoryVariation / averageMemory).toBeLessThan(0.2); // Less than 20% variation
      expect(memoryGrowthRate).toBeLessThan(1000); // Less than 1KB/s growth
    });
  });
});
