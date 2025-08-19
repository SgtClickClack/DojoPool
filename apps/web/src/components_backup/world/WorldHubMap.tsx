import 'mapbox-gl/dist/mapbox-gl.css';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, Popup } from 'react-map-gl/mapbox';
import { useMapData } from '../../hooks/useMapData';
import { useUserLocation } from '../../hooks/useUserLocation';
import { getDistance } from '../../utils/geo';

import styles from './WorldHubMap.module.css';

// --- Constants ---
const MAPBOX_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  'pk.eyJ1IjoiZG9qb3Bvb2wiLCJhIjoiY21lZng2YmxkMHk1aTJub2VsaXUyeXRlcyJ9.JTlUI6gaKKorGBm-4p-G6g';

const BRISBANE_COORDS = {
  longitude: 153.0251,
  latitude: -27.4698,
  zoom: 10,
};

const INTERACTION_RADIUS_METERS = 50;

// --- Component Props ---
interface WorldHubMapProps {
  /** Additional CSS classes to apply to the container. */
  className?: string;
  /** Callback function triggered when a user enters a Dojo. */
  onEnterDojo: (dojoId: string) => void;
}

/**
 * The core interactive map component for the Dojo Pool World Hub.
 * It displays the user, other players, and Dojo locations, and handles
 * proximity-based interactions using a declarative React approach.
 */
