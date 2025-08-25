'use client';

import React from 'react';
import MapboxWorldHubMap from './MapboxWorldHubMap';

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
