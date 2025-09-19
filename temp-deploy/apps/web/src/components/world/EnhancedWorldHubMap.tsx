'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const MapboxWorldHubMap = dynamic(
  () => import('./MapboxWorldHubMap'),
  { ssr: false } // This is the crucial part
);

interface EnhancedWorldHubMapProps {
  height?: string | number;
}

const EnhancedWorldHubMap: React.FC<EnhancedWorldHubMapProps> = ({
  height = '100%',
}) => {
  // For now, return the Mapbox-based map since we have the token
  return <MapboxWorldHubMap height={height} />;
};

export default EnhancedWorldHubMap;