const WorldHubMap: React.FC<WorldHubMapProps> = ({
  className,
  onEnterDojo,
}) => {
  console.log('🚨 WORLDHUBMAP COMPONENT IS RENDERING! 🚨');

  // --- Refs ---
  const hasCenteredOnUserRef = useRef(false);

  // --- State ---
  const [viewState, setViewState] = useState({
    longitude: BRISBANE_COORDS.longitude,
    latitude: BRISBANE_COORDS.latitude,
    zoom: BRISBANE_COORDS.zoom,
  });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [nearbyDojoIds, setNearbyDojoIds] = useState<Set<string>>(new Set());
  const [selectedDojo, setSelectedDojo] = useState<any>(null);

  // --- Custom Hooks ---
  const { players, dojos, isLoading } = useMapData();
  const {
    position: userPosition,
    isLoading: isLocationLoading,
    error: locationError,
    accuracy,
  } = useUserLocation();

  // Add debugging logs
  console.log('WorldHubMap render:', {
    players: players?.length || 0,
    dojos: dojos?.length || 0,
    userPosition,
    isLocationLoading,
    locationError,
    mapError,
    isMapLoaded,
    viewState,
  });

  // --- Map Event Handlers ---
  const handleMapLoad = useCallback(() => setIsMapLoaded(true), []);

  const handleMapError = useCallback((error: any) => {
    console.error('WorldHubMap: Map error:', error);
    setMapError(
      'Map failed to load: ' + (error?.error?.message || 'Unknown error')
    );
  }, []);

  // --- Proximity Detection ---
  useEffect(() => {
    if (!userPosition || dojos.length === 0) return;

    const timeoutId = setTimeout(() => {
      const nearbyIds = new Set<string>();
      dojos.forEach((dojo) => {
        const distance = getDistance(
          userPosition[1], // latitude
          userPosition[0], // longitude
          dojo.coordinates[1], // latitude
          dojo.coordinates[0] // longitude
        );
        if (distance <= INTERACTION_RADIUS_METERS) {
          nearbyIds.add(dojo.id);
        }
      });
      setNearbyDojoIds(nearbyIds);
    }, 250); // Debounce check for performance

    return () => clearTimeout(timeoutId);
  }, [userPosition, dojos]);

  // --- Auto-center on user ---
  useEffect(() => {
    if (!isMapLoaded || !userPosition || hasCenteredOnUserRef.current) return;

    setViewState((prev) => ({
      ...prev,
      longitude: userPosition[0],
      latitude: userPosition[1],
      zoom: 14,
    }));
    hasCenteredOnUserRef.current = true;
  }, [isMapLoaded, userPosition]);

  // FIX: Moved token validation from render body to useEffect to prevent illegal state updates.
  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN) {
      const error = 'Mapbox access token is not configured.';
      console.error('WorldHubMap:', error);
      setMapError(error);
    }
  }, []);

  // --- Render Logic ---
  if (mapError) {
    console.error('WorldHubMap: Rendering error state:', mapError);
    return (
      <div className={styles.errorContainer}>
        <h3>Map Error</h3>
        <p>{mapError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Show loading state while hooks are loading
  if (isLoading || isLocationLoading) {
    console.log('WorldHubMap: Rendering loading state');
    return (
      <div className={styles.mapWrapper}>
        <div className={styles.loadingContainer}>
          <div>Loading DojoPool World...</div>
          <div>Players: {players?.length || 0}</div>
          <div>Dojos: {dojos?.length || 0}</div>
          <div>Location: {isLocationLoading ? '⏳' : '✅'}</div>
        </div>
      </div>
    );
  }

  console.log('WorldHubMap: About to render map component');

  try {
    console.log('WorldHubMap: Rendering Map component with props:', {
      viewState,
      mapboxAccessToken: MAPBOX_ACCESS_TOKEN ? '✅ Set' : '❌ Missing',
      players: players?.length || 0,
      dojos: dojos?.length || 0,
      userPosition,
    });

    return (
      <div className={`${styles.mapWrapper} ${className}`}>
        <Map
          {...viewState}
          style={{ width: '100%', height: 400 }}
          onLoad={handleMapLoad}
          onError={handleMapError}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          attributionControl={false}
        >
          <NavigationControl />

          {/* Render user marker */}
          {userPosition && (
            <Marker longitude={userPosition[0]} latitude={userPosition[1]}>
              <div className={styles.userMarker}>
                <div className={styles.userMarkerPulse}></div>
                <div className={styles.userMarkerCore}></div>
              </div>
            </Marker>
          )}

          {/* Render player markers */}
          {players?.map((player) => (
            <Marker
              key={player.id}
              longitude={player.coordinates[0]}
              latitude={player.coordinates[1]}
            >
              <div className={styles.playerMarker}>
                <Image
                  src={player.avatarUrl}
                  alt={player.username}
                  width={20}
                  height={20}
                />
              </div>
            </Marker>
          ))}

          {/* Render dojo markers */}
          {dojos?.map((dojo) => (
            <Marker
              key={dojo.id}
              longitude={dojo.coordinates[0]}
              latitude={dojo.coordinates[1]}
            >
              <div
                className={`${styles.dojoMarker} ${
                  dojo.isControlled ? styles.controlledDojo : ''
                }`}
                onClick={() => setSelectedDojo(dojo)}
              >
                {dojo.clanLogoUrl ? (
                  <Image
                    src={dojo.clanLogoUrl}
                    alt={dojo.name}
                    width={20}
                    height={20}
                  />
                ) : (
                  <div className={styles.defaultDojoIcon}>
                    {dojo.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {dojo.isControlled && (
                  <div className={styles.controlIndicator}>
                    <div className={styles.controlPulse}></div>
                  </div>
                )}
              </div>
            </Marker>
          ))}

          {/* Dojo popup */}
          {selectedDojo && (
            <Popup
              longitude={selectedDojo.coordinates[0]}
              latitude={selectedDojo.coordinates[1]}
              anchor="bottom"
              onClose={() => setSelectedDojo(null)}
              className={styles.dojoPopup}
            >
              <div className={styles.popupContent}>
                <h3 className={styles.dojoName}>{selectedDojo.name}</h3>
                <p className={styles.dojoAddress}>{selectedDojo.address}</p>
                <p className={styles.dojoLevel}>Level: {selectedDojo.level}</p>

                {selectedDojo.isControlled ? (
                  <div className={styles.controlInfo}>
                    <div className={styles.controlLabel}>Controlled by:</div>
                    <div className={styles.controllerInfo}>
                      {selectedDojo.controllingPlayerAvatar && (
                        <Image
                          src={selectedDojo.controllingPlayerAvatar}
                          alt={selectedDojo.controllingPlayerName || 'Player'}
                          width={24}
                          height={24}
                          className={styles.controllerAvatar}
                        />
                      )}
                      <span className={styles.controllerName}>
                        {selectedDojo.controllingPlayerName || 'Unknown Player'}
                      </span>
                    </div>
                    {selectedDojo.clan && (
                      <div className={styles.clanInfo}>
                        Clan: {selectedDojo.clan}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.controlInfo}>
                    <div className={styles.controlLabel}>
                      Status: Uncontrolled
                    </div>
                    <div className={styles.controlHint}>
                      Available for conquest!
                    </div>
                  </div>
                )}

                <button
                  className={styles.enterDojoButton}
                  onClick={() => {
                    onEnterDojo(selectedDojo.id);
                    setSelectedDojo(null);
                  }}
                >
                  Enter Dojo
                </button>
              </div>
            </Popup>
          )}
        </Map>

        <div className={styles.infoPanel}>
          <div>Lng: {viewState.longitude}</div>
          <div>Lat: {viewState.latitude}</div>
          <div>Zoom: {viewState.zoom}</div>
          <div className={styles.infoDivider}></div>
          <div>Players: {players?.length || 0}</div>
          <div>Map: {isMapLoaded ? '✅ Loaded' : '⏳ Loading...'}</div>
          <div>
            Location:
            {isLocationLoading
              ? '⏳'
              : locationError
              ? '❌ Error'
              : userPosition
              ? '✅ Found'
              : '⛔'}
          </div>
          {accuracy && <div>Accuracy: ±{Math.round(accuracy)}m</div>}
          <div>Nearby Dojos: {nearbyDojoIds.size}</div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('WorldHubMap: Error during render:', error);
    return (
      <div className={styles.errorContainer}>
        <h3>Map Error</h3>
        <p>An unexpected error occurred while rendering the map.</p>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
};

export default WorldHubMap;
