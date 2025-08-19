/**
 * Geolocation utility functions for Dojo Pool
 */

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in meters
 */
export const getDistance = (
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

  return R * c;
};

/**
 * Check if a point is within a specified radius of another point
 * @param centerLat Latitude of center point in degrees
 * @param centerLon Longitude of center point in degrees
 * @param pointLat Latitude of point to check in degrees
 * @param pointLon Longitude of point to check in degrees
 * @param radiusMeters Radius in meters
 * @returns True if point is within radius
 */
export const isWithinRadius = (
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusMeters: number
): boolean => {
  const distance = getDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusMeters;
};

/**
 * Convert meters to a human-readable string
 * @param meters Distance in meters
 * @returns Formatted distance string
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
};

/**
 * Get the bearing from one point to another
 * @param lat1 Latitude of starting point in degrees
 * @param lon1 Longitude of starting point in degrees
 * @param lat2 Latitude of destination point in degrees
 * @param lon2 Longitude of destination point in degrees
 * @returns Bearing in degrees (0-360)
 */
export const getBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
};
