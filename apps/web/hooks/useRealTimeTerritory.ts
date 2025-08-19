import { useState, useEffect, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

// Territory interfaces
export interface Territory {
  id: number;
  name: string;
  position: { lat: number; lng: number };
  clan: string | null;
  clanColor: string;
  controller: string | null;
  influence: number;
  isControlled: boolean;
}

export interface TerritoryUpdate {
  territoryId: string;
  previousOwnerId?: string;
  newOwnerId: string;
  clanId?: string;
  timestamp: Date;
  reason: 'challenge' | 'tournament' | 'admin' | 'expired';
  matchId?: string;
}

export interface ClanUpdate {
  clanId: string;
  name: string;
  color: string;
  influence: number;
  territories: string[];
}

export interface PlayerMovement {
  playerId: string;
  position: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  isMoving: boolean;
}

export const useRealTimeTerritory = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [clans, setClans] = useState<Map<string, ClanUpdate>>(new Map());
  const [playerMovements, setPlayerMovements] = useState<PlayerMovement[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io('http://localhost:8080');

    newSocket.on('connect', () => {
      console.log('Socket.IO connected successfully! ID:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected.');
      setIsConnected(false);
    });

    // Territory ownership updates
    newSocket.on('territory-ownership-updated', (update: TerritoryUpdate) => {
      console.log('Territory ownership update received:', update);
      handleTerritoryUpdate(update);
    });

    // Territory updates from LivingWorldHub
    newSocket.on('territory_update', (data: any) => {
      console.log('Territory update received:', data);
      handleTerritoryUpdate(data);
    });

    // Clan updates
    newSocket.on('clan-update', (clan: ClanUpdate) => {
      console.log('Clan update received:', clan);
      handleClanUpdate(clan);
    });

    // Player movement updates
    newSocket.on('player_movement', (movement: PlayerMovement) => {
      console.log('Player movement received:', movement);
      handlePlayerMovement(movement);
    });

    // Challenge updates
    newSocket.on('challenge-updated', (challenge: any) => {
      console.log('Challenge update received:', challenge);
      handleChallengeUpdate(challenge);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle territory ownership updates
  const handleTerritoryUpdate = useCallback(
    (update: TerritoryUpdate) => {
      setTerritories((prev) => {
        const updated = prev.map((territory) => {
          if (territory.id.toString() === update.territoryId) {
            const clan = clans.get(update.clanId || '');
            return {
              ...territory,
              controller: update.newOwnerId,
              clan: clan?.name || null,
              clanColor: clan?.color || '#666666',
              influence:
                update.reason === 'challenge' ? 100 : territory.influence,
              isControlled: true,
            };
          }
          return territory;
        });
        return updated;
      });
      setLastUpdate(new Date());
    },
    [clans]
  );

  // Handle clan updates
  const handleClanUpdate = useCallback((clan: ClanUpdate) => {
    setClans((prev) => {
      const updated = new Map(prev);
      updated.set(clan.clanId, clan);
      return updated;
    });
  }, []);

  // Handle player movement
  const handlePlayerMovement = useCallback((movement: PlayerMovement) => {
    setPlayerMovements((prev) => {
      const existing = prev.find((p) => p.playerId === movement.playerId);
      if (existing) {
        return prev.map((p) =>
          p.playerId === movement.playerId ? movement : p
        );
      } else {
        return [...prev, movement];
      }
    });
  }, []);

  // Handle challenge updates
  const handleChallengeUpdate = useCallback((challenge: any) => {
    console.log('Challenge update processed:', challenge);
    // Update territory status based on challenge
    if (challenge.status === 'in-progress') {
      setTerritories((prev) => {
        return prev.map((territory) => {
          if (territory.id.toString() === challenge.territoryId) {
            return {
              ...territory,
              isControlled: false, // Territory is contested
            };
          }
          return territory;
        });
      });
    }
  }, []);

  // Subscribe to territory updates
  const subscribeToTerritoryUpdates = useCallback(
    (callback: (update: TerritoryUpdate) => void) => {
      if (socket) {
        socket.on('territory-ownership-updated', callback);
        return () => {
          socket.off('territory-ownership-updated', callback);
        };
      }
    },
    [socket]
  );

  // Subscribe to clan updates
  const subscribeToClanUpdates = useCallback(
    (callback: (clan: ClanUpdate) => void) => {
      if (socket) {
        socket.on('clan-update', callback);
        return () => {
          socket.off('clan-update', callback);
        };
      }
    },
    [socket]
  );

  // Subscribe to player movements
  const subscribeToPlayerMovements = useCallback(
    (callback: (movement: PlayerMovement) => void) => {
      if (socket) {
        socket.on('player_movement', callback);
        return () => {
          socket.off('player_movement', callback);
        };
      }
    },
    [socket]
  );

  // Emit territory challenge
  const emitTerritoryChallenge = useCallback(
    (territoryId: string, challengerId: string, defenderId: string) => {
      if (socket && isConnected) {
        socket.emit('territory-challenge', {
          territoryId,
          challengerId,
          defenderId,
          timestamp: new Date(),
        });
      }
    },
    [socket, isConnected]
  );

  // Emit player movement
  const emitPlayerMovement = useCallback(
    (playerId: string, position: { lat: number; lng: number }) => {
      if (socket && isConnected) {
        socket.emit('player_movement', {
          playerId,
          position,
          timestamp: new Date(),
        });
      }
    },
    [socket, isConnected]
  );

  return {
    isConnected,
    territories,
    clans,
    playerMovements,
    lastUpdate,
    subscribeToTerritoryUpdates,
    subscribeToClanUpdates,
    subscribeToPlayerMovements,
    emitTerritoryChallenge,
    emitPlayerMovement,
  };
};
