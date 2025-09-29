/**
 * Refactored World Hub Map Component
 * 
 * Cleaner, more maintainable version that:
 * - Separates concerns into focused components
 * - Uses unified state management
 * - Implements proper error boundaries
 * - Optimizes performance with memoization
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Alert } from '@mui/material';
import { useAuthRefactored } from '@/hooks/useAuthRefactored';
import { useMapData } from '@/hooks/useMapData';
import { type DojoData } from '@/services/dojoService';
import { type PlayerPosition } from '@/services/WebSocketService';

// Refactored components
import MapContainer from './MapContainer';
import DojoMarkers from './DojoMarkers';
import PlayerMarkers from './PlayerMarkers';
import MapInfoWindows from './MapInfoWindows';

// Existing components
import { ConnectionStatusBar } from '../ConnectionStatusBar';
import { ShadowRunModal } from '../ShadowRunModal';

import { center, defaultZoom, mapStyles } from '../MapStyles';
import styles from '../WorldHubMap.module.css';

interface RefactoredWorldHubMapProps {
  height?: string | number;
}

/**
 * Custom hook for managing map interaction state
 */
const useMapInteractions = () => {
  const [selectedDojo, setSelectedDojo] = useState<DojoData | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerPosition | null>(null);
  const [shadowRunOpen, setShadowRunOpen] = useState(false);

  const handleMarkerClick = useCallback((dojo: DojoData) => {
    setSelectedDojo(dojo);
    setSelectedPlayer(null);
  }, []);

  const handlePlayerMarkerClick = useCallback((player: PlayerPosition) => {
    setSelectedPlayer(player);
    setSelectedDojo(null);
  }, []);

  const handleCloseInfoWindow = useCallback(() => {
    setSelectedDojo(null);
    setSelectedPlayer(null);
  }, []);

  const openShadowRun = useCallback(() => {
    setShadowRunOpen(true);
  }, []);

  const closeShadowRun = useCallback(() => {
    setShadowRunOpen(false);
  }, []);

  return {
    selectedDojo,
    selectedPlayer,
    shadowRunOpen,
    handleMarkerClick,
    handlePlayerMarkerClick,
    handleCloseInfoWindow,
    openShadowRun,
    closeShadowRun,
  };
};

/**
 * Custom hook for map-specific actions
 */
const useMapActions = (user: any) => {
  const handleChallengeDojo = useCallback((dojoId: string) => {
    console.log('Challenging dojo:', dojoId, 'as user:', user?.id);
    // TODO: Implement actual challenge logic
  }, [user?.id]);

  const handleViewDojoDetails = useCallback((dojoId: string) => {
    console.log('Viewing dojo details:', dojoId);
    // TODO: Implement navigation to dojo details page
  }, []);

  const handleChallengePlayer = useCallback((playerId: string) => {
    console.log('Challenging player:', playerId, 'as user:', user?.id);
    // TODO: Implement actual challenge logic
  }, [user?.id]);

  const handleViewPlayerProfile = useCallback((playerId: string) => {
    console.log('Viewing player profile:', playerId);
    // TODO: Implement navigation to player profile page
  }, []);

  return {
    handleChallengeDojo,
    handleViewDojoDetails,
    handleChallengePlayer,
    handleViewPlayerProfile,
  };
};

/**
 * Component for rendering map configuration errors
 */
const MapConfigError: React.FC<{ height?: string | number }> = ({ height }) => (
  <Box 
    height={height || '100%'} 
    display="flex" 
    alignItems="center" 
    justifyContent="center"
    className={styles.errorContainer}
  >
    <Alert severity="error" sx={{ maxWidth: 600 }}>
      <strong>Map Configuration Required</strong>
      <br />
      Mapbox API token is missing. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.
    </Alert>
  </Box>
);

/**
 * Component for rendering loading states
 */
const MapLoading: React.FC<{ 
  height?: string | number;
  isWebSocketConnected: boolean;
}> = ({ height, isWebSocketConnected }) => (
  <Box 
    height={height || '100%'} 
    display="flex" 
    alignItems="center" 
    justifyContent="center"
    className={styles.errorContainer}
  >
    <Box textAlign="center">
      <h3>Loading World Map...</h3>
      <p>Discovering nearby Dojos...</p>
      {!isWebSocketConnected && (
        <p className={styles.connectionStatus}>
          Connecting to real-time service...
        </p>
      )}
    </Box>
  </Box>
);

