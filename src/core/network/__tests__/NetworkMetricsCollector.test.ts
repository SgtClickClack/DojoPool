import { NetworkMetricsCollector, NetworkMetrics } from '../metrics/NetworkMetricsCollector';
import { NodeManager } from '../NodeManager';

// Mock NodeManager
jest.mock('../NodeManager', () => {
  return {
    NodeManager: {
      getInstance: jest.fn(),
    },
  };
});

describe('NetworkMetricsCollector', () => {
  let metricsCollector: NetworkMetricsCollector;
  let mockNodeManager: jest.Mocked<NodeManager>;

  const mockMetrics: NetworkMetrics = {
    nodeId: 'test-node-1',
    timestamp: Date.now(),
    latency: 100,
    bandwidth: 1000,
    packetLoss: 0.01,
    connectedPeers: 5,
    messagesSent: 1000,
    messagesReceived: 950,
    bytesTransferred: 50000,
    errorRate: 0.005
  };

  beforeEach(() => {
    // Create mock NodeManager instance
    mockNodeManager = {
      getInstance: jest.fn(),
      getAllNodeIds: jest.fn(),
      getNodeMetrics: jest.fn(),
      on: jest.fn(),
    } as unknown as jest.Mocked<NodeManager>;

    // Setup NodeManager mock
    (NodeManager.getInstance as jest.Mock).mockReturnValue(mockNodeManager);
    
    // Reset the NetworkMetricsCollector instance
    // @ts-ignore - accessing private property for testing
    NetworkMetricsCollector.instance = undefined;
    
    metricsCollector = NetworkMetricsCollector.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should create only one instance (singleton)', () => {
      const instance1 = NetworkMetricsCollector.getInstance();
      const instance2 = NetworkMetricsCollector.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('collectMetrics', () => {
    it('should collect metrics from all nodes', () => {
      const nodeIds = ['node-1', 'node-2'];
      mockNodeManager.getAllNodeIds.mockReturnValue(nodeIds);
      mockNodeManager.getNodeMetrics.mockImplementation((nodeId) => ({
        ...mockMetrics,
        nodeId
      }));

      const metrics = metricsCollector.collectMetrics();
      
      expect(metrics.size).toBe(2);
      expect(metrics.get('node-1')).toEqual({ ...mockMetrics, nodeId: 'node-1' });
      expect(metrics.get('node-2')).toEqual({ ...mockMetrics, nodeId: 'node-2' });
    });

    it('should handle errors when collecting metrics', () => {
      const nodeIds = ['node-1', 'node-2'];
      mockNodeManager.getAllNodeIds.mockReturnValue(nodeIds);
      mockNodeManager.getNodeMetrics
        .mockImplementationOnce(() => { throw new Error('Failed to get metrics'); })
        .mockImplementationOnce((nodeId) => ({ ...mockMetrics, nodeId }));

      const metrics = metricsCollector.collectMetrics();
      
      expect(metrics.size).toBe(1);
      expect(metrics.get('node-2')).toEqual({ ...mockMetrics, nodeId: 'node-2' });
    });
  });

  describe('getMetricsHistory', () => {
    it('should return empty array for unknown node', () => {
      const history = metricsCollector.getMetricsHistory('unknown-node');
      expect(history).toEqual([]);
    });

    it('should return metrics history for known node', () => {
      const nodeId = 'test-node';
      mockNodeManager.getAllNodeIds.mockReturnValue([nodeId]);
      mockNodeManager.getNodeMetrics.mockReturnValue(mockMetrics);

      metricsCollector.collectMetrics(); // Collect first metrics
      const history = metricsCollector.getMetricsHistory(nodeId);
      
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockMetrics);
    });
  });

  describe('getAggregatedMetrics', () => {
    it('should return default metrics when no nodes exist', () => {
      mockNodeManager.getAllNodeIds.mockReturnValue([]);
      
      const aggregated = metricsCollector.getAggregatedMetrics();
      
      expect(aggregated).toEqual({
        nodeId: 'aggregate',
        timestamp: expect.any(Number),
        latency: 0,
        bandwidth: 0,
        packetLoss: 0,
        connectedPeers: 0,
        messagesSent: 0,
        messagesReceived: 0,
        bytesTransferred: 0,
        errorRate: 0
      });
    });

    it('should correctly aggregate metrics from multiple nodes', () => {
      const nodeIds = ['node-1', 'node-2'];
      mockNodeManager.getAllNodeIds.mockReturnValue(nodeIds);
      mockNodeManager.getNodeMetrics.mockImplementation((nodeId) => ({
        ...mockMetrics,
        nodeId
      }));

      const aggregated = metricsCollector.getAggregatedMetrics();
      
      expect(aggregated).toEqual({
        nodeId: 'aggregate',
        timestamp: expect.any(Number),
        latency: mockMetrics.latency, // Average of same values
        bandwidth: mockMetrics.bandwidth * 2, // Sum
        packetLoss: mockMetrics.packetLoss, // Average
        connectedPeers: mockMetrics.connectedPeers * 2, // Sum
        messagesSent: mockMetrics.messagesSent * 2, // Sum
        messagesReceived: mockMetrics.messagesReceived * 2, // Sum
        bytesTransferred: mockMetrics.bytesTransferred * 2, // Sum
        errorRate: mockMetrics.errorRate // Average
      });
    });
  });

  describe('clearHistory', () => {
    beforeEach(() => {
      const nodeIds = ['node-1', 'node-2'];
      mockNodeManager.getAllNodeIds.mockReturnValue(nodeIds);
      mockNodeManager.getNodeMetrics.mockImplementation((nodeId) => ({
        ...mockMetrics,
        nodeId
      }));
      metricsCollector.collectMetrics(); // Populate some history
    });

    it('should clear history for specific node', () => {
      metricsCollector.clearHistory('node-1');
      expect(metricsCollector.getMetricsHistory('node-1')).toEqual([]);
      expect(metricsCollector.getMetricsHistory('node-2')).toHaveLength(1);
    });

    it('should clear all history when no nodeId provided', () => {
      metricsCollector.clearHistory();
      expect(metricsCollector.getMetricsHistory('node-1')).toEqual([]);
      expect(metricsCollector.getMetricsHistory('node-2')).toEqual([]);
    });
  });

  describe('node registration events', () => {
    it('should setup history for newly registered nodes', () => {
      // Simulate node registration
      const callback = (mockNodeManager.on as jest.Mock).mock.calls
        .find(call => call[0] === 'nodeRegistered')[1];
      
      callback('new-node');
      expect(metricsCollector.getMetricsHistory('new-node')).toEqual([]);
    });

    it('should cleanup history for unregistered nodes', () => {
      // First register and collect some metrics
      const nodeId = 'test-node';
      mockNodeManager.getAllNodeIds.mockReturnValue([nodeId]);
      mockNodeManager.getNodeMetrics.mockReturnValue(mockMetrics);
      metricsCollector.collectMetrics();

      // Simulate node unregistration
      const callback = (mockNodeManager.on as jest.Mock).mock.calls
        .find(call => call[0] === 'nodeUnregistered')[1];
      
      callback(nodeId);
      expect(metricsCollector.getMetricsHistory(nodeId)).toEqual([]);
    });
  });
}); 