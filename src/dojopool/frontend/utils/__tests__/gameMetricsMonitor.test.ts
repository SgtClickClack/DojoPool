import { GameMetricsMonitor } from '../monitoring';
import { DataCompressor } from '../dataCompressor';

describe('GameMetricsMonitor', () => {
  let metricsMonitor: GameMetricsMonitor;
  let mockDataCompressor: jest.Mocked<DataCompressor>;

  beforeEach(() => {
    // Reset singleton instance
    (GameMetricsMonitor as any).instance = null;
    metricsMonitor = GameMetricsMonitor.getInstance();

    // Mock DataCompressor
    mockDataCompressor = {
      getInstance: jest.fn().mockReturnThis(),
      compressData: jest.fn(),
      decompressData: jest.fn(),
      archiveData: jest.fn(),
      retrieveArchive: jest.fn(),
      listArchives: jest.fn().mockReturnValue([]),
      getArchiveStats: jest.fn(),
      shouldArchive: jest.fn()
    } as unknown as jest.Mocked<DataCompressor>;

    jest.spyOn(DataCompressor, 'getInstance')
      .mockReturnValue(mockDataCompressor);
  });

  afterEach(() => {
    metricsMonitor.reset();
  });

  describe('player tracking', () => {
    it('should track active players', () => {
      metricsMonitor.recordPlayerJoin('player1', 'game1');
      metricsMonitor.recordPlayerJoin('player2', 'game1');

      const metrics = metricsMonitor.getMetrics();
      expect(metrics.activePlayers).toBe(2);
      expect(metrics.activeGames).toBe(1);
    });

    it('should update player count on leave', () => {
      metricsMonitor.recordPlayerJoin('player1', 'game1');
      metricsMonitor.recordPlayerJoin('player2', 'game1');
      metricsMonitor.recordPlayerLeave('player1', 5, 300000); // 5 clues, 5 minutes

      const metrics = metricsMonitor.getMetrics();
      expect(metrics.activePlayers).toBe(1);
      expect(metrics.playerRetention).toBeGreaterThan(0);
    });

    it('should track player progress', () => {
      metricsMonitor.recordPlayerJoin('player1', 'game1');
      metricsMonitor.recordClueCompletion('player1', 10); // 1/10 clues

      const metrics = metricsMonitor.getMetrics();
      expect(metrics.playerProgress.player1).toBe(10); // 10%
    });
  });

  describe('game metrics', () => {
    it('should track clue completion rate', () => {
      metricsMonitor.recordPlayerJoin('player1', 'game1');
      
      // Complete clues at different times
      jest.useFakeTimers();
      const startTime = Date.now();
      
      jest.setSystemTime(startTime);
      metricsMonitor.recordClueCompletion('player1', 10);
      
      jest.setSystemTime(startTime + 30000); // 30 seconds later
      metricsMonitor.recordClueCompletion('player1', 10);

      const metrics = metricsMonitor.getMetrics();
      expect(metrics.completedClues).toBe(2);
      expect(metrics.clueDiscoveryRate).toBeGreaterThan(0);
      
      jest.useRealTimers();
    });

    it('should calculate completion rate', () => {
      metricsMonitor.recordPlayerJoin('player1', 'game1');
      metricsMonitor.recordPlayerJoin('player2', 'game2');
      
      metricsMonitor.recordGameCompletion('player1', 100, 600000); // 10 minutes

      const metrics = metricsMonitor.getMetrics();
      expect(metrics.totalGamesCompleted).toBe(1);
      expect(metrics.completionRate).toBe(50); // 1 out of 2 games completed
    });

    it('should track average completion time', () => {
      metricsMonitor.recordPlayerJoin('player1', 'game1');
      
      jest.useFakeTimers();
      const startTime = Date.now();
      
      jest.setSystemTime(startTime);
      metricsMonitor.recordClueCompletion('player1', 10);
      
      jest.setSystemTime(startTime + 60000); // 1 minute later
      metricsMonitor.recordClueCompletion('player1', 10);

      const metrics = metricsMonitor.getMetrics();
      expect(metrics.averageCompletionTime).toBe(60000);
      
      jest.useRealTimers();
    });

    it('should track scores', () => {
      metricsMonitor.recordScore(100);
      metricsMonitor.recordScore(200);
      metricsMonitor.recordScore(300);

      const metrics = metricsMonitor.getMetrics();
      expect(metrics.averageScore).toBe(200);
    });
  });

  describe('safety monitoring', () => {
    it('should track safety incidents', () => {
      metricsMonitor.recordSafetyIncident('player1', 'collision', 'Near miss');
      metricsMonitor.recordSafetyIncident('player2', 'boundary', 'Out of bounds');

      const metrics = metricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.total).toBe(2);
      expect(metrics.safetyIncidents.byType).toEqual({
        collision: 1,
        boundary: 1
      });
    });

    it('should maintain recent incidents list', () => {
      for (let i = 0; i < 60; i++) {
        metricsMonitor.recordSafetyIncident(
          `player${i}`,
          'test',
          `incident ${i}`
        );
      }

      const metrics = metricsMonitor.getMetrics();
      expect(metrics.safetyIncidents.recentIncidents.length).toBe(50); // Max recent incidents
      expect(metrics.safetyIncidents.total).toBe(60);
    });
  });

  describe('alert management', () => {
    it('should handle alert subscriptions', () => {
      const callback = jest.fn();
      const unsubscribe = metricsMonitor.subscribeToAlerts(callback);

      metricsMonitor.addAlert('warning', 'Test alert');
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warning',
          message: 'Test alert'
        })
      );

      unsubscribe();
      metricsMonitor.addAlert('info', 'Another alert');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should acknowledge alerts', () => {
      const alert = metricsMonitor.addAlert('warning', 'Test alert');
      metricsMonitor.acknowledgeAlert(alert.id, 'Handled');

      const alerts = metricsMonitor.getAlerts({ acknowledged: true });
      expect(alerts).toHaveLength(1);
      expect(alerts[0].details?.acknowledgeNote).toBe('Handled');
    });

    it('should filter alerts', () => {
      metricsMonitor.addAlert('error', 'Error alert');
      metricsMonitor.addAlert('warning', 'Warning alert');
      metricsMonitor.addAlert('info', 'Info alert');

      const errorAlerts = metricsMonitor.getAlerts({ severity: 'error' });
      expect(errorAlerts).toHaveLength(1);
      expect(errorAlerts[0].severity).toBe('error');

      const limitedAlerts = metricsMonitor.getAlerts({ limit: 2 });
      expect(limitedAlerts).toHaveLength(2);
    });
  });

  describe('performance monitoring', () => {
    it('should monitor performance thresholds', () => {
      const callback = jest.fn();
      metricsMonitor.subscribeToAlerts(callback);

      metricsMonitor.monitorPerformance('responseTime', 2000);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'warning',
          message: expect.stringContaining('Performance threshold exceeded')
        })
      );
    });

    it('should track system health', () => {
      const callback = jest.fn();
      metricsMonitor.subscribeToAlerts(callback);

      metricsMonitor.monitorSystemHealth({
        online: true,
        services: {
          database: false,
          cache: true
        }
      });

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          message: 'System health check failed'
        })
      );
    });
  });

  describe('data management', () => {
    it('should handle metric batching', () => {
      const data = { timestamp: Date.now(), value: 100 };
      metricsMonitor.addMetricData('test', data);

      // Should not process until batch size is reached
      expect(metricsMonitor.getMetrics()).toBeDefined();

      // Add more data to reach batch size
      for (let i = 0; i < 49; i++) {
        metricsMonitor.addMetricData('test', {
          timestamp: Date.now() + i * 1000,
          value: 100 + i
        });
      }

      // Should process batch
      expect(metricsMonitor.getMetrics()).toBeDefined();
    });

    it('should use caching for frequent requests', () => {
      const metrics = metricsMonitor.getMetrics();
      const cachedMetrics = metricsMonitor.getMetrics();

      expect(metrics).toEqual(cachedMetrics);
    });
  });

  describe('data archiving', () => {
    it('should archive metrics after game completion', async () => {
      const testMetrics = {
        activePlayers: 10,
        completedClues: 50,
        averageCompletionTime: 300,
        // ... other metrics
      };

      mockDataCompressor.listArchives.mockReturnValue([]);
      mockDataCompressor.archiveData.mockResolvedValue({
        archiveKey: 'test_archive',
        metadata: {
          timestamp: Date.now(),
          originalSize: 1000,
          compressedSize: 500,
          recordCount: 1,
          dataType: 'game_metrics',
          checksum: '123'
        }
      });

      metricsMonitor.recordGameCompletion('player1', 100, 600000);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockDataCompressor.archiveData).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: expect.any(Object),
          alerts: expect.any(Array)
        }),
        'game_metrics'
      );
    });

    it('should archive metrics when there are many acknowledged alerts', async () => {
      // Add many acknowledged alerts
      for (let i = 0; i < 101; i++) {
        const alert = metricsMonitor.addAlert('info', `Test alert ${i}`);
        metricsMonitor.acknowledgeAlert(alert.id);
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockDataCompressor.archiveData).toHaveBeenCalled();
    });

    it('should retrieve historical metrics', async () => {
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      const mockArchives = [
        {
          key: 'archive_1',
          metadata: {
            timestamp: now - 3 * 24 * 60 * 60 * 1000,
            dataType: 'game_metrics'
          }
        },
        {
          key: 'archive_2',
          metadata: {
            timestamp: now - 5 * 24 * 60 * 60 * 1000,
            dataType: 'game_metrics'
          }
        }
      ];

      const mockArchiveData = {
        timestamp: now - 3 * 24 * 60 * 60 * 1000,
        metrics: {
          activePlayers: 10,
          completionRate: 75,
          averageScore: 100
        },
        alerts: []
      };

      mockDataCompressor.listArchives.mockReturnValue(mockArchives);
      mockDataCompressor.retrieveArchive.mockResolvedValue(mockArchiveData);

      const historicalMetrics = await metricsMonitor.getHistoricalMetrics(
        new Date(weekAgo),
        new Date(now)
      );

      expect(historicalMetrics).toHaveLength(2);
      expect(historicalMetrics[0]).toEqual(mockArchiveData);
    });

    it('should get metrics snapshot with historical data', async () => {
      const now = Date.now();
      const mockHistoricalData = [
        {
          timestamp: now - 24 * 60 * 60 * 1000,
          metrics: {
            activePlayers: 10,
            completionRate: 75,
            clueDiscoveryRate: 5,
            playerRetention: 80,
            averageScore: 100
          },
          alerts: []
        },
        {
          timestamp: now - 2 * 24 * 60 * 60 * 1000,
          metrics: {
            activePlayers: 15,
            completionRate: 80,
            clueDiscoveryRate: 6,
            playerRetention: 85,
            averageScore: 110
          },
          alerts: []
        }
      ];

      mockDataCompressor.listArchives.mockReturnValue(
        mockHistoricalData.map((data, index) => ({
          key: `archive_${index}`,
          metadata: {
            timestamp: data.timestamp,
            dataType: 'game_metrics'
          }
        }))
      );

      mockDataCompressor.retrieveArchive
        .mockImplementation(async (key) => {
          const index = parseInt(key.split('_')[1]);
          return mockHistoricalData[index];
        });

      const snapshot = await metricsMonitor.getMetricsSnapshot();

      expect(snapshot).toMatchObject({
        current: expect.any(Object),
        historical: {
          dailyAverage: expect.any(Object),
          weeklyTrend: expect.arrayContaining([
            expect.objectContaining({
              timestamp: expect.any(Number),
              metrics: expect.objectContaining({
                activePlayers: expect.any(Number),
                completionRate: expect.any(Number)
              })
            })
          ])
        }
      });

      expect(snapshot.historical.weeklyTrend).toHaveLength(2);
    });

    it('should get archive statistics', async () => {
      mockDataCompressor.getArchiveStats.mockReturnValue({
        totalSize: 1000,
        compressionRatio: 2,
        archiveCount: 5
      });

      mockDataCompressor.listArchives.mockReturnValue([
        {
          key: 'archive_1',
          metadata: {
            timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
            dataType: 'game_metrics'
          }
        },
        {
          key: 'archive_2',
          metadata: {
            timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
            dataType: 'game_metrics'
          }
        }
      ]);

      const stats = await metricsMonitor.getArchiveStats();

      expect(stats).toMatchObject({
        totalArchives: 2,
        oldestArchive: expect.any(Number),
        totalStorageUsed: 1000,
        compressionRatio: 2
      });
    });

    it('should handle archiving errors', async () => {
      mockDataCompressor.archiveData.mockRejectedValue(
        new Error('Storage error')
      );

      metricsMonitor.recordGameCompletion('player1', 100, 600000);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      const alerts = metricsMonitor.getAlerts({ severity: 'error' });
      expect(alerts).toHaveLength(1);
      expect(alerts[0].message).toBe('Failed to archive metrics data');
    });
  });
});
