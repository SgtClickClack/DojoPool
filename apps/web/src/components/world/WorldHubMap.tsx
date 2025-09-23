'use client';
import { useAuth } from '@/hooks/useAuth';
import { useMapData } from '@/hooks/useMapData';
import { type PlayerPosition } from '@/services/WebSocketService';
import { type DojoData } from '@/services/dojoService';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';

// Dynamically import Google Maps components to reduce initial bundle size
const GoogleMap = dynamic(
  () =>
    import('@react-google-maps/api').then((mod) => ({
      default: mod.GoogleMap,
    })),
  {
    ssr: false,
    loading: () => <div>Loading map...</div>,
  }
);

const InfoWindow = dynamic(
  () =>
    import('@react-google-maps/api').then((mod) => ({
      default: mod.InfoWindow,
    })),
  {
    ssr: false,
  }
);

const LoadScript = dynamic(
  () =>
    import('@react-google-maps/api').then((mod) => ({
      default: mod.LoadScript,
    })),
  {
    ssr: false,
  }
);

const Marker = dynamic(
  () =>
    import('@react-google-maps/api').then((mod) => ({ default: mod.Marker })),
  {
    ssr: false,
  }
);
import { ShadowRunModal } from './ShadowRunModal';
import { ConnectionStatusBar } from './ConnectionStatusBar';
import { DojoInfoWindow } from './DojoInfoWindow';
import { PlayerInfoWindow } from './PlayerInfoWindow';
import { getMarkerIcon, getPlayerMarkerIcon } from './MapMarkerIcons';
import { mapStyles, center, defaultZoom } from './MapStyles';
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

  const _heightClass = getHeightClass(height);

  // Check for required environment variables first
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Use the new useMapData hook for real-time data
  const {
    dojos,
    playerData: _playerData,
    playerPositions,
    isLoading,
    error,
    isWebSocketConnected,
    messageActivity,
    updatePlayerPosition: _updatePlayerPosition,
    refreshData,
  } = useMapData(center.lat, center.lng, 10000);

  const [selectedDojo, setSelectedDojo] = useState<DojoData | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPosition | null>(
    null
  );
  const [shadowRunOpen, setShadowRunOpen] = useState(false);

  const { user } = useAuth();

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

  const handleChallengeDojo = (dojoId: string) => {
    console.log('Challenging dojo:', dojoId);
  };

  const handleViewDojoDetails = (dojoId: string) => {
    console.log('Viewing dojo details:', dojoId);
  };

  const handleChallengePlayer = (playerId: string) => {
    console.log('Challenging player:', playerId);
  };

  const handleViewPlayerProfile = (playerId: string) => {
    console.log('Viewing player profile:', playerId);
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

  const userClanId = (user as any)?.clanId;
  const isRival = !!(
    selectedDojo &&
    selectedDojo.controllingClanId &&
    selectedDojo.controllingClanId !== userClanId
  );
  const isLeader = (user as any)?.clanRole === 'leader';

  return (
    <div className={styles.mapContainer} data-height={height}>
      {/* Connection Status Indicator */}
      <ConnectionStatusBar
        isWebSocketConnected={isWebSocketConnected}
        messageActivity={messageActivity}
        playerCount={playerPositions.length}
      />

      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY_INLINE}
        id="google-maps-script"
      >
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
              <DojoInfoWindow
                dojo={selectedDojo}
                isRival={isRival}
                isLeader={isLeader}
                onClose={handleCloseInfoWindow}
                onChallenge={handleChallengeDojo}
                onViewDetails={handleViewDojoDetails}
                onShadowRun={() => setShadowRunOpen(true)}
              />
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
              <PlayerInfoWindow
                player={selectedPlayer}
                onClose={handleCloseInfoWindow}
                onChallenge={handleChallengePlayer}
                onViewProfile={handleViewPlayerProfile}
              />
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
      <ShadowRunModal
        open={shadowRunOpen}
        onClose={() => setShadowRunOpen(false)}
        targetVenueId={selectedDojo?.id || ''}
        targetVenueName={selectedDojo?.name || ''}
      />
    </div>
  );
};

export default WorldHubMap;
