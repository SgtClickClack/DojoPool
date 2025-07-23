import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindow, OverlayView } from '@react-google-maps/api';
import livingWorldHubService, { DojoData, PlayerData, TerritoryUpdate } from '../../services/LivingWorldHubService';
import { ErrorBoundary } from 'react-error-boundary';
import { CircularProgress, Alert, Snackbar, Chip, Box, Typography, Paper, Button, IconButton, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  LocationOn,
  People,
  Star,
  EmojiEvents,
  Warning,
  CheckCircle,
  Cancel,
  DirectionsWalk,
  Timer,
  TrendingUp
} from '@mui/icons-material';
import DojoProfilePanel from '../../components/dojo/DojoProfilePanel';
import ChallengeManager from '../../components/challenge/ChallengeManager';
import { env } from '../../config/environment';

// Debug environment variables
console.log('Environment check:', {
  VITE_GOOGLE_MAPS_API_KEY: env.VITE_GOOGLE_MAPS_API_KEY,
  NODE_ENV: env.NODE_ENV,
  MODE: env.NODE_ENV
});

console.log('GOOGLE MAPS KEY:', env.VITE_GOOGLE_MAPS_API_KEY);

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Brisbane center coordinates
const center = {
  lat: -27.4698,
  lng: 153.0251
};

// Midnight Commander dark map style
const mapStyles = [
  { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }, { "lightness": 13 }] },
  { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#144b53" }, { "lightness": 14 }, { "weight": 1.4 }] },
  { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#08304b" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#0c4152" }, { "lightness": 5 }] },
  { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#0b434f" }, { "lightness": 25 }] },
  { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }] },
  { "featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{ "color": "#0b3d51" }, { "lightness": 16 }] },
  { "featureType": "road.local", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "featureType": "transit", "elementType": "all", "stylers": [{ "color": "#146474" }] },
  { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#021019" }] }
];

// Environment variables are accessed directly from the centralized config

const googleMapsApiKey = env.VITE_GOOGLE_MAPS_API_KEY || '';

// Permanent Google Maps API key check
const isMapsKeyMissingOrInvalid = !googleMapsApiKey ||
  googleMapsApiKey === 'your_actual_api_key' ||
  googleMapsApiKey.toLowerCase().includes('mock') ||
  googleMapsApiKey.length < 30;

// Enhanced DojoMarker SVG with territory level indicators
const getDojoMarkerIcon = (dojo: DojoData) => {
  let glow, fill, icon, borderColor;
  const territoryLevel = dojo.territoryLevel;

  if (dojo.isLocked) {
    glow = '#888'; fill = '#444'; icon = '🔒'; borderColor = '#666';
  } else if (dojo.allegiance === 'player') {
    glow = '#00fff7'; fill = '#00fff7'; icon = '🏠'; borderColor = '#00a8ff';
  } else if (dojo.allegiance === 'rival') {
    glow = '#ff3b3b'; fill = '#ff3b3b'; icon = '⚔️'; borderColor = '#ff6b6b';
  } else {
    glow = '#aaa'; fill = '#aaa'; icon = '🎱'; borderColor = '#888';
  }

  // Add territory level rings
  const rings = territoryLevel > 0 ? Array.from({ length: territoryLevel }, (_, i) =>
    `<circle cx='24' cy='24' r='${20 + (i * 3)}' fill='none' stroke='${borderColor}' stroke-width='2' opacity='${0.8 - (i * 0.2)}'/>`
  ).join('') : '';

  const svg = `<svg width='48' height='48' xmlns='http://www.w3.org/2000/svg'>${rings}<circle cx='24' cy='24' r='16' fill='${fill}' stroke='#000' stroke-width='3'/><filter id='glow'><feGaussianBlur stdDeviation='4' result='coloredBlur'/><feMerge><feMergeNode in='coloredBlur'/><feMergeNode in='SourceGraphic'/></feMerge></filter><circle cx='24' cy='24' r='16' fill='${fill}' filter='url(%23glow)' opacity='0.7'/><text x='24' y='30' text-anchor='middle' font-size='22' font-family='Arial'>${icon}</text></svg>`;

  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(48, 48),
    anchor: new google.maps.Point(24, 24),
  };
};

const getPlayerMarkerIcon = () => {
  const svg = `<svg width='56' height='56' xmlns='http://www.w3.org/2000/svg'><circle cx='28' cy='28' r='20' fill='#00fff7' stroke='#fff' stroke-width='4'/><circle cx='28' cy='28' r='20' fill='#00fff7' filter='url(%23glow)' opacity='0.7'/><text x='28' y='36' text-anchor='middle' font-size='28' font-family='Arial'>👤</text></svg>`;

  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(56, 56),
    anchor: new google.maps.Point(28, 28),
  };
};

