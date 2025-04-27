import { NetworkConsensusIntegration, NetworkConsensusConfig } from '../NetworkConsensusIntegration';
import { ConsensusState } from '../../consensus/types';
import { GameState } from '../../../types/game';
import WebSocket from 'ws';

describe('NetworkConsensusIntegration Integration', () => {
  const nodes = ['node-1', 'node-2', 'node-3'];
  const basePort = 3002;
  let integrations: NetworkConsensusIntegration[] = [];
  let wsServers: WebSocket.Server[] = [];

  const createNodeConfig = (nodeId: string, port: number): NetworkConsensusConfig => ({
    nodeId,
    nodes,
    port,
    heartbeatInterval: 1000,
    electionTimeout: 5000,
    syncInterval: 2000,
  });

  beforeAll(async () => {
    // Create WebSocket servers for each node
    for (let i = 0; i < nodes.length; i++) {
      const port = basePort + i;
      const server = new WebSocket.Server({ port });
      wsServers.push(server);
    }

    // Wait for all servers to start
    await Promise.all(
      wsServers.map(
        (server) =>
          new Promise<void>((resolve) => {
            server.on('listening', () => resolve());
          })
      )
    );

    // Create and start network integrations for each node
    for (let i = 0; i < nodes.length; i++) {
      const config = createNodeConfig(nodes[i], basePort + i);
      const integration = new NetworkConsensusIntegration(config);
      integrations.push(integration);
    }

    // Start all integrations
    await Promise.all(integrations.map((integration) => integration.start()));
  });

  afterAll(async () => {
    // Stop all integrations
    await Promise.all(integrations.map((integration) => integration.stop()));

    // Close all WebSocket servers
    await Promise.all(
      wsServers.map(
        (server) =>
          new Promise<void>((resolve) => {
            server.close(() => resolve());
          })
      )
    );
  });

  describe('Network Communication', () => {
    it('should establish connections between all nodes', async () => {
      const connectedNodes = new Set<string>();
      const expectedConnections = nodes.length - 1; // Each node should connect to all others

      await new Promise<void>((resolve) => {
        const checkConnections = () => {
          if (connectedNodes.size === nodes.length * expectedConnections) {
            resolve();
          }
        };

        integrations.forEach((integration) => {
          integration.on('nodeConnected', (nodeId: string) => {
            connectedNodes.add(`${integration['config'].nodeId}-${nodeId}`);
            checkConnections();
          });
        });
      });

      expect(connectedNodes.size).toBe(nodes.length * expectedConnections);
    }, 10000);

    it('should elect a leader', async () => {
      let leaderCount = 0;
      const leaders = new Set<string>();

      await new Promise<void>((resolve) => {
        integrations.forEach((integration) => {
          integration.on('leaderElected', (leaderId: string) => {
            leaderCount++;
            leaders.add(leaderId);
            if (leaderCount === nodes.length) {
              resolve();
            }
          });
        });
      });

      expect(leaders.size).toBe(1); // Should only have one leader
      const leader = Array.from(leaders)[0];
      expect(nodes).toContain(leader);
    }, 10000);

    it('should propagate state updates from leader to followers', async () => {
      const testState: GameState = { id: 'test-game-1' };
      const stateUpdates = new Map<string, GameState>();

      // Wait for state propagation
      await new Promise<void>((resolve) => {
        let updateCount = 0;
        integrations.forEach((integration) => {
          integration.on('stateUpdated', (state: GameState) => {
            stateUpdates.set(integration['config'].nodeId, state);
            updateCount++;
            if (updateCount === nodes.length) {
              resolve();
            }
          });
        });

        // Find the leader and propose a state update
        const leader = integrations.find((integration) => integration.isLeader());
        if (leader) {
          leader.proposeStateUpdate(testState);
        }
      });

      // Verify all nodes received the state update
      integrations.forEach((integration) => {
        const nodeState = stateUpdates.get(integration['config'].nodeId);
        expect(nodeState).toBeDefined();
        expect(nodeState?.id).toBe(testState.id);
      });
    }, 10000);

    it('should handle node disconnection and reconnection', async () => {
      // Find a follower node to disconnect
      const follower = integrations.find((integration) => !integration.isLeader());
      expect(follower).toBeDefined();

      if (!follower) return;

      const disconnectedNodeId = follower['config'].nodeId;
      const disconnections = new Set<string>();
      const reconnections = new Set<string>();

      // Set up disconnect/reconnect tracking
      integrations.forEach((integration) => {
        if (integration['config'].nodeId !== disconnectedNodeId) {
          integration.on('nodeDisconnected', (nodeId: string) => {
            if (nodeId === disconnectedNodeId) {
              disconnections.add(integration['config'].nodeId);
            }
          });

          integration.on('nodeConnected', (nodeId: string) => {
            if (nodeId === disconnectedNodeId) {
              reconnections.add(integration['config'].nodeId);
            }
          });
        }
      });

      // Stop the follower
      await follower.stop();

      // Wait for disconnection events
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 2000);
      });

      expect(disconnections.size).toBe(nodes.length - 1);

      // Restart the follower
      await follower.start();

      // Wait for reconnection events
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 2000);
      });

      expect(reconnections.size).toBe(nodes.length - 1);
    }, 15000);

    it('should maintain consensus after leader failure', async () => {
      // Find the current leader
      const originalLeader = integrations.find((integration) => integration.isLeader());
      expect(originalLeader).toBeDefined();

      if (!originalLeader) return;

      let newLeaderElected = false;
      const newLeaderPromise = new Promise<void>((resolve) => {
        integrations.forEach((integration) => {
          if (integration !== originalLeader) {
            integration.on('leaderElected', () => {
              newLeaderElected = true;
              resolve();
            });
          }
        });
      });

      // Stop the leader
      await originalLeader.stop();

      // Wait for new leader election
      await newLeaderPromise;

      expect(newLeaderElected).toBe(true);

      // Verify only one new leader was elected
      const currentLeaders = integrations.filter(
        (integration) => integration !== originalLeader && integration.isLeader()
      );
      expect(currentLeaders.length).toBe(1);
    }, 15000);
  });
}); 