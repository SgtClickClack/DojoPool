import { ConsensusProtocol, ConsensusConfig } from '../../core/consensus/ConsensusProtocol';
import { NetworkTransport } from '../../core/network/NetworkTransport';

describe('ConsensusProtocol', () => {
  let node1: ConsensusProtocol;
  let node2: ConsensusProtocol;
  let node3: ConsensusProtocol;
  let transport1: NetworkTransport;
  let transport2: NetworkTransport;
  let transport3: NetworkTransport;

  beforeEach(async () => {
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

    const config1: ConsensusConfig = {
      nodeId: 'node1',
      electionTimeoutMin: 150,
      electionTimeoutMax: 300,
      heartbeatInterval: 50,
      transport: transport1
    };

    const config2: ConsensusConfig = {
      nodeId: 'node2',
      electionTimeoutMin: 150,
      electionTimeoutMax: 300,
      heartbeatInterval: 50,
      transport: transport2
    };

    const config3: ConsensusConfig = {
      nodeId: 'node3',
      electionTimeoutMin: 150,
      electionTimeoutMax: 300,
      heartbeatInterval: 50,
      transport: transport3
    };

    node1 = new ConsensusProtocol(config1);
    node2 = new ConsensusProtocol(config2);
    node3 = new ConsensusProtocol(config3);
  });

  afterEach(async () => {
    node1.stop();
    node2.stop();
    node3.stop();
    await transport1.stop();
    await transport2.stop();
    await transport3.stop();
  });

  it('should elect a leader', async () => {
    const leaderPromise = new Promise<void>(resolve => {
      const checkLeader = () => {
        const leaders = [
          node1.getRole() === 'LEADER',
          node2.getRole() === 'LEADER',
          node3.getRole() === 'LEADER'
        ].filter(isLeader => isLeader);

        if (leaders.length === 1) {
          resolve();
        }
      };

      node1.on('leader:elected', checkLeader);
      node2.on('leader:elected', checkLeader);
      node3.on('leader:elected', checkLeader);
    });

    node1.start();
    node2.start();
    node3.start();

    await leaderPromise;

    const leaderCount = [
      node1.getRole() === 'LEADER',
      node2.getRole() === 'LEADER',
      node3.getRole() === 'LEADER'
    ].filter(isLeader => isLeader).length;

    expect(leaderCount).toBe(1);
  });

  it('should handle leader failure', async () => {
    // First, wait for initial leader election
    await new Promise<void>(resolve => {
      const checkLeader = () => {
        const leaders = [
          node1.getRole() === 'LEADER',
          node2.getRole() === 'LEADER',
          node3.getRole() === 'LEADER'
        ].filter(isLeader => isLeader);

        if (leaders.length === 1) {
          resolve();
        }
      };

      node1.on('leader:elected', checkLeader);
      node2.on('leader:elected', checkLeader);
      node3.on('leader:elected', checkLeader);
    });

    node1.start();
    node2.start();
    node3.start();

    // Find the current leader and stop it
    let stoppedLeader: ConsensusProtocol | null = null;
    if (node1.getRole() === 'LEADER') {
      stoppedLeader = node1;
      await transport1.stop();
    } else if (node2.getRole() === 'LEADER') {
      stoppedLeader = node2;
      await transport2.stop();
    } else {
      stoppedLeader = node3;
      await transport3.stop();
    }

    // Wait for new leader election
    await new Promise<void>(resolve => {
      const checkNewLeader = () => {
        const remainingNodes = [node1, node2, node3].filter(node => node !== stoppedLeader);
        const newLeaders = remainingNodes
          .filter(node => node.getRole() === 'LEADER')
          .length;

        if (newLeaders === 1) {
          resolve();
        }
      };

      const remainingNodes = [node1, node2, node3].filter(node => node !== stoppedLeader);
      remainingNodes.forEach(node => {
        node.on('leader:elected', checkNewLeader);
      });
    });

    const remainingNodes = [node1, node2, node3].filter(node => node !== stoppedLeader);
    const newLeaderCount = remainingNodes
      .filter(node => node.getRole() === 'LEADER')
      .length;

    expect(newLeaderCount).toBe(1);
  });

  it('should commit proposals when majority accepts', async () => {
    // Wait for leader election
    await new Promise<void>(resolve => {
      const checkLeader = () => {
        const leaders = [
          node1.getRole() === 'LEADER',
          node2.getRole() === 'LEADER',
          node3.getRole() === 'LEADER'
        ].filter(isLeader => isLeader);

        if (leaders.length === 1) {
          resolve();
        }
      };

      node1.on('leader:elected', checkLeader);
      node2.on('leader:elected', checkLeader);
      node3.on('leader:elected', checkLeader);
    });

    node1.start();
    node2.start();
    node3.start();

    // Find the leader
    const leader = [node1, node2, node3].find(node => node.getRole() === 'LEADER')!;

    // Create a proposal
    const proposalValue = { key: 'test', value: 'data' };
    const proposalPromise = new Promise<void>(resolve => {
      leader.on('proposal:committed', ({ value }) => {
        expect(value).toEqual(proposalValue);
        resolve();
      });
    });

    leader.proposeValue(proposalValue);
    await proposalPromise;
  });

  it('should maintain consistent term numbers', async () => {
    node1.start();
    node2.start();
    node3.start();

    // Wait for some elections to occur
    await new Promise(resolve => setTimeout(resolve, 1000));

    const term1 = node1.getCurrentTerm();
    const term2 = node2.getCurrentTerm();
    const term3 = node3.getCurrentTerm();

    expect(term1).toBe(term2);
    expect(term2).toBe(term3);
  });
}); 