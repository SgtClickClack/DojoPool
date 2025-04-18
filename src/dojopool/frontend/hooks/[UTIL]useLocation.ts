import { useState, useEffect } from "react";
import { Location, watchLocation } from "@/utils/location";

interface UseLocationOptions {
  onError?: (error: GeolocationPositionError) => void;
}

export const useLocation = ({ onError }: UseLocationOptions = {}) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    const handleError = (err: GeolocationPositionError) => {
      setError(err);
      onError?.(err);
    };

    const id = watchLocation((newLocation) => {
      setLocation(newLocation);
      setError(null);
    }, handleError);

    if (id) {
      setWatchId(id);
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [onError]);

  return {
    location,
    error,
    isLoading: !location && !error,
  };
};
