import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssignmentType, PolicyEffect } from '@dojopool/prisma';
import { PrismaService } from '../prisma/prisma.service';

export interface PolicyDefinition {
  name: string;
  description?: string;
  effect: PolicyEffect;
  conditions: Record<string, any>;
  priority?: number;
}

export interface PolicyAssignmentDefinition {
  policyName: string;
  assignmentType: AssignmentType;
  userId?: string;
  roleId?: string;
  groupId?: string;
  conditions?: Record<string, any>;
}

@Injectable()
export class PolicyManagementService {
  private readonly logger = new Logger(PolicyManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new policy
   */
  async createPolicy(definition: PolicyDefinition): Promise<any> {
    try {
      const policy = await this.prisma.policy.create({
        data: {
          name: definition.name,
          description: definition.description,
          effect: definition.effect,
          conditions: definition.conditions,
          priority: definition.priority || 1,
          isEnabled: true,
        },
      });

      this.logger.log(`Created policy: ${definition.name}`);
      return policy;
    } catch (error) {
      this.logger.error(`Failed to create policy ${definition.name}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing policy
   */
  async updatePolicy(
    name: string,
    updates: Partial<PolicyDefinition>
  ): Promise<any> {
    try {
      const policy = await this.prisma.policy.update({
        where: { name },
        data: {
          description: updates.description,
          effect: updates.effect,
          conditions: updates.conditions,
          priority: updates.priority,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Updated policy: ${name}`);
      return policy;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Policy ${name} not found`);
      }
      this.logger.error(`Failed to update policy ${name}:`, error);
      throw error;
    }
  }

  /**
   * Delete a policy
   */
  async deletePolicy(name: string): Promise<void> {
    try {
      await this.prisma.policy.delete({
        where: { name },
      });

      this.logger.log(`Deleted policy: ${name}`);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Policy ${name} not found`);
      }
      this.logger.error(`Failed to delete policy ${name}:`, error);
      throw error;
    }
  }

  /**
   * Assign a policy to users, roles, or groups
   */
  async assignPolicy(assignment: PolicyAssignmentDefinition): Promise<any> {
    try {
      const policy = await this.prisma.policy.findUnique({
        where: { name: assignment.policyName },
      });

      if (!policy) {
        throw new NotFoundException(
          `Policy ${assignment.policyName} not found`
        );
      }

      const policyAssignment = await this.prisma.policyAssignment.create({
        data: {
          policyId: policy.id,
          userId: assignment.userId,
          roleId: assignment.roleId,
          groupId: assignment.groupId,
          assignmentType: assignment.assignmentType,
          conditions: assignment.conditions,
        },
      });

      this.logger.log(
        `Assigned policy ${assignment.policyName} to ${assignment.assignmentType}: ${assignment.userId || assignment.roleId || assignment.groupId}`
      );

      return policyAssignment;
    } catch (error) {
      this.logger.error(
        `Failed to assign policy ${assignment.policyName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Remove a policy assignment
   */
  async removePolicyAssignment(
    policyName: string,
    assignmentType: AssignmentType,
    targetId?: string
  ): Promise<void> {
    try {
      const policy = await this.prisma.policy.findUnique({
        where: { name: policyName },
      });

      if (!policy) {
        throw new NotFoundException(`Policy ${policyName} not found`);
      }

      await this.prisma.policyAssignment.deleteMany({
        where: {
          policyId: policy.id,
          assignmentType,
          OR: [
            { userId: targetId },
            { roleId: targetId },
            { groupId: targetId },
          ].filter(
            (condition) => targetId || Object.values(condition).some((v) => v)
          ),
        },
      });

      this.logger.log(`Removed policy assignment for ${policyName}`);
    } catch (error) {
      this.logger.error(
        `Failed to remove policy assignment for ${policyName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all policies with their assignments
   */
  async getAllPolicies(): Promise<any[]> {
    return this.prisma.policy.findMany({
      include: {
        policyAssignments: {
          include: {
            policy: true,
          },
        },
        _count: {
          select: {
            policyEvaluations: true,
          },
        },
      },
      orderBy: {
        priority: 'desc',
      },
    });
  }

  /**
   * Get policies for a specific user
   */
  async getUserPolicies(userId: string): Promise<any[]> {
    return this.prisma.policy.findMany({
      where: {
        isEnabled: true,
        policyAssignments: {
          some: {
            OR: [
              { userId },
              {
                assignmentType: AssignmentType.ATTRIBUTE_BASED,
              },
            ],
          },
        },
      },
      include: {
        policyAssignments: true,
      },
    });
  }

  /**
   * Enable or disable a policy
   */
  async togglePolicy(name: string, enabled: boolean): Promise<any> {
    try {
      const policy = await this.prisma.policy.update({
        where: { name },
        data: {
          isEnabled: enabled,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`${enabled ? 'Enabled' : 'Disabled'} policy: ${name}`);
      return policy;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Policy ${name} not found`);
      }
      this.logger.error(`Failed to toggle policy ${name}:`, error);
      throw error;
    }
  }

  /**
   * Create predefined DojoPool policies
   */
  async createDojoPoolPolicies(): Promise<void> {
    const policies: PolicyDefinition[] = [
      // Geographic policies
      {
        name: 'clan-leader-territory-edit-geographic',
        description:
          'Clan leaders can edit territories within 100 meters of their location',
        effect: PolicyEffect.ALLOW,
        conditions: {
          'user.role': 'USER',
          'user.groups': ['clan-leader'],
          'resource.type': 'territory',
          action: 'update',
          'environment.location': {
            maxDistance: 0.1, // 100 meters
          },
        },
        priority: 10,
      },

      // Temporal policies
      {
        name: 'venue-admin-business-hours',
        description:
          'Venue admins can only modify venue settings during business hours',
        effect: PolicyEffect.ALLOW,
        conditions: {
          'user.role': 'VENUE_ADMIN',
          'resource.type': 'venue',
          action: 'update',
          'environment.time': {
            hourRange: [8, 22], // 8 AM to 10 PM
          },
        },
        priority: 15,
      },

      // Contextual policies
      {
        name: 'match-participant-only',
        description:
          'Only match participants can view detailed match information',
        effect: PolicyEffect.ALLOW,
        conditions: {
          'resource.type': 'match',
          action: 'read',
          'resource.attributes': {
            participants: {
              contains: '{{user.id}}',
            },
          },
        },
        priority: 20,
      },

      // Tournament policies
      {
        name: 'tournament-organizer-edit',
        description: 'Tournament organizers can edit their tournaments',
        effect: PolicyEffect.ALLOW,
        conditions: {
          'resource.type': 'tournament',
          action: 'update',
          'resource.owner': true,
        },
        priority: 25,
      },

      // Administrative policies
      {
        name: 'moderator-content-moderation',
        description:
          'Moderators can moderate content within their assigned regions',
        effect: PolicyEffect.ALLOW,
        conditions: {
          'user.role': 'MODERATOR',
          'resource.type': 'content',
          action: ['approve', 'reject', 'delete'],
          'user.attributes': {
            assignedRegions: {
              contains: '{{resource.attributes.region}}',
            },
          },
        },
        priority: 30,
      },

      // Security policies
      {
        name: 'admin-ip-restriction',
        description: 'Admins can only access from approved IP addresses',
        effect: PolicyEffect.ALLOW,
        conditions: {
          'user.role': 'ADMIN',
          'environment.ip': {
            allowedIPs: ['192.168.1.0/24', '10.0.0.0/8'], // Example IP ranges
          },
        },
        priority: 50,
      },

      // Business logic policies
      {
        name: 'premium-feature-access',
        description: 'Premium users get access to exclusive features',
        effect: PolicyEffect.ALLOW,
        conditions: {
          'user.attributes': {
            subscriptionTier: {
              in: ['premium', 'enterprise'],
            },
          },
          'resource.attributes': {
            requiresPremium: true,
          },
        },
        priority: 5,
      },
    ];

    for (const policy of policies) {
      try {
        await this.createPolicy(policy);
        this.logger.log(`Created DojoPool policy: ${policy.name}`);
      } catch (error) {
        this.logger.warn(
          `Failed to create policy ${policy.name}:`,
          error.message
        );
      }
    }
  }

  /**
   * Create example policy assignments
   */
  async createExampleAssignments(): Promise<void> {
    const assignments: PolicyAssignmentDefinition[] = [
      // Assign geographic policy to clan leaders
      {
        policyName: 'clan-leader-territory-edit-geographic',
        assignmentType: AssignmentType.GROUP,
        groupId: 'clan-leaders',
      },

      // Assign venue admin policy to venue admins
      {
        policyName: 'venue-admin-business-hours',
        assignmentType: AssignmentType.ROLE,
        roleId: 'VENUE_ADMIN',
      },

      // Assign match participant policy to all users
      {
        policyName: 'match-participant-only',
        assignmentType: AssignmentType.ROLE,
        roleId: 'USER',
      },

      // Assign tournament policy to organizers
      {
        policyName: 'tournament-organizer-edit',
        assignmentType: AssignmentType.ATTRIBUTE_BASED,
        conditions: {
          'user.attributes': {
            isOrganizer: true,
          },
        },
      },

      // Assign moderator policy to moderators
      {
        policyName: 'moderator-content-moderation',
        assignmentType: AssignmentType.ROLE,
        roleId: 'MODERATOR',
      },

      // Assign admin security policy
      {
        policyName: 'admin-ip-restriction',
        assignmentType: AssignmentType.ROLE,
        roleId: 'ADMIN',
      },
    ];

    for (const assignment of assignments) {
      try {
        await this.assignPolicy(assignment);
        this.logger.log(
          `Created policy assignment for: ${assignment.policyName}`
        );
      } catch (error) {
        this.logger.warn(
          `Failed to create assignment for ${assignment.policyName}:`,
          error.message
        );
      }
    }
  }
}
