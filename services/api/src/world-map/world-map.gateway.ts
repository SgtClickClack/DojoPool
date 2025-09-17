import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { corsOptions } from '../config/cors.config';
import { FeatureFlagsConfig } from '../config/feature-flags.config';
import { SOCKET_NAMESPACES } from '../config/sockets.config';
import { PrismaService } from '../prisma/prisma.service';

interface PlayerPosition {
  playerId: string;
  playerName: string;
  avatar?: string;
  clan?: string;
  lat: number;
  lng: number;
  timestamp: number;
  isOnline: boolean;
}

interface DojoStatus {
  id: string;
  status: 'controlled' | 'rival' | 'neutral';
  controller: string;
  influence: number;
  players: number;
}

interface GameEvent {
  type:
    | 'dojo_captured'
    | 'player_joined'
    | 'player_left'
    | 'match_started'
    | 'match_ended';
  dojoId?: string;
  playerId?: string;
  newStatus?: 'controlled' | 'rival' | 'neutral';
  newController?: string;
  newInfluence?: number;
  timestamp: Date;
}

@WebSocketGateway({
  cors: corsOptions,
  namespace: SOCKET_NAMESPACES.WORLD_MAP,
})
export class WorldMapGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly featureFlags: FeatureFlagsConfig,
    private readonly prisma: PrismaService
  ) {}

  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WorldMapGateway.name);
  private connectedClients = new Map<string, Socket>();
  private playerPositions = new Map<string, PlayerPosition>();
  private dojoStatuses = new Map<string, DojoStatus>();

  handleConnection(client: Socket) {
    this.logger.log(`World map client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Send current world state to newly connected client
    this.sendWorldState(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`World map client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);

    // Remove player position if they were tracking one
    const playerId = this.findPlayerBySocketId(client.id);
    if (playerId) {
      this.playerPositions.delete(playerId);
      this.broadcastPlayerPositions();
    }
  }

  @SubscribeMessage('join_world_map')
  handleJoinWorldMap(
    @MessageBody() data: { playerId?: string; playerName?: string },
    @ConnectedSocket() client: Socket
  ) {
    const { playerId, playerName } = data;

    if (playerId && playerName) {
      client.join('world_map');
      client.join(`player:${playerId}`);

      this.logger.log(`Player ${playerName} (${playerId}) joined world map`);

      // Send confirmation
      client.emit('joined_world_map', {
        message: 'Successfully joined world map',
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('leave_world_map')
  handleLeaveWorldMap(
    @MessageBody() data: { playerId: string },
    @ConnectedSocket() client: Socket
  ) {
    const { playerId } = data;

    client.leave('world_map');
    client.leave(`player:${playerId}`);

    // Remove player position
    this.playerPositions.delete(playerId);
    this.broadcastPlayerPositions();

    this.logger.log(`Player ${playerId} left world map`);
  }

  @SubscribeMessage('update_player_position')
  handleUpdatePlayerPosition(
    @MessageBody() data: Omit<PlayerPosition, 'timestamp'>,
    @ConnectedSocket() client: Socket
  ) {
    const playerPosition: PlayerPosition = {
      ...data,
      timestamp: Date.now(),
    };

    this.playerPositions.set(data.playerId, playerPosition);

    this.logger.log(
      `Player ${data.playerName} position updated: ${data.lat}, ${data.lng}`
    );

    // Broadcast to all clients in world map
    this.broadcastPlayerPositions();
  }

  @SubscribeMessage('request_player_positions')
  handleRequestPlayerPositions(@ConnectedSocket() client: Socket) {
    this.broadcastPlayerPositions(client);
  }

  @SubscribeMessage('update_dojo_status')
  handleUpdateDojoStatus(
    @MessageBody() data: DojoStatus,
    @ConnectedSocket() client: Socket
  ) {
    this.dojoStatuses.set(data.id, data);

    this.logger.log(`Dojo ${data.id} status updated: ${data.status}`);

    // Broadcast dojo status update
    this.broadcastDojoStatusUpdate(data);
  }

  @SubscribeMessage('request_dojo_statuses')
  handleRequestDojoStatuses(@ConnectedSocket() client: Socket) {
    const dojoStatuses = Array.from(this.dojoStatuses.values());
    client.emit('dojo_status_update', {
      dojos: dojoStatuses,
    });
  }

  @SubscribeMessage('game_event')
  handleGameEvent(
    @MessageBody() data: Omit<GameEvent, 'timestamp'>,
    @ConnectedSocket() client: Socket
  ) {
    const gameEvent: GameEvent = {
      ...data,
      timestamp: new Date(),
    };

    this.logger.log(`Game event: ${gameEvent.type}`, gameEvent);

    // Broadcast game event to all clients
    this.broadcastGameEvent(gameEvent);

    // Update dojo status if it's a capture event
    if (
      gameEvent.type === 'dojo_captured' &&
      gameEvent.dojoId &&
      gameEvent.newStatus &&
      gameEvent.newController
    ) {
      const currentStatus = this.dojoStatuses.get(gameEvent.dojoId);
      if (currentStatus) {
        const updatedStatus: DojoStatus = {
          ...currentStatus,
          status: gameEvent.newStatus,
          controller: gameEvent.newController,
          influence: gameEvent.newInfluence || currentStatus.influence,
        };

        this.dojoStatuses.set(gameEvent.dojoId, updatedStatus);
        this.broadcastDojoStatusUpdate(updatedStatus);
      }
    }
  }

  // Public methods for other services to use
  broadcastPlayerPositions(client?: Socket) {
    const positions = Array.from(this.playerPositions.values());
    const event = {
      type: 'player_position_update',
      data: positions,
    };

    if (client) {
      client.emit('message', event);
    } else {
      this.server.to('world_map').emit('message', event);
    }
  }

  broadcastDojoStatusUpdate(dojoStatus: DojoStatus) {
    const event = {
      type: 'dojo_status_update',
      data: {
        dojos: [dojoStatus],
      },
    };

    this.server.to('world_map').emit('message', event);
  }

  broadcastGameEvent(gameEvent: GameEvent) {
    const event = {
      type: 'game_update',
      data: gameEvent,
    };

    this.server.to('world_map').emit('message', event);
  }

  // Resource tick: periodic resource accrual and strategic updates
  async tickResourcesForAllTerritories() {
    try {
      const territories = await this.prisma.territory.findMany({
        select: {
          id: true,
          resources: true,
          resourceRate: true,
          lastTickAt: true,
        },
      });

      const now = new Date();
      for (const t of territories) {
        const last = t.lastTickAt ? new Date(t.lastTickAt) : null;
        const elapsedHours = last
          ? (now.getTime() - last.getTime()) / 3600000
          : 1;

        // Parse stringified JSON fields into objects
        const rate: Record<string, unknown> =
          typeof t.resourceRate === 'string'
            ? JSON.parse(t.resourceRate || '{}')
            : ((t.resourceRate as any) || {});
        const current: Record<string, number> =
          typeof t.resources === 'string'
            ? JSON.parse(t.resources || '{}')
            : ((t.resources as any) || {});

        const next: Record<string, number> = { ...current };
        for (const key of Object.keys(rate)) {
          const rateVal = Number((rate as any)[key]);
          const inc = Number.isFinite(rateVal) ? rateVal * elapsedHours : 0;
          const base = Number.isFinite(Number(next[key])) ? Number(next[key]) : 0;
          const candidate = base + inc;
          next[key] = Math.max(0, Math.floor(Number.isFinite(candidate) ? candidate : 0));
        }

        await this.prisma.territory.update({
          where: { id: t.id },
          data: { resources: JSON.stringify(next), lastTickAt: now },
        });
      }

      // Broadcast a lightweight tick event
      this.server.to('world_map').emit('message', {
        type: 'resource_tick',
        data: { ts: now.toISOString() },
      });
    } catch (err) {
      this.logger.warn(`Resource tick failed: ${String(err)}`);
    }
  }

  // Helper methods
  private sendWorldState(client: Socket) {
    // Send current player positions
    this.broadcastPlayerPositions(client);

    // Send current dojo statuses
    const dojoStatuses = Array.from(this.dojoStatuses.values());
    client.emit('message', {
      type: 'dojo_status_update',
      data: {
        dojos: dojoStatuses,
      },
    });
  }

  private findPlayerBySocketId(socketId: string): string | null {
    for (const [playerId, position] of this.playerPositions.entries()) {
      // This is a simplified approach - in a real implementation,
      // you'd maintain a mapping between socket IDs and player IDs
      if (position.playerId === socketId) {
        return playerId;
      }
    }
    return null;
  }

  // Method to simulate real-time updates for testing
  startSimulation() {
    // Use feature flags configuration for simulation control
    if (!this.featureFlags.isSimulationEnabled()) {
      this.logger.warn('Simulation disabled by feature flags configuration');
      return;
    }

    this.logger.log('Starting simulation mode for real-time updates');

    setInterval(() => {
      // Simulate player movement
      this.simulatePlayerMovement();

      // Simulate dojo status changes
      this.simulateDojoStatusChanges();

      // Simulate game events
      this.simulateGameEvents();
    }, 5000); // Update every 5 seconds
  }

  private simulatePlayerMovement() {
    if (this.playerPositions.size === 0) {
      // Create some mock players if none exist
      const mockPlayers: PlayerPosition[] = [
        {
          playerId: 'player1',
          playerName: 'RyuKlaw',
          clan: 'Crimson Monkey',
          lat: -27.4698 + (Math.random() - 0.5) * 0.01,
          lng: 153.0251 + (Math.random() - 0.5) * 0.01,
          timestamp: Date.now(),
          isOnline: true,
        },
        {
          playerId: 'player2',
          playerName: 'ShadowFox',
          clan: 'Shadow Fox',
          lat: -27.4698 + (Math.random() - 0.5) * 0.01,
          lng: 153.0251 + (Math.random() - 0.5) * 0.01,
          timestamp: Date.now(),
          isOnline: true,
        },
      ];

      mockPlayers.forEach((player) => {
        this.playerPositions.set(player.playerId, player);
      });
    } else {
      // Move existing players slightly
      this.playerPositions.forEach((position, playerId) => {
        const newPosition: PlayerPosition = {
          ...position,
          lat: position.lat + (Math.random() - 0.5) * 0.001,
          lng: position.lng + (Math.random() - 0.5) * 0.001,
          timestamp: Date.now(),
        };
        this.playerPositions.set(playerId, newPosition);
      });
    }

    this.broadcastPlayerPositions();
  }

  private simulateDojoStatusChanges() {
    if (this.dojoStatuses.size === 0) {
      // Create some mock dojos if none exist
      const mockDojos: DojoStatus[] = [
        {
          id: 'dojo1',
          status: 'controlled',
          controller: 'RyuKlaw',
          influence: 85,
          players: 12,
        },
        {
          id: 'dojo2',
          status: 'neutral',
          controller: 'None',
          influence: 0,
          players: 5,
        },
        {
          id: 'dojo3',
          status: 'rival',
          controller: 'ShadowFox',
          influence: 60,
          players: 8,
        },
      ];

      mockDojos.forEach((dojo) => {
        this.dojoStatuses.set(dojo.id, dojo);
      });
    } else {
      // Randomly change dojo statuses
      this.dojoStatuses.forEach((status, dojoId) => {
        if (Math.random() < 0.1) {
          // 10% chance of change
          const newStatus: DojoStatus = {
            ...status,
            influence: Math.max(
              0,
              Math.min(100, status.influence + (Math.random() - 0.5) * 20)
            ),
            players: Math.max(
              0,
              status.players + Math.floor((Math.random() - 0.5) * 4)
            ),
          };
          this.dojoStatuses.set(dojoId, newStatus);
          this.broadcastDojoStatusUpdate(newStatus);
        }
      });
    }
  }

  private simulateGameEvents() {
    if (Math.random() < 0.3) {
      // 30% chance of game event
      const eventTypes: GameEvent['type'][] = [
        'match_started',
        'match_ended',
        'player_joined',
        'player_left',
      ];
      const randomType =
        eventTypes[Math.floor(Math.random() * eventTypes.length)];

      const gameEvent: GameEvent = {
        type: randomType,
        dojoId: 'dojo1',
        playerId: 'player1',
        timestamp: new Date(),
      };

      this.broadcastGameEvent(gameEvent);
    }
  }
}
