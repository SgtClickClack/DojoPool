import { useCallback, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Circle } from '@react-google-maps/api';
import { useTheme } from '@mui/material';
import { Location } from '@/utils/location';
import {
  GOOGLE_MAPS_API_KEY,
  DEFAULT_MAP_OPTIONS,
  MAP_STYLES,
  PLAYER_MARKER_RADIUS,
  ANIMATION_DURATION,
} from '@/constants';

interface GameMapProps {
  currentLocation: Location;
  onLocationUpdate?: (location: Location) => void;
  otherPlayerLocations?: Record<string, Location>;
}

interface AnimatedMarker {
  current: google.maps.LatLng;
  target: google.maps.LatLng;
  marker?: google.maps.Marker;
}

// Map container styles
const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px',
};

const GameMap: React.FC<GameMapProps> = ({
  currentLocation,
  onLocationUpdate,
  otherPlayerLocations = {},
}) => {
  const theme = useTheme();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Record<string, AnimatedMarker>>({});
  const animationFrameRef = useRef<number>();

  // Calculate map center based on player location
  const center = {
    lat: currentLocation.latitude,
    lng: currentLocation.longitude,
  };

  // Animation function for smooth marker movement
  const animateMarkers = useCallback((timestamp: number) => {
    if (!mapRef.current) return;

    let needsAnimation = false;
    const progress = (timestamp % ANIMATION_DURATION) / ANIMATION_DURATION;

    Object.entries(markersRef.current).forEach(([id, markerData]) => {
      const { current, target, marker } = markerData;
      if (!marker) return;

      if (current.equals(target)) return;

      needsAnimation = true;
      const lat = current.lat() + (target.lat() - current.lat()) * progress;
      const lng = current.lng() + (target.lng() - current.lng()) * progress;
      
      marker.setPosition({ lat, lng });

      if (progress >= 1) {
        markerData.current = target;
      }
    });

    if (needsAnimation) {
      animationFrameRef.current = requestAnimationFrame(animateMarkers);
    }
  }, []);

  // Update marker positions
  useEffect(() => {
    if (!mapRef.current) return;

    // Update player marker
    const playerLatLng = new google.maps.LatLng(center.lat, center.lng);
    if (!markersRef.current.player) {
      markersRef.current.player = {
        current: playerLatLng,
        target: playerLatLng,
        marker: new google.maps.Marker({
          map: mapRef.current,
          position: playerLatLng,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: theme.palette.primary.main,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
          },
        }),
      };
    } else {
      markersRef.current.player.target = playerLatLng;
    }

    // Update other players' markers
    Object.entries(otherPlayerLocations).forEach(([playerId, location]) => {
      const latLng = new google.maps.LatLng(location.latitude, location.longitude);
      if (!markersRef.current[playerId]) {
        markersRef.current[playerId] = {
          current: latLng,
          target: latLng,
          marker: new google.maps.Marker({
            map: mapRef.current,
            position: latLng,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: theme.palette.info.main,
              fillOpacity: 0.8,
              strokeColor: 'white',
              strokeWeight: 1,
            },
          }),
        };
      } else {
        markersRef.current[playerId].target = latLng;
      }
    });

    // Start animation loop
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateMarkers);
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      Object.values(markersRef.current).forEach(({ marker }) => marker?.setMap(null));
      markersRef.current = {};
    };
  }, [center, otherPlayerLocations, theme.palette, animateMarkers]);

  // Handle map load
  const onLoad = useCallback((map: google.maps.Map) => {
    const bounds = new window.google.maps.LatLngBounds();
    
    // Add player location to bounds
    bounds.extend(new window.google.maps.LatLng(center.lat, center.lng));

    // Add other players to bounds
    Object.values(otherPlayerLocations).forEach((location) => {
      bounds.extend(
        new window.google.maps.LatLng(
          location.latitude,
          location.longitude
        )
      );
    });

    map.fitBounds(bounds, 50); // 50 pixels padding
    mapRef.current = map;
  }, [center, otherPlayerLocations]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        options={{
          ...DEFAULT_MAP_OPTIONS,
          styles: MAP_STYLES,
        }}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Player Range Circle */}
        <Circle
          center={center}
          radius={PLAYER_MARKER_RADIUS}
          options={{
            fillColor: theme.palette.primary.main,
            fillOpacity: 0.1,
            strokeColor: theme.palette.primary.main,
            strokeOpacity: 0.3,
            strokeWeight: 1,
          }}
        />
      </GoogleMap>
    </LoadScript>
  );
};

export default GameMap; 