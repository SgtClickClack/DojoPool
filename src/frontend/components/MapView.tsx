import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import React, { useEffect, useState } from 'react';
import DojoMarker from '../../apps/web/src/components/DojoMarker';
import DojoProfilePanel from '../../apps/web/src/components/dojo/DojoProfilePanel';
import {
  livingWorldHubService,
  type DojoData,
  type PlayerData,
} from '../../apps/web/src/services/LivingWorldHubService';
import styles from './MapView.module.css';

// Dark theme map styles
const mapStyles = [
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }, { lightness: 13 }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.fill',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#144b53' }, { lightness: 14 }, { weight: 1.4 }],
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [{ color: '#08304b' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#0c4152' }, { lightness: 5 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0b434f' }, { lightness: 25 }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0b3d51' }, { lightness: 16 }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ color: '#146474' }],
  },
  { featureType: 'water', elementType: 'all', stylers: [{ color: '#021019' }] },
];

const containerStyle = { width: '100%', height: '100%' };
const center = { lat: -27.4698, lng: 153.0251 }; // Brisbane center

function MapView() {
  const [dojos, setDojos] = useState<DojoData[]>([]);
  const [selectedDojo, setSelectedDojo] = useState<DojoData | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoadingDojos, setIsLoadingDojos] = useState(true);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Fetch player data and dojos on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingDojos(true);

        // Fetch player data to get clan information
        const player = await livingWorldHubService.getPlayerData();
        setPlayerData(player);

        // Fetch dojos in the Brisbane area (using center coordinates with 10km radius)
        const dojosData = await livingWorldHubService.getDojos(
          center.lat,
          center.lng,
          10000
        );
        setDojos(dojosData);
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setIsLoadingDojos(false);
      }
    };

    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded]);

  const handleMarkerClick = (dojo: DojoData) => {
    setSelectedDojo(dojo);
  };

  const handleClosePanel = () => {
    setSelectedDojo(null);
  };

  if (loadError) {
    return (
      <div className={styles.errorContainer}>
        <h2 className={styles.errorTitle}>Error loading map</h2>
        <p>{loadError.message}</p>
        <p className={styles.errorMessage}>
          Please check your Google Maps API key configuration.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading Map...</div>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
        }}
      >
        {/* Render Dojo Markers */}
        {dojos.map((dojo) => (
          <DojoMarker
            key={dojo.id}
            dojo={dojo}
            onClick={handleMarkerClick}
            playerClanId={playerData?.clan}
            isLocked={dojo.isLocked}
          />
        ))}
      </GoogleMap>

      {/* Loading indicator for dojos */}
      {isLoadingDojos && (
        <div className={styles.loadingIndicator}>Loading Dojos...</div>
      )}

      {/* Dojo Profile Panel */}
      {selectedDojo && (
        <DojoProfilePanel
          dojo={selectedDojo}
          onClose={handleClosePanel}
          isLocked={selectedDojo.isLocked}
        />
      )}
    </div>
  );
}

export default React.memo(MapView);
