import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Search as SearchIcon,
  Directions as DirectionsIcon,
  Close as CloseIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { SocketIOService } from '../../../services/WebSocketService';
import {
  APIProvider,
  Map as VisMap,
  AdvancedMarker,
  Pin,
  // Polygon, // Not used in SVG mock, comment out
  InfoWindow as VisInfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';

const DEFAULT_CENTER = { lat: -27.4698, lng: 153.0251 }; // Brisbane, Australia

// Use a default Map ID for development - in production, you should create a proper Map ID in Google Cloud Console
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'default_map_id';

interface Dojo {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  rating: number;
  distance: number;
  features: string[];
  status: 'open' | 'closed' | 'busy';
  coordinates: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  types?: string[];
}

// Territory interface for overlay system
interface Territory {
  id: string;
  name: string;
  type: 'friend' | 'neutral' | 'enemy';
  coordinates: Array<{ lat: number; lng: number }>;
  description: string;
  owner?: string;
  clan?: string;
  requiredNFT?: string;
  influence: number; // 0-100, represents territory control strength
}

// Mock dojo data as fallback
const mockDojos: Dojo[] = [
  {
    id: '1',
    name: 'Cyber Pool Hall',
    address: '123 Tech Street, Brisbane',
    phone: '+61 7 1234 5678',
    hours: 'Open',
    rating: 4.5,
    distance: 0.5,
    features: ['Pool Tables', 'Bar', 'Tournaments'],
    status: 'open',
    coordinates: { lat: -27.4698, lng: 153.0251 }
  },
  {
    id: '2',
    name: 'Neon Billiards',
    address: '456 Digital Ave, Brisbane',
    phone: '+61 7 8765 4321',
    hours: 'Open',
    rating: 4.2,
    distance: 1.2,
    features: ['Snooker', 'Food', 'Events'],
    status: 'open',
    coordinates: { lat: -27.4700, lng: 153.0255 }
  }
];

interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  nationalPhoneNumber?: string;
  types?: string[];
}

interface MapProps {
  unlockedTerritories: any[];
  userNFTs: string[];
  userId: string;
}

