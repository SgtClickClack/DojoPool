import { Injectable, Logger } from '@nestjs/common';
import type { User } from '@prisma/client';
import {
  type PermissionAction,
  type PermissionResource,
  type PermissionContext,
} from '../common/interfaces/user.interfaces';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  /**
   * Check if a user can perform an action on a resource
   */
  can(
    user: User | null | undefined,
    action: PermissionAction,
    resource: PermissionResource,
    context?: PermissionContext
  ): boolean {
    if (!user) {
      this.logger.debug('Permission denied: No user provided');
      return false;
    }

    if (user.isBanned) {
      this.logger.debug(`Permission denied: User ${user.id} is banned`);
      return false;
    }

    // Admin users can do everything
    if (user.role === 'ADMIN') {
      this.logger.debug(`Permission granted: User ${user.id} is admin`);
      return true;
    }

    // Check specific permissions based on action and resource
    switch (resource) {
      case 'user':
        return this.canManageUser(user, action, context);
      case 'tournament':
        return this.canManageTournament(user, action, context);
      case 'venue':
        return this.canManageVenue(user, action, context);
      case 'admin':
        return this.canManageAdmin(user, action, context);
      case 'content':
        return this.canManageContent(user, action, context);
      case 'match':
        return this.canManageMatch(user, action, context);
      case 'clan':
        return this.canManageClan(user, action, context);
      case 'territory':
        return this.canManageTerritory(user, action, context);
      default:
        this.logger.warn(`Unknown resource type: ${resource}`);
        return false;
    }
  }

  /**
   * Check if user can manage their own profile
   */
  private canManageUser(
    user: User,
    action: PermissionAction,
    context?: PermissionContext
  ): boolean {
    // Users can always read their own data
    if (action === 'read') {
      return true;
    }

    // Users can update their own profile
    if (action === 'update' && context?.resourceId === user.id) {
      return true;
    }

    // Venue admins can read user data for their venue
    if (user.role === 'VENUE_ADMIN') {
      return true;
    }

    return false;
  }

  /**
   * Check tournament permissions
   */
  private canManageTournament(
    user: User,
    action: PermissionAction,
    context?: PermissionContext
  ): boolean {
    // All authenticated users can read tournaments
    if (action === 'read') {
      return true;
    }

    // Venue admins can create tournaments at their venues
    if (action === 'create' && user.role === 'VENUE_ADMIN') {
      return true;
    }

    // Tournament creators can update/delete their tournaments
    if (
      (action === 'update' || action === 'delete') &&
      context?.ownerId === user.id
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check venue permissions
   */
  private canManageVenue(
    user: User,
    action: PermissionAction,
    _context?: PermissionContext
  ): boolean {
    // All users can read venue information
    if (action === 'read') {
      return true;
    }

    // Venue admins can manage their venues
    if (user.role === 'VENUE_ADMIN') {
      return true;
    }

    return false;
  }

  /**
   * Check admin permissions
   */
  private canManageAdmin(
    user: User,
    _action: PermissionAction,
    _context?: PermissionContext
  ): boolean {
    // Only admins can access admin resources
    return user.role === 'ADMIN';
  }

  /**
   * Check content permissions
   */
  private canManageContent(
    user: User,
    action: PermissionAction,
    context?: PermissionContext
  ): boolean {
    // All users can read content
    if (action === 'read') {
      return true;
    }

    // Users can create content
    if (action === 'create') {
      return true;
    }

    // Content creators can update/delete their content
    if (
      (action === 'update' || action === 'delete') &&
      context?.ownerId === user.id
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check match permissions
   */
  private canManageMatch(
    user: User,
    action: PermissionAction,
    context?: PermissionContext
  ): boolean {
    // All users can read match data
    if (action === 'read') {
      return true;
    }

    // Users can create matches
    if (action === 'create') {
      return true;
    }

    // Match participants can update their matches
    if (action === 'update' && context?.participantIds?.includes(user.id)) {
      return true;
    }

    return false;
  }

  /**
   * Check clan permissions
   */
  private canManageClan(
    user: User,
    action: PermissionAction,
    context?: PermissionContext
  ): boolean {
    // All users can read clan information
    if (action === 'read') {
      return true;
    }

    // Users can create clans
    if (action === 'create') {
      return true;
    }

    // Clan leaders can manage their clans
    if (
      (action === 'update' || action === 'delete') &&
      context?.leaderId === user.id
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check territory permissions
   */
  private canManageTerritory(
    user: User,
    action: PermissionAction,
    context?: PermissionContext
  ): boolean {
    // All users can read territory information
    if (action === 'read') {
      return true;
    }

    // Territory owners can manage their territories
    if (
      (action === 'update' || action === 'delete') &&
      context?.ownerId === user.id
    ) {
      return true;
    }

    // Users can challenge territories
    if (action === 'create') {
      return true;
    }

    return false;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(user: User | null | undefined, role: string): boolean {
    return user?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(user: User | null | undefined): boolean {
    return this.hasRole(user, 'ADMIN');
  }

  /**
   * Check if user is venue admin
   */
  isVenueAdmin(user: User | null | undefined): boolean {
    return this.hasRole(user, 'VENUE_ADMIN');
  }

  /**
   * Check if user owns a resource
   */
  isOwner(user: User | null | undefined, resourceOwnerId: string): boolean {
    return user?.id === resourceOwnerId;
  }
}
