import { NetworkConsensusIntegration, NetworkConsensusConfig } from '../NetworkConsensusIntegration';
import { ConsensusState } from '../../consensus/types';
import { GameState } from '../../../types/game';

// Mock dependencies
jest.mock('../NetworkTransport');
jest.mock('../../consensus/ConsensusManager');
jest.mock('../../replication/StateReplicator');
jest.mock('../../consistency/VectorClock');

describe('NetworkConsensusIntegration', () => {
  let integration: NetworkConsensusIntegration;
  let mockConfig: NetworkConsensusConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup test config
    mockConfig = {
      nodeId: 'test-node-1',
      nodes: ['test-node-1', 'test-node-2', 'test-node-3'],
      port: 3002,
      heartbeatInterval: 1000,
      electionTimeout: 5000,
      syncInterval: 2000,
    };

    integration = new NetworkConsensusIntegration(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(integration).toBeDefined();
      expect(integration.getLeader()).toBeNull();
      expect(integration.getCurrentTerm()).toBe(0);
      expect(integration.isLeader()).toBeFalsy();
    });

    it('should setup event handlers correctly', () => {
      const eventSpy = jest.spyOn(integration, 'emit');

      // Trigger state update event
      const mockState: GameState = { id: 'test-game' };
      integration['stateReplicator'].emit('stateUpdated', mockState);
      expect(eventSpy).toHaveBeenCalledWith('stateUpdated', mockState);

      // Trigger consensus state change
      integration['consensusManager'].emit('state:change', ConsensusState.LEADER);
      expect(eventSpy).toHaveBeenCalledWith('consensusStateChanged', ConsensusState.LEADER);

      // Trigger leader election
      integration['consensusManager'].emit('leader:elected', 'test-node-1');
      expect(eventSpy).toHaveBeenCalledWith('leaderElected', 'test-node-1');

      // Trigger network events
      integration['networkTransport'].emit('connect', 'test-node-2');
      expect(eventSpy).toHaveBeenCalledWith('nodeConnected', 'test-node-2');

      integration['networkTransport'].emit('disconnect', 'test-node-2');
      expect(eventSpy).toHaveBeenCalledWith('nodeDisconnected', 'test-node-2');

      const mockError = new Error('Test error');
      integration['networkTransport'].emit('error', mockError);
      expect(eventSpy).toHaveBeenCalledWith('error', mockError);
    });
  });

  describe('System Lifecycle', () => {
    it('should start all components successfully', async () => {
      await integration.start();

      expect(integration['networkTransport'].start).toHaveBeenCalled();
      expect(integration['consensusManager'].start).toHaveBeenCalled();
    });

    it('should handle start errors correctly', async () => {
      const mockError = new Error('Start failed');
      jest.spyOn(integration['networkTransport'], 'start').mockRejectedValue(mockError);

      await expect(integration.start()).rejects.toThrow(mockError);
    });

    it('should stop all components successfully', async () => {
      await integration.stop();

      expect(integration['consensusManager'].stop).toHaveBeenCalled();
      expect(integration['networkTransport'].stop).toHaveBeenCalled();
      expect(integration['stateReplicator'].stop).toHaveBeenCalled();
    });

    it('should handle stop errors correctly', async () => {
      const mockError = new Error('Stop failed');
      jest.spyOn(integration['consensusManager'], 'stop').mockRejectedValue(mockError);

      await expect(integration.stop()).rejects.toThrow(mockError);
    });
  });

  describe('State Management', () => {
    it('should propose state updates when leader', async () => {
      const mockState: GameState = { id: 'test-game' };
      jest.spyOn(integration['consensusManager'], 'isLeader').mockReturnValue(true);

      await integration.proposeStateUpdate(mockState);

      expect(integration['vectorClock'].increment).toHaveBeenCalled();
      expect(integration['stateReplicator'].updateLocalState).toHaveBeenCalled();
      expect(integration['consensusManager'].appendEntry).toHaveBeenCalled();
    });

    it('should reject state updates when not leader', async () => {
      const mockState: GameState = { id: 'test-game' };
      if (!integration['consensusManager'].isLeader) {
        integration['consensusManager'].isLeader = () => false;
      }
      jest.spyOn(integration['consensusManager'], 'isLeader').mockReturnValue(false);

      await expect(integration.proposeStateUpdate(mockState)).rejects.toThrow('Only leader can propose state updates');
    });

    it('should handle state update errors correctly', async () => {
      const mockState: GameState = { id: 'test-game' };
      const mockError = new Error('Update failed');
      if (!integration['consensusManager'].isLeader) {
        integration['consensusManager'].isLeader = () => true;
      }
      jest.spyOn(integration['consensusManager'], 'isLeader').mockReturnValue(true);
      jest.spyOn(integration['consensusManager'], 'appendEntry').mockRejectedValue(mockError);

      await expect(integration.proposeStateUpdate(mockState)).rejects.toThrow(mockError);
    });

    it('should get current state correctly', () => {
      const mockState: GameState = { id: 'test-game' };
      jest.spyOn(integration['stateReplicator'], 'getState').mockReturnValue(mockState);

      expect(integration.getState()).toBe(mockState);
    });
  });

  describe('Consensus Status', () => {
    it('should check leader status correctly', () => {
      if (!integration['consensusManager'].isLeader) {
        integration['consensusManager'].isLeader = () => true;
      }
      jest.spyOn(integration['consensusManager'], 'isLeader').mockReturnValue(true);
      expect(integration.isLeader()).toBe(true);

      jest.spyOn(integration['consensusManager'], 'isLeader').mockReturnValue(false);
      expect(integration.isLeader()).toBe(false);
    });

    it('should get leader ID correctly', () => {
      jest.spyOn(integration['consensusManager'], 'getLeader').mockReturnValue('test-node-1');
      expect(integration.getLeader()).toBe('test-node-1');
    });

    it('should get current term correctly', () => {
      jest.spyOn(integration['consensusManager'], 'getCurrentTerm').mockReturnValue(5);
      expect(integration.getCurrentTerm()).toBe(5);
    });
  });
});