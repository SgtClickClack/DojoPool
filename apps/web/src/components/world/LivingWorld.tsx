'use client';

import { useAuth } from '@/hooks/useAuth';
import { apiClient, getMySkillProfile } from '@/services/APIService';
import { TerritoryData } from '@/types';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AvatarData, AvatarRenderer } from './AvatarRenderer';

interface LivingWorldProps {
  height?: string | number;
  width?: string | number;
}

interface PlayerPresence {
  playerId: string;
  username: string;
  avatarUrl?: string;
  clanTag?: string;
  latitude: number;
  longitude: number;
  distance: number;
  heading?: number;
  speed?: number;
  lastUpdated: Date;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isWatching: boolean;
}

const LivingWorld: React.FC<LivingWorldProps> = ({
  height = '100vh',
  width = '100%',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const animationFrameRef = useRef<number>();

  const { user } = useAuth();

  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [territories, setTerritories] = useState<TerritoryData[]>([]);
  const [nearbyPlayers, setNearbyPlayers] = useState<PlayerPresence[]>([]);
  const [playerSkills, setPlayerSkills] = useState<any>(null);

  // Geolocation state
  const [geolocation, setGeolocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isWatching: false,
  });

  // Three.js scene objects (will be initialized when Three.js is loaded)
  const [scene, setScene] = useState<any>(null);
  const [camera, setCamera] = useState<any>(null);
  const [renderer, setRenderer] = useState<any>(null);
  const [avatarRenderer, setAvatarRenderer] = useState<AvatarRenderer | null>(
    null
  );
  const [playerAvatar, setPlayerAvatar] = useState<any>(null);

  // Initialize Three.js scene
  useEffect(() => {
    const initThreeJS = async () => {
      try {
        // Dynamic import of Three.js to avoid SSR issues
        const THREE = await import('three');

        if (!canvasRef.current) return;

        // Create scene
        const newScene = new THREE.Scene();
        newScene.background = new THREE.Color(0x87ceeb); // Sky blue background

        // Create camera
        const newCamera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        newCamera.position.set(0, 5, 10);

        // Create renderer
        const newRenderer = new THREE.WebGLRenderer({
          canvas: canvasRef.current,
          antialias: true,
        });
        newRenderer.setSize(window.innerWidth, window.innerHeight);
        newRenderer.shadowMap.enabled = true;
        newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        newScene.add(ambientLight);

        // Add directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        newScene.add(directionalLight);

        // Create ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshLambertMaterial({
          color: 0x90ee90, // Light green
          transparent: true,
          opacity: 0.8,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        newScene.add(ground);

        // Create player avatar (simple cylinder for now)
        const avatarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const avatarMaterial = new THREE.MeshLambertMaterial({
          color: user?.id ? 0x4caf50 : 0x2196f3, // Green for current user, blue for others
        });
        const avatar = new THREE.Mesh(avatarGeometry, avatarMaterial);
        avatar.position.set(0, 1, 0);
        avatar.castShadow = true;
        newScene.add(avatar);

        // Initialize AvatarRenderer
        const newAvatarRenderer = new AvatarRenderer(newScene);
        setAvatarRenderer(newAvatarRenderer);

        setScene(newScene);
        setCamera(newCamera);
        setRenderer(newRenderer);
        setPlayerAvatar(avatar);

        // Start render loop with avatar animation updates
        const animate = () => {
          animationFrameRef.current = requestAnimationFrame(animate);

          // Update avatar animations
          if (newAvatarRenderer) {
            newAvatarRenderer.updateAnimations();
          }

          newRenderer.render(newScene, newCamera);
        };
        animate();

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize Three.js:', err);
        setError(
          'Failed to initialize 3D world. Please check your browser compatibility.'
        );
        setIsLoading(false);
      }
    };

    initThreeJS();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (avatarRenderer) {
        avatarRenderer.dispose();
      }
    };
  }, [user?.id]);

  // Initialize geolocation tracking
  useEffect(() => {
    const initGeolocation = () => {
      if (!navigator.geolocation) {
        setGeolocation((prev) => ({
          ...prev,
          error: 'Geolocation is not supported by this browser',
        }));
        return;
      }

      setGeolocation((prev) => ({ ...prev, isWatching: true }));

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;

          setGeolocation((prev) => ({
            ...prev,
            latitude,
            longitude,
            accuracy,
            error: null,
          }));

          // Update player avatar position in 3D world
          updatePlayerPosition(latitude, longitude);

          // Send location update to server
          sendLocationUpdate(latitude, longitude, accuracy);
        },
        (error) => {
          let errorMessage = 'Unknown geolocation error';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }

          setGeolocation((prev) => ({
            ...prev,
            error: errorMessage,
            isWatching: false,
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000, // Accept cached positions up to 30 seconds old
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    };

    const cleanup = initGeolocation();
    return cleanup;
  }, []);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const initWebSocket = () => {
      if (!user?.id) return;

      try {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';
        const ws = new WebSocket(`${wsUrl}/world`, [], {
          headers: {
            authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        ws.onopen = () => {
          console.log('Connected to world WebSocket');
          // Send authentication message
          const authMessage = {
            type: 'authenticate',
            token: localStorage.getItem('auth_token'),
          };
          ws.send(JSON.stringify(authMessage));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle authentication response
            if (data.type === 'authenticated' && data.success) {
              console.log('WebSocket authentication successful');

              // Now request nearby players
              if (geolocation.latitude && geolocation.longitude) {
                const nearbyRequest = {
                  type: 'get_nearby_players',
                  latitude: geolocation.latitude,
                  longitude: geolocation.longitude,
                  radius: 2000,
                };
                ws.send(JSON.stringify(nearbyRequest));
              }
            } else {
              handleWebSocketMessage(data);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed');
          // Attempt to reconnect after 5 seconds
          setTimeout(initWebSocket, 5000);
        };

        websocketRef.current = ws;
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err);
      }
    };

    initWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [user?.id]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load territories
        const territoriesResponse = await apiClient.get('/v1/territories/map');
        setTerritories(territoriesResponse.data || []);

        // Load player skills for avatar customization
        if (user?.id) {
          const skillsResponse = await getMySkillProfile();
          setPlayerSkills(skillsResponse);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    loadInitialData();
  }, [user?.id]);

  // Update player position in 3D world
  const updatePlayerPosition = useCallback(
    async (latitude: number, longitude: number) => {
      if (!avatarRenderer || !camera || !user?.id) return;

      // Convert lat/lng to 3D coordinates (simplified projection)
      const x = (longitude - (geolocation.longitude || longitude)) * 111000; // Rough conversion
      const z = (latitude - (geolocation.latitude || latitude)) * 111000;

      // Create or update current player avatar
      const playerPosition = new THREE.Vector3(x, 1, z);
      const avatarData: AvatarData = {
        playerId: user.id,
        username: user.username || 'Player',
        position: playerPosition,
        rotation: new THREE.Euler(0, 0, 0),
        isCurrentPlayer: true,
        customization: {
          skinTone: '#F5DEB3',
          hairColor: '#4CAF50',
          hairStyle: 'short',
          clothingColor: '#2196F3',
          clothingStyle: 'casual',
          size: 1.0,
          animation: 'idle',
        },
      };

      const avatar = await avatarRenderer.createAvatar(avatarData);

      // Update camera to follow player
      camera.position.set(x, 5, z + 10);
      camera.lookAt(x, 0, z);
    },
    [avatarRenderer, camera, geolocation, user]
  );

  // Send location update to server
  const sendLocationUpdate = useCallback(
    async (
      latitude: number,
      longitude: number,
      accuracy: number | null = null
    ) => {
      if (!user?.id) return;

      try {
        await apiClient.post('/v1/location/update', {
          latitude,
          longitude,
          accuracy,
          isPrecise: true,
          isSharing: true,
        });
      } catch (err) {
        console.error('Failed to send location update:', err);
      }
    },
    [user?.id]
  );

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'nearby_players':
        if (data.players) {
          updateNearbyPlayers(data.players);
        }
        break;
      case 'location_update':
        updatePlayerLocation(data);
        break;
      case 'player_joined':
        addNearbyPlayer(data);
        break;
      case 'player_left':
        removeNearbyPlayer(data.playerId);
        break;
      case 'world_connected':
        console.log('Successfully connected to world server');
        break;
      case 'pong':
        // Handle ping response
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type, data);
    }
  }, []);

  // Update nearby players in 3D world
  const updateNearbyPlayers = useCallback((players: PlayerPresence[]) => {
    setNearbyPlayers(players);
    // Update 3D avatars for nearby players
    updateNearbyAvatars(players);
  }, []);

  // Update individual player location
  const updatePlayerLocation = useCallback(
    async (data: any) => {
      if (!avatarRenderer || !geolocation.latitude || !geolocation.longitude)
        return;

      // Update specific player's avatar position
      const avatarPosition = new THREE.Vector3(
        (data.longitude - geolocation.longitude) * 111000,
        1,
        (data.latitude - geolocation.latitude) * 111000
      );

      const avatarData: AvatarData = {
        playerId: data.playerId,
        username: data.username || 'Unknown',
        position: avatarPosition,
        rotation: new THREE.Euler(0, data.heading || 0, 0),
        isCurrentPlayer: false,
        customization: {
          skinTone: '#F5DEB3',
          hairColor: '#8B4513',
          hairStyle: 'short',
          clothingColor: '#9C27B0',
          clothingStyle: 'casual',
          size: 1.0,
          animation:
            data.speed && data.speed > 2
              ? 'running'
              : data.speed && data.speed > 0.5
                ? 'walking'
                : 'idle',
        },
      };

      await avatarRenderer.createAvatar(avatarData);
    },
    [avatarRenderer, geolocation]
  );

  // Add new nearby player
  const addNearbyPlayer = useCallback((data: any) => {
    setNearbyPlayers((prev) => [...prev, data]);
  }, []);

  // Remove player who left
  const removeNearbyPlayer = useCallback(
    (playerId: string) => {
      setNearbyPlayers((prev) => prev.filter((p) => p.playerId !== playerId));

      // Remove 3D avatar using AvatarRenderer
      if (avatarRenderer) {
        avatarRenderer.removeAvatar(playerId);
      }
    },
    [avatarRenderer]
  );

  // Update 3D avatars for nearby players
  const updateNearbyAvatars = useCallback(
    async (players: PlayerPresence[]) => {
      if (!avatarRenderer || !geolocation.latitude || !geolocation.longitude)
        return;

      // Remove old avatars that are no longer nearby
      const currentPlayerIds = new Set(players.map((p) => p.playerId));
      for (const player of players) {
        if (!currentPlayerIds.has(player.playerId)) {
          avatarRenderer.removeAvatar(player.playerId);
        }
      }

      // Add or update avatars for nearby players
      for (const player of players) {
        const avatarPosition = new THREE.Vector3(
          (player.longitude - geolocation.longitude) * 111000,
          1,
          (player.latitude - geolocation.latitude) * 111000
        );

        const avatarData: AvatarData = {
          playerId: player.playerId,
          username: player.username,
          avatarUrl: player.avatarUrl,
          clanTag: player.clanTag,
          position: avatarPosition,
          rotation: new THREE.Euler(0, 0, 0),
          isCurrentPlayer: false,
          customization: {
            skinTone: '#F5DEB3',
            hairColor: '#8B4513',
            hairStyle: 'short',
            clothingColor: player.clanTag ? '#FF9800' : '#9C27B0',
            clothingStyle: 'casual',
            size: 1.0,
            animation:
              player.speed && player.speed > 2
                ? 'running'
                : player.speed && player.speed > 0.5
                  ? 'walking'
                  : 'idle',
          },
        };

        await avatarRenderer.createAvatar(avatarData);
      }
    },
    [avatarRenderer, geolocation]
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera, renderer]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height={height}
        width={width}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Initializing 3D World...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading Three.js and connecting to world server
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height={height}
        width={width}
        p={3}
      >
        <Typography variant="h6" color="error" gutterBottom>
          3D World Error
        </Typography>
        <Typography variant="body1" textAlign="center" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height,
        width,
        overflow: 'hidden',
      }}
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Main UI Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* World Status Panel */}
        <Paper sx={{ p: 2, minWidth: 250 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            🌍 Living World
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Players nearby:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {nearbyPlayers.length}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Territories:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {territories.length}
              </Typography>
            </Box>
            {geolocation.latitude && geolocation.longitude && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Position:</Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ fontSize: '0.75rem' }}
                >
                  {geolocation.latitude.toFixed(4)},{' '}
                  {geolocation.longitude.toFixed(4)}
                </Typography>
              </Box>
            )}
            {geolocation.accuracy && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Accuracy:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ±{Math.round(geolocation.accuracy)}m
                </Typography>
              </Box>
            )}
          </Box>
          {geolocation.error && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mt: 1, fontSize: '0.75rem' }}
            >
              ⚠️ {geolocation.error}
            </Typography>
          )}
        </Paper>

        {/* Quick Actions */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                if (geolocation.latitude && geolocation.longitude) {
                  const request = {
                    type: 'get_nearby_players',
                    latitude: geolocation.latitude,
                    longitude: geolocation.longitude,
                    radius: 2000,
                  };
                  websocketRef.current?.send(JSON.stringify(request));
                }
              }}
            >
              🔄 Refresh Players
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                // Toggle location sharing
                setGeolocation((prev) => ({
                  ...prev,
                  isWatching: !prev.isWatching,
                }));
              }}
            >
              📍 {geolocation.isWatching ? 'Stop Tracking' : 'Start Tracking'}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Mini Map (top-right) */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Paper sx={{ p: 2, width: 200, height: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            Mini Map
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 140,
              bgcolor: 'grey.100',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Simple mini map representation */}
            <Box
              sx={{
                width: 8,
                height: 8,
                bgcolor: 'primary.main',
                borderRadius: '50%',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            {nearbyPlayers.slice(0, 5).map((player, index) => (
              <Box
                key={player.playerId}
                sx={{
                  width: 4,
                  height: 4,
                  bgcolor: player.clanTag ? 'secondary.main' : 'text.secondary',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: `${40 + index * 15}%`,
                  left: `${20 + index * 12}%`,
                }}
                title={player.username}
              />
            ))}
            <Typography variant="caption" color="text.secondary">
              You are here
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Nearby Players List (bottom-left) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          maxWidth: 300,
        }}
      >
        <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>
            Nearby Players ({nearbyPlayers.length})
          </Typography>
          {nearbyPlayers.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              No players nearby
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {nearbyPlayers.slice(0, 8).map((player) => (
                <Box
                  key={player.playerId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'grey.50',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: player.clanTag
                          ? 'secondary.main'
                          : 'primary.main',
                      }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {player.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(player.distance)}m away
                      </Typography>
                    </Box>
                  </Box>
                  {player.clanTag && (
                    <Chip
                      label={player.clanTag}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>
              ))}
              {nearbyPlayers.length > 8 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textAlign: 'center' }}
                >
                  ...and {nearbyPlayers.length - 8} more
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Performance & Debug Info (bottom-right) */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Paper sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            System Status
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">WebSocket:</Typography>
              <Typography
                variant="caption"
                color={
                  websocketRef.current?.readyState === WebSocket.OPEN
                    ? 'success.main'
                    : 'error.main'
                }
              >
                {websocketRef.current?.readyState === WebSocket.OPEN
                  ? '🟢 Connected'
                  : '🔴 Disconnected'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">GPS:</Typography>
              <Typography
                variant="caption"
                color={geolocation.isWatching ? 'success.main' : 'warning.main'}
              >
                {geolocation.isWatching ? '🛰️ Active' : '📍 Inactive'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">3D Engine:</Typography>
              <Typography variant="caption" color="success.main">
                ⚡ Three.js
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Loading/Error Overlays */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Initializing Living World
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Loading 3D environment and connecting to world server...
            </Typography>
          </Paper>
        </Box>
      )}

      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
        >
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
            <Typography variant="h5" color="error" gutterBottom>
              World Loading Error
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
              >
                Reload World
              </Button>
              <Button variant="contained" onClick={() => setError(null)}>
                Continue
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default LivingWorld;
