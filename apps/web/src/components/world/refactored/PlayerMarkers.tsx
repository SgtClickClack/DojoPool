/**
 * Player Markers Component
 * 
 * Handles rendering and animation for player position markers
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { type PlayerPosition } from '@/services/WebSocketService';
import { getPlayerMarkerIcon } from '../MapMarkerIcons';

const Marker = dynamic(
  () => import('@react-google-maps/api').then((mod) => ({ default: mod.Marker })),
  { ssr: false }
);

interface PlayerMarkersProps {
  playerPositions: PlayerPosition[];
  onMarkerClick: (player: PlayerPosition) => void;
  selectedPlayerId?: string;
}

const PlayerMarkers: React.FC<PlayerMarkersProps> = ({
  playerPositions,
  onMarkerClick,
  selectedPlayerId,
}) => {
  const handleMarkerClick = React.useCallback((player: PlayerPosition) => {
    onMarkerClick(player);
  }, [onMarkerClick]);

  return (
    <>
      {playerPositions.map((player) => (
        <Marker
          key={player.playerId}
          position={{
            lat: player.lat,
            lng: player.lng,
          }}
          icon={getPlayerMarkerIcon(player)}
          onClick={() => handleMarkerClick(player)}
          options={{
            optimized: true,
            zIndex: selectedPlayerId === player.playerId ? 1001 : 1000,
          }}
          animation={selectedPlayerId === player.playerId ? 'BOUNCE' : undefined}
        />
      ))}
    </>
  );
};

export default PlayerMarkers;
