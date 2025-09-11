import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsePolicy, UsePolicyWith } from './policy.decorator';
import { PolicyGuard } from './policy.guard';
import { Roles, RolesGuard } from './roles.decorator';

/**
 * Example controller demonstrating progressive enhancement from RBAC to PBAC
 *
 * This controller shows how to:
 * 1. Start with traditional RBAC
 * 2. Gradually introduce PBAC for complex use cases
 * 3. Use both systems together
 */
@Controller('policy-examples')
@UseGuards(RolesGuard, PolicyGuard) // Use both guards together
export class PolicyExampleController {
  private readonly logger = new Logger(PolicyExampleController.name);

  /**
   * Example 1: Traditional RBAC - Simple role-based access
   * This uses only the existing RBAC system
   */
  @Get('territories/simple')
  @Roles('USER')
  getTerritoriesSimple() {
    this.logger.log('Access granted via RBAC: USER role');
    return {
      message: 'Territories accessed via simple RBAC',
      territories: ['territory1', 'territory2'],
    };
  }

  /**
   * Example 2: Progressive Enhancement - Enable PBAC alongside RBAC
   * This uses the PolicyGuard but falls back to RBAC if no policies apply
   */
  @Get('territories/enhanced')
  @Roles('USER')
  @UsePolicy() // Enable policy evaluation alongside RBAC
  getTerritoriesEnhanced() {
    this.logger.log('Access granted via enhanced RBAC + PBAC');
    return {
      message: 'Territories accessed via enhanced RBAC + PBAC',
      territories: ['territory1', 'territory2', 'territory3'],
      policyEvaluated: true,
    };
  }

  /**
   * Example 3: Geographic Policy - Complex location-based access
   * This requires the user to be within 100 meters of the territory
   */
  @Get('territories/:id/geographic')
  @Roles('USER')
  @UsePolicyWith('clan-leader-territory-edit-geographic')
  getTerritoryGeographic(@Param('id') territoryId: string) {
    this.logger.log(
      `Access granted via geographic policy for territory: ${territoryId}`
    );
    return {
      message: `Territory ${territoryId} accessed via geographic policy`,
      territory: {
        id: territoryId,
        location: { lat: -27.4698, lng: 153.0251 },
        status: 'controlled',
      },
      policyType: 'geographic',
    };
  }

  /**
   * Example 4: Temporal Policy - Time-based access control
   * Venue admins can only modify settings during business hours
   */
  @Put('venues/:id/business-hours')
  @Roles('VENUE_ADMIN')
  @UsePolicyWith('venue-admin-business-hours')
  updateVenueBusinessHours(
    @Param('id') venueId: string,
    @Body() updateData: any
  ) {
    this.logger.log(
      `Venue ${venueId} updated via temporal policy (business hours only)`
    );
    return {
      message: `Venue ${venueId} updated successfully`,
      venue: {
        id: venueId,
        ...updateData,
      },
      policyType: 'temporal',
      timestamp: new Date(),
    };
  }

  /**
   * Example 5: Contextual Policy - Match participant access
   * Only match participants can view detailed match information
   */
  @Get('matches/:id/detailed')
  @Roles('USER')
  @UsePolicyWith('match-participant-only')
  getMatchDetailed(@Param('id') matchId: string) {
    this.logger.log(`Detailed match ${matchId} accessed via contextual policy`);
    return {
      message: `Detailed match ${matchId} accessed`,
      match: {
        id: matchId,
        status: 'IN_PROGRESS',
        players: ['playerA', 'playerB'],
        score: { playerA: 5, playerB: 3 },
        detailedStats: {
          shots: 42,
          fouls: 2,
          duration: '25m 30s',
        },
      },
      policyType: 'contextual',
    };
  }

  /**
   * Example 6: Administrative Policy - IP-restricted access
   * Admins can only access from approved IP addresses
   */
  @Get('admin/restricted')
  @Roles('ADMIN')
  @UsePolicyWith('admin-ip-restriction')
  getAdminRestricted() {
    this.logger.log('Admin access granted via IP restriction policy');
    return {
      message: 'Admin panel accessed via IP-restricted policy',
      sensitiveData: {
        serverStats: 'confidential',
        userMetrics: 'restricted',
      },
      policyType: 'security',
    };
  }

  /**
   * Example 7: Premium Feature Policy - Subscription-based access
   */
  @Get('premium/features')
  @Roles('USER')
  @UsePolicyWith('premium-feature-access')
  getPremiumFeatures() {
    this.logger.log('Premium features accessed via subscription policy');
    return {
      message: 'Premium features accessed',
      features: [
        'advanced-analytics',
        'priority-matching',
        'exclusive-tournaments',
        'custom-avatars',
      ],
      policyType: 'subscription',
    };
  }

  /**
   * Example 8: Combined Policies - Multiple policy evaluation
   * This endpoint requires multiple policies to pass
   */
  @Post('tournaments/:id/manage')
  @Roles('USER')
  @UsePolicy() // Evaluate all applicable policies
  manageTournament(
    @Param('id') tournamentId: string,
    @Body() managementData: any
  ) {
    this.logger.log(`Tournament ${tournamentId} managed via multiple policies`);
    return {
      message: `Tournament ${tournamentId} managed successfully`,
      tournament: {
        id: tournamentId,
        ...managementData,
      },
      policiesEvaluated: [
        'tournament-organizer-edit',
        'clan-leader-territory-edit-geographic',
        'venue-admin-business-hours',
      ],
    };
  }

  /**
   * Example 9: Policy Override - Administrative override
   * Moderators can access content moderation features
   */
  @Put('content/:id/moderate')
  @Roles('MODERATOR')
  @UsePolicyWith('moderator-content-moderation')
  moderateContent(@Param('id') contentId: string, @Body() moderationData: any) {
    this.logger.log(`Content ${contentId} moderated via moderator policy`);
    return {
      message: `Content ${contentId} moderated`,
      content: {
        id: contentId,
        status: moderationData.action,
        moderatedBy: 'moderator',
        timestamp: new Date(),
      },
      policyType: 'moderation',
    };
  }

  /**
   * Example 10: Gradual Rollout - Feature flag controlled
   * This demonstrates how to gradually roll out PBAC features
   */
  @Get('beta/features')
  @Roles('USER')
  @UsePolicy() // Only enable PBAC for beta users
  getBetaFeatures() {
    // In production, this would check a feature flag
    const isBetaUser = Math.random() > 0.5; // Simulate beta user check

    if (isBetaUser) {
      this.logger.log('Beta features accessed via PBAC (beta user)');
      return {
        message: 'Beta features accessed',
        features: ['new-ui', 'advanced-filters', 'real-time-sync'],
        accessMethod: 'pbac-beta',
      };
    } else {
      this.logger.log('Beta features accessed via RBAC (non-beta user)');
      return {
        message: 'Limited beta features accessed',
        features: ['basic-ui'],
        accessMethod: 'rbac-fallback',
      };
    }
  }
}
