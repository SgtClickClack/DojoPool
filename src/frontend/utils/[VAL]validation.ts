import { VIOLATION_THRESHOLDS } from '../../constants';
import { type Location } from './location';

interface Boundary {
  id: string;
  center: Location;
  radius: number;
  type: 'safe' | 'unsafe';
}

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  automatedResponse?: AutomatedResponse;
}

interface AutomatedResponse {
  type: 'warning' | 'suspension' | 'ban';
  reason: string;
  duration?: number;
}

export class LocationValidator {
  private boundaries: Map<string, Boundary> = new Map();
  private violations: Map<string, { count: number; lastViolation: number }> =
    new Map();
  private readonly VIOLATION_THRESHOLDS = VIOLATION_THRESHOLDS;
  private readonly VIOLATION_WINDOW = 3600000; // 1 hour in milliseconds
  private readonly SAFETY_BUFFER = 50; // 50 meters safety buffer

  addBoundary(
    id: string,
    center: Location,
    radius: number,
    type: 'safe' | 'unsafe'
  ): void {
    this.boundaries.set(id, { id, center, radius, type });
  }

  removeBoundary(id: string): void {
    this.boundaries.delete(id);
  }

  clearBoundaries(): void {
    this.boundaries.clear();
  }

  validateLocation(location: Location, playerId?: string): ValidationResult {
    for (const boundary of this.boundaries.values()) {
      const distance = this.calculateDistance(location, boundary.center);
      const effectiveRadius =
        boundary.radius + (boundary.type === 'unsafe' ? this.SAFETY_BUFFER : 0);

      if (boundary.type === 'unsafe' && distance <= effectiveRadius) {
        const severity = distance <= boundary.radius ? 'high' : 'medium';
        const response = this.determineAutomatedResponse(playerId, severity);
        return {
          isValid: false,
          reason:
            distance <= boundary.radius
              ? 'Location is in an unsafe area'
              : 'Location is too close to an unsafe area',
          automatedResponse: response,
        };
      }
    }

    return { isValid: true };
  }

  validateMovement(
    from: Location,
    to: Location,
    timeElapsed: number,
    playerId?: string
  ): ValidationResult {
    const distance = this.calculateDistance(from, to);
    const speed = distance / (timeElapsed / 1000); // meters per second

    if (speed > 100) {
      // More than 100 m/s is suspicious
      const response = this.determineAutomatedResponse(playerId, 'high');
      return {
        isValid: false,
        reason: 'Movement speed exceeds reasonable limits',
        automatedResponse: response,
      };
    }

    return this.validateLocation(to, playerId);
  }

  private determineAutomatedResponse(
    playerId?: string,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): AutomatedResponse | undefined {
    if (!playerId) return undefined;

    const now = Date.now();
    const playerViolations = this.violations.get(playerId) || {
      count: 0,
      lastViolation: 0,
    };

    // Clean up old violations
    if (now - playerViolations.lastViolation > this.VIOLATION_WINDOW) {
      playerViolations.count = 0;
    }

    // Update violation count
    playerViolations.count++;
    playerViolations.lastViolation = now;
    this.violations.set(playerId, playerViolations);

    const recentViolations = playerViolations.count;

    if (
      recentViolations >= this.VIOLATION_THRESHOLDS.BAN &&
      severity === 'high'
    ) {
      return {
        type: 'ban',
        reason: 'Multiple severe safety violations',
        duration: 24 * 60 * 60 * 1000, // 24 hours
      };
    }

    if (recentViolations >= this.VIOLATION_THRESHOLDS.SUSPENSION) {
      return {
        type: 'suspension',
        reason: 'Repeated safety violations',
        duration: 60 * 60 * 1000, // 1 hour
      };
    }

    if (recentViolations >= this.VIOLATION_THRESHOLDS.WARNING) {
      return {
        type: 'warning',
        reason: 'Safety violation detected',
      };
    }

    return undefined;
  }

  private calculateDistance(point1: Location, point2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(point1.latitude);
    const φ2 = this.toRadians(point2.latitude);
    const Δφ = this.toRadians(point2.latitude - point1.latitude);
    const Δλ = this.toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

// Export a singleton instance
export const locationValidator = new LocationValidator();
