import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { IPermissionsService, PERMISSIONS_SERVICE_TOKEN } from '../common/interfaces/user.interfaces';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(PERMISSIONS_SERVICE_TOKEN) 
    private readonly permissionsService: IPermissionsService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!this.permissionsService.isAdmin(user)) {
      throw new ForbiddenException('Admin privileges required');
    }

    return true;
  }
}
