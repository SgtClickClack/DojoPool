import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PolicyContext,
  PolicyDecision,
  PolicyEngineService,
} from './policy-engine.service';

export const POLICY_KEY = 'policy';
export const USE_POLICY_KEY = 'usePolicy';

@Injectable()
export class PolicyGuard implements CanActivate {
  private readonly logger = new Logger(PolicyGuard.name);

  constructor(
    private reflector: Reflector,
    private policyEngine: PolicyEngineService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if policy-based access control is enabled for this endpoint
    const usePolicy = this.reflector.get<boolean>(
      USE_POLICY_KEY,
      context.getHandler()
    );

    if (!usePolicy) {
      // Fall back to traditional role-based access control
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Build policy context from request
      const policyContext = await this.buildPolicyContext(context, user);

      // Get policy requirements from decorator
      const policyName = this.reflector.get<string>(
        POLICY_KEY,
        context.getHandler()
      );

      if (policyName) {
        // Evaluate specific policy
        const result = await this.policyEngine.evaluatePolicies({
          ...policyContext,
          resource: {
            ...policyContext.resource,
            type: policyName, // Use policy name as resource type for simple cases
          },
        });

        if (result.decision === PolicyDecision.DENY) {
          throw new ForbiddenException(
            result.reason || 'Access denied by policy'
          );
        }

        return result.decision === PolicyDecision.ALLOW;
      } else {
        // Evaluate all applicable policies
        const result = await this.policyEngine.evaluatePolicies(policyContext);

        if (result.decision === PolicyDecision.DENY) {
          throw new ForbiddenException(
            result.reason || 'Access denied by policy'
          );
        }

        // Allow access if no policies apply or if explicitly allowed
        return (
          result.decision === PolicyDecision.ALLOW ||
          result.decision === PolicyDecision.NOT_APPLICABLE
        );
      }
    } catch (error) {
      this.logger.error('Policy evaluation failed:', error);
      throw new ForbiddenException('Policy evaluation failed');
    }
  }

  /**
   * Build policy context from execution context and user
   */
  private async buildPolicyContext(
    context: ExecutionContext,
    user: any
  ): Promise<PolicyContext> {
    const request = context.switchToHttp().getRequest();
    const { method, url, params, query, body } = request;

    // Extract resource information from request
    const resource = this.extractResourceInfo(url, params, body);

    // Extract action from HTTP method
    const action = this.mapHttpMethodToAction(method);

    // Build user context
    const userContext = {
      id: user.id || user.sub,
      role: user.role,
      attributes: user.attributes || {},
      groups: user.groups || [],
    };

    // Build environment context
    const environmentContext = {
      timestamp: new Date(),
      ip: request.ip || request.connection?.remoteAddress,
      userAgent: request.get('User-Agent'),
      location: user.location || body?.location,
    };

    return {
      user: userContext,
      resource,
      action,
      environment: environmentContext,
    };
  }

  /**
   * Extract resource information from request
   */
  private extractResourceInfo(
    url: string,
    params: Record<string, any>,
    body: Record<string, any>
  ): PolicyContext['resource'] {
    // Extract resource type and ID from URL pattern
    const urlParts = url.split('/').filter(Boolean);

    if (urlParts.includes('territories')) {
      return {
        type: 'territory',
        id: params.id || body?.territoryId || 'unknown',
        attributes: body,
        ownerId: body?.ownerId,
      };
    }

    if (urlParts.includes('matches')) {
      return {
        type: 'match',
        id: params.id || body?.matchId || 'unknown',
        attributes: body,
        ownerId: body?.playerAId === body?.playerBId ? null : undefined, // Complex ownership
      };
    }

    if (urlParts.includes('tournaments')) {
      return {
        type: 'tournament',
        id: params.id || body?.tournamentId || 'unknown',
        attributes: body,
        ownerId: body?.organizerId,
      };
    }

    if (urlParts.includes('clans')) {
      return {
        type: 'clan',
        id: params.id || body?.clanId || 'unknown',
        attributes: body,
        ownerId: body?.leaderId,
      };
    }

    if (urlParts.includes('venues')) {
      return {
        type: 'venue',
        id: params.id || body?.venueId || 'unknown',
        attributes: body,
        ownerId: body?.ownerId,
      };
    }

    // Default resource
    return {
      type: 'unknown',
      id: 'unknown',
      attributes: body,
    };
  }

  /**
   * Map HTTP method to action
   */
  private mapHttpMethodToAction(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'read';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'unknown';
    }
  }
}
