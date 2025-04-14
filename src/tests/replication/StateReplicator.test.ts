import { StateReplicator, ReplicatorConfig } from '../../core/replication/StateReplicator';
import { ConsensusProtocol, ConsensusConfig } from '../../core/consensus/ConsensusProtocol';
import { NetworkTransport } from '../../core/network/NetworkTransport';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('StateReplicator', () => {
  let node1: StateReplicator;
  let node2: StateReplicator;
  let node3: StateReplicator;
  let consensus1: ConsensusProtocol;
  let consensus2: ConsensusProtocol;
  let consensus3: ConsensusProtocol;
  let transport1: NetworkTransport;
  let transport2: NetworkTransport;
  let transport3: NetworkTransport;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for storage
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'state-replicator-test-'));
    
    // Set up network transports
    transport1 = new NetworkTransport({
      nodeId: 'node1',
      port: 3001
    });

    transport2 = new NetworkTransport({
      nodeId: 'node2',
      port: 3002,
      peers: ['ws://localhost:3001']
    });

    transport3 = new NetworkTransport({
      nodeId: 'node3',
      port: 3003,
      peers: ['ws://localhost:3001', 'ws://localhost:3002']
    });

    await transport1.start();
    await transport2.start();
    await transport3.start();

    // Wait for connections to establish
    await new Promise(resolve => setTimeout(resolve, 100));

    // Set up consensus nodes
    const consensusConfig1: ConsensusConfig = {
      nodeId: 'node1',
      electionTimeoutMin: 150,
      electionTimeoutMax: 300,
      heartbeatInterval: 50,
      transport: transport1
    };

    const consensusConfig2: ConsensusConfig = {
      nodeId: 'node2',
      electionTimeoutMin: 150,
      electionTimeoutMax: 300,
      heartbeatInterval: 50,
      transport: transport2
    };

    const consensusConfig3: ConsensusConfig = {
      nodeId: 'node3',
      electionTimeoutMin: 150,
      electionTimeoutMax: 300,
      heartbeatInterval: 50,
      transport: transport3
    };

    consensus1 = new ConsensusProtocol(consensusConfig1);
    consensus2 = new ConsensusProtocol(consensusConfig2);
    consensus3 = new ConsensusProtocol(consensusConfig3);

    // Set up state replicators
    const replicatorConfig1: ReplicatorConfig = {
      nodeId: 'node1',
      consensus: consensus1,
      storageDir: path.join(tempDir, 'node1')
    };

    const replicatorConfig2: ReplicatorConfig = {
      nodeId: 'node2',
      consensus: consensus2,
      storageDir: path.join(tempDir, 'node2')
    };

    const replicatorConfig3: ReplicatorConfig = {
      nodeId: 'node3',
      consensus: consensus3,
      storageDir: path.join(tempDir, 'node3')
    };

    node1 = new StateReplicator(replicatorConfig1);
    node2 = new StateReplicator(replicatorConfig2);
    node3 = new StateReplicator(replicatorConfig3);

    // Start consensus
    consensus1.start();
    consensus2.start();
    consensus3.start();
  });

  afterEach(async () => {
    consensus1.stop();
    consensus2.stop();
    consensus3.stop();
    await transport1.stop();
    await transport2.stop();
    await transport3.stop();

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should replicate state across nodes', async () => {
    // Wait for leader election
    await new Promise<void>(resolve => {
      const checkLeader = () => {
        const leaders = [
          consensus1.getRole() === 'LEADER',
          consensus2.getRole() === 'LEADER',
          consensus3.getRole() === 'LEADER'
        ].filter(isLeader => isLeader);

        if (leaders.length === 1) {
          resolve();
        }
      };

      consensus1.on('leader:elected', checkLeader);
      consensus2.on('leader:elected', checkLeader);
      consensus3.on('leader:elected', checkLeader);
    });

    // Find the leader
    const leader = [consensus1, consensus2, consensus3].find(
      node => node.getRole() === 'LEADER'
    )!;

    // Create a test state update
    const stateUpdate = { key: 'test', value: 'data' };
    
    // Wait for state to be replicated
    const statePromise = Promise.all([
      new Promise<void>(resolve => {
        node1.on('state:updated', ({ state }) => {
          if (state.key === stateUpdate.key) {
            resolve();
          }
        });
      }),
      new Promise<void>(resolve => {
        node2.on('state:updated', ({ state }) => {
          if (state.key === stateUpdate.key) {
            resolve();
          }
        });
      }),
      new Promise<void>(resolve => {
        node3.on('state:updated', ({ state }) => {
          if (state.key === stateUpdate.key) {
            resolve();
          }
        });
      })
    ]);

    // Propose the state update
    leader.proposeValue(stateUpdate);

    // Wait for replication
    await statePromise;

    // Verify state is consistent across nodes
    expect(node1.getState()).toEqual(stateUpdate);
    expect(node2.getState()).toEqual(stateUpdate);
    expect(node3.getState()).toEqual(stateUpdate);
  });

  it('should create and load snapshots', async () => {
    // Wait for leader election
    await new Promise<void>(resolve => {
      const checkLeader = () => {
        const leaders = [
          consensus1.getRole() === 'LEADER',
          consensus2.getRole() === 'LEADER',
          consensus3.getRole() === 'LEADER'
        ].filter(isLeader => isLeader);

        if (leaders.length === 1) {
          resolve();
        }
      };

      consensus1.on('leader:elected', checkLeader);
      consensus2.on('leader:elected', checkLeader);
      consensus3.on('leader:elected', checkLeader);
    });

    // Find the leader
    const leader = [consensus1, consensus2, consensus3].find(
      node => node.getRole() === 'LEADER'
    )!;

    // Create multiple state updates to trigger snapshot
    const updates = Array.from({ length: 1100 }, (_, i) => ({
      [`key${i}`]: `value${i}`
    }));

    // Wait for snapshot creation
    const snapshotPromise = new Promise<void>(resolve => {
      node1.on('snapshot:created', () => resolve());
    });

    // Apply updates
    for (const update of updates) {
      leader.proposeValue(update);
    }

    await snapshotPromise;

    // Verify snapshot was created
    const snapshotPath = path.join(tempDir, 'node1', 'latest_snapshot.json');
    expect(fs.existsSync(snapshotPath)).toBe(true);

    // Create a new replicator instance
    const newReplicator = new StateReplicator({
      nodeId: 'node1',
      consensus: consensus1,
      storageDir: path.join(tempDir, 'node1')
    });

    // Verify state was loaded from snapshot
    const state = newReplicator.getState();
    expect(Object.keys(state).length).toBeGreaterThan(0);
    expect(state.key0).toBe('value0');
    expect(state.key1099).toBe('value1099');
  });

  it('should handle state synchronization', async () => {
    // Wait for leader election
    await new Promise<void>(resolve => {
      const checkLeader = () => {
        const leaders = [
          consensus1.getRole() === 'LEADER',
          consensus2.getRole() === 'LEADER',
          consensus3.getRole() === 'LEADER'
        ].filter(isLeader => isLeader);

        if (leaders.length === 1) {
          resolve();
        }
      };

      consensus1.on('leader:elected', checkLeader);
      consensus2.on('leader:elected', checkLeader);
      consensus3.on('leader:elected', checkLeader);
    });

    // Stop node3 temporarily
    await transport3.stop();

    // Find the leader
    const leader = [consensus1, consensus2].find(
      node => node.getRole() === 'LEADER'
    )!;

    // Apply some updates while node3 is down
    const updates = Array.from({ length: 5 }, (_, i) => ({
      [`key${i}`]: `value${i}`
    }));

    for (const update of updates) {
      leader.proposeValue(update);
    }

    // Wait for updates to be applied
    await new Promise(resolve => setTimeout(resolve, 100));

    // Restart node3
    await transport3.start();

    // Wait for state sync
    const syncPromise = new Promise<void>(resolve => {
      node3.on('state:synchronized', () => resolve());
    });

    // Request sync
    node3.requestStateSync(leader.getNodeId());

    await syncPromise;

    // Verify state is consistent
    expect(node3.getState()).toEqual(node1.getState());
    expect(node3.getState()).toEqual(node2.getState());
  });
}); 