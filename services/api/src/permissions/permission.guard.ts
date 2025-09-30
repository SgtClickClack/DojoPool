import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Inject,
} from '@nestjs/common';
import {
  IPermissionsService,
  PERMISSIONS_SERVICE_TOKEN,
  type PermissionAction,
  type PermissionResource,
  type PermissionContext,
} from '../common/interfaces/user.interfaces';

export interface PermissionGuardOptions {
  action: PermissionAction;
  resource: PermissionResource;
  context?:
    | PermissionContext
    | ((
        request: Express.Request & { user?: { userId: string; role: string } }
      ) => PermissionContext);
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    @Inject(PERMISSIONS_SERVICE_TOKEN)
    private readonly permissionsService: IPermissionsService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Get permission options from metadata or use defaults
    const options = this.getPermissionOptions(request);

    if (!options) {
      throw new ForbiddenException('Permission configuration required');
    }

    const permissionContext =
      typeof options.context === 'function'
        ? options.context(request)
        : options.context;

    const hasPermission = this.permissionsService.can(
      user,
      options.action,
      options.resource,
      permissionContext
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${options.action} ${options.resource}`
      );
    }

    return true;
  }

  private getPermissionOptions(
    request: Express.Request & { permissionOptions?: PermissionGuardOptions }
  ): PermissionGuardOptions | null {
    // This can be extended to read from route metadata or other sources
    return request.permissionOptions || null;
  }
}

/**
 * Decorator to set permission requirements for a route
 */
export function RequirePermission(
  action: PermissionAction,
  resource: PermissionResource,
  context?:
    | PermissionContext
    | ((
        request: Express.Request & { user?: { userId: string; role: string } }
      ) => PermissionContext)
) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Store permission options in metadata
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const request = args.find(
        (
          arg
        ): arg is Express.Request & {
          user?: { userId: string; role: string };
          permissionOptions?: PermissionGuardOptions;
        } => arg !== null && typeof arg === 'object' && 'user' in arg
      );
      if (request) {
        request.permissionOptions = { action, resource, context };
      }
      return originalMethod.apply(this, args);
    };
  };
}
