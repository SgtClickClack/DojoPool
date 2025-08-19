import { useEffect, useState } from 'react';

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

// Returns a tuple of [location, error]
export const useLocation = (): [GeoLocation | null, string | null] => {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('navigator' in window)) {
      setError('Geolocation is not available in this environment');
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setLocation({ latitude, longitude });
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err.message || 'Failed to retrieve location');
    };

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000,
    });

    return () => {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch {
        // ignore
      }
    };
  }, []);

  return [location, error];
};

export default useLocation;
