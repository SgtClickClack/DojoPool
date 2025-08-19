import { useState, useEffect } from 'react';
import { type Location, watchLocation } from '../utils/location';

interface UseLocationOptions {
  onError?: (error: GeolocationPositionError) => void;
}

export const useLocation = ({ onError }: UseLocationOptions = {}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  useEffect(() => {
    const handleError = (err: GeolocationPositionError) => {
      setError(err);
      onError?.(err);
    };

    const cleanup = watchLocation((newLocation) => {
      setLocation(newLocation);
      setError(null);
    }, handleError);

    return cleanup;
  }, [onError]);

  return {
    location,
    error,
    isLoading: !location && !error,
  };
};