// Enhanced Player HUD with real-time information
const PlayerHUD = ({ player }: { player: PlayerData }) => (
  <Paper
    sx={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      p: 2,
      background: 'rgba(0,0,0,0.9)',
      border: '2px solid #00fff7',
      borderRadius: 2,
      boxShadow: '0 0 24px #00fff7',
      zIndex: 2000,
      minWidth: 280,
      display: 'flex',
      alignItems: 'center',
      gap: 2
    }}
  >
    <Typography sx={{ fontSize: '2.5rem', mr: 1 }}>{player.avatar}</Typography>
    <Box sx={{ flex: 1 }}>
      <Typography variant='h6' sx={{ color: '#00fff7', fontFamily: 'Orbitron, monospace', fontWeight: 700 }}>
        {player.name}
      </Typography>
      <Typography variant='body2' sx={{ color: '#fff', fontFamily: 'Orbitron, monospace' }}>
        Level {player.level} • {player.clanRank}
      </Typography>
      <Typography variant='body2' sx={{ color: '#00a8ff', fontFamily: 'Orbitron, monospace' }}>
        💰 {player.dojoCoins} • {player.clan}
      </Typography>
      {player.isMoving && (
        <Typography variant='body2' sx={{ color: '#00ff9d', fontFamily: 'Orbitron, monospace', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <DirectionsWalk sx={{ fontSize: 16 }} />
          Moving to {player.destination ? player.destination.name : 'Unknown'}
        </Typography>
      )}
    </Box>
  </Paper>
);

// Territory Control Status Component
const TerritoryStatus = ({ dojo }: { dojo: DojoData }) => {
  const getStatusColor = () => {
    if (dojo.isLocked) return '#ff6b6b';
    if (dojo.allegiance === 'player') return '#00ff9d';
    if (dojo.allegiance === 'rival') return '#ff3b3b';
    return '#aaa';
  };

  const getStatusIcon = () => {
    if (dojo.isLocked) return <Cancel />;
    if (dojo.allegiance === 'player') return <CheckCircle />;
    if (dojo.allegiance === 'rival') return <Warning />;
    return <LocationOn />;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {getStatusIcon()}
      <Typography variant="body2" sx={{ color: getStatusColor(), fontWeight: 600 }}>
        {dojo.isLocked ? 'Locked Territory' : `${dojo.allegiance.charAt(0).toUpperCase() + dojo.allegiance.slice(1)} Territory`}
      </Typography>
      {dojo.territoryLevel > 0 && (
        <Chip
          label={`Level ${dojo.territoryLevel}`}
          size="small"
          sx={{
            backgroundColor: getStatusColor(),
            color: '#000',
            fontWeight: 700,
            fontSize: '0.7rem'
          }}
        />
      )}
    </Box>
  );
};

// Clan War Status Component
const ClanWarStatus = ({ dojo }: { dojo: DojoData }) => {
  if (dojo.clanWarStatus === 'none') return null;

  const getWarColor = () => {
    switch (dojo.clanWarStatus) {
      case 'active': return '#ff3b3b';
      case 'defending': return '#ff6b6b';
      case 'preparing': return '#ffaa00';
      default: return '#aaa';
    }
  };

  const getWarIcon = () => {
    switch (dojo.clanWarStatus) {
      case 'active': return <EmojiEvents />;
      case 'defending': return <Warning />;
      case 'preparing': return <Timer />;
      default: return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      {getWarIcon()}
      <Typography variant="body2" sx={{ color: getWarColor(), fontWeight: 600 }}>
        Clan War: {dojo.clanWarStatus.charAt(0).toUpperCase() + dojo.clanWarStatus.slice(1)}
      </Typography>
      {dojo.clanWarScore !== '0-0' && (
        <Chip
          label={dojo.clanWarScore}
          size="small"
          sx={{
            backgroundColor: getWarColor(),
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.7rem'
          }}
        />
      )}
    </Box>
  );
};

// Challenge Interface Component
const ChallengeInterface = ({ dojo }: { dojo: DojoData }) => {
  const handleChallenge = async (type: string) => {
    try {
      console.log(`Challenging ${dojo.name} with ${type} challenge`);
      await livingWorldHubService.createChallenge(type, dojo.id, dojo.clanLeader);
      console.log('Challenge created successfully');
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  };

  const handleTravel = async () => {
    try {
      console.log(`Traveling to ${dojo.name}`);
      await livingWorldHubService.updatePlayerLocation(dojo.coordinates.lat, dojo.coordinates.lng);
      console.log('Player location updated');
    } catch (error) {
      console.error('Failed to update player location:', error);
    }
  };

  if (dojo.isLocked) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: '#ff6b6b', mb: 1 }}>
          🔒 Territory is locked and cannot be challenged
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" sx={{ color: '#00a8ff', mb: 1, fontWeight: 600 }}>
        Available Actions:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleChallenge('pilgrimage')}
          sx={{
            borderColor: '#00ff9d',
            color: '#00ff9d',
            '&:hover': { borderColor: '#00a8ff', backgroundColor: 'rgba(0,168,255,0.1)' }
          }}
        >
          Pilgrimage
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleChallenge('duel')}
          sx={{
            borderColor: '#ff3b3b',
            color: '#ff3b3b',
            '&:hover': { borderColor: '#ff6b6b', backgroundColor: 'rgba(255,107,107,0.1)' }
          }}
        >
          Duel
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleChallenge('gauntlet')}
          sx={{
            borderColor: '#ffaa00',
            color: '#ffaa00',
            '&:hover': { borderColor: '#ffcc00', backgroundColor: 'rgba(255,204,0,0.1)' }
          }}
        >
          Gauntlet
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleTravel}
          sx={{
            backgroundColor: '#00a8ff',
            '&:hover': { backgroundColor: '#0088cc' }
          }}
        >
          Travel Here
        </Button>
      </Box>
    </Box>
  );
};

