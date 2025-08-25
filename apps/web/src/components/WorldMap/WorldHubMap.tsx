import { MAPBOX_CONFIG, getMapboxToken } from '@/config/mapbox';
import useUserLocation from '@/hooks/useUserLocation';
import { apiClient } from '@/services/apiClient';
import dojoService from '@/services/dojoService';
import {
  PlayerPosition,
  websocketService,
} from '@/services/services/network/WebSocketService';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useCallback, useEffect, useState } from 'react';
import Map, {
  GeolocateControl,
  Marker,
  NavigationControl,
  Popup,
} from 'react-map-gl';

interface DojoLocation {
  id: string;
  name: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  currentController?: {
    id: string;
    name: string;
    avatarUrl?: string;
    level: number;
  };
  memberCount: number;
  maxCapacity: number;
  status: 'available' | 'occupied' | 'at-war' | 'maintenance';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  specialFeatures: string[];
}

interface WorldHubMapProps {
  onChallengeDojo?: (dojoId: string) => void;
  onViewDojo?: (dojoId: string) => void;
  centerOn?: { lat: number; lng: number } | null;
}

const WorldHubMap: React.FC<WorldHubMapProps> = ({
  onChallengeDojo,
  onViewDojo,
  centerOn,
}) => {
  const [dojos, setDojos] = useState<DojoLocation[]>([]);
  const [players, setPlayers] = useState<PlayerPosition[]>([]);
  const [selectedDojo, setSelectedDojo] = useState<DojoLocation | null>(null);
  const [viewState, setViewState] = useState(MAPBOX_CONFIG.defaultCenter);
  const { location: userLocation, isLoading: locating } = useUserLocation();
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [checkedInDojoId, setCheckedInDojoId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Fetch initial dojo data
  const fetchDojos = useCallback(async () => {
    try {
      const response = await apiClient.get('/territories');
      setDojos(response.data);
    } catch (error) {
      console.error('Failed to fetch dojos:', error);
      // Fallback to mock data for development
      setDojos([
        {
          id: '1',
          name: 'The Jade Tiger',
          description: 'Premier pool hall in Brisbane CBD',
          location: {
            lat: -27.4698,
            lng: 153.0251,
            address: '123 Queen Street, Brisbane QLD 4000',
          },
          currentController: {
            id: 'player1',
            name: 'RyuKlaw',
            level: 85,
          },
          memberCount: 45,
          maxCapacity: 60,
          status: 'occupied',
          difficulty: 'expert',
          specialFeatures: ['Tournament Tables', 'VIP Lounge', 'Pro Shop'],
        },
        {
          id: '2',
          name: 'Pool Masters Dojo',
          description: 'Advanced players training ground',
          location: {
            lat: -27.48,
            lng: 153.015,
            address: '456 George Street, Brisbane QLD 4000',
          },
          currentController: {
            id: 'player2',
            name: 'ShadowStriker',
            level: 72,
          },
          memberCount: 32,
          maxCapacity: 40,
          status: 'occupied',
          difficulty: 'advanced',
          specialFeatures: ['Training Room', 'Video Analysis', 'Coaching'],
        },
        {
          id: '3',
          name: "Beginner's Haven",
          description: 'Friendly environment for new players',
          location: {
            lat: -27.46,
            lng: 153.035,
            address: '789 Adelaide Street, Brisbane QLD 4000',
          },
          currentController: undefined,
          memberCount: 18,
          maxCapacity: 30,
          status: 'available',
          difficulty: 'beginner',
          specialFeatures: [
            'Learning Tables',
            'Mentor Program',
            'Social Events',
          ],
        },
      ]);
    }
  }, []);

  // WebSocket event handlers
  const handlePlayerPositionUpdate = useCallback(
    (positions: PlayerPosition[]) => {
      setPlayers(positions);
    },
    []
  );

  const handleDojoStatusUpdate = useCallback((data: any) => {
    if (data.dojos) {
      setDojos((prevDojos) =>
        prevDojos.map((dojo) => {
          const update = data.dojos.find((d: any) => d.id === dojo.id);
          if (update) {
            return {
              ...dojo,
              status: update.status === 'controlled' ? 'occupied' : 'available',
              currentController: update.controller
                ? {
                    id: update.controller,
                    name: update.controller,
                    level: 50,
                  }
                : undefined,
            };
          }
          return dojo;
        })
      );
    }
  }, []);

  // Initialize WebSocket connection and data
  useEffect(() => {
    fetchDojos();

    // Connect to WebSocket
    websocketService
      .connect()
      .then(() => {
        // Subscribe to events
        const unsubscribePlayerPositions =
          websocketService.subscribeToPlayerPositions(
            handlePlayerPositionUpdate
          );
        const unsubscribeDojoUpdates = websocketService.subscribe(
          'dojo_status_update',
          handleDojoStatusUpdate
        );

        // Request initial player positions
        websocketService.requestPlayerPositions();

        // Cleanup function
        return () => {
          unsubscribePlayerPositions();
          unsubscribeDojoUpdates();
          websocketService.disconnect();
        };
      })
      .catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
      });
  }, [fetchDojos, handlePlayerPositionUpdate, handleDojoStatusUpdate]);

  const getDojoMarkerColor = (dojo: DojoLocation) => {
    switch (dojo.status) {
      case 'occupied':
        return '#ff4444'; // Red for controlled
      case 'at-war':
        return '#ff8800'; // Orange for conflict
      case 'maintenance':
        return '#888888'; // Gray for maintenance
      default:
        return '#44ff44'; // Green for available
    }
  };

  const getPlayerMarkerColor = (player: PlayerPosition) => {
    return player.isOnline ? '#0066ff' : '#666666';
  };

  const calculateDistanceMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const canCheckIn = (dojo: DojoLocation | null): boolean => {
    if (!dojo || !userLocation) return false;
    const dist = calculateDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      dojo.location.lat,
      dojo.location.lng
    );
    return dist <= 200;
  };

  const handleCheckIn = async () => {
    if (!selectedDojo || !userLocation) return;
    setIsCheckingIn(true);
    try {
      const res = await dojoService.checkInToDojo(
        selectedDojo.id,
        userLocation
      );
      setCheckedInDojoId(selectedDojo.id);
      setToast({
        open: true,
        message: res?.message || 'Checked in successfully',
        severity: 'success',
      });
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message || err?.message || 'Failed to check in';
      const tooFar = msg?.toLowerCase?.().includes('too far');
      setToast({
        open: true,
        message: tooFar ? 'You are too far away to check in.' : msg,
        severity: 'error',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Animate to user location when provided
  useEffect(() => {
    if (
      centerOn &&
      Number.isFinite(centerOn.lat) &&
      Number.isFinite(centerOn.lng)
    ) {
      setViewState((prev: any) => ({
        ...prev,
        longitude: centerOn.lng,
        latitude: centerOn.lat,
        zoom: Math.max(prev?.zoom || 11, 12),
        transitionDuration: 1000,
      }));
    }
  }, [centerOn]);

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Map
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '600px' }}
        mapStyle={MAPBOX_CONFIG.defaultStyle}
        mapboxAccessToken={getMapboxToken()}
      >
        <NavigationControl />
        <GeolocateControl />

        {/* Render Dojo Markers */}
        {dojos.map((dojo) => (
          <Marker
            key={dojo.id}
            longitude={dojo.location.lng}
            latitude={dojo.location.lat}
            onClick={(e: any) => {
              e.originalEvent.stopPropagation();
              setSelectedDojo(dojo);
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: getDojoMarkerColor(dojo),
                border: '2px solid white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              🏠
            </Box>
          </Marker>
        ))}

        {/* Render Player Markers */}
        {players.map((player) => (
          <Marker
            key={player.playerId}
            longitude={player.lng}
            latitude={player.lat}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: getPlayerMarkerColor(player),
                border: '2px solid white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              👤
            </Box>
          </Marker>
        ))}

        {/* Dojo Popup */}
        {selectedDojo && (
          <Popup
            longitude={selectedDojo.location.lng}
            latitude={selectedDojo.location.lat}
            onClose={() => setSelectedDojo(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <Paper sx={{ p: 2, minWidth: 250 }}>
              <Typography variant="h6" gutterBottom>
                {selectedDojo.name}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedDojo.description}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Address:</strong> {selectedDojo.location.address}
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <strong>Difficulty:</strong>
                  <Chip
                    label={selectedDojo.difficulty}
                    size="small"
                    sx={{ ml: 1 }}
                    color={
                      selectedDojo.difficulty === 'expert'
                        ? 'error'
                        : selectedDojo.difficulty === 'advanced'
                        ? 'warning'
                        : selectedDojo.difficulty === 'intermediate'
                        ? 'info'
                        : 'success'
                    }
                  />
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <strong>Status:</strong>
                  <Chip
                    label={selectedDojo.status}
                    size="small"
                    sx={{ ml: 1 }}
                    color={
                      selectedDojo.status === 'occupied'
                        ? 'error'
                        : selectedDojo.status === 'at-war'
                        ? 'warning'
                        : selectedDojo.status === 'maintenance'
                        ? 'default'
                        : 'success'
                    }
                  />
                </Typography>

                <Typography variant="body2" gutterBottom>
                  <strong>Members:</strong> {selectedDojo.memberCount}/
                  {selectedDojo.maxCapacity}
                </Typography>
              </Box>

              {selectedDojo.currentController && (
                <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Current Controller:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={selectedDojo.currentController.avatarUrl}
                      sx={{ width: 24, height: 24 }}
                    >
                      {selectedDojo.currentController.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">
                      {selectedDojo.currentController.name} (Level{' '}
                      {selectedDojo.currentController.level})
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {onViewDojo && (
                  <Chip
                    label="View Details"
                    onClick={() => onViewDojo(selectedDojo.id)}
                    color="primary"
                    variant="outlined"
                    clickable
                  />
                )}
                {onChallengeDojo && selectedDojo.status === 'available' && (
                  <Chip
                    label="Challenge"
                    onClick={() => onChallengeDojo(selectedDojo.id)}
                    color="success"
                    variant="outlined"
                    clickable
                  />
                )}
                <Button
                  size="small"
                  variant="contained"
                  color={
                    checkedInDojoId === selectedDojo.id ? 'success' : 'primary'
                  }
                  onClick={handleCheckIn}
                  disabled={
                    locating ||
                    isCheckingIn ||
                    !canCheckIn(selectedDojo) ||
                    checkedInDojoId === selectedDojo.id
                  }
                >
                  {checkedInDojoId === selectedDojo.id
                    ? 'Checked In ✔'
                    : isCheckingIn
                    ? 'Checking In...'
                    : canCheckIn(selectedDojo)
                    ? 'Check-In'
                    : 'Too Far'}
                </Button>
              </Box>
            </Paper>
          </Popup>
        )}
        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => setToast((t) => ({ ...t, open: false }))}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      </Map>
    </Box>
  );
};

export default WorldHubMap;
