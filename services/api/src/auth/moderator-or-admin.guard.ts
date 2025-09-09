import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class ModeratorOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: string } | undefined;
    if (!user || !user.role) {
      throw new ForbiddenException('Moderator or Admin privileges required');
    }
    const role = String(user.role).toUpperCase();
    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      throw new ForbiddenException('Moderator or Admin privileges required');
    }
    return true;
  }
}