// Enhanced Info Window Content
const DojoInfoWindow = ({ dojo, onClose }: { dojo: DojoData, onClose: () => void }) => (
  <Paper sx={{
    p: 2,
    minWidth: 320,
    maxWidth: 400,
    background: 'rgba(10,20,30,0.95)',
    border: '2px solid #00ff9d',
    borderRadius: 2,
    boxShadow: '0 0 20px #00ff9d80'
  }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
      <Typography variant="h6" sx={{ color: '#00ff9d', fontFamily: 'Orbitron, monospace', fontWeight: 700 }}>
        {dojo.name}
      </Typography>
      <IconButton size="small" onClick={onClose} sx={{ color: '#00a8ff' }}>
        <Cancel />
      </IconButton>
    </Box>

    <TerritoryStatus dojo={dojo} />
    <ClanWarStatus dojo={dojo} />

    <Divider sx={{ my: 1, borderColor: '#00a8ff' }} />

    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <People sx={{ fontSize: 16, color: '#00a8ff' }} />
        <Typography variant="body2" sx={{ color: '#fff' }}>
          {dojo.players} players
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Star sx={{ fontSize: 16, color: '#ffaa00' }} />
        <Typography variant="body2" sx={{ color: '#fff' }}>
          {dojo.rating}
        </Typography>
      </Box>
    </Box>

    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2" sx={{ color: '#00a8ff' }}>
        Distance: {dojo.distance}
      </Typography>
      <Typography variant="body2" sx={{ color: '#00ff9d' }}>
        Revenue: {dojo.revenue}
      </Typography>
    </Box>

    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2" sx={{ color: '#ffaa00' }}>
        Active Matches: {dojo.activeMatches}
      </Typography>
      <Typography variant="body2" sx={{ color: '#aaa' }}>
        Last Challenge: {dojo.lastChallenge}
      </Typography>
    </Box>

    {dojo.clan !== "Unclaimed Territory" && (
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ color: '#00a8ff', fontWeight: 600 }}>
          Clan: {dojo.clan}
        </Typography>
        <Typography variant="body2" sx={{ color: '#fff' }}>
          Leader: {dojo.clanLeader}
        </Typography>
      </Box>
    )}

    {dojo.challenges.length > 0 && (
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ color: '#ffaa00', fontWeight: 600, mb: 0.5 }}>
          Active Challenges:
        </Typography>
        {dojo.challenges.map((challenge, index) => (
          <Chip
            key={index}
            label={`${challenge.type} by ${challenge.challenger}`}
            size="small"
            sx={{
              backgroundColor: challenge.status === 'active' ? '#ff3b3b' : '#ffaa00',
              color: '#fff',
              fontSize: '0.7rem',
              mr: 0.5,
              mb: 0.5
            }}
          />
        ))}
      </Box>
    )}

    <ChallengeInterface dojo={dojo} />
  </Paper>
);

