/**
 * Map Container Component
 * 
 * Handles Google Maps container loading and rendering
 * Separates map logic from UI interactions
 */

import dynamic from 'next/dynamic';
import React, { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Dynamic imports for code splitting
const GoogleMap = dynamic(
  () => import('@react-google-maps/api').then((mod) => ({
    default: mod.GoogleMap,
  })),
  {
    ssr: false,
    loading: () => (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    ),
  }
);

const LoadScript = dynamic(
  () => import('@react-google-maps/api').then((mod) => ({
    default: mod.LoadScript,
  })),
  {
    ssr: false,
  }
);

interface MapContainerProps {
  center: { lat: number; lng: number };
  zoom: number;
  mapStyles: any;
  onMapLoad?: (map: any) => void;
  onBoundsChanged?: (bounds: any) => void;
  onMapClick?: (event: any) => void;
  children: React.ReactNode;
  height?: string | number;
  className?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({
  center,
  zoom,
  mapStyles,
  onMapLoad,
  onBoundsChanged,
  onMapClick,
  children,
  height = '100%',
  className,
}) => {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    return (
      <Box height={height} display="flex" alignItems="center" justifyContent="center">
        Missing Google Maps API Key
      </Box>
    );
  }

  const mapContainerStyle = {
    width: '100%',
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const handleMapLoad = React.useCallback((map: any) => {
    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [onMapLoad]);

  const handleBoundsChanged = React.useCallback(() => {
    if (onBoundsChanged) {
      // Implementation depends on map instance needs
    }
  }, [onBoundsChanged]);

  const handleMapClick = React.useCallback((event: any) => {
    if (onMapClick) {
      onMapClick(event);
    }
  }, [onMapClick]);

  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    }>
      <LoadScript googleMapsApiKey={googleMapsApiKey} id="google-maps-script">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          mapContainerClassName={className}
          center={center}
          zoom={zoom}
          options={{
            styles: mapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
        >
          {children}
        </GoogleMap>
      </LoadScript>
    </Suspense>
  );
};

export default MapContainer;