/**
 * Component for rendering map errors
 */
const MapError: React.FC<{ 
  height?: string | number;
  error: string;
  onRetry: () => void;
}> = ({ height, error, onRetry }) => (
  <Box 
    height={height || '100%'} 
    display="flex" 
    alignItems="center" 
    justifyContent="center"
    className={styles.errorContainer}
  >
    <Box textAlign="center">
      <h3>Error Loading Map</h3>
      <p>{error}</p>
      <button onClick={onRetry} className={styles.retryButton}>
        Retry
      </button>
    </Box>
  </Box>
);

/**
 * Main refactored World Hub Map component
 */
const RefactoredWorldHubMap: React.FC<RefactoredWorldHubMapProps> = ({ 
  height = '100100vh' 
}) => {
  const { user } = useAuthRefactored();
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Map data from hook
  const {
    dojos,
    playerPositions,
    isLoading,
    error,
    isWebSocketConnected,
    messageActivity,
    refreshData,
  } = useMapData(center.lat, center.lng, 10000);

  // Map interactions
  const {
    selectedDojo,
    selectedPlayer,
    shadowRunOpen,
    handleMarkerClick,
    handlePlayerMarkerClick,
    handleCloseInfoWindow,
    openShadowRun,
    closeShadowRun,
  } = useMapInteractions();

  // Map actions
  const {
    handleChallengeDojo,
    handleViewDojoDetails,
    handleChallengePlayer,
    handleViewPlayerProfile,
  } = useMapActions(user);

  // Computed values
  const userClanId = useMemo(() => (user as any)?.clanId, [user]);
  const isLeader = useMemo(() => (user as any)?.clanRole === 'leader', [user]);
  const containerHeight = useMemo(() => typeof height === 'number' ? `${height}px` : height, [height]);

  // Early returns for error states
  if (!mapboxToken) {
    return <MapConfigError height={containerHeight} />;
  }

  if (isLoading) {
    return (
      <MapLoading 
        height={containerHeight} 
        isWebSocketConnected={isWebSocketConnected}
      />
    );
  }

  if (error) {
    return (
      <MapError 
        height={containerHeight} 
        error={error}
        onRetry={refreshData}
      />
    );
  }

  return (
    <Box height={containerHeight} position="relative">
      {/* Connection Status Indicator */}
      <ConnectionStatusBar
        isWebSocketConnected={isWebSocketConnected}
        messageActivity={messageActivity}
        playerCount={playerPositions.length}
      />

      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={defaultZoom}
        mapStyles={mapStyles}
        className={styles.mapContainer}
        height={containerHeight}
      >
        {/* Dojo Markers */}
        <DojoMarkers
          dojos={dojos}
          onMarkerClick={handleMarkerClick}
          selectedDojoId={selectedDojo?.id}
        />

        {/* Player Markers */}
        <PlayerMarkers
          playerPositions={playerPositions}
          onMarkerClick={handlePlayerMarkerClick}
          selectedPlayerId={selectedPlayer?.playerId}
        />

        {/* Info Windows */}
        <MapInfoWindows
          selectedDojo={selectedDojo}
          selectedPlayer={selectedPlayer}
          onCloseInfoWindow={handleCloseInfoWindow}
          onChallengeDojo={handleChallengeDojo}
          onViewDojoDetails={handleViewDojoDetails}
          onShadowRun={openShadowRun}
          onChallengePlayer={handleChallengePlayer}
          onViewPlayerProfile={handleViewPlayerProfile}
          userClanId={userClanId}
          isLeader={isLeader}
        />
      </MapContainer>

      {/* Shadow Run Modal */}
      <ShadowRunModal
        open={shadowRunOpen}
        onClose={closeShadowRun}
        targetVenueId={selectedDojo?.id || ''}
        targetVenueName={selectedDojo?.name || ''}
      />
    </Box>
  );
};

export default RefactoredWorldHubMap;