// Styled components for performance
const MapContainer = styled('div')({
  width: '100%',
  height: '100vh',
  position: 'relative',
  overflow: 'hidden'
});

const LoadingOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  zIndex: 1000,
  backdropFilter: 'blur(4px)'
});

const StatusBar = styled(Box)({
  position: 'absolute',
  top: 10,
  right: 10,
  zIndex: 1000,
  display: 'flex',
  gap: 8,
  flexDirection: 'column'
});

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: 2,
      p: 3
    }}
  >
    <Typography variant="h5" color="error">
      Something went wrong with the map
    </Typography>
    <Typography variant="body2" color="text.secondary" textAlign="center">
      {error.message}
    </Typography>
    <button onClick={resetErrorBoundary} style={{ padding: '8px 16px', cursor: 'pointer' }}>
      Try again
    </button>
  </Box>
);

// Performance-optimized marker component
const DojoMarker = React.memo(({
  dojo,
  isSelected,
  onMarkerClick
}: {
  dojo: DojoData;
  isSelected: boolean;
  onMarkerClick: (dojo: DojoData) => void;
}) => {
  const markerRef = useRef<any>(null);

  const getMarkerIcon = useCallback(() => {
    const baseIcon = {
      url: dojo.allegiance === 'player'
        ? '/images/markers/player-dojo.png'
        : dojo.allegiance === 'rival'
          ? '/images/markers/rival-dojo.png'
          : '/images/markers/neutral-dojo.png',
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20)
    };

    if (isSelected) {
      baseIcon.scaledSize = new google.maps.Size(50, 50);
      baseIcon.anchor = new google.maps.Point(25, 25);
    }

    return baseIcon;
  }, [dojo.allegiance, isSelected]);

  const handleClick = useCallback(() => {
    onMarkerClick(dojo);
  }, [dojo, onMarkerClick]);

  return (
    <MarkerF
      position={dojo.coordinates}
      icon={getMarkerIcon()}
      onClick={handleClick}
      title={dojo.name}
    />
  );
});

DojoMarker.displayName = 'DojoMarker';

