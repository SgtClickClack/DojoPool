import { Injectable, Logger } from '@nestjs/common';
import { AssignmentType, PolicyDecision, PolicyEffect } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PolicyContext {
  user: {
    id: string;
    role: string;
    attributes?: Record<string, any>;
    groups?: string[];
  };
  resource: {
    type: string;
    id: string;
    attributes?: Record<string, any>;
    ownerId?: string;
  };
  action: string;
  environment: {
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reason?: string;
  matchedPolicies: string[];
  evaluatedPolicies: number;
}

@Injectable()
export class PolicyEngineService {
  private readonly logger = new Logger(PolicyEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluate policies for a given context
   */
  async evaluatePolicies(
    context: PolicyContext
  ): Promise<PolicyEvaluationResult> {
    try {
      // Get all enabled policies applicable to the user
      const applicablePolicies = await this.getApplicablePolicies(context);

      if (applicablePolicies.length === 0) {
        return {
          decision: PolicyDecision.NOT_APPLICABLE,
          reason: 'No applicable policies found',
          matchedPolicies: [],
          evaluatedPolicies: 0,
        };
      }

      // Sort by priority (highest first)
      applicablePolicies.sort((a, b) => b.priority - a.priority);

      const matchedPolicies: string[] = [];
      let finalDecision = PolicyDecision.NOT_APPLICABLE;

      // Evaluate policies in priority order
      for (const policy of applicablePolicies) {
        try {
          const policyMatch = await this.evaluateSinglePolicy(policy, context);

          if (policyMatch) {
            matchedPolicies.push(policy.name);

            // Record the evaluation for auditing
            await this.recordPolicyEvaluation(
              policy.id,
              context,
              policy.effect
            );

            // Apply the policy effect
            if (policy.effect === PolicyEffect.ALLOW) {
              finalDecision = PolicyDecision.ALLOW;
              break; // Allow takes precedence
            } else if (policy.effect === PolicyEffect.DENY) {
              finalDecision = PolicyDecision.DENY;
              break; // Deny takes precedence
            }
          }
        } catch (error) {
          this.logger.error(`Error evaluating policy ${policy.name}:`, error);
        }
      }

      return {
        decision: finalDecision,
        reason:
          matchedPolicies.length > 0
            ? `Matched policies: ${matchedPolicies.join(', ')}`
            : 'No policies matched the context',
        matchedPolicies,
        evaluatedPolicies: applicablePolicies.length,
      };
    } catch (error) {
      this.logger.error('Policy evaluation failed:', error);
      return {
        decision: PolicyDecision.NOT_APPLICABLE,
        reason: 'Policy evaluation failed',
        matchedPolicies: [],
        evaluatedPolicies: 0,
      };
    }
  }

  /**
   * Get policies applicable to the current user
   */
  private async getApplicablePolicies(context: PolicyContext) {
    // Get policies assigned to the user directly
    const userPolicies = await this.prisma.policy.findMany({
      where: {
        isEnabled: true,
        policyAssignments: {
          some: {
            OR: [
              { userId: context.user.id },
              { roleId: context.user.role },
              { groupId: { in: context.user.groups || [] } },
              { assignmentType: AssignmentType.ATTRIBUTE_BASED },
            ],
          },
        },
      },
      include: {
        policyAssignments: true,
      },
    });

    // Filter policies based on assignment conditions
    const applicablePolicies = [];

    for (const policy of userPolicies) {
      let isApplicable = false;

      for (const assignment of policy.policyAssignments) {
        if (
          assignment.userId === context.user.id ||
          assignment.roleId === context.user.role ||
          (assignment.groupId &&
            context.user.groups?.includes(assignment.groupId))
        ) {
          isApplicable = true;
          break;
        }

        // Check attribute-based assignments
        if (
          assignment.assignmentType === AssignmentType.ATTRIBUTE_BASED &&
          assignment.conditions
        ) {
          if (
            await this.evaluateAttributeConditions(
              assignment.conditions as any,
              context
            )
          ) {
            isApplicable = true;
            break;
          }
        }
      }

      if (isApplicable) {
        applicablePolicies.push(policy);
      }
    }

    return applicablePolicies;
  }

  /**
   * Evaluate a single policy against the context
   */
  private async evaluateSinglePolicy(
    policy: any,
    context: PolicyContext
  ): Promise<boolean> {
    const conditions = policy.conditions as Record<string, any>;

    if (!conditions) {
      return true; // Policy with no conditions always matches
    }

    try {
      // Evaluate each condition group
      for (const [conditionKey, conditionValue] of Object.entries(conditions)) {
        if (
          !(await this.evaluateCondition(conditionKey, conditionValue, context))
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error evaluating policy conditions for ${policy.name}:`,
        error
      );
      return false;
    }
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    conditionKey: string,
    conditionValue: any,
    context: PolicyContext
  ): Promise<boolean> {
    switch (conditionKey) {
      case 'user.role':
        return this.evaluateUserRole(conditionValue, context);

      case 'user.groups':
        return this.evaluateUserGroups(conditionValue, context);

      case 'user.attributes':
        return this.evaluateUserAttributes(conditionValue, context);

      case 'resource.type':
        return context.resource.type === conditionValue;

      case 'resource.owner':
        return context.resource.ownerId === context.user.id;

      case 'resource.attributes':
        return this.evaluateResourceAttributes(conditionValue, context);

      case 'action':
        return context.action === conditionValue;

      case 'environment.time':
        return this.evaluateTimeCondition(conditionValue, context);

      case 'environment.location':
        return this.evaluateLocationCondition(conditionValue, context);

      case 'environment.ip':
        return this.evaluateIPCondition(conditionValue, context);

      default:
        // Custom condition evaluation
        return this.evaluateCustomCondition(
          conditionKey,
          conditionValue,
          context
        );
    }
  }

  /**
   * Evaluate user role condition
   */
  private evaluateUserRole(
    conditionValue: any,
    context: PolicyContext
  ): boolean {
    if (Array.isArray(conditionValue)) {
      return conditionValue.includes(context.user.role);
    }
    return context.user.role === conditionValue;
  }

  /**
   * Evaluate user groups condition
   */
  private evaluateUserGroups(
    conditionValue: any,
    context: PolicyContext
  ): boolean {
    const userGroups = context.user.groups || [];
    if (Array.isArray(conditionValue)) {
      return conditionValue.some((group) => userGroups.includes(group));
    }
    return userGroups.includes(conditionValue);
  }

  /**
   * Evaluate user attributes condition
   */
  private evaluateUserAttributes(
    conditionValue: any,
    context: PolicyContext
  ): boolean {
    const userAttrs = context.user.attributes || {};

    for (const [attrKey, attrCondition] of Object.entries(conditionValue)) {
      const userValue = userAttrs[attrKey];

      if (!this.evaluateAttributeCondition(userValue, attrCondition)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate resource attributes condition
   */
  private evaluateResourceAttributes(
    conditionValue: any,
    context: PolicyContext
  ): boolean {
    const resourceAttrs = context.resource.attributes || {};

    for (const [attrKey, attrCondition] of Object.entries(conditionValue)) {
      const resourceValue = resourceAttrs[attrKey];

      if (!this.evaluateAttributeCondition(resourceValue, attrCondition)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate time-based condition
   */
  private evaluateTimeCondition(
    conditionValue: any,
    context: PolicyContext
  ): boolean {
    const now = context.environment.timestamp;
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    if (conditionValue.hourRange) {
      const [start, end] = conditionValue.hourRange;
      if (currentHour < start || currentHour > end) {
        return false;
      }
    }

    if (conditionValue.dayOfWeek) {
      if (!conditionValue.dayOfWeek.includes(currentDay)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate location-based condition
   */
  private evaluateLocationCondition(
    conditionValue: any,
    context: PolicyContext
  ): boolean {
    const userLocation = context.environment.location;
    if (!userLocation) return false;

    if (conditionValue.maxDistance && context.resource.attributes?.location) {
      const distance = this.calculateDistance(
        userLocation.lat,
        userLocation.lng,
        context.resource.attributes.location.lat,
        context.resource.attributes.location.lng
      );

      if (distance > conditionValue.maxDistance) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate IP-based condition
   */
  private evaluateIPCondition(
    conditionValue: any,
    context: PolicyContext
  ): boolean {
    const userIP = context.environment.ip;
    if (!userIP) return false;

    // Simple IP range check (can be enhanced with CIDR notation)
    if (conditionValue.allowedIPs) {
      return conditionValue.allowedIPs.includes(userIP);
    }

    if (conditionValue.blockedIPs) {
      return !conditionValue.blockedIPs.includes(userIP);
    }

    return true;
  }

  /**
   * Evaluate custom condition (extensible for business logic)
   */
  private async evaluateCustomCondition(
    conditionKey: string,
    conditionValue: any,
    context: PolicyContext
  ): Promise<boolean> {
    // This can be extended to handle custom business logic
    // For example: 'match.status', 'tournament.phase', etc.

    switch (conditionKey) {
      case 'match.status':
        return context.resource.attributes?.status === conditionValue;

      case 'tournament.phase':
        return context.resource.attributes?.phase === conditionValue;

      case 'clan.relationship':
        return await this.evaluateClanRelationship(conditionValue, context);

      default:
        this.logger.warn(`Unknown condition: ${conditionKey}`);
        return false;
    }
  }

  /**
   * Evaluate clan relationship condition
   */
  private async evaluateClanRelationship(
    conditionValue: any,
    context: PolicyContext
  ): Promise<boolean> {
    // Check if user has specific relationship with clan (member, leader, ally, rival)
    try {
      const clanMembership = await this.prisma.clanMember.findFirst({
        where: {
          userId: context.user.id,
          clanId: context.resource.attributes?.clanId,
        },
      });

      if (!clanMembership) return false;

      if (conditionValue.role) {
        return clanMembership.role === conditionValue.role;
      }

      return true;
    } catch (error) {
      this.logger.error('Error evaluating clan relationship:', error);
      return false;
    }
  }

  /**
   * Generic attribute condition evaluator
   */
  private evaluateAttributeCondition(value: any, condition: any): boolean {
    if (typeof condition === 'object' && condition !== null) {
      if (condition.operator) {
        return this.evaluateOperatorCondition(value, condition);
      }

      // Nested object comparison
      for (const [key, subCondition] of Object.entries(condition)) {
        if (value && typeof value === 'object' && key in value) {
          if (!this.evaluateAttributeCondition(value[key], subCondition)) {
            return false;
          }
        } else {
          return false;
        }
      }
      return true;
    }

    // Simple equality check
    return value === condition;
  }

  /**
   * Evaluate operator-based conditions
   */
  private evaluateOperatorCondition(value: any, condition: any): boolean {
    const { operator, value: compareValue } = condition;

    switch (operator) {
      case 'equals':
      case 'eq':
        return value === compareValue;

      case 'not_equals':
      case 'ne':
        return value !== compareValue;

      case 'greater_than':
      case 'gt':
        return value > compareValue;

      case 'less_than':
      case 'lt':
        return value < compareValue;

      case 'greater_equal':
      case 'gte':
        return value >= compareValue;

      case 'less_equal':
      case 'lte':
        return value <= compareValue;

      case 'in':
        return Array.isArray(compareValue) && compareValue.includes(value);

      case 'not_in':
        return !Array.isArray(compareValue) || !compareValue.includes(value);

      case 'contains':
        return Array.isArray(value) && value.includes(compareValue);

      case 'not_contains':
        return !Array.isArray(value) || !value.includes(compareValue);

      default:
        this.logger.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Record policy evaluation for auditing
   */
  private async recordPolicyEvaluation(
    policyId: string,
    context: PolicyContext,
    decision: PolicyEffect
  ): Promise<void> {
    try {
      await this.prisma.policyEvaluation.create({
        data: {
          policyId,
          userId: context.user.id,
          resource: `${context.resource.type}:${context.resource.id}`,
          action: context.action,
          decision:
            decision === PolicyEffect.ALLOW
              ? PolicyDecision.ALLOW
              : PolicyDecision.DENY,
          context: {
            userAttributes: context.user.attributes,
            resourceAttributes: context.resource.attributes,
            environment: context.environment,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to record policy evaluation:', error);
    }
  }
}
