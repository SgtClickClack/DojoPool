import React from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

// Map container style
const containerStyle = {
  width: '100%',
  height: '400px'
};

// Initial center position (e.g., San Francisco)
const center = {
  lat: 37.7749,
  lng: -122.4194
};

function getEnv(key: string): string | undefined {
  // Use import.meta.env for Vite
  return import.meta.env[key];
}

const googleMapsApiKey = getEnv('VITE_GOOGLE_MAPS_API_KEY') || '';

const MapView: React.FC = () => {
  const { isLoaded, loadError } = useLoadScript({
    // Use import.meta.env now that vite.config defines it
    googleMapsApiKey: googleMapsApiKey,
    // Note: libraries prop can be added here if specific libraries like 'places' are needed later
  });

  const renderMap = () => (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
    >
      {/* Optional: Add markers or other components here */}
      <Marker position={center} />
    </GoogleMap>
  );

  if (loadError) {
    return <div>Error loading maps. Please check API key and network.</div>;
  }

  if (!isLoaded) {
    return <div>Loading Maps...</div>;
  }

  return renderMap();
};

export default MapView;
