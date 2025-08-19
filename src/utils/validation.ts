/**
 * Validates an email address.
 * @param email - The email address to validate.
 * @returns True if the email is valid, false otherwise.
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password.
 * Requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 * @param password - The password to validate.
 * @returns True if the password meets all requirements, false otherwise.
 */
export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

/**
 * Validates a username.
 * Requirements:
 * - Between 3 and 20 characters long
 * - Contains only alphanumeric characters, underscores, and hyphens
 * - Starts with a letter
 * @param username - The username to validate.
 * @returns True if the username meets all requirements, false otherwise.
 */
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
  return usernameRegex.test(username);
};

export class LocationValidator {
  private playerHistory: Map<
    string,
    Array<{ timestamp: number; location: any }>
  > = new Map();
  private readonly maxHistorySize = 100;
  private readonly timeWindow = 60000; // 1 minute

  public validateLocation(playerId: string, location: any): boolean {
    const now = Date.now();
    const playerLocations = this.playerHistory.get(playerId) || [];

    // Clean old entries
    const recentLocations = playerLocations.filter(
      (entry) => now - entry.timestamp < this.timeWindow
    );

    // Check for suspicious movement patterns
    if (recentLocations.length > 0) {
      const lastLocation = recentLocations[recentLocations.length - 1];
      const distance = this.calculateDistance(lastLocation.location, location);
      const timeDiff = now - lastLocation.timestamp;

      // If movement is too fast (more than 1000 m/s), flag as suspicious
      if (timeDiff > 0 && distance / (timeDiff / 1000) > 1000) {
        return false;
      }
    }

    // Add new location
    recentLocations.push({ timestamp: now, location });

    // Limit history size
    if (recentLocations.length > this.maxHistorySize) {
      recentLocations.splice(0, recentLocations.length - this.maxHistorySize);
    }

    this.playerHistory.set(playerId, recentLocations);
    return true;
  }

  public clearPlayerHistory(playerId: string): void {
    this.playerHistory.delete(playerId);
  }

  private calculateDistance(loc1: any, loc2: any): number {
    if (!loc1 || !loc2 || !loc1.latitude || !loc2.latitude) {
      return 0;
    }

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180;
    const φ2 = (loc2.latitude * Math.PI) / 180;
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const locationValidator = new LocationValidator();
