/**
 * Dojo Markers Component
 * 
 * Handles rendering and interaction for Dojo markers
 * Separated from main map component for better organization
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { type DojoData } from '@/services/dojoService';
import { getMarkerIcon } from '../MapMarkerIcons';

const Marker = dynamic(
  () => import('@react-google-maps/api').then((mod) => ({ default: mod.Marker })),
  { ssr: false }
);

interface DojoMarkersProps {
  dojos: DojoData[];
  onMarkerClick: (dojo: DojoData) => void;
  selectedDojoId?: string;
}

const DojoMarkers: React.FC<DojoMarkersProps> = ({
  dojos,
  onMarkerClick,
  selectedDojoId,
}) => {
  const handleMarkerClick = React.useCallback((dojo: DojoData) => {
    onMarkerClick(dojo);
  }, [onMarkerClick]);

  return (
    <>
      {dojos.map((dojo) => (
        <Marker
          key={dojo.id}
          position={{
            lat: dojo.coordinates.lat,
            lng: dojo.coordinates.lng,
          }}
          icon={getMarkerIcon(dojo)}
          onClick={() => handleMarkerClick(dojo)}
          zIndex={selectedDojoId === dojo.id ? 1000 : undefined}
          optimized={true}
        />
      ))}
    </>
  );
};

export default DojoMarkers;
