import { useCallback, useEffect, useState } from 'react';

export interface UserLocationState {
  location: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
}

/**
 * useUserLocation - retrieves the user's current geolocation coordinates.
 * Manages loading and error state; returns a refresh function to retry.
 */
export const useUserLocation = (): UserLocationState => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setIsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to retrieve location');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { location, error, isLoading, refresh: fetchLocation };
};

export default useUserLocation;
