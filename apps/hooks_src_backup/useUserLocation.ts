import { useEffect, useState } from 'react';

interface UserLocation {
  position: [number, number] | null; // [longitude, latitude]
  isLoading: boolean;
  error: string | null;
  accuracy: number | null;
}

export const useUserLocation = (): UserLocation => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setIsLoading(false);
      return;
    }

    const successHandler = (pos: GeolocationPosition) => {
      const { longitude, latitude } = pos.coords;
      setPosition([longitude, latitude]);
      setAccuracy(pos.coords.accuracy);
      setError(null);
      setIsLoading(false);
    };

    const errorHandler = (err: GeolocationPositionError) => {
      let errorMessage = 'Unknown error occurred';

      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage =
            'Location permission denied. Please enable location access.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }

      setError(errorMessage);
      setIsLoading(false);
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    const watchId = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      options
    );

    // Cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, isLoading, error, accuracy };
};
