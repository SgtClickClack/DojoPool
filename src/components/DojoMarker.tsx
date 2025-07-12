import React from 'react';
import { MarkerF } from '@react-google-maps/api';
import { DojoData } from '../services/LivingWorldHubService';

interface DojoMarkerProps {
  dojo: DojoData;
  onClick: (dojo: DojoData) => void;
  isLocked?: boolean;
}

const DojoMarker: React.FC<DojoMarkerProps> = ({ dojo, onClick, isLocked = false }) => {
  const allegianceColor = {
    player: '#22d3ee', // cyan
    rival: '#ef4444',   // red
    neutral: '#6b7280', // gray
    ally: '#22c55e'     // green
  };

  const icon = {
    path: 'M0,0 m-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0', // A simple circle
    fillColor: isLocked ? '#4b5563' : allegianceColor[dojo.allegiance],
    fillOpacity: 0.9,
    strokeColor: '#ffffff',
    strokeWeight: 1,
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