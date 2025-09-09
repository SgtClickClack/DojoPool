/**
 * PBAC Integration Example: Progressive Enhancement of DojoPool RBAC to PBAC
 *
 * This file demonstrates how to progressively enhance existing RBAC controllers
 * with Policy-Based Access Control features.
 */

import {
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { FeatureFlagService } from './feature-flag.service';
import { UsePolicy, UsePolicyWith } from './policy.decorator';
import { PolicyGuard } from './policy.guard';
import { Roles, RolesGuard } from './roles.decorator';

/**
 * BEFORE: Traditional RBAC Controller
 * This is how controllers currently work with simple role-based access
 */
@Controller('territories')
@UseGuards(RolesGuard)
export class TerritoriesControllerV1 {
  @Get()
  @Roles(UserRole.USER)
  getTerritories() {
    return { territories: [] };
  }

  @Put(':id')
  @Roles(UserRole.USER) // Simple role check - any user can edit any territory
  updateTerritory() {
    return { message: 'Territory updated' };
  }
}

/**
 * AFTER: Progressive Enhancement to PBAC
 * Enhanced controller with PBAC features while maintaining RBAC compatibility
 */
@Controller('territories-v2')
@UseGuards(RolesGuard, PolicyGuard) // Use both guards together
export class TerritoriesControllerV2 {
  private readonly logger = new Logger(TerritoriesControllerV2.name);

  constructor(private readonly featureFlags: FeatureFlagService) {}

  /**
   * Example 1: Backward Compatible - Existing RBAC still works
   * No changes needed for existing functionality
   */
  @Get('simple')
  @Roles(UserRole.USER)
  getTerritoriesSimple() {
    this.logger.log('Access via traditional RBAC');
    return {
      territories: [],
      accessMethod: 'rbac',
      pbacEnabled: false,
    };
  }

  /**
   * Example 2: Enhanced Access - Add PBAC alongside RBAC
   * Users get enhanced features if PBAC is enabled for them
   */
  @Get('enhanced')
  @Roles(UserRole.USER)
  @UsePolicy() // Enable PBAC evaluation
  getTerritoriesEnhanced() {
    this.logger.log('Access via enhanced RBAC + PBAC');
    return {
      territories: [],
      accessMethod: 'rbac+pbac',
      pbacEnabled: true,
      additionalFeatures: ['location-filtering', 'real-time-updates'],
    };
  }

  /**
   * Example 3: Geographic Restriction - Location-based access
   * Clan leaders can only edit territories near their location
   */
  @Put(':id/geographic')
  @Roles(UserRole.USER)
  @UsePolicyWith('clan-leader-territory-edit-geographic')
  updateTerritoryGeographic() {
    this.logger.log('Territory update with geographic restrictions');
    return {
      message: 'Territory updated (geographic policy enforced)',
      policyType: 'geographic',
      restrictions: ['location-based', '100m-radius'],
    };
  }

  /**
   * Example 4: Feature Flag Controlled Rollout
   * Gradually roll out PBAC features based on user segments
   */
  @Get('beta')
  @Roles(UserRole.USER)
  getBetaFeatures() {
    const pbacEnabled = this.featureFlags.isEnabled('pbac-geographic-policies');

    if (pbacEnabled) {
      this.logger.log('Beta features enabled via PBAC');
      return {
        features: [
          'geographic-filtering',
          'real-time-sync',
          'advanced-analytics',
        ],
        accessMethod: 'pbac-beta',
      };
    } else {
      this.logger.log('Beta features disabled, using RBAC fallback');
      return {
        features: ['basic-listing'],
        accessMethod: 'rbac-fallback',
      };
    }
  }

  /**
   * Example 5: Conditional PBAC - Runtime feature flag check
   */
  @Post('conditional')
  @Roles(UserRole.USER)
  createTerritoryConditional() {
    const usePbac = this.featureFlags.isEnabled('pbac-enabled');

    if (usePbac) {
      // Apply PBAC logic here
      this.logger.log('Territory creation with PBAC validation');
      return {
        message: 'Territory created with PBAC validation',
        validationType: 'pbac',
      };
    } else {
      // Use traditional RBAC logic
      this.logger.log('Territory creation with RBAC validation');
      return {
        message: 'Territory created with RBAC validation',
        validationType: 'rbac',
      };
    }
  }
}

/**
 * VENUE CONTROLLER: Temporal Policies Example
 * Demonstrates time-based access control for venue management
 */
@Controller('venues-v2')
@UseGuards(RolesGuard, PolicyGuard)
export class VenuesControllerV2 {
  constructor(private readonly featureFlags: FeatureFlagService) {}

  /**
   * Business Hours Restriction - Venue admins can only modify during business hours
   */
  @Put(':id/settings')
  @Roles(UserRole.VENUE_ADMIN)
  @UsePolicyWith('venue-admin-business-hours')
  updateVenueSettings() {
    return {
      message: 'Venue settings updated (business hours policy enforced)',
      policyType: 'temporal',
      timeWindow: '8AM-10PM',
    };
  }

  /**
   * Geographic + Temporal Combined Policies
   */
  @Post(':id/events')
  @Roles(UserRole.VENUE_ADMIN)
  @UsePolicy() // Evaluate multiple policies
  createVenueEvent() {
    const temporalEnabled = this.featureFlags.isEnabled(
      'pbac-temporal-policies'
    );
    const geographicEnabled = this.featureFlags.isEnabled(
      'pbac-geographic-policies'
    );

    return {
      message: 'Venue event created',
      policiesApplied: [
        temporalEnabled ? 'business-hours' : null,
        geographicEnabled ? 'geographic-restriction' : null,
      ].filter(Boolean),
      featureFlags: { temporalEnabled, geographicEnabled },
    };
  }
}

/**
 * MATCH CONTROLLER: Contextual Policies Example
 * Demonstrates participant-based access control
 */
@Controller('matches-v2')
@UseGuards(RolesGuard, PolicyGuard)
export class MatchesControllerV2 {
  /**
   * Participant-Only Access - Only match participants can view details
   */
  @Get(':id/details')
  @Roles(UserRole.USER)
  @UsePolicyWith('match-participant-only')
  getMatchDetails() {
    return {
      message: 'Match details accessed',
      policyType: 'contextual',
      restriction: 'participants-only',
      data: {
        score: '5-3',
        duration: '25m 30s',
        participants: ['playerA', 'playerB'],
      },
    };
  }

  /**
   * Real-time Updates with PBAC
   */
  @Post(':id/join')
  @Roles(UserRole.USER)
  @UsePolicyWith('match-participant-only')
  joinMatch() {
    return {
      message: 'Joined match with participant validation',
      policyType: 'contextual',
      realTimeEnabled: true,
    };
  }
}

/**
 * ADMIN CONTROLLER: Security Policies Example
 * Demonstrates IP-based and enhanced security controls
 */
@Controller('admin-v2')
@UseGuards(RolesGuard, PolicyGuard)
export class AdminControllerV2 {
  /**
   * IP-Restricted Access - Admins can only access from approved IPs
   */
  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  @UsePolicyWith('admin-ip-restriction')
  getAdminDashboard() {
    return {
      message: 'Admin dashboard accessed',
      policyType: 'security',
      restrictions: ['ip-based', 'location-aware'],
      sensitiveData: 'protected',
    };
  }

  /**
   * Multi-Factor Security Policies
   */
  @Delete('users/:id')
  @Roles(UserRole.ADMIN)
  @UsePolicy() // Multiple security policies applied
  deleteUser() {
    return {
      message: 'User deleted with enhanced security policies',
      policiesApplied: [
        'admin-ip-restriction',
        'admin-temporal-restriction',
        'admin-audit-logging',
      ],
    };
  }
}

/**
 * GRADUAL ROLLOUT STRATEGY
 *
 * Phase 1: Feature Flag Controlled (0-25% users)
 * - Enable PBAC for beta users and administrators
 * - Monitor performance and user feedback
 * - Roll back if issues detected
 *
 * Phase 2: Role-Based Rollout (25-50% users)
 * - Enable for venue admins and moderators
 * - Test with different user types
 * - A/B test RBAC vs PBAC performance
 *
 * Phase 3: Geographic Rollout (50-75% users)
 * - Enable location-based policies first
 * - Start with high-traffic regions
 * - Monitor latency and user experience
 *
 * Phase 4: Full Rollout (75-100% users)
 * - Enable all PBAC features
 * - Maintain RBAC as fallback
 * - Continuous monitoring and optimization
 */

/**
 * MONITORING AND METRICS
 *
 * Key metrics to track during rollout:
 * 1. Policy evaluation latency
 * 2. Error rates and failure modes
 * 3. User satisfaction and engagement
 * 4. Performance impact on existing features
 * 5. Policy hit/miss ratios
 * 6. Gradual adoption rates
 */

/**
 * ROLLBACK STRATEGY
 *
 * If issues arise during rollout:
 * 1. Disable problematic policies via feature flags
 * 2. Fall back to RBAC for affected users
 * 3. Monitor and fix issues in isolated environment
 * 4. Gradual re-enablement with improved policies
 * 5. Maintain dual system support for safety
 */

export {
  AdminControllerV2,
  MatchesControllerV2,
  TerritoriesControllerV1,
  TerritoriesControllerV2,
  VenuesControllerV2,
};
