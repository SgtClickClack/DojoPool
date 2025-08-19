import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  LinearProgress,
  useTheme,
  alpha,
  Paper,
  Zoom,
} from '@mui/material';
import {
  LocationOn,
  MyLocation,
  CheckCircle,
  Error as ErrorIcon,
  Radar,
  GpsFixed,
  GpsNotFixed,
} from '@mui/icons-material';

interface GeolocationCheckInProps {
  venueId: string;
  onLocationReceived: (coords: { latitude: number; longitude: number }) => void;
  venueLocation?: { latitude: number; longitude: number };
  maxDistance?: number; // Maximum distance in meters
}

export const GeolocationCheckIn: React.FC<GeolocationCheckInProps> = ({
  venueId,
  onLocationReceived,
  venueLocation,
  maxDistance = 100, // Default 100 meters
}) => {
  const theme = useTheme();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [permission, setPermission] = useState<PermissionState | null>(null);

  // Cyberpunk neon colors
  const neonColors = {
    primary: '#00ff88',
    secondary: '#ff0099',
    warning: '#ffcc00',
    error: '#ff0044',
    info: '#00ccff',
    purple: '#8b00ff',
    orange: '#ff6600',
  };

  useEffect(() => {
    // Check geolocation permission status
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermission(result.state);
          result.addEventListener('change', () => {
            setPermission(result.state);
          });
        })
        .catch(() => {
          // Permissions API not supported
        });
    }
  }, []);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLocation(coords);
        setAccuracy(position.coords.accuracy);

        // Calculate distance if venue location is provided
        if (venueLocation) {
          const dist = calculateDistance(
            coords.latitude,
            coords.longitude,
            venueLocation.latitude,
            venueLocation.longitude
          );
          setDistance(dist);
          setIsWithinRange(dist <= maxDistance);
        } else {
          // If no venue location provided, assume user is within range
          setIsWithinRange(true);
        }

        onLocationReceived(coords);
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Unable to retrieve your location';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage =
              'Location permission denied. Please enable location access.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      options
    );
  };

  const getPermissionIcon = () => {
    switch (permission) {
      case 'granted':
        return <GpsFixed sx={{ color: neonColors.primary }} />;
      case 'denied':
        return <GpsNotFixed sx={{ color: neonColors.error }} />;
      default:
        return <MyLocation sx={{ color: neonColors.warning }} />;
    }
  };

  const getPermissionText = () => {
    switch (permission) {
      case 'granted':
        return 'Location access granted';
      case 'denied':
        return 'Location access denied';
      case 'prompt':
        return 'Location permission required';
      default:
        return 'Checking location permission...';
    }
  };

  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      {/* Location Permission Status */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          background: alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${alpha(
            permission === 'granted'
              ? neonColors.primary
              : permission === 'denied'
                ? neonColors.error
                : neonColors.warning,
            0.3
          )}`,
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          {getPermissionIcon()}
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {getPermissionText()}
          </Typography>
        </Box>
      </Paper>

      {!location && !loading && !error && (
        <Zoom in>
          <Box>
            <Radar
              sx={{
                fontSize: 100,
                color: neonColors.info,
                mb: 3,
                filter: `drop-shadow(0 0 30px ${neonColors.info})`,
                animation: 'rotate 3s linear infinite',
                '@keyframes rotate': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
            <Typography
              variant="h5"
              sx={{
                color: neonColors.info,
                textShadow: `0 0 10px ${neonColors.info}`,
                mb: 2,
              }}
            >
              Geolocation Verification
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, mb: 3 }}
            >
              We need to verify you're at the venue location
            </Typography>
            <Button
              variant="contained"
              startIcon={<MyLocation />}
              onClick={getLocation}
              size="large"
              sx={{
                background: `linear-gradient(45deg, ${neonColors.info} 30%, ${neonColors.primary} 90%)`,
                boxShadow: `0 0 20px ${alpha(neonColors.info, 0.5)}`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${neonColors.info} 10%, ${neonColors.primary} 100%)`,
                  boxShadow: `0 0 30px ${alpha(neonColors.info, 0.7)}`,
                },
              }}
            >
              Get My Location
            </Button>
          </Box>
        </Zoom>
      )}

      {loading && (
        <Box>
          <CircularProgress
            size={80}
            sx={{
              color: neonColors.info,
              filter: `drop-shadow(0 0 20px ${neonColors.info})`,
              mb: 3,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: neonColors.info,
              textShadow: `0 0 10px ${neonColors.info}`,
              mb: 1,
            }}
          >
            Getting your location...
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            This may take a few seconds
          </Typography>
          <LinearProgress
            sx={{
              mt: 3,
              height: 4,
              borderRadius: 2,
              backgroundColor: alpha(neonColors.info, 0.2),
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${neonColors.info} 0%, ${neonColors.primary} 100%)`,
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          sx={{
            background: alpha(neonColors.error, 0.1),
            border: `1px solid ${neonColors.error}`,
            color: neonColors.error,
            '& .MuiAlert-icon': { color: neonColors.error },
            mb: 2,
          }}
        >
          {error}
        </Alert>
      )}

      {location && !loading && (
        <Zoom in>
          <Box>
            <CheckCircle
              sx={{
                fontSize: 80,
                color: isWithinRange ? neonColors.primary : neonColors.warning,
                mb: 2,
                filter: `drop-shadow(0 0 20px ${isWithinRange ? neonColors.primary : neonColors.warning})`,
                animation: 'bounce 0.5s ease-out',
                '@keyframes bounce': {
                  '0%': { transform: 'scale(0.5)' },
                  '60%': { transform: 'scale(1.2)' },
                  '100%': { transform: 'scale(1)' },
                },
              }}
            />

            <Typography
              variant="h5"
              sx={{
                color: neonColors.primary,
                textShadow: `0 0 10px ${neonColors.primary}`,
                mb: 2,
              }}
            >
              Location Verified!
            </Typography>

            <Box
              sx={{
                p: 2,
                background: alpha(theme.palette.background.paper, 0.5),
                border: `1px solid ${alpha(neonColors.primary, 0.3)}`,
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 1,
                }}
              >
                <LocationOn sx={{ color: neonColors.info }} />
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Coordinates
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: neonColors.info, fontFamily: 'monospace' }}
              >
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Typography>

              {accuracy && (
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ color: theme.palette.text.secondary, mt: 1 }}
                >
                  Accuracy: ±{accuracy.toFixed(0)}m
                </Typography>
              )}

              {distance !== null && (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 2,
                    color: isWithinRange
                      ? neonColors.primary
                      : neonColors.warning,
                    fontWeight: 'bold',
                  }}
                >
                  {isWithinRange
                    ? `✓ You are ${distance.toFixed(0)}m from the venue`
                    : `⚠ You are ${distance.toFixed(0)}m away (max: ${maxDistance}m)`}
                </Typography>
              )}
            </Box>

            {!isWithinRange && venueLocation && (
              <Alert
                severity="warning"
                sx={{
                  background: alpha(neonColors.warning, 0.1),
                  border: `1px solid ${neonColors.warning}`,
                  color: neonColors.warning,
                  '& .MuiAlert-icon': { color: neonColors.warning },
                }}
              >
                You appear to be outside the venue's check-in range. Please move
                closer to the venue.
              </Alert>
            )}
          </Box>
        </Zoom>
      )}
    </Box>
  );
};

export default GeolocationCheckIn;