// Cyberpunk Overlay Component - Renders custom SVG elements on the map
const CyberpunkOverlay = ({ dojos, onDojoClick }: {
  dojos: DojoData[],
  onDojoClick: (dojo: DojoData) => void
}) => {
  // Define district positions in real-world coordinates (Brisbane)
  const districts = [
    {
      name: 'Crimson District',
      position: { lat: -27.4698, lng: 153.0251 },
      color: '#00ff88',
      size: 200,
      clan: 'Crimson Monkey'
    },
    {
      name: 'Azure District',
      position: { lat: -27.4580, lng: 153.0335 },
      color: '#ff6b6b',
      size: 180,
      clan: 'Azure Dragon'
    },
    {
      name: 'Golden District',
      position: { lat: -27.4800, lng: 153.0150 },
      color: '#ffd700',
      size: 190,
      clan: 'Golden Phoenix'
    },
    {
      name: 'Silver District',
      position: { lat: -27.4600, lng: 153.0100 },
      color: '#00a8ff',
      size: 170,
      clan: 'Silver Wolf'
    }
  ];

  // Define connection lines between districts
  const connections = [
    { from: districts[0], to: districts[1] },
    { from: districts[0], to: districts[2] },
    { from: districts[1], to: districts[3] },
    { from: districts[2], to: districts[3] }
  ];

  return (
    <>
      {/* Territory Boundaries */}
      {districts.map((district, index) => (
        <OverlayView
          key={`district-${district.name}`}
          position={district.position}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div
            style={{
              width: `${district.size}px`,
              height: `${district.size}px`,
              borderRadius: '50%',
              border: `2px solid ${district.color}`,
              backgroundColor: `${district.color}20`,
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: `territory-glow 4s ease-in-out infinite ${index * 0.5}s`,
              boxShadow: `0 0 30px ${district.color}40`
            }}
            title={district.name}
          />
        </OverlayView>
      ))}

      {/* Connection Lines */}
      {connections.map((connection, index) => (
        <OverlayView
          key={`connection-${index}`}
          position={{
            lat: (connection.from.position.lat + connection.to.position.lat) / 2,
            lng: (connection.from.position.lng + connection.to.position.lng) / 2
          }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <svg
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            <defs>
              <linearGradient id={`connectionGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00ff88" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#00ff88" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00ff88" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <line
              x1="0%"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke="url(#connectionGradient-0)"
              strokeWidth="3"
              opacity="0.4"
            />
          </svg>
        </OverlayView>
      ))}

      {/* 8-Ball Dojo Icons */}
      {dojos.map((dojo) => (
        <OverlayView
          key={`dojo-overlay-${dojo.id}`}
          position={dojo.coordinates}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              background: dojo.allegiance === 'player'
                ? 'radial-gradient(circle, #00ff88 0%, #00cc66 70%, #008844 100%)'
                : dojo.allegiance === 'rival'
                  ? 'radial-gradient(circle, #ff6b6b 0%, #ff4444 70%, #cc0000 100%)'
                  : 'radial-gradient(circle, #ffd700 0%, #ffcc00 70%, #cc9900 100%)',
              border: '2px solid #00ff88',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: `0 0 20px ${dojo.allegiance === 'player' ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 107, 107, 0.6)'}`,
              transition: 'all 0.3s ease',
              animation: 'pulse 2s infinite',
              transform: 'translate(-50%, -50%)',
              zIndex: 10
            }}
            onClick={() => onDojoClick(dojo)}
            title={`${dojo.name} - Controlled by ${dojo.clanLeader}`}
          >
            🎱
          </div>
        </OverlayView>
      ))}

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <OverlayView
          key={`particle-${i}`}
          position={{
            lat: center.lat + (Math.random() - 0.5) * 0.02,
            lng: center.lng + (Math.random() - 0.5) * 0.02
          }}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div
            style={{
              width: '2px',
              height: '2px',
              backgroundColor: '#00ff88',
              borderRadius: '50%',
              opacity: 0.6,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              pointerEvents: 'none',
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              zIndex: 2
            }}
          />
        </OverlayView>
      ))}
    </>
  );
};

