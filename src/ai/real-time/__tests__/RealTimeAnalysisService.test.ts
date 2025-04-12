import { RealTimeAnalysisService } from '../RealTimeAnalysisService';
import { GameEvent } from '../../types/game';

describe('RealTimeAnalysisService', () => {
  let service: RealTimeAnalysisService;
  let mockEvent: GameEvent;

  beforeEach(() => {
    service = new RealTimeAnalysisService();
    mockEvent = {
      playerId: 'player1',
      shotType: 'straight',
      success: true,
      accuracy: 0.85,
      duration: 2000,
      timestamp: Date.now()
    };
  });

  afterEach(() => {
    service.stopProcessing();
  });

  describe('Event Processing', () => {
    it('should start and stop processing', () => {
      service.startProcessing();
      expect(service.isProcessing()).toBe(true);

      service.stopProcessing();
      expect(service.isProcessing()).toBe(false);
    });

    it('should process queued events', () => {
      const handler = jest.fn();
      service.registerEventHandler('straight', handler);
      service.startProcessing();

      service.enqueueEvent(mockEvent);
      
      // Wait for processing
      return new Promise(resolve => {
        setTimeout(() => {
          expect(handler).toHaveBeenCalledWith(mockEvent);
          resolve(undefined);
        }, 150);
      });
    });

    it('should maintain event order', () => {
      const events: GameEvent[] = [];
      const handler = jest.fn().mockImplementation(event => {
        events.push(event);
      });

      service.registerEventHandler('straight', handler);
      service.startProcessing();

      const event1 = { ...mockEvent, timestamp: 1000 };
      const event2 = { ...mockEvent, timestamp: 2000 };
      const event3 = { ...mockEvent, timestamp: 3000 };

      service.enqueueEvent(event1);
      service.enqueueEvent(event2);
      service.enqueueEvent(event3);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(events[0].timestamp).toBe(1000);
          expect(events[1].timestamp).toBe(2000);
          expect(events[2].timestamp).toBe(3000);
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('Event Handlers', () => {
    it('should register and unregister handlers', () => {
      const handler = jest.fn();
      service.registerEventHandler('straight', handler);
      service.startProcessing();

      service.enqueueEvent(mockEvent);
      
      return new Promise(resolve => {
        setTimeout(() => {
          expect(handler).toHaveBeenCalled();
          handler.mockClear();

          service.unregisterEventHandler('straight', handler);
          service.enqueueEvent(mockEvent);

          setTimeout(() => {
            expect(handler).not.toHaveBeenCalled();
            resolve(undefined);
          }, 150);
        }, 150);
      });
    });

    it('should handle multiple handlers for same event type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      service.registerEventHandler('straight', handler1);
      service.registerEventHandler('straight', handler2);
      service.startProcessing();

      service.enqueueEvent(mockEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(handler1).toHaveBeenCalledWith(mockEvent);
          expect(handler2).toHaveBeenCalledWith(mockEvent);
          resolve(undefined);
        }, 150);
      });
    });

    it('should handle errors in event handlers', () => {
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const normalHandler = jest.fn();

      service.registerEventHandler('straight', errorHandler);
      service.registerEventHandler('straight', normalHandler);
      service.startProcessing();

      service.enqueueEvent(mockEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(errorHandler).toHaveBeenCalled();
          expect(normalHandler).toHaveBeenCalled();
          const metrics = service.getPerformanceMetrics();
          expect(metrics.errorCount).toBe(1);
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should track processing time', () => {
      service.startProcessing();
      service.enqueueEvent(mockEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          const metrics = service.getPerformanceMetrics();
          expect(metrics.processingTime.length).toBeGreaterThan(0);
          expect(metrics.processingTime[0]).toBeGreaterThan(0);
          resolve(undefined);
        }, 150);
      });
    });

    it('should track queue size', () => {
      service.enqueueEvent(mockEvent);
      service.enqueueEvent(mockEvent);

      const metrics = service.getPerformanceMetrics();
      expect(metrics.queueSize).toContain(1);
      expect(metrics.queueSize).toContain(2);
    });

    it('should track event and error counts', () => {
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      service.registerEventHandler('straight', errorHandler);
      service.startProcessing();

      service.enqueueEvent(mockEvent);
      service.enqueueEvent(mockEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          const metrics = service.getPerformanceMetrics();
          expect(metrics.eventCount).toBe(2);
          expect(metrics.errorCount).toBe(2);
          resolve(undefined);
        }, 150);
      });
    });

    it('should clear metrics', () => {
      service.startProcessing();
      service.enqueueEvent(mockEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          service.clearMetrics();
          const metrics = service.getPerformanceMetrics();
          expect(metrics.processingTime).toHaveLength(0);
          expect(metrics.queueSize).toHaveLength(0);
          expect(metrics.eventCount).toBe(0);
          expect(metrics.errorCount).toBe(0);
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('Queue Management', () => {
    it('should return correct queue size', () => {
      expect(service.getQueueSize()).toBe(0);
      
      service.enqueueEvent(mockEvent);
      expect(service.getQueueSize()).toBe(1);
      
      service.enqueueEvent(mockEvent);
      expect(service.getQueueSize()).toBe(2);
    });

    it('should clear queue after processing', () => {
      service.startProcessing();
      service.enqueueEvent(mockEvent);
      service.enqueueEvent(mockEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(service.getQueueSize()).toBe(0);
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should continue processing after handler error', () => {
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const normalHandler = jest.fn();

      service.registerEventHandler('straight', errorHandler);
      service.registerEventHandler('straight', normalHandler);
      service.startProcessing();

      service.enqueueEvent(mockEvent);
      service.enqueueEvent(mockEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(normalHandler).toHaveBeenCalledTimes(2);
          const metrics = service.getPerformanceMetrics();
          expect(metrics.eventCount).toBe(2);
          expect(metrics.errorCount).toBe(2);
          resolve(undefined);
        }, 150);
      });
    });

    it('should handle malformed events', () => {
      const handler = jest.fn();
      service.registerEventHandler('straight', handler);
      service.startProcessing();

      const malformedEvent = { ...mockEvent, shotType: undefined } as unknown as GameEvent;
      service.enqueueEvent(malformedEvent);

      return new Promise(resolve => {
        setTimeout(() => {
          expect(handler).not.toHaveBeenCalled();
          const metrics = service.getPerformanceMetrics();
          expect(metrics.errorCount).toBe(1);
          resolve(undefined);
        }, 150);
      });
    });
  });
}); 