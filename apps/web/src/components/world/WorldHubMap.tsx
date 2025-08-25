'use client';
import {
  GoogleMap,
  InfoWindow,
  LoadScript,
  Marker,
} from '@react-google-maps/api';
import React, { useState } from 'react';
import { useMapData } from '../../hooks/useMapData';
import { DojoData } from '../../services/dojoService';
import { PlayerPosition } from '../../services/services/network/WebSocketService';
import styles from './WorldHubMap.module.css';

// Prefer build-time inlined env var to avoid client/runtime env lookup pitfalls
const GOOGLE_MAPS_API_KEY_INLINE =
  (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined) || '';

// Safe masked log to verify key presence during development only
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  try {
    const prefix = GOOGLE_MAPS_API_KEY_INLINE
      ? GOOGLE_MAPS_API_KEY_INLINE.slice(0, 6)
      : 'MISSING';
    // eslint-disable-next-line no-console
    console.debug('[DojoPool] Maps key:', prefix, '********');
  } catch (e) {
    void e;
  }
}

interface WorldHubMapProps {
  height?: string | number;
}

const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
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

// Container styling handled via CSS module class `mapContainer`
const center = { lat: -27.4698, lng: 153.0251 }; // Brisbane center
const defaultZoom = 13;

const WorldHubMap: React.FC<WorldHubMapProps> = ({ height = '100%' }) => {
  // Utility function to generate height class
  const getHeightClass = (heightValue: string | number) => {
    if (typeof heightValue === 'string') {
      if (heightValue === '100%') return 'h100';
      if (heightValue === '100vh') return 'h100vh';
      // Extract numeric value from strings like "200px"
      const match = heightValue.match(/(\d+)px/);
      if (match) {
        const num = parseInt(match[1]);
        if (num <= 900) return `h${Math.floor(num / 100) * 100}`;
      }
    } else if (typeof heightValue === 'number') {
      if (heightValue <= 900) return `h${Math.floor(heightValue / 100) * 100}`;
    }
    return 'h100'; // default fallback
  };

  const heightClass = getHeightClass(height);

  // Check for required environment variables first
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Use the new useMapData hook for real-time data
  const {
    dojos,
    playerData,
    playerPositions,
    isLoading,
    error,
    isWebSocketConnected,
    messageActivity,
    updatePlayerPosition,
    refreshData,
  } = useMapData(center.lat, center.lng, 10000);

  const [selectedDojo, setSelectedDojo] = useState<DojoData | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPosition | null>(
    null
  );

  // Add error boundary protection
  if (!React || typeof React.useState !== 'function') {
    return (
      <div className={styles.errorContainer} data-height={height}>
        <p>React hooks not available. Please refresh the page.</p>
      </div>
    );
  }

  // Check for Mapbox token
  if (!mapboxToken) {
    return (
      <div className={styles.mapConfigContainer} data-height={height}>
        <div>
          <h3>Map Configuration Required</h3>
          <p>
            Mapbox API token is missing. Please set NEXT_PUBLIC_MAPBOX_TOKEN in
            your environment variables.
          </p>
          <p className={styles.mapConfigText}>
            For development, create a .env.local file with:
            NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
          </p>
        </div>
      </div>
    );
  }

  const handleMarkerClick = (dojo: DojoData) => {
    setSelectedDojo(dojo);
    setSelectedPlayer(null);
  };

  const handlePlayerMarkerClick = (player: PlayerPosition) => {
    setSelectedPlayer(player);
    setSelectedDojo(null);
  };

  const handleCloseInfoWindow = () => {
    setSelectedDojo(null);
    setSelectedPlayer(null);
  };

  const getMarkerIcon = (dojo: DojoData) => {
    if (dojo.isLocked) {
      return {
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#ff4444" stroke="#ffffff" stroke-width="2"/>
              <path d="M12 16h8v8h-8z" fill="#ffffff"/>
              <rect x="14" y="12" width="4" height="4" fill="#ffffff"/>
            </svg>
          `),
        scaledSize: new google.maps.Size(32, 32),
      };
    }

    if (dojo.controllingClanId && dojo.controllingClan) {
      // Enhanced clan-controlled dojo marker with clan tag
      return {
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#ff8800" stroke="#ffffff" stroke-width="2"/>
              <text x="16" y="18" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial">🏰</text>
              <text x="16" y="28" text-anchor="middle" fill="#ffffff" font-size="8" font-family="Arial">${
                dojo.controllingClan.tag || 'CLAN'
              }</text>
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
            <circle cx="16" cy="16" r="14" fill="#44ff44" stroke="#ffffff" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="#ffffff" font-size="16" font-family="Arial">🎱</text>
          </svg>
        `),
      scaledSize: new google.maps.Size(32, 32),
    };
  };

  const getPlayerMarkerIcon = (player: PlayerPosition) => {
    return {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#4a90e2" stroke="#ffffff" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial">👤</text>
          </svg>
        `),
      scaledSize: new google.maps.Size(24, 24),
    };
  };

  if (isLoading) {
    return (
      <div className={styles.errorContainer} data-height={height}>
        <div className={styles.centerContent}>
          <h3>Loading World Map...</h3>
          <p>Discovering nearby Dojos...</p>
          {!isWebSocketConnected && (
            <p className={styles.connectionStatus}>
              Connecting to real-time service...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer} data-height={height}>
        <div className={styles.centerContent}>
          <h3>Error Loading Map</h3>
          <p>{error}</p>
          <button onClick={refreshData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer} data-height={height}>
      {/* Connection Status Indicator */}
      <div className={styles.connectionStatusBar}>
        <span
          className={`${styles.statusDot} ${
            isWebSocketConnected ? styles.connected : styles.disconnected
          } ${messageActivity ? styles.heartbeat : ''}`}
        />
        {isWebSocketConnected ? 'Live Updates Active' : 'Connecting...'}
        <span className={styles.playerCount}>
          {playerPositions.length} players online
        </span>
      </div>

      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY_INLINE}>
        <GoogleMap
          mapContainerClassName={styles.mapContainer}
          center={center}
          zoom={defaultZoom}
          options={{
            styles: mapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {/* Dojo Markers */}
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

          {/* Player Position Markers with smooth transitions */}
          {playerPositions.map((player) => (
            <Marker
              key={player.playerId}
              position={{
                lat: player.lat,
                lng: player.lng,
              }}
              icon={getPlayerMarkerIcon(player)}
              onClick={() => handlePlayerMarkerClick(player)}
              options={{
                // Enable smooth transitions for player markers
                optimized: true,
                // Add custom properties for CSS transitions
                zIndex: 1000,
              }}
            />
          ))}

          {/* Dojo Info Window */}
          {selectedDojo && (
            <InfoWindow
              position={{
                lat: selectedDojo.coordinates.lat,
                lng: selectedDojo.coordinates.lng,
              }}
              onCloseClick={handleCloseInfoWindow}
            >
              <div className={styles.infoWindowContent}>
                <h3 className={styles.infoWindowTitle}>{selectedDojo.name}</h3>
                <p className={styles.infoWindowText}>{selectedDojo.status}</p>
                <div className={styles.infoWindowSection}>
                  <strong>Coordinates:</strong>{' '}
                  {selectedDojo.coordinates.lat.toFixed(4)},{' '}
                  {selectedDojo.coordinates.lng.toFixed(4)}
                </div>
                <div className={styles.infoWindowSection}>
                  <strong>Status:</strong>{' '}
                  <span
                    className={
                      selectedDojo.status === 'active'
                        ? styles.statusActive
                        : selectedDojo.status === 'inactive'
                        ? styles.statusInactive
                        : styles.statusMaintenance
                    }
                  >
                    {selectedDojo.status.charAt(0).toUpperCase() +
                      selectedDojo.status.slice(1)}
                  </span>
                </div>
                {selectedDojo.controllingClan && (
                  <div className={styles.infoWindowSection}>
                    <strong>Controlled by:</strong>
                    <div className={styles.controllerContainer}>
                      {selectedDojo.controllingClan.avatar && (
                        <img
                          src={selectedDojo.controllingClan.avatar}
                          alt={`${selectedDojo.controllingClan.name} emblem`}
                          className={styles.clanAvatar}
                        />
                      )}
                      <div>
                        <div className={styles.clanName}>
                          {selectedDojo.controllingClan.name}
                        </div>
                        {selectedDojo.controllingClan.tag && (
                          <div className={styles.clanTagBadge}>
                            [{selectedDojo.controllingClan.tag}]
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {selectedDojo.distance && (
                  <div className={styles.infoWindowSection}>
                    <strong>Distance:</strong> {selectedDojo.distance}
                  </div>
                )}
                {selectedDojo.isLocked && (
                  <div className={styles.infoWindowSection}>
                    <strong>Status:</strong> 🔒 Locked
                  </div>
                )}
                <div className={styles.buttonRow}>
                  <button
                    onClick={() => {
                      // Handle challenge logic
                      console.log('Challenging dojo:', selectedDojo.id);
                    }}
                    className={styles.challengeButton}
                  >
                    Challenge
                  </button>
                  <button
                    onClick={() => {
                      // Handle view details logic
                      console.log('Viewing dojo details:', selectedDojo.id);
                    }}
                    className={styles.viewDetailsButton}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Player Info Window */}
          {selectedPlayer && (
            <InfoWindow
              position={{
                lat: selectedPlayer.lat,
                lng: selectedPlayer.lng,
              }}
              onCloseClick={handleCloseInfoWindow}
            >
              <div className={styles.infoWindowContent}>
                <h3 className={styles.infoWindowTitle}>
                  {selectedPlayer.playerName}
                </h3>
                <div className={styles.infoWindowSection}>
                  <strong>Status:</strong>{' '}
                  <span
                    className={
                      selectedPlayer.isOnline
                        ? styles.statusActive
                        : styles.statusInactive
                    }
                  >
                    {selectedPlayer.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                {selectedPlayer.clan && (
                  <div className={styles.infoWindowSection}>
                    <strong>Clan:</strong> {selectedPlayer.clan}
                  </div>
                )}
                <div className={styles.infoWindowSection}>
                  <strong>Coordinates:</strong> {selectedPlayer.lat.toFixed(4)},{' '}
                  {selectedPlayer.lng.toFixed(4)}
                </div>
                <div className={styles.infoWindowSection}>
                  <strong>Last Update:</strong>{' '}
                  {new Date(selectedPlayer.timestamp).toLocaleTimeString()}
                </div>
                <div className={styles.buttonRow}>
                  <button
                    onClick={() => {
                      // Handle challenge logic
                      console.log(
                        'Challenging player:',
                        selectedPlayer.playerId
                      );
                    }}
                    className={styles.challengeButton}
                  >
                    Challenge
                  </button>
                  <button
                    onClick={() => {
                      // Handle view profile logic
                      console.log(
                        'Viewing player profile:',
                        selectedPlayer.playerId
                      );
                    }}
                    className={styles.viewDetailsButton}
                  >
                    View Profile
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

export default WorldHubMap;