// Add CSS animations for the overlay elements
const overlayStyles = `
  @keyframes territory-glow {
    0%, 100% {
      border-color: rgba(0, 255, 136, 0.3);
      box-shadow: 0 0 20px rgba(0, 255, 136, 0.1);
    }
    50% {
      border-color: rgba(0, 255, 136, 0.6);
      box-shadow: 0 0 40px rgba(0, 255, 136, 0.3);
    }
  }

  @keyframes pulse {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.1); }
  }

  @keyframes float {
    0%, 100% {
      transform: translate(-50%, -50%) translateY(0px) scale(1);
      opacity: 0.6;
    }
    50% {
      transform: translate(-50%, -50%) translateY(-20px) scale(1.2);
      opacity: 1;
    }
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = overlayStyles;
  document.head.appendChild(styleElement);
}

// Main MapView component with performance optimizations
const MapView: React.FC = () => {
  const [dojos, setDojos] = useState<DojoData[]>([]);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [selectedDojo, setSelectedDojo] = useState<DojoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [showChallengeManager, setShowChallengeManager] = useState(false);

  const mapRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const loadStartTime = useRef<number>(Date.now());

  // Use the useJsApiLoader hook to properly load the Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey
  });

  // Memoized map center
  const mapCenter = useMemo(() => ({
    lat: -27.4698,
    lng: 153.0251
  }), []);

  // Memoized map options
  const mapOptions = useMemo(() => ({
    zoom: 15,
    center: mapCenter,
    mapTypeId: 'roadmap',
    styles: mapStyles,
    disableDefaultUI: true
  }), [mapCenter]);

  // Initialize service and load data
  useEffect(() => {
    const initializeService = async () => {
      try {
        await livingWorldHubService.initializeSocket();
        await loadData();

        // Update performance metrics
        const loadTime = Date.now() - loadStartTime.current;
        console.log(`Map loaded in ${loadTime}ms`);

        setPerformanceMetrics({
          loadTime,
          ...livingWorldHubService.getPerformanceMetrics()
        });
      } catch (err) {
        console.error('Failed to initialize service:', err);
        setError('Failed to initialize the map service');
      } finally {
        setLoading(false);
      }
    };

    initializeService();

    // Cleanup
    return () => {
      livingWorldHubService.disconnect();
    };
  }, []);

  // Online/offline status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeTerritory = livingWorldHubService.subscribeToTerritoryUpdates((update: TerritoryUpdate) => {
      setDojos(prevDojos =>
        prevDojos.map(dojo =>
          dojo.id === update.dojoId
            ? { ...dojo, ...update }
            : dojo
        )
      );
    });

    const unsubscribeChallenges = livingWorldHubService.subscribeToChallengeUpdates((update: any) => {
      console.log('Challenge update received:', update);
      // Refresh challenges for affected dojo
      if (selectedDojo && update.dojoId === selectedDojo.id) {
        loadDojoData();
      }
    });

    return () => {
      unsubscribeTerritory();
      unsubscribeChallenges();
    };
  }, [selectedDojo]);

  // Load data with error handling
  const loadData = useCallback(async () => {
    try {
      const [dojosData, playerData] = await Promise.all([
        livingWorldHubService.getDojos(mapCenter.lat, mapCenter.lng),
        livingWorldHubService.getPlayerData()
      ]);

      setDojos(dojosData);
      setPlayer(playerData);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      // Check if it's a connection error
      if (err instanceof Error && err.message.includes('fetch')) {
        setError('Connection to game server failed. Please check your internet connection and try again.');
      } else {
        setError('Failed to load map data. Please try again.');
      }
    }
  }, [mapCenter]);

  // Load dojo data for info window
  const loadDojoData = useCallback(async () => {
    if (!selectedDojo) return;

    try {
      const updatedDojos = await livingWorldHubService.getDojos(mapCenter.lat, mapCenter.lng);
      const updatedDojo = updatedDojos.find(d => d.id === selectedDojo.id);
      if (updatedDojo) {
        setSelectedDojo(updatedDojo);
      }
    } catch (err) {
      console.error('Failed to load dojo data:', err);
    }
  }, [selectedDojo, mapCenter]);

  // Handle marker click with performance optimization
  const handleMarkerClick = useCallback((dojo: DojoData) => {
    setSelectedDojo(dojo);

    // Update performance metrics
    setPerformanceMetrics((prev: any) => ({
      ...prev,
      ...livingWorldHubService.getPerformanceMetrics()
    }));
  }, []);

  // Handle challenge creation
  const handleChallenge = useCallback(async (type: string, dojoId: string, defenderId: string) => {
    try {
      const result = await livingWorldHubService.createChallenge(type, dojoId, defenderId);
      console.log('Challenge created:', result);

      // Refresh dojo data
      await loadDojoData();
    } catch (err) {
      console.error('Failed to create challenge:', err);
      setError('Failed to create challenge');
    }
  }, [loadDojoData]);

  // Handle player movement
  const handlePlayerMove = useCallback(async (destination: DojoData) => {
    if (!player) return;

    try {
      setPlayer((prev: PlayerData | null) => prev ? { ...prev, isMoving: true, destination } : null);

      // Simulate movement
      setTimeout(async () => {
        await livingWorldHubService.updatePlayerLocation(
          destination.coordinates.lat,
          destination.coordinates.lng
        );

        setPlayer((prev: PlayerData | null) => prev ? {
          ...prev,
          isMoving: false,
          destination: null,
          currentLocation: destination.coordinates
        } : null);
      }, 2000);
    } catch (err) {
      console.error('Failed to update player location:', err);
      setPlayer((prev: PlayerData | null) => prev ? { ...prev, isMoving: false, destination: null } : null);
    }
  }, [player]);

  // Map load handler
  const onMapLoad = useCallback((map: any) => {
    mapRef.current = map;
    console.log('Map loaded successfully');
  }, []);

  // Info window close handler
  const onInfoWindowClose = useCallback(() => {
    setSelectedDojo(null);
  }, []);

  // Retry loading data
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Toggle performance metrics
  const togglePerformanceMetrics = useCallback(() => {
    setShowPerformanceMetrics(prev => !prev);
  }, []);

  // Render performance metrics
  const renderPerformanceMetrics = useCallback(() => {
    if (!showPerformanceMetrics || !performanceMetrics) return null;

    return (
      <Box sx={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: 2,
        borderRadius: 1,
        fontSize: '0.8em',
        zIndex: 1000
      }}>
        <Typography variant="caption" display="block">
          Load Time: {performanceMetrics.loadTime}ms
        </Typography>
        <Typography variant="caption" display="block">
          Connected: {performanceMetrics.isConnected ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="caption" display="block">
          Cache Size: {performanceMetrics.cacheSize}
        </Typography>
        <Typography variant="caption" display="block">
          Queue Size: {performanceMetrics.offlineQueueSize}
        </Typography>
        <Typography variant="caption" display="block">
          Online: {performanceMetrics.isOnline ? 'Yes' : 'No'}
        </Typography>
      </Box>
    );
  }, [showPerformanceMetrics, performanceMetrics]);

  // Permanent Google Maps API key check (before any map logic)
  if (isMapsKeyMissingOrInvalid) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#111', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}>
        <h2 style={{ color: '#00fff7', marginBottom: 16 }}>Google Maps API Key Required</h2>
        <p style={{ maxWidth: 400, textAlign: 'center', marginBottom: 16 }}>
          A valid Google Maps API key is required for the map to function.<br />
          <b>Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file.</b><br />
          <span style={{ color: '#ff6b6b' }}>
            The current key is missing or invalid.
          </span>
        </p>
        <code style={{ background: '#222', padding: 8, borderRadius: 4, color: '#00fff7' }}>
          VITE_GOOGLE_MAPS_API_KEY=your_real_key_here
        </code>
        <p style={{ marginTop: 24, color: '#aaa', fontSize: 14 }}>
          See the README for setup instructions.<br />
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" style={{ color: '#00a8ff' }}>Get a Google Maps API key</a>
        </p>
      </div>
    );
  }

  // Handle loading state while the script is fetched
  if (!isLoaded) {
    return (
      <MapContainer>
        <LoadingOverlay>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ color: '#fff', mt: 2 }}>
            Loading Map...
          </Typography>
        </LoadingOverlay>
      </MapContainer>
    );
  }

  // Handle any script loading errors
  if (loadError) {
    return (
      <MapContainer>
        <LoadingOverlay>
          <Typography variant="h6" color="error">
            Error loading maps
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {loadError.message}
          </Typography>
        </LoadingOverlay>
      </MapContainer>
    );
  }

  // Handle data loading state
  if (loading) {
    return (
      <MapContainer>
        <LoadingOverlay>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ color: '#fff', mt: 2 }}>
            Loading Dojo Data...
          </Typography>
        </LoadingOverlay>
      </MapContainer>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MapContainer>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={mapOptions.zoom}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Player marker */}
          {player && (
            <MarkerF
              position={player.currentLocation}
              icon={getPlayerMarkerIcon()}
              title={player.name}
            />
          )}

          {/* Cyberpunk Overlay - Custom SVG elements on the map */}
          <CyberpunkOverlay dojos={dojos} onDojoClick={handleMarkerClick} />

          {/* Info window */}
          {selectedDojo && (
            <InfoWindow
              position={selectedDojo.coordinates}
              onCloseClick={onInfoWindowClose}
            >
              <DojoInfoWindow dojo={selectedDojo} onClose={onInfoWindowClose} />
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Status bar */}
        <StatusBar>
          <Chip
            label={isOnline ? 'Online' : 'Offline'}
            color={isOnline ? 'success' : 'error'}
            size="small"
          />

          {error && (
            <Chip
              label="Error"
              color="error"
              size="small"
              onClick={handleRetry}
              clickable
            />
          )}

          <Chip
            label="Performance"
            color="primary"
            size="small"
            onClick={togglePerformanceMetrics}
            clickable
          />
        </StatusBar>

        {/* Player HUD */}
        {player && <PlayerHUD player={player} />}

        {/* Challenges Button */}
        <button
          onClick={() => setShowChallengeManager(true)}
          className="fixed top-24 right-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors z-[1500]"
        >
          Challenges
        </button>

        {/* Dojo Profile Panel */}
        <DojoProfilePanel
          dojo={selectedDojo}
          onClose={() => setSelectedDojo(null)}
          isLocked={selectedDojo?.isLocked || false}
        />

        {/* Challenge Manager */}
        <ChallengeManager
          isOpen={showChallengeManager}
          onClose={() => setShowChallengeManager(false)}
        />

        {/* Performance metrics */}
        {renderPerformanceMetrics()}

        {/* Error snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </MapContainer>
    </ErrorBoundary>
  );
};

export default MapView;
