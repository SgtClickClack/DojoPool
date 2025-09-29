/**
 * Map Info Windows Component
 * 
 * Handles rendering of all map info windows (Dojos and Players)
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { type DojoData } from '@/services/dojoService';
import { type PlayerPosition } from '@/services/WebSocketService';
import { DojoInfoWindow } from '../DojoInfoWindow';
import { PlayerInfoWindow } from '../PlayerInfoWindow';

const InfoWindow = dynamic(
  () => import('@react-google-maps/api').then((mod) => ({
    default: mod.InfoWindow,
  })),
  { ssr: false }
);

interface MapInfoWindowsProps {
  selectedDojo: DojoData | null;
  selectedPlayer: PlayerPosition | null;
  onCloseInfoWindow: () => void;
  onChallengeDojo: (dojoId: string) => void;
  onViewDojoDetails: (dojoId: string) => void;
  onShadowRun: () => void;
  onChallengePlayer: (playerId: string) => void;
  onViewPlayerProfile: (playerId: string) => void;
  userClanId?: string;
  isLeader?: boolean;
}

const MapInfoWindows: React.FC<MapInfoWindowsProps> = ({
  selectedDojo,
  selectedPlayer,
  onCloseInfoWindow,
  onChallengeDojo,
  onViewDojoDetails,
  onShadowRun,
  onChallengePlayer,
  onViewPlayerProfile,
  userClanId,
  isLeader,
}) => {
  const isRival = React.useMemo(() => {
    return !!(
      selectedDojo &&
      selectedDojo.controllingClanId &&
      selectedDojo.controllingClanId !== userClanId
    );
  }, [selectedDojo, userClanId]);

  return (
    <>
      {/* Dojo Info Window */}
      {selectedDojo && (
        <InfoWindow
          position={{
            lat: selectedDojo.coordinates.lat,
            lng: selectedDojo.coordinates.lng,
          }}
          onCloseClick={onCloseInfoWindow}
        >
          <DojoInfoWindow
            dojo={selectedDojo}
            isRival={isRival}
            isLeader={isLeader ?? false}
            onClose={onCloseInfoWindow}
            onChallenge={onChallengeDojo}
            onViewDetails={onViewDojoDetails}
            onShadowRun={onShadowRun}
          />
        </InfoWindow>
      )}

      {/* Player Info Window */}
      {selectedPlayer && (
        <InfoWindow
          position={{
            lat: selectedPlayer.lat,
            lng: selectedPlayer.lng,
          }}
          onCloseClick={onCloseInfoWindow}
        >
          <PlayerInfoWindow
            player={selectedPlayer}
            onClose={onCloseInfoWindow}
            onChallenge={onChallengePlayer}
            onViewProfile={onViewPlayerProfile}
          />
        </InfoWindow>
      )}
    </>
  );
};

export default MapInfoWindows;
