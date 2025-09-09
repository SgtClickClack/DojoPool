import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma/service';

export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100, percentage of users
  conditions?: {
    userRoles?: string[];
    userIds?: string[];
    environments?: string[];
  };
}

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  // In-memory feature flags for PBAC rollout (in production, use Redis or database)
  private readonly featureFlags: Map<string, FeatureFlag> = new Map([
    [
      'pbac-enabled',
      {
        name: 'pbac-enabled',
        description: 'Enable Policy-Based Access Control system',
        enabled: true,
        rolloutPercentage: 25, // Start with 25% of users
        conditions: {
          userRoles: ['USER', 'VENUE_ADMIN', 'MODERATOR'],
        },
      },
    ],
    [
      'pbac-geographic-policies',
      {
        name: 'pbac-geographic-policies',
        description: 'Enable location-based geographic policies',
        enabled: true,
        rolloutPercentage: 15, // More restrictive rollout
        conditions: {
          userRoles: ['USER', 'VENUE_ADMIN'],
        },
      },
    ],
    [
      'pbac-temporal-policies',
      {
        name: 'pbac-temporal-policies',
        description: 'Enable time-based access control policies',
        enabled: true,
        rolloutPercentage: 30,
        conditions: {
          userRoles: ['VENUE_ADMIN', 'MODERATOR'],
        },
      },
    ],
    [
      'pbac-premium-features',
      {
        name: 'pbac-premium-features',
        description: 'Enable subscription-based premium feature access',
        enabled: true,
        rolloutPercentage: 50, // Higher rollout for business features
        conditions: {
          userRoles: ['USER', 'VENUE_ADMIN'],
        },
      },
    ],
    [
      'pbac-admin-security',
      {
        name: 'pbac-admin-security',
        description: 'Enable enhanced security policies for administrators',
        enabled: true,
        rolloutPercentage: 100, // Full rollout for security features
        conditions: {
          userRoles: ['ADMIN'],
        },
      },
    ],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a feature flag is enabled for a specific user
   */
  isEnabled(flagName: string, user?: any): boolean {
    const flag = this.featureFlags.get(flagName);

    if (!flag || !flag.enabled) {
      return false;
    }

    // If no user provided, only check global enablement
    if (!user) {
      return flag.rolloutPercentage > 0;
    }

    // Check user-specific conditions
    if (flag.conditions?.userIds?.includes(user.id)) {
      return true; // Explicitly enabled for this user
    }

    if (
      flag.conditions?.userRoles &&
      !flag.conditions.userRoles.includes(user.role)
    ) {
      return false; // User role not in allowed list
    }

    // Check rollout percentage using user ID as seed for consistent hashing
    const userRolloutValue = this.getUserRolloutValue(user.id);
    return userRolloutValue <= flag.rolloutPercentage;
  }

  /**
   * Check multiple feature flags at once
   */
  areEnabled(flagNames: string[], user?: any): Record<string, boolean> {
    const results: Record<string, boolean> = {};

    for (const flagName of flagNames) {
      results[flagName] = this.isEnabled(flagName, user);
    }

    return results;
  }

  /**
   * Update feature flag rollout percentage
   */
  updateRolloutPercentage(flagName: string, percentage: number): boolean {
    const flag = this.featureFlags.get(flagName);

    if (!flag) {
      return false;
    }

    flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    this.logger.log(
      `Updated rollout percentage for ${flagName}: ${percentage}%`
    );

    return true;
  }

  /**
   * Enable or disable a feature flag
   */
  toggleFlag(flagName: string, enabled: boolean): boolean {
    const flag = this.featureFlags.get(flagName);

    if (!flag) {
      return false;
    }

    flag.enabled = enabled;
    this.logger.log(
      `${enabled ? 'Enabled' : 'Disabled'} feature flag: ${flagName}`
    );

    return true;
  }

  /**
   * Get all feature flags with their current status
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  /**
   * Add users to explicit allowlist for a feature flag
   */
  addToAllowlist(flagName: string, userIds: string[]): boolean {
    const flag = this.featureFlags.get(flagName);

    if (!flag) {
      return false;
    }

    if (!flag.conditions) {
      flag.conditions = {};
    }

    if (!flag.conditions.userIds) {
      flag.conditions.userIds = [];
    }

    flag.conditions.userIds.push(...userIds);
    this.logger.log(
      `Added ${userIds.length} users to allowlist for ${flagName}`
    );

    return true;
  }

  /**
   * Generate a consistent rollout value for a user (0-100)
   * Uses user ID to ensure consistent experience across sessions
   */
  private getUserRolloutValue(userId: string): number {
    // Simple hash function for consistent user distribution
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to positive number and scale to 0-100
    return Math.abs(hash) % 100;
  }

  /**
   * Get rollout statistics for monitoring
   */
  getRolloutStats(flagName: string): {
    totalUsers: number;
    enabledUsers: number;
    percentage: number;
  } | null {
    const flag = this.featureFlags.get(flagName);

    if (!flag) {
      return null;
    }

    // In a real implementation, you would query your user database
    // For now, we'll use placeholder values
    const totalUsers = 10000; // Placeholder
    const enabledUsers = Math.floor(
      (totalUsers * flag.rolloutPercentage) / 100
    );

    return {
      totalUsers,
      enabledUsers,
      percentage: flag.rolloutPercentage,
    };
  }

  /**
   * Gradual rollout strategies for different scenarios
   */
  async gradualRolloutStrategies(): Promise<void> {
    // Strategy 1: Percentage-based rollout
    this.logger.log('Strategy 1: Percentage-based rollout');
    this.logger.log('- Start with 1-5% for critical features');
    this.logger.log('- Increase by 10-20% every few days');
    this.logger.log('- Monitor error rates and user feedback');
    this.logger.log('- Roll back if issues detected');

    // Strategy 2: Role-based rollout
    this.logger.log('\nStrategy 2: Role-based rollout');
    this.logger.log('- Start with administrators and power users');
    this.logger.log('- Then venue admins and moderators');
    this.logger.log('- Finally regular users');
    this.logger.log('- Allows testing with different user types');

    // Strategy 3: Feature-specific rollout
    this.logger.log('\nStrategy 3: Feature-specific rollout');
    this.logger.log('- Geographic policies: Start with local users');
    this.logger.log('- Temporal policies: Start with business users');
    this.logger.log('- Security policies: Full rollout immediately');
    this.logger.log('- Premium features: Higher rollout percentage');

    // Strategy 4: A/B testing integration
    this.logger.log('\nStrategy 4: A/B testing integration');
    this.logger.log('- Use feature flags for A/B test groups');
    this.logger.log('- Compare RBAC vs PBAC performance');
    this.logger.log('- Measure user satisfaction and engagement');
    this.logger.log('- Data-driven rollout decisions');
  }

  /**
   * Monitor and report on PBAC rollout progress
   */
  async generateRolloutReport(): Promise<string> {
    const report: string[] = [];
    report.push('# PBAC Rollout Report');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push('');

    for (const [flagName, flag] of this.featureFlags) {
      const stats = this.getRolloutStats(flagName);
      report.push(`## ${flagName}`);
      report.push(`Description: ${flag.description}`);
      report.push(`Enabled: ${flag.enabled}`);
      report.push(`Rollout: ${flag.rolloutPercentage}%`);

      if (stats) {
        report.push(
          `Estimated enabled users: ${stats.enabledUsers.toLocaleString()}`
        );
      }

      if (flag.conditions?.userRoles) {
        report.push(`Target roles: ${flag.conditions.userRoles.join(', ')}`);
      }

      report.push('');
    }

    return report.join('\n');
  }
}
