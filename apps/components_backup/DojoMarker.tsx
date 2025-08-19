import React from 'react';
import { MarkerF } from '@react-google-maps/api';
import { type DojoData } from '../services/LivingWorldHubService';

interface DojoMarkerProps {
  dojo: DojoData;
  onClick: (dojo: DojoData) => void;
  isLocked?: boolean;
  playerClanId?: string;
}

const DojoMarker: React.FC<DojoMarkerProps> = ({
  dojo,
  onClick,
  isLocked = false,
  playerClanId,
}) => {
  // Determine marker color based on clan ownership
  const getMarkerColor = (): string => {
    if (isLocked) return '#4b5563'; // Gray for locked territories

    // If no controlling clan, territory is unclaimed (neutral)
    if (!dojo.controllingClanId || !dojo.controllingClan) {
      return '#ffffff'; // White for unclaimed territory
    }

    // If player's clan controls this territory (friendly)
    if (playerClanId && dojo.controllingClanId === playerClanId) {
      return '#00fff7'; // Glowing cyan for friendly clan
    }

    // If another clan controls this territory (rival)
    return '#ff4444'; // Glowing red for rival clan
  };

  const icon = {
    path: 'M0,0 m-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0', // A simple circle
    fillColor: getMarkerColor(),
    fillOpacity: 0.9,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 1.5,
  };

  return (
    <MarkerF
      position={dojo.coordinates}
      icon={icon}
      onClick={() => onClick(dojo)}
      title={dojo.name}
    />
  );
};

export default DojoMarker;
