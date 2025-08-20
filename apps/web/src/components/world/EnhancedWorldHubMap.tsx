// @ts-nocheck
'use client';

import {
  GoogleMap,
  InfoWindow,
  LoadScript,
  Marker,
} from '@react-google-maps/api';
import React, { useMemo } from 'react';
import { DojoData } from '../../services/dojoService';
import getGoogleMapsApiKey from '../../utils/getGoogleMapsApiKey';
import MapboxWorldHubMap from './MapboxWorldHubMap';

interface EnhancedWorldHubMapProps {
  height?: string | number;
}

// Mapbox-inspired dark theme styles for Google Maps
const mapboxDarkTheme = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a2e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8ec6ad' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4ecdc4' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4ecdc4' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#2d5a27' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

// Alternative Mapbox-inspired themes
const mapboxThemes = {
  dark: mapboxDarkTheme,
  light: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#7c93a3' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#e8f5e8' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#a2daf2' }],
    },
  ],
  vintage: [
    {
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#f4d03f' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#8b4513' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8b4513' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#d4af37' }],
    },
  ],
};

const containerStyle = { width: '100%', height: '100%' };
const center = { lat: -27.4698, lng: 153.0251 }; // Brisbane center
const defaultZoom = 13;

const EnhancedWorldHubMap: React.FC<EnhancedWorldHubMapProps> = ({
  height = '100%',
}) => {
  // For now, return the Mapbox-based map since we have the token
  return <MapboxWorldHubMap height={height} />;

  // TODO: Re-enable the full component once the React issue is resolved
  /*
  const [dojos, setDojos] = useState<DojoData[]>([]);
  const [selectedDojo, setSelectedDojo] = useState<DojoData | null>(null);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<
    'dark' | 'light' | 'vintage'
  >('dark');
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(
    null
  );
  const [mapError, setMapError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  */

  /*
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch player data to get clan information
      const player = await dojoService.getPlayerData();
      setPlayerData(player);

      // Fetch dojos in the Brisbane area
      const dojosData = await dojoService.getDojos(
        center.lat,
        center.lng,
        10000
      );
      setDojos(dojosData);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  */

  /*
  useEffect(() => {
    // Check if we have a Google Maps API key
    try {
      const apiKey = getGoogleMapsApiKey();
      setHasApiKey(!!apiKey);
    } catch (error) {
      console.warn('Failed to get Google Maps API key:', error);
      setHasApiKey(false);
    }

    fetchData();
  }, [fetchData]);
  */

  /*
  const handleMarkerClick = (dojo: DojoData) => {
    setSelectedDojo(dojo);
  };

  const handleCloseInfoWindow = () => {
    setSelectedDojo(null);
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);
  */

  const getMarkerIcon = (dojo: DojoData) => {
    if (dojo.isLocked) {
      return {
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#e74c3c" stroke="#ffffff" stroke-width="2"/>
              <path d="M12 16h8v8h-8z" fill="#ffffff"/>
              <rect x="14" y="12" width="4" height="4" fill="#ffffff"/>
            </svg>
          `),
        scaledSize: new google.maps.Size(32, 32),
      };
    }

    if (dojo.controllingClanId) {
      return {
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#f39c12" stroke="#ffffff" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="#ffffff" font-size="16" font-family="Arial">🏰</text>
            </svg>
          `),
        scaledSize: new google.maps.Size(32, 32),
      };
    }

    return {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#27ae60" stroke="#ffffff" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="#ffffff" font-size="16" font-family="Arial">🎯</text>
          </svg>
        `),
      scaledSize: new google.maps.Size(32, 32),
    };
  };

  const currentMapStyles = useMemo(() => mapboxThemes['dark'], []);

  // Check for Google Maps API key
  let googleMapsApiKey: string;
  try {
    googleMapsApiKey = getGoogleMapsApiKey();
  } catch (error) {
    console.warn('Failed to get Google Maps API key:', error);
    googleMapsApiKey = '';
  }

  if (!googleMapsApiKey) {
    // Fallback to MapboxWorldHubMap when Google Maps API key is missing
    return <MapboxWorldHubMap height={height} />;
  }

  if (mapError) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          color: '#ff4444',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <p>Map Error: {mapError}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          color: '#ffffff',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌍</div>
          <p>Loading DojoPool World Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height, position: 'relative' }}>
      {/* Theme Selector */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '8px',
          padding: '8px',
        }}
      >
        <select
          value={selectedTheme}
          onChange={(e) =>
            setSelectedTheme(e.target.value as 'dark' | 'light' | 'vintage')
          }
          aria-label="Select map theme"
          title="Choose map theme"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
          }}
        >
          <option value="dark">🌙 Dark</option>
          <option value="light">☀️ Light</option>
          <option value="vintage">📜 Vintage</option>
        </select>
      </div>

      <LoadScript
        googleMapsApiKey={googleMapsApiKey}
        onError={(error) => {
          console.error('Google Maps LoadScript error:', error);
          setMapError('Failed to load Google Maps');
        }}
        onLoad={() => {
          console.log('Google Maps loaded successfully');
        }}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={defaultZoom}
          options={{
            styles: currentMapStyles,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
          }}
          onLoad={onMapLoad}
        >
          {dojos.map((dojo) => (
            <Marker
              key={dojo.id}
              position={{
                lat: dojo.coordinates.lat,
                lng: dojo.coordinates.lng,
              }}
              icon={getMarkerIcon(dojo)}
              onClick={() => handleMarkerClick(dojo)}
            />
          ))}

          {selectedDojo && (
            <InfoWindow
              position={{
                lat: selectedDojo.coordinates.lat,
                lng: selectedDojo.coordinates.lng,
              }}
              onCloseClick={handleCloseInfoWindow}
            >
              <div style={{ padding: '8px', minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                  {selectedDojo.name}
                </h3>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                  Status: {selectedDojo.status}
                </p>
                {selectedDojo.controllingClan && (
                  <p
                    style={{
                      margin: '4px 0',
                      fontSize: '14px',
                      color: '#f39c12',
                    }}
                  >
                    Controlled by: {selectedDojo.controllingClan.name}{' '}
                    {selectedDojo.controllingClan.avatar}
                  </p>
                )}
                {selectedDojo.distance && (
                  <p
                    style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}
                  >
                    Distance: {selectedDojo.distance}
                  </p>
                )}
                <div style={{ marginTop: '12px' }}>
                  <button
                    style={{
                      padding: '6px 12px',
                      backgroundColor: selectedDojo.isLocked
                        ? '#95a5a6'
                        : '#27ae60',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: selectedDojo.isLocked ? 'not-allowed' : 'pointer',
                      marginRight: '8px',
                      fontSize: '12px',
                    }}
                    disabled={selectedDojo.isLocked}
                    onClick={() =>
                      console.log('Challenge dojo:', selectedDojo.name)
                    }
                  >
                    {selectedDojo.isLocked ? '🔒 Locked' : '⚔️ Challenge'}
                  </button>
                  <button
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3498db',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                    onClick={() => console.log('View dojo:', selectedDojo.name)}
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default EnhancedWorldHubMap;
