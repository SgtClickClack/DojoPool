import React, { useState, useEffect } from 'react';
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';

interface Dojo {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  rating: number;
  is_unlocked: boolean;
  visit_count: number;
}

interface DojoMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  onDojoSelect?: (dojo: Dojo) => void;
}

const MapContainer = styled(Box)(({ theme }) => ({
  height: '500px',
  width: '100%',
  position: 'relative',
}));

const InfoWindowContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  maxWidth: '200px',
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255, 255, 255, 0.8)',
  zIndex: 1,
}));

const DojoMap: React.FC<DojoMapProps> = ({ apiKey, center, onDojoSelect }) => {
  const [dojos, setDojos] = useState<Dojo[]>([]);
  const [selectedDojo, setSelectedDojo] = useState<Dojo | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(
    center || { lat: 0, lng: 0 }
  );

  const mapStyles = {
    height: '100%',
    width: '100%',
  };

  useEffect(() => {
    // Get user's location if not provided
    if (!center) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          fetchNearbyDojos(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
        }
      );
    } else {
      fetchNearbyDojos(center);
    }
  }, [center]);

  const fetchNearbyDojos = async (location: { lat: number; lng: number }) => {
    try {
      const response = await fetch(
        `/api/geo/nearby?lat=${location.lat}&lng=${location.lng}`
      );
      const data = await response.json();
      if (data.status === 'success') {
        setDojos(data.dojos);
      }
    } catch (error) {
      console.error('Error fetching nearby dojos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (dojo: Dojo) => {
    setSelectedDojo(dojo);
    if (onDojoSelect) {
      onDojoSelect(dojo);
    }
  };

  return (
    <MapContainer>
      {loading && (
        <LoadingOverlay>
          <CircularProgress />
        </LoadingOverlay>
      )}

      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={13}
          center={userLocation}
        >
          {/* User's location marker */}
          <Marker
            position={userLocation}
            icon={{
              url: '/assets/icons/user-location.png',
              scaledSize: new window.google.maps.Size(30, 30),
            }}
          />

          {/* Dojo markers */}
          {dojos.map((dojo) => (
            <Marker
              key={dojo.id}
              position={{ lat: dojo.latitude, lng: dojo.longitude }}
              onClick={() => handleMarkerClick(dojo)}
              icon={{
                url: dojo.is_unlocked
                  ? '/assets/icons/dojo-unlocked.png'
                  : '/assets/icons/dojo-locked.png',
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            />
          ))}

          {/* Info window for selected dojo */}
          {selectedDojo && (
            <InfoWindow
              position={{
                lat: selectedDojo.latitude,
                lng: selectedDojo.longitude,
              }}
              onCloseClick={() => setSelectedDojo(null)}
            >
              <InfoWindowContent>
                <Typography variant="h6">{selectedDojo.name}</Typography>
                <Typography variant="body2">
                  Distance: {selectedDojo.distance} km
                </Typography>
                <Typography variant="body2">
                  Rating: {selectedDojo.rating} ⭐
                </Typography>
                <Typography variant="body2">
                  Status: {selectedDojo.is_unlocked ? 'Unlocked' : 'Locked'}
                </Typography>
                {!selectedDojo.is_unlocked && (
                  <Typography variant="body2" color="text.secondary">
                    Visits needed: {5 - selectedDojo.visit_count}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  size="small"
                  fullWidth
                  sx={{ mt: 1 }}
                  onClick={() => onDojoSelect?.(selectedDojo)}
                >
                  View Details
                </Button>
              </InfoWindowContent>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </MapContainer>
  );
};

export default DojoMap;