const Map: React.FC<MapProps> = ({ unlockedTerritories = [], userNFTs = [], userId }) => {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<Dojo | null>(null);
  const [selectedDojo, setSelectedDojo] = useState<Dojo | null>(null);
  const [showDojoDialog, setShowDojoDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [debouncedBounds, setDebouncedBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [homeDojoId, setHomeDojoId] = useState<string | null>(null); // State for Home Dojo
  const [showTerritories, setShowTerritories] = useState(true); // Toggle for territory overlays
  const [territoryEventDialogOpen, setTerritoryEventDialogOpen] = useState(false);
  const [territoryEventMessage, setTerritoryEventMessage] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);

  // Example: mock territory overlays (replace with real data in future)
  const territoryOverlays: Territory[] = [
    {
      id: 'downtown',
      name: 'Downtown District',
      type: unlockedTerritories.includes('downtown') ? 'friend' : 'enemy',
      coordinates: [
        { lat: -27.4698, lng: 153.0251 },
        { lat: -27.4690, lng: 153.0270 },
        { lat: -27.4705, lng: 153.0280 },
        { lat: -27.4712, lng: 153.0260 },
      ],
      description: 'Downtown Dojo territory',
      owner: unlockedTerritories.includes('downtown') ? userId : undefined,
      clan: unlockedTerritories.includes('downtown') ? 'Red Dragons' : undefined,
      requiredNFT: 'dojo_nft_downtown',
      influence: unlockedTerritories.includes('downtown') ? 100 : 0,
    },
    {
      id: 'beachfront',
      name: 'Beachfront',
      type: unlockedTerritories.includes('beachfront') ? 'friend' : 'enemy',
      coordinates: [
        { lat: -27.4700, lng: 153.0300 },
        { lat: -27.4695, lng: 153.0310 },
        { lat: -27.4710, lng: 153.0320 },
        { lat: -27.4715, lng: 153.0305 },
      ],
      description: 'Beachfront Dojo territory',
      owner: unlockedTerritories.includes('beachfront') ? userId : undefined,
      clan: unlockedTerritories.includes('beachfront') ? 'Blue Sharks' : undefined,
      requiredNFT: 'dojo_nft_beachfront',
      influence: unlockedTerritories.includes('beachfront') ? 100 : 0,
    },
    // Add more territories as needed
  ];

  // Debounce bounds changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBounds(mapBounds);
    }, 500);

    return () => clearTimeout(timer);
  }, [mapBounds]);

  useEffect(() => {
    const handleTerritoryUpdate = (data: any) => {
      setTerritoryEventMessage('Territory status has changed!');
      setTerritoryEventDialogOpen(true);
    };

    const unsubscribe = SocketIOService.subscribe('territory-updates', handleTerritoryUpdate);

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch user's home dojo on component mount (mocked for now)
  useEffect(() => {
    const fetchHomeDojo = async () => {
      // Mock implementation - in real app, fetch from backend
      setHomeDojoId('1'); // Set first dojo as home for demo
    };
    fetchHomeDojo();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  };

  const handleSetHomeDojo = async (dojoId: string) => {
    // Mock implementation - in real app, send to backend
    setHomeDojoId(dojoId);
  };

  const getTerritoryIcon = (type: Territory['type']) => {
    switch (type) {
      case 'friend':
        return '🛡️';
      case 'neutral':
        return '⚖️';
      case 'enemy':
        return '⚔️';
      default:
        return '📍';
    }
  };

  const getTerritoryColor = (type: Territory['type']) => {
    switch (type) {
      case 'friend':
        return '#00ff9d';
      case 'neutral':
        return '#ffa726';
      case 'enemy':
        return '#ff6b6b';
      default:
        return '#666';
    }
  };

  // Search for pool halls using Google Places API
  const searchPoolHalls = useCallback(async (bounds: google.maps.LatLngBounds | null) => {
    if (!bounds || bounds.isEmpty()) {
      // REMOVE console.warn('Search skipped: bounds are invalid or empty.');
      setMapError('Invalid map view. Please pan to a different area.');
      return;
    }

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    // Validate the coordinates to prevent API errors for invalid rectangles (e.g., crossing the antimeridian)
    if (sw.lat() > ne.lat() || sw.lng() > ne.lng()) {
        // REMOVE console.warn('Search skipped: Invalid map bounds detected.');
        setMapError('Invalid map view. Please pan to a different area.');
        return;
    }

    setIsSearching(true);
    setMapError(null);

    // Prepare the request body for the Google Places API
    const requestBody = {
      textQuery: 'pool hall OR billiards',
      languageCode: 'en',
      maxResultCount: 10,
      locationBias: {
        circle: {
          center: {
            latitude: (sw.lat() + ne.lat()) / 2,
            longitude: (sw.lng() + ne.lng()) / 2,
          },
          radius: 50000.0, // 50km radius
        },
      },
    };

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        // REMOVE console.warn('Google Maps API key not found, using mock data.');
        setMapError('Google Maps API key not found. Displaying mock data.');
        setDojos(mockDojos);
        return;
      }
      
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // REMOVE console.error('Full error response:', JSON.stringify(errorData, null, 2));
        // REMOVE console.error('Response status:', response.status);
        // REMOVE console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        setMapError(`Failed to search for Dojos: ${errorData.error?.message || 'Unknown error'}`);
        setDojos(mockDojos); // Fallback to mock data on API error
        return;
      }

      const data = await response.json();
      const foundDojos = (data.places || []).map((place: GooglePlaceResult) => ({
        id: place.id,
        name: place.displayName?.text || 'Name not available',
        address: place.formattedAddress,
        coordinates: {
          lat: place.location.latitude,
          lng: place.location.longitude,
        },
        rating: place.rating || 0,
        distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, place.location.latitude, place.location.longitude) : 0,
        phone: place.nationalPhoneNumber || 'N/A',
        hours: 'N/A', // Opening hours requires a separate Place Details request
        features: place.types || [],
        status: 'open', // Status also requires more details
        placeId: place.id,
        types: place.types || [],
      }));

      setDojos(foundDojos);
      if (foundDojos.length === 0) {
        setMapError('No Dojos found in your area. Showing mock data as examples.');
        setDojos(mockDojos);
      }

    } catch (error) {
      // REMOVE console.error('Error fetching from Places API:', error);
      setMapError('An error occurred while searching for Dojos.');
      setDojos(mockDojos); // Fallback to mock data on fetch error
    } finally {
      setIsSearching(false);
    }
  }, [userLocation]);

  // Handle map bounds change (zoom/pan)
  const handleBoundsChanged = useCallback(() => {
    if (map) {
      const bounds = map.getBounds();
      if (bounds) {
        setMapBounds(bounds);
      }
    }
  }, [map]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLoc);
          setCenter(userLoc);
        },
        () => {
          setCenter(DEFAULT_CENTER);
        }
      );
    } else {
      setCenter(DEFAULT_CENTER);
    }
  }, []);

  // Search for pool halls when debounced bounds change
  useEffect(() => {
    if (debouncedBounds) {
      searchPoolHalls(debouncedBounds);
    }
  }, [debouncedBounds, searchPoolHalls]);

  // Fallback: ensure dojos are displayed even if search hasn't triggered
  useEffect(() => {
    if (map && userLocation && dojos.length === 0 && !debouncedBounds) {
      const initialBounds = map.getBounds();
      if (initialBounds) {
        setMapBounds(initialBounds);
        searchPoolHalls(initialBounds);
      }
    }
  }, [map, userLocation, searchPoolHalls, dojos.length, debouncedBounds]);

  const handleDojoClick = (dojo: Dojo) => {
    setSelectedDojo(dojo);
    setShowDojoDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDojoDialog(false);
    setSelectedDojo(null);
  };

  const handleGetDirections = (dojo: Dojo) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dojo.address)}`;
    window.open(url, '_blank');
  };

  const handleMarkerClick = (dojo: Dojo) => {
    setSelectedMarker(dojo);
  };

  const handleMapClick = () => {
    setSelectedMarker(null);
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  return (
    <Box sx={{ py: 6 }}>
      <Typography
        variant="h2"
        align="center"
        sx={{
          color: "#00ff9d",
          textShadow: "0 0 10px #00ff9d, 0 0 20px #00a8ff",
          fontFamily: 'Orbitron',
          mb: 4,
        }}
      >
        🗺️ Dojo Map
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search dojos by name or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#00ff9d' }} />
              </InputAdornment>
            ),
            sx: {
              background: 'rgba(0, 0, 0, 0.8)',
              border: '2px solid #00ff9d',
              borderRadius: 2,
              color: '#fff',
              fontFamily: 'Orbitron, monospace',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '& input::placeholder': {
                color: '#00a8ff',
                opacity: 0.7,
              },
            },
          }}
        />
      </Box>

      {/* Loading Indicator for Places API Search */}
      {isSearching && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          mb: 2,
          p: 2,
          background: 'rgba(0, 168, 255, 0.1)',
          border: '1px solid #00a8ff',
          borderRadius: 2,
          fontFamily: 'Orbitron, monospace',
        }}>
          <CircularProgress size={20} sx={{ color: '#00ff9d', mr: 2 }} />
          <Typography sx={{ color: '#00ff9d' }}>
            Searching for pool halls and billiards venues...
          </Typography>
        </Box>
      )}

      {/* Status Message */}
      {!isSearching && dojos.length > 0 && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 2, 
            background: 'rgba(0, 168, 255, 0.1)',
            border: '1px solid #00a8ff',
            color: '#00a8ff',
            fontFamily: 'Orbitron, monospace',
          }}
        >
          Found {dojos.length} pool halls and billiards venues near you
        </Alert>
      )}

      {/* Territory Overlay Controls */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          background: 'linear-gradient(135deg, #181818 60%, #1a1a1a 100%)',
          border: '2px solid #00a8ff',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#00ff9d',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <SecurityIcon /> Territory Overlays
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={showTerritories}
                onChange={(e) => setShowTerritories(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#00ff9d',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 255, 157, 0.08)',
                    },
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#00ff9d',
                  },
                }}
              />
            }
            label=""
          />
        </Box>

        {/* Territory Legend */}
        {showTerritories && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {['friend', 'neutral', 'enemy'].map((type) => (
              <Chip
                key={type}
                icon={<span style={{ fontSize: '16px' }}>{getTerritoryIcon(type as Territory['type'])}</span>}
                label={`${type.charAt(0).toUpperCase() + type.slice(1)} Territory`}
                sx={{
                  background: `rgba(${type === 'friend' ? '0, 255, 157' : type === 'neutral' ? '255, 167, 38' : '255, 107, 107'}, 0.2)`,
                  color: getTerritoryColor(type as Territory['type']),
                  border: `1px solid ${getTerritoryColor(type as Territory['type'])}`,
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Map Error Alert */}
      {mapError && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 2, 
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid #ffc107',
            color: '#ffc107',
            fontFamily: 'Orbitron, monospace',
          }}
        >
          {mapError}
        </Alert>
      )}

      {/* Interactive Google Map */}
      <Paper
        sx={{
          height: 400,
          mb: 4,
          background: 'linear-gradient(135deg, #181818 60%, #00a8ff 100%)',
          border: '2px solid #00a8ff',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
          <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <VisMap
              mapId={MAP_ID}
              style={{ width: '100%', height: 400 }}
              defaultCenter={center}
              defaultZoom={12}
              gestureHandling="greedy"
              onClick={handleMapClick}
              onCenterChanged={e => setCenter(e.detail.center)}
              onBoundsChanged={handleBoundsChanged}
            >
              {/* MapHandler if present */}
              {/* <MapHandler onMapLoad={onMapLoad} /> */}
              {userLocation && (
                <AdvancedMarker position={userLocation} title="Your Location">
                  <Pin background="#00ff9d" borderColor="#000" glyphColor="#000" />
                </AdvancedMarker>
              )}
              {dojos.map((dojo) => (
                <AdvancedMarker
                  key={dojo.id}
                  position={dojo.coordinates}
                  title={dojo.name}
                  onClick={() => handleMarkerClick(dojo)}
                >
                  <Pin 
                    background={homeDojoId === dojo.id ? '#f7b731' : (selectedMarker?.id === dojo.id ? '#ff6b6b' : '#00a8ff')} 
                    borderColor="#000" 
                    glyphColor="#fff" 
                  />
                </AdvancedMarker>
              ))}
              {selectedMarker && (
                <VisInfoWindow
                  position={selectedMarker.coordinates}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <Box sx={{ p: 1, minWidth: 250, background: '#1a1a1a', color: '#fff', fontFamily: 'Orbitron, monospace' }}>
                    <Typography
                      variant="h6"
                      sx={{ color: '#00ff9d', fontFamily: 'Orbitron, monospace', fontWeight: 700, mb: 1 }}
                    >
                      {selectedMarker.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc', fontFamily: 'Orbitron, monospace', mb: 1 }}>
                      {selectedMarker.address}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#00a8ff', fontFamily: 'Orbitron, monospace', mb: 2 }}>
                      ⭐ {selectedMarker.rating} • {selectedMarker.distance} miles
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleDojoClick(selectedMarker)}
                        sx={{ background: '#00ff9d', color: '#000', fontFamily: 'Orbitron, monospace', fontWeight: 700, '&:hover': { background: '#00cc7a' }, mr: 1 }}
                      >
                        Details
                      </Button>
                      {homeDojoId === selectedMarker.id ? (
                        <Button variant="contained" size="small" disabled sx={{ background: '#f7b731', color: '#000' }}>
                          Home Dojo
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleSetHomeDojo(selectedMarker.id)}
                          sx={{ borderColor: '#f7b731', color: '#f7b731', '&:hover': { borderColor: '#ffca28', background: 'rgba(247, 183, 49, 0.1)' } }}
                        >
                          Set as Home
                        </Button>
                      )}
                    </Box>
                  </Box>
                </VisInfoWindow>
              )}
              {/* Territory Overlays */}
              {showTerritories && territoryOverlays.map((territory) => {
                const isUnlocked = unlockedTerritories.includes(territory.id);
                const territoryColor = getTerritoryColor(territory.type);
                const territoryIcon = getTerritoryIcon(territory.type);
                
                return (
                  <Box
                    key={territory.id}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    {/* Territory Border Overlay */}
                    <svg
                      width="100%"
                      height="100%"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        pointerEvents: 'none',
                      }}
                    >
                      <defs>
                        <pattern 
                          id={`territory-pattern-${territory.id}`} 
                          patternUnits="userSpaceOnUse" 
                          width="20" 
                          height="20"
                        >
                          <rect width="20" height="20" fill={territoryColor} opacity="0.1"/>
                          <path 
                            d="M0,0 L20,20 M20,0 L0,20" 
                            stroke={territoryColor} 
                            strokeWidth="1" 
                            opacity="0.3"
                          />
                        </pattern>
                        <filter id={`glow-${territory.id}`}>
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Territory Polygon */}
                      <polygon
                        points={territory.coordinates.map((c: { lat: number; lng: number }) => `${400 + (c.lng - 153.0251) * 10000},${300 + (c.lat + 27.4698) * 10000}`)
                        .join(' ')}
                        fill={`url(#territory-pattern-${territory.id})`}
                        stroke={territoryColor}
                        strokeWidth={hovered === territory.id ? 4 : 2}
                        strokeOpacity={hovered === territory.id ? 1 : 0.8}
                        opacity={hovered === territory.id ? 0.8 : 0.6}
                        style={{
                          cursor: 'pointer',
                          pointerEvents: 'auto',
                          filter: hovered === territory.id ? `url(#glow-${territory.id})` : 'none',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={() => setHovered(territory.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => {
                          if (!isUnlocked) {
                            setTerritoryEventMessage(
                              `🔒 ${territory.name} is locked!\n\n` +
                              `Required NFT: ${territory.requiredNFT}\n` +
                              `Win the Dojo NFT trophy to unlock this territory and gain control.`
                            );
                          } else {
                            setTerritoryEventMessage(
                              `✅ You control ${territory.name}!\n\n` +
                              `Territory Influence: ${territory.influence}%\n` +
                              `Owner: ${territory.owner || 'You'}\n` +
                              `Clan: ${territory.clan || 'None'}\n\n` +
                              `Ready to defend your territory or expand your influence!`
                            );
                          }
                          setTerritoryEventDialogOpen(true);
                        }}
                      />
                      
                      {/* Territory Label */}
                      <text
                        x={((territory.coordinates[0].lng + 27.4698) * 1000) % 800}
                        y={((territory.coordinates[0].lat + 153.0251) * 1000) % 600 - 10}
                        fill="#fff"
                        fontSize="14"
                        fontWeight="bold"
                        textAnchor="middle"
                        style={{
                          pointerEvents: 'none',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          fontFamily: 'Orbitron, monospace',
                        }}
                      >
                        {territoryIcon} {territory.name}
                      </text>
                    </svg>
                    
                    {/* Enhanced Tooltip */}
                    {hovered === territory.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 20,
                          top: 20,
                          background: 'rgba(0, 0, 0, 0.9)',
                          color: '#fff',
                          padding: '16px 20px',
                          borderRadius: '8px',
                          border: `2px solid ${territoryColor}`,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                          zIndex: 20,
                          pointerEvents: 'none',
                          minWidth: 280,
                          fontFamily: 'Orbitron, monospace',
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: territoryColor,
                            fontWeight: 700,
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          {territoryIcon} {territory.name}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                          <strong>Status:</strong> {isUnlocked ? '✅ Unlocked' : '🔒 Locked'}
                        </Typography>
                        
                        {isUnlocked ? (
                          <>
                            <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                              <strong>Owner:</strong> {territory.owner || 'You'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                              <strong>Clan:</strong> {territory.clan || 'None'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                              <strong>Influence:</strong> {territory.influence}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#00ff9d', fontWeight: 600 }}>
                              Click to manage territory
                            </Typography>
                          </>
                        ) : (
                          <>
                            <Typography variant="body2" sx={{ color: '#ccc', mb: 1 }}>
                              <strong>Required NFT:</strong> {territory.requiredNFT}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#ff6b6b', fontWeight: 600 }}>
                              Win the NFT trophy to unlock!
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </VisMap>
          </APIProvider>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid #ff6b6b',
            color: '#ff6b6b',
            fontFamily: 'Orbitron, monospace',
          }}>
            <Typography>
              Google Maps API key not configured. Please check your environment variables.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Dojo Details Dialog */}
      <Dialog
        open={showDojoDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #181818 60%, #00a8ff 100%)',
            border: '2px solid #00a8ff',
            borderRadius: 3,
          },
        }}
      >
        {selectedDojo && (
          <>
            <DialogTitle
              sx={{
                color: '#00ff9d',
                fontFamily: 'Orbitron, monospace',
                fontWeight: 700,
                borderBottom: '2px solid #00a8ff',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {selectedDojo.name}
                <IconButton onClick={handleCloseDialog} sx={{ color: '#00a8ff' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#00a8ff',
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      📍 Location
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#ccc',
                        fontFamily: 'Orbitron, monospace',
                        mb: 2,
                      }}
                    >
                      {selectedDojo.address}
                    </Typography>
                    
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#00a8ff',
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      📞 Contact
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#ccc',
                        fontFamily: 'Orbitron, monospace',
                        mb: 2,
                      }}
                    >
                      {selectedDojo.phone}
                    </Typography>
                    
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#00a8ff',
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      🕒 Hours
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#ccc',
                        fontFamily: 'Orbitron, monospace',
                        mb: 2,
                      }}
                    >
                      {selectedDojo.hours}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#00a8ff',
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      ⭐ Rating & Distance
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#ccc',
                        fontFamily: 'Orbitron, monospace',
                        mb: 2,
                      }}
                    >
                      {selectedDojo.rating} stars • {selectedDojo.distance} miles away
                    </Typography>
                    
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#00a8ff',
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 700,
                        mb: 1,
                      }}
                    >
                      🎯 Features
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {selectedDojo.features.map((feature, index) => (
                        <Chip
                          key={index}
                          label={feature}
                          sx={{
                            background: 'rgba(0, 255, 157, 0.2)',
                            color: '#00ff9d',
                            fontFamily: 'Orbitron, monospace',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, borderTop: '2px solid #00a8ff' }}>
              <Button
                onClick={() => handleGetDirections(selectedDojo)}
                variant="contained"
                startIcon={<DirectionsIcon />}
                sx={{
                  background: 'linear-gradient(45deg, #00ff9d, #00a8ff)',
                  color: '#000',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 0 20px rgba(0, 255, 157, 0.5)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #00a8ff, #00ff9d)',
                    boxShadow: '0 0 30px rgba(0, 168, 255, 0.7)',
                  },
                }}
              >
                Get Directions
              </Button>
              <Button
                onClick={handleCloseDialog}
                variant="outlined"
                sx={{
                  border: '2px solid #00a8ff',
                  color: '#00a8ff',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': {
                    border: '2px solid #00ff9d',
                    color: '#00ff9d',
                    boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
                  },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog 
        open={territoryEventDialogOpen} 
        onClose={() => setTerritoryEventDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #181818 60%, #00a8ff 100%)',
            border: '2px solid #00a8ff',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: '#00ff9d',
            fontFamily: 'Orbitron, monospace',
            fontWeight: 700,
            borderBottom: '2px solid #00a8ff',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          🗺️ Territory Event
          <IconButton 
            onClick={() => setTerritoryEventDialogOpen(false)} 
            sx={{ color: '#00a8ff', ml: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography
            variant="body1"
            sx={{
              color: '#fff',
              fontFamily: 'Orbitron, monospace',
              lineHeight: 1.6,
              whiteSpace: 'pre-line',
            }}
          >
            {territoryEventMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '2px solid #00a8ff' }}>
          <Button
            onClick={() => setTerritoryEventDialogOpen(false)}
            variant="outlined"
            sx={{
              border: '2px solid #00a8ff',
              color: '#00a8ff',
              fontFamily: 'Orbitron, monospace',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderRadius: 2,
              '&:hover': {
                border: '2px solid #00ff9d',
                color: '#00ff9d',
                boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 800 600" style={{ background: '#222' }}>
          {unlockedTerritories.map((territory, idx) => {
            const isLocked = territory.isLocked;
            const color = isLocked ? '#b71c1c' : '#43a047';
            const points = territory.coordinates
              .map((c: { lat: number; lng: number }) => `${400 + (c.lng - 153.0251) * 10000},${300 + (c.lat + 27.4698) * 10000}`)
              .join(' ');
            return (
              <g key={territory.id}>
                <polygon
                  points={points}
                  fill={color}
                  opacity={hovered === territory.id ? 0.7 : 0.5}
                  stroke="#fff"
                  strokeWidth={2}
                  style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={() => setHovered(territory.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(territory)}
                />
                <text
                  x={400 + (territory.coordinates[0].lng - 153.0251) * 10000}
                  y={300 + (territory.coordinates[0].lat + 27.4698) * 10000 - 10}
                  fill="#fff"
                  fontSize="18"
                >
                  {territory.name} {isLocked ? '🔒' : '✅'}
                </text>
              </g>
            );
          })}
        </svg>
        {/* Tooltip/Overlay */}
        {hovered && (
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 20,
              background: '#222',
              color: '#fff',
              padding: '12px 18px',
              borderRadius: 8,
              boxShadow: '0 2px 12px #0008',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <strong>{unlockedTerritories.find(t => t.id === hovered)?.name}</strong>
            <br />
            Owner: {unlockedTerritories.find(t => t.id === hovered)?.owner || 'Unclaimed'}
            <br />
            Clan: {unlockedTerritories.find(t => t.id === hovered)?.clan || 'None'}
            <br />
            Status: {unlockedTerritories.find(t => t.id === hovered)?.isLocked ? 'Locked' : 'Unlocked'}
          </div>
        )}
        {/* Click Dialog */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '30%',
              transform: 'translate(-50%, 0)',
              background: '#181818',
              color: '#fff',
              padding: '24px 32px',
              borderRadius: 12,
              boxShadow: '0 4px 24px #000a',
              zIndex: 20,
              minWidth: 320,
            }}
          >
            <h3 style={{ margin: 0 }}>{selected.name}</h3>
            <p style={{ margin: '8px 0' }}>
              <b>Owner:</b> {selected.owner || 'Unclaimed'}<br />
              <b>Clan:</b> {selected.clan || 'None'}<br />
              <b>Status:</b> {selected.isLocked ? 'Locked 🔒' : 'Unlocked ✅'}
            </p>
            {selected.isLocked ? (
              <div style={{ color: '#ffb300', marginBottom: 12 }}>
                Unlock this territory by winning the required Dojo NFT trophy!
              </div>
            ) : (
              <div style={{ color: '#00ff9d', marginBottom: 12 }}>
                You can challenge for control of this territory!
              </div>
            )}
            <button
              style={{
                background: selected.isLocked ? '#b71c1c' : '#43a047',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontSize: 16,
                cursor: selected.isLocked ? 'not-allowed' : 'pointer',
                marginRight: 12,
              }}
              disabled={selected.isLocked}
              onClick={() => {
                if (!selected.isLocked) {
                  alert('Challenge flow coming soon!');
                  setSelected(null);
                }
              }}
            >
              {selected.isLocked ? 'Locked' : 'Challenge for Control'}
            </button>
            <button
              style={{
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontSize: 16,
                cursor: 'pointer',
              }}
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Box>
  );
};

export default Map; 